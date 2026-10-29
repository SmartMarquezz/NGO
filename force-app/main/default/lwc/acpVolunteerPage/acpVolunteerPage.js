import { LightningElement } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';

const M = `${MEDIA}/acpTrainingMedia`;

export default class AcpVolunteerPage extends LightningElement {
    _observer;
    media = {
        hero: `${M}/img_community_fair.jpg`,
        photo: `${M}/img_volunteer_help.jpg`
    };

    renderedCallback() {
        if (this._observer) return;
        const nodes = this.template.querySelectorAll('[data-reveal]');
        if (!nodes.length) return;
        this._observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('is-in')),
            { threshold: 0.14 }
        );
        nodes.forEach((n) => this._observer.observe(n));
    }

    disconnectedCallback() {
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
    }

    siteRoot() {
        const meta = document.querySelector('meta[name="basePath"]')?.getAttribute('content');
        if (meta !== null && meta !== undefined) return meta;
        return '';
    }

    handleNeedSupport() {
        // Short contact form with peer-support intent
        window.location.assign(`${this.siteRoot()}/contact#contact-form`);
    }

    handleVolunteer() {
        window.location.assign(`${this.siteRoot()}/get-involved#volunteer`);
    }
}
