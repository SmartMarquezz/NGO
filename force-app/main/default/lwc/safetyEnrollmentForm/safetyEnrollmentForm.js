import { LightningElement, api, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import submitEnrollment from '@salesforce/apex/SafetyEnrollmentController.submitEnrollment';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';

const TOTAL_PAGES = 5;

const STATE_OPTIONS = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
    'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
    'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
].map((s) => ({ label: s, value: s }));

export default class SafetyEnrollmentForm extends LightningElement {
    @api headline = 'Safety Training Enrollment';

    formBackdrop = `linear-gradient(180deg, rgba(19, 37, 58, 0.62), rgba(19, 37, 58, 0.42)), url(${MEDIA}/acpTrainingMedia/cpr.jpg) center/cover fixed`;

    get formStyle() {
        return `background:${this.formBackdrop}`;
    }

    @track currentPage = 1;
    @track isSubmitting = false;
    @track isComplete = false;
    @track enrollmentNumber;
    @track submitError;
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

    async handleNext() {
        if (!this.validateCurrentPage()) {
            this.toast('Please complete the required fields on this page.', 'error');
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
        this.toast('Form cleared.', 'info');
    }

    validateCurrentPage() {
        const f = this.form;
        if (this.currentPage === 1) {
            return f.email && f.greatDay;
        }
        if (this.currentPage === 2) {
            return f.classDate && f.classTime && f.firstName && f.lastName && f.phone && f.dateOfBirth && f.groupName && f.profession;
        }
        if (this.currentPage === 3) {
            return f.streetAddress && f.city && f.state && f.postalCode && f.certifyingAgency;
        }
        if (this.currentPage === 4) {
            return f.maritalStatus && f.sexAtBirth && f.employmentStatus && f.highestEducation && f.cprPreviously;
        }
        if (this.currentPage === 5) {
            return (
                f.physicalHealth && f.mentalHealth && f.emotionalHealth && f.socialNetwork &&
                f.cprConfidence && f.nutritionalChoices && f.overallHealthSatisfaction &&
                f.learnSelfCare && f.selfCarePeerHelp
            );
        }
        return true;
    }

    async submit() {
        this.isSubmitting = true;
        try {
            const id = await submitEnrollment({ payloadJson: JSON.stringify(this.form) });
            this.enrollmentNumber = id;
            this.isComplete = true;
            this.toast('Enrollment submitted. Welcome to All Care Plus!', 'success');
        } catch (error) {
            const message = error?.body?.message || error?.message || 'Unable to submit enrollment.';
            this.toast(message, 'error');
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

    toast(message, variant) {
        this.submitError = variant === 'error' ? message : null;
        try {
            this.dispatchEvent(new ShowToastEvent({ title: 'All Care Plus', message, variant }));
        } catch (e) {
            // Guest Experience Cloud users may not support toasts
        }
    }
}
