import { LightningElement, api, track } from 'lwc';
import submitEnrollment from '@salesforce/apex/SafetyEnrollmentController.submitEnrollment';

const TOTAL_PAGES = 5;

const STATE_OPTIONS = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
].map((s) => ({ label: s, value: s }));

export default class AcpFullEnrollmentForm extends LightningElement {
    @api headline = 'Safety Training Enrollment';
    @api embedMode = false;

    @track currentPage = 1;
    @track isSubmitting = false;
    @track isComplete = false;
    @track enrollmentNumber;
    @track formError = '';
    @track form = this.emptyForm();

    get stateOptions() {
        return STATE_OPTIONS.map((s) => ({
            ...s,
            selected: this.form.state === s.value
        }));
    }

    ethnicityOptions = [
        'Asian', 'Caucasian', 'Latino', 'African-American', 'South Indian',
        'Pacific Islander', 'Native American', 'Middle Eastern', 'Multi-Racial',
        'Prefer not to answer', 'Other'
    ];

    get progressPercent() {
        return Math.round((this.currentPage / TOTAL_PAGES) * 100);
    }

    get progressStyle() {
        return `width:${this.progressPercent}%`;
    }

    get pageLabel() {
        return `Page ${this.currentPage} of ${TOTAL_PAGES}`;
    }

    get isFirstPage() {
        return this.currentPage === 1;
    }

    get isLastPage() {
        return this.currentPage === TOTAL_PAGES;
    }

    get showPage1() { return this.currentPage === 1 && !this.isComplete; }
    get showPage2() { return this.currentPage === 2 && !this.isComplete; }
    get showPage3() { return this.currentPage === 3 && !this.isComplete; }
    get showPage4() { return this.currentPage === 4 && !this.isComplete; }
    get showPage5() { return this.currentPage === 5 && !this.isComplete; }
    get showNav() { return !this.isComplete; }

    get showHero() {
        return !(this.embedMode === true || this.embedMode === 'true');
    }

    get rootClass() {
        return this.showHero ? 'acp-form' : 'acp-form acp-form--embed';
    }

    get nextLabel() {
        return this.isLastPage ? 'Submit' : 'Next';
    }

    get showAgencyOther() {
        return this.form.certifyingAgency === 'Other';
    }

    get showEthnicityOther() {
        return (this.form.ethnicity || []).includes('Other');
    }

    get showMaritalOther() {
        return this.form.maritalStatus === 'Other';
    }

    get showSexOther() {
        return this.form.sexAtBirth === 'Other';
    }

    get showEmploymentOther() {
        return this.form.employmentStatus === 'Other';
    }

    get showEducationOther() {
        return this.form.highestEducation === 'Other';
    }

    get showPeerOther() {
        return this.form.selfCarePeerHelp === 'Other';
    }

    get likertOptions() {
        return [1, 2, 3, 4, 5];
    }

    emptyForm() {
        return {
            email: '',
            greatDay: '',
            classDate: '',
            classTime: '',
            firstName: '',
            lastName: '',
            phone: '',
            dateOfBirth: '',
            groupName: '',
            profession: '',
            streetAddress: '',
            city: '',
            state: '',
            postalCode: '',
            certifyingAgency: '',
            certifyingAgencyOther: '',
            ethnicity: [],
            ethnicityOther: '',
            maritalStatus: '',
            maritalStatusOther: '',
            sexAtBirth: '',
            sexAtBirthOther: '',
            employmentStatus: '',
            employmentStatusOther: '',
            highestEducation: '',
            highestEducationOther: '',
            cprPreviously: '',
            physicalHealth: null,
            mentalHealth: null,
            emotionalHealth: null,
            socialNetwork: null,
            cprConfidence: null,
            nutritionalChoices: null,
            overallHealthSatisfaction: null,
            learnSelfCare: '',
            selfCarePeerHelp: '',
            selfCarePeerOther: ''
        };
    }

    handleChange(event) {
        const { name, value, type, checked } = event.target;
        if (type === 'checkbox') {
            const selected = new Set(this.form.ethnicity || []);
            if (checked) {
                selected.add(value);
            } else {
                selected.delete(value);
            }
            this.form = { ...this.form, ethnicity: Array.from(selected) };
            return;
        }
        this.form = { ...this.form, [name]: value };
    }

    handleRadio(event) {
        const name = event.currentTarget.dataset.name;
        const value = event.currentTarget.dataset.value;
        this.form = { ...this.form, [name]: value };
    }

    isSelected(name, value) {
        return this.form[name] === value;
    }

    isEthnicityChecked(value) {
        return (this.form.ethnicity || []).includes(value);
    }

    get greatDayOptions() {
        return this.withSelected('greatDay', ['Yes', 'No', 'Unsure', 'Need Help']);
    }

    get agencyOptions() {
        return this.withSelected('certifyingAgency', [
            'Not Sure',
            'American Heart Association',
            'American Red Cross',
            'ECSI (Emergency Care & Safety Institute)',
            'American Trauma Event Management',
            'National Safety Council',
            'Custom Class',
            'Other'
        ]);
    }

    get maritalOptions() {
        return this.withSelected('maritalStatus', ['Single', 'Married', 'Divorced', 'Widow', 'Other']);
    }

    get sexOptions() {
        return this.withSelected('sexAtBirth', ['Male', 'Female', 'Prefer not to answer', 'Other']);
    }

    get employmentOptions() {
        return this.withSelected('employmentStatus', [
            'Unemployed', 'Employed Full-Time', 'Employed Part-Time', 'Student', 'Retired', 'Other'
        ]);
    }

    get educationOptions() {
        return this.withSelected('highestEducation', [
            'High School', 'Associate', 'Certificate', 'Bachelor', 'Masters', 'Doctorate', 'Other'
        ]);
    }

    get cprOptions() {
        return this.withSelected('cprPreviously', ['Yes', 'No', 'Not sure']);
    }

    get selfCareOptions() {
        return this.withSelected('learnSelfCare', ['Yes', 'No', 'Maybe', 'Need more information']);
    }

    get peerOptions() {
        return this.withSelected('selfCarePeerHelp', ['Yes', 'No', 'Maybe', 'Need more information', 'Other']);
    }

    get ethnicityChoices() {
        return this.ethnicityOptions.map((value) => ({
            value,
            checked: this.isEthnicityChecked(value)
        }));
    }

    get readinessQuestions() {
        return [
            { key: 'physicalHealth', label: 'I feel my physical health is adequate.', left: 'Strongly disagree', right: 'Strongly agree' },
            { key: 'mentalHealth', label: 'I feel my mental health is adequate.', left: 'Strongly disagree', right: 'Strongly agree' },
            { key: 'emotionalHealth', label: 'I feel my emotional health is balanced.', left: 'Strongly disagree', right: 'Strongly agree' },
            { key: 'socialNetwork', label: 'I feel my social network is supportive.', left: 'Strongly disagree', right: 'Strongly agree' },
            { key: 'cprConfidence', label: 'I feel confident to provide CPR if needed.', left: 'Strongly disagree', right: 'Strongly agree' },
            { key: 'nutritionalChoices', label: 'I feel I make wise nutritional choices for my overall health.', left: 'Strongly disagree', right: 'Strongly agree' },
            { key: 'overallHealthSatisfaction', label: 'I feel satisfied with my overall health?', left: 'Very satisfied', right: 'Very dissatisfied' }
        ].map((q) => ({
            ...q,
            options: this.likertOptions.map((n) => {
                const selected = String(this.form[q.key]) === String(n);
                return {
                    value: String(n),
                    selected,
                    buttonClass: selected ? 'is-selected' : ''
                };
            })
        }));
    }

    withSelected(field, values) {
        return values.map((value) => {
            const selected = this.form[field] === value;
            return {
                value,
                selected,
                buttonClass: selected ? 'is-selected' : ''
            };
        });
    }

    handleBack() {
        if (this.currentPage > 1) {
            this.currentPage -= 1;
            this.scrollTop();
        }
    }

    syncInputsFromDom() {
        const next = { ...this.form };
        this.template.querySelectorAll('input[name], select[name], textarea[name]').forEach((el) => {
            if (!el.name || el.type === 'checkbox' || el.type === 'radio') {
                return;
            }
            next[el.name] = el.value;
        });
        this.form = next;
    }

    async handleNext() {
        this.formError = '';
        // Capture typed values even if the last field never blurred (onchange only).
        this.syncInputsFromDom();
        const missing = this.missingFieldsForPage(this.currentPage);
        if (missing.length) {
            this.formError = `Please complete: ${missing.join(', ')}.`;
            return;
        }
        if (this.isLastPage) {
            await this.submit();
            return;
        }
        this.currentPage += 1;
        this.scrollTop();
    }

    handleClear() {
        this.form = this.emptyForm();
        this.currentPage = 1;
        this.isComplete = false;
        this.enrollmentNumber = null;
        this.formError = '';
    }

    validateCurrentPage() {
        return this.missingFieldsForPage(this.currentPage).length === 0;
    }

    missingFieldsForPage(page) {
        const f = this.form;
        const missing = [];
        const need = (ok, label) => {
            if (!ok) missing.push(label);
        };
        if (page === 1) {
            need(f.email, 'Email');
            need(f.greatDay, 'Great Day');
        } else if (page === 2) {
            need(f.classDate, 'Class Date');
            need(f.classTime, 'Class Time');
            need(f.firstName, 'First Name');
            need(f.lastName, 'Last Name');
            need(f.phone, 'Phone');
            need(f.dateOfBirth, 'Date of Birth');
            need(f.groupName, 'Group Name');
            need(f.profession, 'Profession');
        } else if (page === 3) {
            need(f.streetAddress, 'Street Address');
            need(f.city, 'City');
            need(f.state, 'State');
            need(f.postalCode, 'Postal Code');
            need(f.certifyingAgency, 'Certifying Agency');
        } else if (page === 4) {
            need(f.maritalStatus, 'Marital Status');
            need(f.sexAtBirth, 'Sex at Birth');
            need(f.employmentStatus, 'Employment Status');
            need(f.highestEducation, 'Highest Education');
            need(f.cprPreviously, 'CPR Previously');
        } else if (page === 5) {
            need(f.physicalHealth, 'Physical Health rating');
            need(f.mentalHealth, 'Mental Health rating');
            need(f.emotionalHealth, 'Emotional Health rating');
            need(f.socialNetwork, 'Social Network rating');
            need(f.cprConfidence, 'CPR Confidence rating');
            need(f.nutritionalChoices, 'Nutritional Choices rating');
            need(f.overallHealthSatisfaction, 'Overall Health rating');
            need(f.learnSelfCare, 'Learn Self-Care');
            need(f.selfCarePeerHelp, 'Self-Care Peer Help');
        }
        return missing;
    }

    async submit() {
        this.isSubmitting = true;
        this.formError = '';
        try {
            const id = await submitEnrollment({ payloadJson: JSON.stringify(this.form) });
            this.enrollmentNumber = id;
            this.isComplete = true;
        } catch (error) {
            let message = 'Unable to submit enrollment. Please try again or call (650) 424-9304.';
            if (error && error.body && error.body.message) {
                message = error.body.message;
            } else if (error && error.message) {
                message = error.message;
            }
            this.formError = message;
        } finally {
            this.isSubmitting = false;
        }
    }

    scrollTop() {
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            const root = this.template.querySelector('.acp-form');
            if (root) {
                root.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 50);
    }
}
