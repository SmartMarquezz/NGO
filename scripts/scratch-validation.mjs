import { chromium } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS = path.join(ROOT, 'screenshots');
const TARGET_ORG = 'vf-scratch';

fs.mkdirSync(SCREENSHOTS, { recursive: true });

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function getFrontdoor() {
  const raw = sh(`sf org open --target-org ${TARGET_ORG} --url-only --json`);
  return JSON.parse(raw).result.url;
}

function getLexBase() {
  const raw = sh(`sf org display --target-org ${TARGET_ORG} --json`);
  const instanceUrl = JSON.parse(raw).result.instanceUrl;
  return instanceUrl.replace('.my.salesforce.com', '.lightning.force.com');
}

function queryCount(soql) {
  const raw = sh(`sf data query --query "${soql}" --target-org ${TARGET_ORG} --json`);
  return JSON.parse(raw).result.totalSize;
}

async function shot(page, name) {
  const file = path.join(SCREENSHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`  screenshot -> screenshots/${name}.png`);
}

async function gotoLex(page, lexBase, pathSuffix) {
  const url = `${lexBase}${pathSuffix}`;
  console.log(`  navigate -> ${pathSuffix}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
}

async function fillPage1(page) {
  await page.locator('input[name="email"]').fill('playwright.learner@example.com');
  await page.locator('button[data-name="greatDay"][data-value="Yes"]').click();
}

async function fillPage2(page) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
  const iso = tomorrow.toISOString().slice(0, 10);
  await page.locator('input[name="classDate"]').fill(iso);
  await page.locator('input[name="classTime"]').fill('10:00 AM');
  await page.locator('input[name="firstName"]').fill('Playwright');
  await page.locator('input[name="lastName"]').fill('Learner');
  await page.locator('input[name="phone"]').fill('5559876543');
  await page.locator('input[name="dateOfBirth"]').fill('1991-06-15');
  await page.locator('input[name="groupName"]').fill('Playwright Cohort');
  await page.locator('input[name="profession"]').fill('Paramedic');
}

async function fillPage3(page) {
  await page.locator('input[name="streetAddress"]').fill('500 Validation Ave');
  await page.locator('input[name="city"]').fill('Austin');
  await page.locator('select[name="state"]').selectOption('TX');
  await page.locator('input[name="postalCode"]').fill('78702');
  await page.locator('button[data-name="certifyingAgency"][data-value="American Heart Association"]').click();
}

async function fillPage4(page) {
  await page.locator('input[type="checkbox"][value="Latino"]').check();
  await page.locator('button[data-name="maritalStatus"][data-value="Single"]').click();
  await page.locator('button[data-name="sexAtBirth"][data-value="Female"]').click();
  await page.locator('button[data-name="employmentStatus"][data-value="Employed Full-Time"]').click();
  await page.locator('button[data-name="highestEducation"][data-value="Bachelor"]').click();
  await page.locator('button[data-name="cprPreviously"][data-value="Yes"]').click();
}

async function fillPage5(page) {
  const keys = [
    'physicalHealth',
    'mentalHealth',
    'emotionalHealth',
    'socialNetwork',
    'cprConfidence',
    'nutritionalChoices',
    'overallHealthSatisfaction'
  ];
  for (const key of keys) {
    await page.locator(`button[data-name="${key}"][data-value="4"]`).first().click();
  }
  await page.locator('button[data-name="learnSelfCare"][data-value="Yes"]').click();
  await page.locator('button[data-name="selfCarePeerHelp"][data-value="Maybe"]').click();
}

async function clickNext(page) {
  await page.locator('button.acp-btn-primary').click();
  await page.waitForTimeout(1200);
}

async function run() {
  const steps = [];
  const fail = (name, err) => {
    console.error(`❌ ${name}: ${err}`);
    steps.push({ name, ok: false, err: String(err) });
    throw new Error(name);
  };
  const pass = (name) => {
    console.log(`✅ ${name}`);
    steps.push({ name, ok: true });
  };

  console.log('Starting Playwright. Steps to be tested:');
  console.log('1) Login via frontdoor');
  console.log('2) Open Enroll Now form tab');
  console.log('3) Complete 5-page enrollment and submit');
  console.log('4) Verify Safety_Enrollment__c record via SOQL');
  console.log('5) Open Enrollment Dashboard and confirm visuals');
  console.log('');

  const before = queryCount(
    "SELECT Id FROM Safety_Enrollment__c WHERE Email__c = 'playwright.learner@example.com'"
  );

  const frontdoor = getFrontdoor();
  const lexBase = getLexBase();

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  try {
    console.log('Step 1: Login via frontdoor');
    await page.goto(frontdoor, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await shot(page, '01-login');
    pass('Login via frontdoor');

    console.log('Step 2: Open Enroll Now form tab');
    await gotoLex(page, lexBase, '/lightning/n/Safety_Enrollment_Form');
    await page.waitForSelector('.acp-form, c-safety-enrollment-form', { timeout: 20000 });
    await shot(page, '02-enroll-form');
    pass('Open Enroll Now form tab');

    console.log('Step 3: Complete 5-page enrollment and submit');
    // Form may be inside LWC shadow DOM — Playwright pierces open shadow by default in recent versions
    // Use frame/locator strategies that work with LWC
    const root = page.locator('c-safety-enrollment-form');
    await root.waitFor({ timeout: 20000 });

    // Page 1
    await root.locator('input[name="email"]').fill('playwright.learner@example.com');
    await root.locator('button[data-name="greatDay"][data-value="Yes"]').click();
    await shot(page, '03-page1');
    await root.locator('button.acp-btn-primary').click();
    await page.waitForTimeout(1000);

    // Page 2
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const iso = tomorrow.toISOString().slice(0, 10);
    await root.locator('input[name="classDate"]').fill(iso);
    await root.locator('input[name="classTime"]').fill('10:00 AM');
    await root.locator('input[name="firstName"]').fill('Playwright');
    await root.locator('input[name="lastName"]').fill('Learner');
    await root.locator('input[name="phone"]').fill('5559876543');
    await root.locator('input[name="dateOfBirth"]').fill('1991-06-15');
    await root.locator('input[name="groupName"]').fill('Playwright Cohort');
    await root.locator('input[name="profession"]').fill('Paramedic');
    await shot(page, '04-page2');
    await root.locator('button.acp-btn-primary').click();
    await page.waitForTimeout(1000);

    // Page 3
    await root.locator('input[name="streetAddress"]').fill('500 Validation Ave');
    await root.locator('input[name="city"]').fill('Austin');
    await root.locator('select[name="state"]').selectOption('TX');
    await root.locator('input[name="postalCode"]').fill('78702');
    await root.locator('button[data-name="certifyingAgency"][data-value="American Heart Association"]').click();
    await shot(page, '05-page3');
    await root.locator('button.acp-btn-primary').click();
    await page.waitForTimeout(1000);

    // Page 4
    await root.locator('input[type="checkbox"][value="Latino"]').check();
    await root.locator('button[data-name="maritalStatus"][data-value="Single"]').click();
    await root.locator('button[data-name="sexAtBirth"][data-value="Female"]').click();
    await root.locator('button[data-name="employmentStatus"][data-value="Employed Full-Time"]').click();
    await root.locator('button[data-name="highestEducation"][data-value="Bachelor"]').click();
    await root.locator('button[data-name="cprPreviously"][data-value="Yes"]').click();
    await shot(page, '06-page4');
    await root.locator('button.acp-btn-primary').click();
    await page.waitForTimeout(1000);

    // Page 5
    const keys = [
      'physicalHealth',
      'mentalHealth',
      'emotionalHealth',
      'socialNetwork',
      'cprConfidence',
      'nutritionalChoices',
      'overallHealthSatisfaction'
    ];
    for (const key of keys) {
      await root.locator(`button[data-name="${key}"][data-value="4"]`).first().click();
    }
    await root.locator('button[data-name="learnSelfCare"][data-value="Yes"]').click();
    await root.locator('button[data-name="selfCarePeerHelp"][data-value="Maybe"]').click();
    await shot(page, '07-page5');
    await root.locator('button.acp-btn-primary').click();
    await page.waitForTimeout(4000);
    await root.locator('.acp-complete, .acp-success').first().waitFor({ timeout: 20000 });
    await shot(page, '08-submitted');
    pass('Complete 5-page enrollment and submit');

    console.log('Step 4: Verify Safety_Enrollment__c record via SOQL');
    const after = queryCount(
      "SELECT Id FROM Safety_Enrollment__c WHERE Email__c = 'playwright.learner@example.com'"
    );
    if (after <= before) {
      fail('Verify Safety_Enrollment__c record via SOQL', `Expected count > ${before}, got ${after}`);
    }
    pass('Verify Safety_Enrollment__c record via SOQL');

    console.log('Step 5: Open Enrollment Dashboard and confirm visuals');
    await gotoLex(page, lexBase, '/lightning/n/Safety_Enrollment_Dashboard');
    const dash = page.locator('c-safety-enrollment-dashboard');
    await dash.waitFor({ timeout: 20000 });
    await dash.locator('.dash-hero h1').waitFor({ timeout: 15000 });
    await dash.locator('.kpi strong').first().waitFor({ timeout: 15000 });
    await shot(page, '09-dashboard');
    pass('Open Enrollment Dashboard and confirm visuals');
  } catch (e) {
    await shot(page, '99-failure').catch(() => {});
    if (!steps.find((s) => !s.ok && s.err)) {
      fail(e.message || 'Unhandled failure', e);
    }
    await browser.close();
    process.exit(1);
  }

  await browser.close();

  console.log('\nPlaywright validation complete.\n');
  for (const s of steps) {
    console.log(`${s.ok ? '✅' : '❌'} ${s.name}`);
  }
  console.log('\nScreenshots saved to: screenshots/');
  process.exit(0);
}

run().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
