import { LightningElement, api, track, wire } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';
import getOfferings from '@salesforce/apex/SafetyEnrollmentController.getOfferings';
import submitClassRegistration from '@salesforce/apex/SafetyEnrollmentController.submitClassRegistration';
import submitInquiry from '@salesforce/apex/AcpSiteFormController.submitInquiry';

const M = `${MEDIA}/acpTrainingMedia`;

export default class SafetyEnrollmentForm extends LightningElement {
    @api headline = 'First Aid & CPR Registration';
    @api embedMode = false;
    /** @type {'inquiry'|'seat'} */
    @api formMode = 'seat';
    sideImage = `${M}/img_form_cpr_side.jpg`;

    @track form = this.emptySeatForm();
    @track inquiry = this.emptyInquiryForm();
    @track offerings = [];
    @track loadingOfferings = true;
    @track isSubmitting = false;
    @track isComplete = false;
    @track submitError = '';
    @track result = {};

    preferredOptions = [
        { value: 'Email', label: 'Email' },
        { value: 'Text Message', label: 'Text Message' },
        { value: 'Phone Call', label: 'Phone Call' }
    ];

    deliveryOptions = [
        { value: 'In-Person (Instructor Led)', label: 'In-Person (Instructor Led)' },
        {
            value: 'Blended (Mostly Online with In-Person Skills)',
            label: 'Blended (Mostly Online with In-Person Skills)'
        }
    ];

    timeOptions = [
        { value: '9:00 AM', label: '9:00 AM' },
        { value: '10:00 AM', label: '10:00 AM' },
        { value: '1:00 PM', label: '1:00 PM' },
        { value: '4:30 PM', label: '4:30 PM' },
        { value: '6:00 PM', label: '6:00 PM' }
    ];

    classInterestOptions = [
        { value: 'Basic Life Support (BLS)', label: 'Basic Life Support (BLS) - healthcare / clinical' },
        {
            value: 'Adult & Pediatric First Aid / CPR / AED',
            label: 'Adult & Pediatric First Aid / CPR / AED'
        },
        { value: 'Adult First Aid / CPR / AED', label: 'Adult First Aid / CPR / AED' },
        { value: 'Adult & Pediatric CPR / AED', label: 'Adult & Pediatric CPR / AED' },
        { value: 'Adult CPR / AED', label: 'Adult CPR / AED' },
        { value: 'First Aid only', label: 'First Aid only' },
        { value: 'Not sure - please recommend', label: 'Not sure - please recommend' }
    ];

    reasonOptions = [
        { value: 'Workplace / job requirement', label: 'Workplace / job requirement' },
        { value: 'School / college requirement', label: 'School / college requirement' },
        { value: 'Healthcare / clinical program', label: 'Healthcare / clinical program' },
        { value: 'Childcare / teaching / coaching', label: 'Childcare / teaching / coaching' },
        { value: 'Personal / family preparedness', label: 'Personal / family preparedness' },
        { value: 'Group / organization training', label: 'Group / organization training' },
        { value: 'Renewal / recertification', label: 'Renewal / recertification' }
    ];

    experienceOptions = [
        { value: 'First time', label: 'First time taking this type of class' },
        { value: 'Renewal', label: 'Renewal / I have certified before' },
        { value: 'Not sure', label: 'Not sure' }
    ];

    timingOptions = [
        { value: 'As soon as possible', label: 'As soon as possible' },
        { value: 'Within 2 weeks', label: 'Within 2 weeks' },
        { value: 'Within a month', label: 'Within a month' },
        { value: 'Flexible / exploring options', label: 'Flexible / exploring options' }
    ];

    @wire(getOfferings, { offeringType: 'Class' })
    wiredOfferings({ data, error }) {
        this.loadingOfferings = false;
        if (data) {
            this.offerings = data;
        } else if (error) {
            this.offerings = [];
            if (this.isSeatMode) {
                this.submitError = error?.body?.message || 'Unable to load class inventory.';
            }
        }
    }

    emptySeatForm() {
        return {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            preferredContact: '',
            offeringId: '',
            deliveryOption: '',
            classDate: '',
            classTime: '',
            groupName: '',
            trainingNotes: ''
        };
    }

    emptyInquiryForm() {
        return {
            fullName: '',
            email: '',
            phone: '',
            preferredContact: '',
            classInterests: [],
            reasons: [],
            deliveryOption: '',
            experienceLevel: '',
            timingNeed: '',
            groupName: '',
            additionalDetails: ''
        };
    }

    get isInquiryMode() {
        return (this.formMode || 'seat').toLowerCase() === 'inquiry';
    }

    get isSeatMode() {
        return !this.isInquiryMode;
    }

    get rootClass() {
        return this.embedMode ? 'embed' : 'site';
    }

    get pageClass() {
        return this.embedMode ? 'page is-embed' : 'page';
    }

    get visualTitle() {
        return this.isInquiryMode ? 'Tell us what you need. We’ll point you to the right class.' : 'Reserve your seat. Walk out rescue-ready.';
    }

    get visualCopy() {
        return this.isInquiryMode
            ? 'A few questions help us recommend BLS, HeartSaver, First Aid, adult vs pediatric, and the best format.'
            : 'Pick your class, hold inventory in Salesforce, then finish payment on QuickBooks.';
    }

    get introTitle() {
        return this.isInquiryMode ? 'Class inquiry' : this.headline || 'First Aid & CPR Registration';
    }

    get introCopy() {
        return this.isInquiryMode
            ? 'Use this if you are unsure which class fits. We’ll follow up with the best option and how to enroll on the current schedule.'
            : 'Choose your class, reserve a seat, then complete payment with the QuickBooks link. You’ll receive your student access code when registration is confirmed.';
    }

    get preferredChoices() {
        const selected = this.isInquiryMode ? this.inquiry.preferredContact : this.form.preferredContact;
        return this.preferredOptions.map((o) => ({
            ...o,
            checked: selected === o.value
        }));
    }

    get deliveryChoices() {
        const selected = this.isInquiryMode ? this.inquiry.deliveryOption : this.form.deliveryOption;
        return this.deliveryOptions.map((o) => ({
            ...o,
            checked: selected === o.value
        }));
    }

    get timeChoices() {
        return this.timeOptions.map((o) => ({
            ...o,
            selected: this.form.classTime === o.value
        }));
    }

    get offeringChoices() {
        return (this.offerings || []).map((o) => ({
            ...o,
            checked: this.form.offeringId === o.id,
            disabled: o.available === false
        }));
    }

    get hasOfferings() {
        return (this.offerings || []).length > 0;
    }

    get classInterestChoices() {
        return this.classInterestOptions.map((o) => ({
            ...o,
            checked: this.inquiry.classInterests.includes(o.value)
        }));
    }

    get reasonChoices() {
        return this.reasonOptions.map((o) => ({
            ...o,
            checked: this.inquiry.reasons.includes(o.value)
        }));
    }

    get experienceChoices() {
        return this.experienceOptions.map((o) => ({
            ...o,
            checked: this.inquiry.experienceLevel === o.value
        }));
    }

    get timingChoices() {
        return this.timingOptions.map((o) => ({
            ...o,
            checked: this.inquiry.timingNeed === o.value
        }));
    }

    get submitLabel() {
        if (this.isSubmitting) return 'Submitting…';
        return this.isInquiryMode ? 'Send class inquiry' : 'Reserve seat & get payment link';
    }

    handleText(event) {
        const { name, value } = event.target;
        if (this.isInquiryMode) {
            this.inquiry = { ...this.inquiry, [name]: value };
        } else {
            this.form = { ...this.form, [name]: value };
        }
    }

    handleRadio(event) {
        const { name, value } = event.target;
        if (this.isInquiryMode) {
            this.inquiry = { ...this.inquiry, [name]: value };
        } else {
            this.form = { ...this.form, [name]: value };
        }
    }

    handleMulti(event) {
        const { name, value, checked } = event.target;
        const current = [...(this.inquiry[name] || [])];
        if (checked) {
            if (!current.includes(value)) current.push(value);
        } else {
            const idx = current.indexOf(value);
            if (idx >= 0) current.splice(idx, 1);
        }
        this.inquiry = { ...this.inquiry, [name]: current };
    }

    async handleSubmit(event) {
        event.preventDefault();
        this.submitError = '';
        if (this.isInquiryMode) {
            if (!(this.inquiry.classInterests || []).length) {
                this.submitError = 'Please select at least one class type (or Not sure).';
                return;
            }
            // Pre-qual only — reasons/timing optional to reduce friction
            if (!(this.inquiry.reasons || []).length) {
                this.inquiry = { ...this.inquiry, reasons: ['Need recommendation'] };
            }
            if (!this.inquiry.preferredContact) {
                this.inquiry = { ...this.inquiry, preferredContact: 'Email' };
            }
            if (!this.inquiry.experienceLevel) {
                this.inquiry = { ...this.inquiry, experienceLevel: 'Not sure' };
            }
            if (!this.inquiry.timingNeed) {
                this.inquiry = { ...this.inquiry, timingNeed: 'Flexible' };
            }
            if (!this.inquiry.groupName) {
                this.inquiry = { ...this.inquiry, groupName: 'Individual' };
            }
        }
        this.isSubmitting = true;
        try {
            if (this.isInquiryMode) {
                await this.submitInquiryForm();
            } else {
                const payload = await submitClassRegistration({
                    payloadJson: JSON.stringify(this.form)
                });
                this.result = payload || {};
                this.isComplete = true;
            }
        } catch (e) {
            this.submitError = e?.body?.message || e?.message || 'Unable to submit right now. Please try again.';
        } finally {
            this.isSubmitting = false;
        }
    }

    async submitInquiryForm() {
        const payload = {
            fullName: this.inquiry.fullName,
            email: this.inquiry.email,
            phone: this.inquiry.phone,
            preferredContact: this.inquiry.preferredContact,
            interestAreas: this.inquiry.classInterests,
            availability: [
                this.inquiry.deliveryOption,
                this.inquiry.experienceLevel,
                this.inquiry.timingNeed
            ].filter(Boolean),
            focusAreas: this.inquiry.reasons,
            additionalDetails: [
                this.inquiry.groupName ? `Group/org: ${this.inquiry.groupName}` : null,
                this.inquiry.additionalDetails || null
            ]
                .filter(Boolean)
                .join('\n')
        };
        await submitInquiry({ formType: 'CPR_Inquiry', payloadJson: JSON.stringify(payload) });
        this.isComplete = true;
        this.result = { inquiry: true };
    }
}
