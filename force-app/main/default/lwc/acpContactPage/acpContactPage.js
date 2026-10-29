import { LightningElement, track } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';
import submitInquiry from '@salesforce/apex/AcpSiteFormController.submitInquiry';

const M = `${MEDIA}/acpTrainingMedia`;

export default class AcpContactPage extends LightningElement {
    media = { team: `${M}/img_community_fair.jpg` };
    _observer;

    @track form = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        topic: 'Accept & Grow',
        message: ''
    };
    @track isSent = false;
    @track isSubmitting = false;
    @track submitError = '';

    get topicOptions() {
        return [
            { value: 'Accept & Grow', label: 'Accept & Grow' },
            { value: 'CPR & First Aid', label: 'CPR & First Aid' },
            { value: 'Peer Support', label: 'Peer Support' },
            { value: 'Volunteer', label: 'Volunteer' },
            { value: 'Support / Donate', label: 'Support / Donate' },
            { value: 'Other', label: 'Other' }
        ].map((opt) => ({ ...opt, selected: opt.value === this.form.topic }));
    }

    get submitLabel() {
        return this.isSubmitting ? 'Saving…' : 'Send message';
    }

    connectedCallback() {
        this._onHash = () => this.scrollToHash();
        window.addEventListener('hashchange', this._onHash);
    }

    disconnectedCallback() {
        window.removeEventListener('hashchange', this._onHash);
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
    }

    renderedCallback() {
        this.scrollToHash();
        if (this._observer) return;
        const nodes = this.template.querySelectorAll('[data-reveal]');
        if (!nodes.length) return;
        this._observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-in')),
            { threshold: 0.14 }
        );
        nodes.forEach((n) => this._observer.observe(n));
    }

    scrollToHash() {
        const hash = (window.location.hash || '').replace('#', '');
        if (!hash) return;
        const el = this.template.querySelector(`[data-anchor="${hash}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    handleChange(event) {
        const { name, value } = event.target;
        this.form = { ...this.form, [name]: value };
    }

    async handleSubmit(event) {
        event.preventDefault();
        this.submitError = '';
        this.isSubmitting = true;
        try {
            await submitInquiry({
                formType: 'Contact',
                payloadJson: JSON.stringify({
                    firstName: this.form.firstName,
                    lastName: this.form.lastName,
                    fullName: `${this.form.firstName} ${this.form.lastName}`.trim(),
                    email: this.form.email,
                    phone: this.form.phone,
                    topic: this.form.topic,
                    preferredContact: 'Email',
                    additionalDetails: this.form.message
                })
            });
            this.isSent = true;
            this.form = {
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                topic: 'Accept & Grow',
                message: ''
            };
        } catch (e) {
            this.submitError =
                (e && e.body && e.body.message) ||
                (e && e.message) ||
                'Unable to save your message. Please try again or call (650) 424-0204.';
        } finally {
            this.isSubmitting = false;
        }
    }
}
