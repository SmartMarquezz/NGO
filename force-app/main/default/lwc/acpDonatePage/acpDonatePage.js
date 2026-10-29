import { LightningElement, api } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';

const M = `${MEDIA}/acpTrainingMedia`;

// Override in Experience Builder (donateUrl) when Ramesh shares the donation QuickBooks link.
const DEFAULT_DONATE_URL =
    'mailto:ramesh@allcareplus.org?subject=All%20Care%20Plus%20Donation&body=I%20would%20like%20to%20make%20a%20donation.%20Please%20send%20the%20QuickBooks%20payment%20link.';

export default class AcpDonatePage extends LightningElement {
    @api donateUrl = DEFAULT_DONATE_URL;
    _observer;
    media = { hero: `${M}/img_donate_reach.jpg` };

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
}
