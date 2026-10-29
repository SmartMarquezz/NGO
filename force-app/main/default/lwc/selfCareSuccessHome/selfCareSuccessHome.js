import { LightningElement, api } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';

const M = `${MEDIA}/acpTrainingMedia`;

export default class SelfCareSuccessHome extends LightningElement {
    @api ctaPath = '/contact';
    _observer;

    media = {
        hero: `${M}/img_selfcare_dawn.jpg`,
        success: `${M}/img_peer_warm.jpg`,
        prevention: `${M}/img_hope_window.jpg`,
        resources: `${M}/img_journaling_light.jpg`,
        alone: `${M}/img_mountain_alone.jpg`
    };

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
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add('is-in');
                });
            },
            { threshold: 0.14 }
        );
        nodes.forEach((node) => this._observer.observe(node));
    }

    scrollToHash() {
        const hash = (window.location.hash || '').replace('#', '');
        if (!hash) return;
        // Prefer the signup form for program hashes used in ads
        const formHost =
            this.template.querySelector('[data-anchor="register"]') ||
            this.template.querySelector('#register') ||
            this.template.querySelector('[data-register]');
        const el = formHost || this.template.querySelector(`#${hash}`) || this.template.querySelector(`[data-anchor="${hash}"]`);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.pageYOffset - 72;
        window.scrollTo({ top, behavior: 'smooth' });
    }

    handleDirectSignup(event) {
        if (event) event.preventDefault();
        const hash = event.currentTarget.dataset.hash || 'register';
        const next = `#${hash}`;
        if (window.location.hash !== next) {
            window.location.hash = hash;
        } else {
            this.scrollToHash();
        }
    }
}
