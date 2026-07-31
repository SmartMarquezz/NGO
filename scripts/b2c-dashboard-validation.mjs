import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS = path.join(ROOT, 'screenshots');
const TARGET_ORG = 'vf-scratch';
const TEST_EMAIL = 'b2c.dashboard.test@example.com';
const SITE_HOME = 'https://nosoftware-nosoftware-3537-dev-ed.scratch.my.site.com/ACPTraining/';
const SITE_ENROLL = 'https://nosoftware-nosoftware-3537-dev-ed.scratch.my.site.com/ACPTraining/enroll';

fs.mkdirSync(SCREENSHOTS, { recursive: true });

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function queryJson(soql) {
  const raw = sh(`sf data query --query "${soql}" --target-org ${TARGET_ORG} --json`);
  return JSON.parse(raw).result;
}

function getFrontdoor() {
  return JSON.parse(sh(`sf org open --target-org ${TARGET_ORG} --url-only --json`)).result.url;
}

function getLexBase() {
  const instanceUrl = JSON.parse(sh(`sf org display --target-org ${TARGET_ORG} --json`)).result.instanceUrl;
  return instanceUrl.replace('.my.salesforce.com', '.lightning.force.com');
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS, `${name}.png`), fullPage: true });
  console.log(`  screenshot -> screenshots/${name}.png`);
}

async function fillAndSubmit(page) {
  const root = page.locator('c-safety-enrollment-form');
  await root.waitFor({ timeout: 30000 });

  // Page 1
  await root.locator('input[name="email"]').fill(TEST_EMAIL);
  await root.locator('button[data-name="greatDay"][data-value="Yes"]').click();
  await root.locator('button.acp-btn-primary').click();
  await page.waitForTimeout(900);

  // Page 2
  const d = new Date();
  d.setDate(d.getDate() + 5);
  await root.locator('input[name="classDate"]').fill(d.toISOString().slice(0, 10));
  await root.locator('input[name="classTime"]').fill('02:00 PM');
  await root.locator('input[name="firstName"]').fill('B2C');
  await root.locator('input[name="lastName"]').fill('Dashboard');
  await root.locator('input[name="phone"]').fill('5125550199');
  await root.locator('input[name="dateOfBirth"]').fill('1993-04-12');
  await root.locator('input[name="groupName"]').fill('Community Cohort');
  await root.locator('input[name="profession"]').fill('Caregiver');
  await root.locator('button.acp-btn-primary').click();
  await page.waitForTimeout(900);

  // Page 3
  await root.locator('input[name="streetAddress"]').fill('77 Rescue Rd');
  await root.locator('input[name="city"]').fill('Austin');
  await root.locator('select[name="state"]').selectOption('TX');
  await root.locator('input[name="postalCode"]').fill('78704');
  await root.locator('button[data-name="certifyingAgency"][data-value="American Red Cross"]').click();
  await root.locator('button.acp-btn-primary').click();
  await page.waitForTimeout(900);

  // Page 4
  await root.locator('input[type="checkbox"][value="Caucasian"]').check();
  await root.locator('button[data-name="maritalStatus"][data-value="Married"]').click();
  await root.locator('button[data-name="sexAtBirth"][data-value="Male"]').click();
  await root.locator('button[data-name="employmentStatus"][data-value="Employed Full-Time"]').click();
  await root.locator('button[data-name="highestEducation"][data-value="Bachelor"]').click();
  await root.locator('button[data-name="cprPreviously"][data-value="No"]').click();
  await root.locator('button.acp-btn-primary').click();
  await page.waitForTimeout(900);

  // Page 5
  for (const key of [
    'physicalHealth',
    'mentalHealth',
    'emotionalHealth',
    'socialNetwork',
    'cprConfidence',
    'nutritionalChoices',
    'overallHealthSatisfaction'
  ]) {
    await root.locator(`button[data-name="${key}"][data-value="5"]`).first().click();
  }
  await root.locator('button[data-name="learnSelfCare"][data-value="Yes"]').click();
  await root.locator('button[data-name="selfCarePeerHelp"][data-value="Yes"]').click();
  await shot(page, 'b2c-10-before-submit');
  await root.locator('button.acp-btn-primary').click();
  await page.waitForTimeout(5000);
  await root.locator('.acp-complete, .acp-success').first().waitFor({ timeout: 25000 });
  await shot(page, 'b2c-11-submitted');
}

async function run() {
  const steps = [];
  const pass = (n) => {
    console.log(`✅ ${n}`);
    steps.push({ n, ok: true });
  };
  const fail = (n, e) => {
    console.error(`❌ ${n}: ${e}`);
    steps.push({ n, ok: false, e: String(e) });
    throw new Error(n);
  };

  console.log('Starting B2C form → dashboard validation\n');
  const before = queryJson(
    `SELECT Id FROM Safety_Enrollment__c WHERE Email__c = '${TEST_EMAIL}'`
  ).totalSize;

  const browser = await chromium.launch({ headless: false, slowMo: 250 });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  try {
    console.log('Step 1: Open public enroll form');
    await page.goto(SITE_ENROLL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await shot(page, 'b2c-01-enroll');
    pass('Open public enroll form');

    console.log('Step 2: Submit full 5-page enrollment as guest');
    await fillAndSubmit(page);
    pass('Submit full 5-page enrollment as guest');

    console.log('Step 3: Verify Safety_Enrollment__c via SOQL');
    const after = queryJson(
      `SELECT Id, Name, First_Name__c, Last_Name__c, Email__c, Status__c, Certifying_Agency__c, Learn_Self_Care__c FROM Safety_Enrollment__c WHERE Email__c = '${TEST_EMAIL}' ORDER BY CreatedDate DESC LIMIT 5`
    );
    if (after.totalSize <= before) {
      fail('Verify Safety_Enrollment__c via SOQL', `Expected > ${before}, got ${after.totalSize}`);
    }
    const row = after.records[0];
    console.log('  saved record:', JSON.stringify(row));
    if (row.Status__c !== 'Submitted' || row.First_Name__c !== 'B2C') {
      fail('Verify Safety_Enrollment__c via SOQL', 'Unexpected field values');
    }
    pass('Verify Safety_Enrollment__c via SOQL');

    console.log('Step 4: Open Enrollment Dashboard and confirm data');
    const frontdoor = getFrontdoor();
    const lex = getLexBase();
    await page.goto(frontdoor, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await page.goto(`${lex}/lightning/n/Safety_Enrollment_Dashboard`, {
      waitUntil: 'domcontentloaded'
    });
    await page.waitForTimeout(4000);
    const dash = page.locator('c-safety-enrollment-dashboard');
    await dash.waitFor({ timeout: 20000 });
    await dash.locator('button.refresh').click();
    await page.waitForTimeout(2500);
    await shot(page, 'b2c-12-dashboard');

    const bodyText = await dash.innerText();
    if (!bodyText.includes('B2C') || !bodyText.includes('Dashboard') || !bodyText.includes(TEST_EMAIL)) {
      // Email may wrap; at least name should appear
      if (!bodyText.includes('B2C Dashboard') && !bodyText.includes('b2c.dashboard.test')) {
        console.log('Dashboard text sample:', bodyText.slice(0, 800));
        fail('Open Enrollment Dashboard and confirm data', 'Submitted learner not visible on dashboard');
      }
    }
    pass('Open Enrollment Dashboard and confirm data');

    console.log('Step 5: Confirm home ENROLL NOW still reaches form');
    await page.goto(SITE_HOME, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'ENROLL NOW' }).first().click();
    await page.waitForTimeout(2000);
    if (!page.url().includes('/enroll')) {
      fail('Confirm home ENROLL NOW still reaches form', page.url());
    }
    pass('Confirm home ENROLL NOW still reaches form');
  } catch (e) {
    await shot(page, 'b2c-99-failure').catch(() => {});
    if (!steps.some((s) => !s.ok)) fail(e.message || 'Unhandled', e);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  console.log('\nB2C form → dashboard validation complete\n');
  for (const s of steps) console.log(`${s.ok ? '✅' : '❌'} ${s.n}`);
  console.log('\nScreenshots saved to: screenshots/');
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
