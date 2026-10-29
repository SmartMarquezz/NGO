import { LightningElement, track } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';
import submitInquiry from '@salesforce/apex/AcpSiteFormController.submitInquiry';

const M = `${MEDIA}/acpTrainingMedia`;

export default class AcpVolunteerInterestForm extends LightningElement {
    sideImage = `${M}/img_form_vol_side.jpg`;
    @track fullName = '';
    @track email = '';
    @track phone = '';
    @track preferredContact = '';
    @track interestAreas = [];
    @track availability = [];
    @track additionalDetails = '';
    @track isSubmitting = false;
    @track isComplete = false;
    @track errorMessage = '';

    preferredOptions = [
        { value: 'Email', label: 'Email' },
        { value: 'Text Message', label: 'Text Message' },
        { value: 'Phone Call', label: 'Phone Call' }
    ];

    interestOptions = [
        {
            value: 'Accept & Grow: Supporting youth & young adult mental wellness programs',
            label: 'Accept & Grow: Supporting youth & young adult mental wellness programs'
        },
        {
            value: 'Rescuer Ready: Assisting with community CPR & First Aid awareness events',
            label: 'Rescuer Ready: Assisting with community CPR & First Aid awareness events'
        },
        {
            value: 'Community Outreach: Helping at local fairs, events, and school hubs',
            label: 'Community Outreach: Helping at local fairs, events, and school hubs'
        },
        {
            value: 'Behind-the-Scenes: Tech, social media, graphic design, or admin support',
            label: 'Behind-the-Scenes: Tech, social media, graphic design, or admin support'
        },
        {
            value: 'General Support: I just want to help where needed most!',
            label: 'General Support: I just want to help where needed most!'
        }
    ];

    availabilityOptions = [
        { value: 'Weekday Evenings (After 4:30 PM)', label: 'Weekday Evenings (After 4:30 PM)' },
        { value: 'Weekends (Saturdays / Sundays)', label: 'Weekends (Saturdays / Sundays)' },
        { value: 'Flexible / On-Call for Special Events', label: 'Flexible / On-Call for Special Events' },
        { value: 'Remote / Digital tasks only', label: 'Remote / Digital tasks only' }
    ];

    get preferredChoices() {
        return this.preferredOptions.map((o) => ({ ...o, checked: this.preferredContact === o.value }));
    }

    get interestChoices() {
        return this.interestOptions.map((o) => ({ ...o, checked: this.interestAreas.includes(o.value) }));
    }

    get submitLabel() {
        return this.isSubmitting ? 'Submitting…' : 'Submit interest form';
    }

    handleText(event) {
        this[event.target.name] = event.target.value;
    }

    handlePreferred(event) {
        this.preferredContact = event.target.value;
    }

    handleMulti(event) {
        const { name, value, checked } = event.target;
        const current = [...(this[name] || [])];
        if (checked) {
            if (!current.includes(value)) current.push(value);
        } else {
            const idx = current.indexOf(value);
            if (idx >= 0) current.splice(idx, 1);
        }
        this[name] = current;
    }

    async handleSubmit(event) {
        event.preventDefault();
        this.errorMessage = '';
        this.isSubmitting = true;
        try {
            await submitInquiry({
                formType: 'Volunteer',
                payloadJson: JSON.stringify({
                    fullName: this.fullName,
                    email: this.email,
                    phone: this.phone,
                    preferredContact: this.preferredContact,
                    interestAreas: this.interestAreas,
                    availability: this.availability,
                    additionalDetails: this.additionalDetails
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
