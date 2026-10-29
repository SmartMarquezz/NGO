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
    @track firstName = '';
    @track lastName = '';
    @track email = '';
    @track phone = '';
    @track organization = '';
    @track title = '';
    @track location = '';
    @track emergencyAcknowledgment = '';
    @track isSubmitting = false;
    @track isComplete = false;
    @track errorMessage = '';

    interestOptions = [
        { value: 'Weekly Drop-In', label: 'Weekly Drop-In' },
        { value: 'Suicide Prevention Awareness', label: 'Suicide Prevention Awareness' },
        { value: 'Self-Care Resources', label: 'Self-Care Resources' }
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
        const fullName = `${this.firstName} ${this.lastName}`.trim();
        const extras = [
            this.organization ? `Org: ${this.organization}` : '',
            this.title ? `Title: ${this.title}` : '',
            this.location ? `Location: ${this.location}` : ''
        ]
            .filter(Boolean)
            .join(' | ');
        try {
            await submitInquiry({
                formType: 'Accept_Grow',
                payloadJson: JSON.stringify({
                    completingAs: 'I am joining for myself',
                    firstName: this.firstName,
                    lastName: this.lastName,
                    participantName: fullName,
                    fullName,
                    participantAge: '',
                    parentGuardianName: '',
                    email: this.email,
                    phone: this.phone,
                    preferredContact: ['Email'],
                    bestCheckInTime: [],
                    focusAreas: [this.interestPath, extras].filter(Boolean),
                    urgency: 'Ready for next session',
                    communityAgreement: [],
                    emergencyAcknowledgment: this.emergencyAcknowledgment,
                    notes: extras
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
