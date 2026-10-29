import { LightningElement } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';
const M = `${MEDIA}/acpTrainingMedia`;

export default class AcpAboutPage extends LightningElement {
    _observer;
    media = {
        logo: `${M}/logo.png`,
        history: `${M}/img_about_mission.jpg`,
        team: `${M}/img_contact_desk.jpg`
    };

    board = [
        { key: 'b1', name: 'Uday Koppikar', title: 'Board Chairman', initials: 'UK' },
        { key: 'b2', name: 'Ramesh Azariah', title: 'Executive Director', initials: 'RA' },
        { key: 'b3', name: 'Gopi Saraf', title: 'Board Member', initials: 'GS' },
        { key: 'b4', name: 'Sheena Azariah', title: 'Board Member', initials: 'SA' }
    ];

    committees = [
        { key: 'c1', name: 'Training & Safety Committee' },
        { key: 'c2', name: 'Self-Care Programs Committee' },
        { key: 'c3', name: 'Community Outreach Committee' }
    ];

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

    siteRoot() {
        const meta = document.querySelector('meta[name="basePath"]')?.getAttribute('content');
        if (meta !== null && meta !== undefined) return meta;
        return '';
    }

    handlePath(event) {
        const path = event.currentTarget.dataset.path;
        if (!path) return;
        if (path.includes('#')) {
            const [base, hash] = path.split('#');
            const target = !base || base === '/' ? `${this.siteRoot()}/` : `${this.siteRoot()}${base}`;
            window.location.assign(`${target}#${hash}`);
            return;
        }
        window.location.assign(`${this.siteRoot()}${path.startsWith('/') ? path : `/${path}`}`);
    }
}
