import { LightningElement, api, track } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';
import submitInquiry from '@salesforce/apex/AcpSiteFormController.submitInquiry';

const M = `${MEDIA}/acpTrainingMedia`;

const INTEREST_MAP = {
    'drop-in': 'Weekly Drop-In',
    prevention: 'Suicide Prevention Awareness',
    resources: 'Self-Care Resources',
    register: 'Weekly Drop-In'
};

export default class AcpAcceptGrowForm extends LightningElement {
    @api defaultInterest = '';
    sideImage = `${M}/img_form_grow_side.jpg`;
    @track interestPath = '';
    @track participantName = '';
    @track email = '';
    @track phone = '';
    @track urgency = '';
    @track notes = '';
    @track emergencyAcknowledgment = '';
    @track isSubmitting = false;
    @track isComplete = false;
    @track errorMessage = '';

    interestOptions = [
        { value: 'Weekly Drop-In', label: 'Weekly Drop-In (self-help / resilience circle)' },
        { value: 'Suicide Prevention Awareness', label: 'Suicide Prevention Awareness pathway' },
        { value: 'Self-Care Resources', label: 'Self-Care Resources & follow-up tools' }
    ];

    urgencyOptions = [
        { value: 'Ready for next session', label: 'Ready for the next session' },
        { value: 'Within a few weeks', label: 'Within a few weeks' },
        { value: 'Just exploring', label: 'Just exploring' }
    ];

    connectedCallback() {
        this.applyHashInterest();
        this._onHash = () => this.applyHashInterest();
        window.addEventListener('hashchange', this._onHash);
    }

    disconnectedCallback() {
        window.removeEventListener('hashchange', this._onHash);
    }

    applyHashInterest() {
        const hash = (window.location.hash || '').replace('#', '').toLowerCase();
        const fromHash = INTEREST_MAP[hash];
        const fromApi = INTEREST_MAP[(this.defaultInterest || '').toLowerCase()] || this.defaultInterest;
        if (fromHash) this.interestPath = fromHash;
        else if (fromApi && !this.interestPath) this.interestPath = fromApi;
    }

    get interestChoices() {
        return this.interestOptions.map((o) => ({ ...o, checked: this.interestPath === o.value }));
    }
    get urgencyChoices() {
        return this.urgencyOptions.map((o) => ({ ...o, checked: this.urgency === o.value }));
    }
    get emergencyChecked() {
        return Boolean(this.emergencyAcknowledgment);
    }
    get introTitle() {
        if (this.interestPath) return `Sign up — ${this.interestPath}`;
        return 'Quick Accept & Grow signup';
    }
    get submitLabel() {
        return this.isSubmitting ? 'Submitting…' : 'Submit signup';
    }

    handleText(event) {
        this[event.target.name] = event.target.value;
    }

    handleRadio(event) {
        this[event.target.name] = event.target.value;
    }

    handleEmergency(event) {
        this.emergencyAcknowledgment = event.target.checked
            ? 'I understand that Accept & Grow drop-in sessions are not for 24/7 emergency crisis response.'
            : '';
    }

    async handleSubmit(event) {
        event.preventDefault();
        this.errorMessage = '';
        this.isSubmitting = true;
        try {
            await submitInquiry({
                formType: 'Accept_Grow',
                payloadJson: JSON.stringify({
                    completingAs: 'I am joining for myself',
                    participantName: this.participantName,
                    participantAge: '',
                    parentGuardianName: '',
                    email: this.email,
                    phone: this.phone,
                    preferredContact: ['Email'],
                    bestCheckInTime: [],
                    focusAreas: [this.interestPath].filter(Boolean),
                    urgency: this.urgency,
                    communityAgreement: [],
                    emergencyAcknowledgment: this.emergencyAcknowledgment,
                    notes: this.notes
                })
            });
            this.isComplete = true;
        } catch (e) {
            this.errorMessage = e?.body?.message || e?.message || 'Unable to submit right now. Please try again.';
        } finally {
            this.isSubmitting = false;
        }
    }
}
