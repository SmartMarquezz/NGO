import { LightningElement } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';

const M = `${MEDIA}/acpTrainingMedia`;

export default class AcpImpactPage extends LightningElement {
    _observer;
    media = {
        hero: `${M}/img_impact_people.jpg`,
        volunteer: `${M}/img_books_sun.jpg`
    };

    stats = [
        { key: 's1', value: '20+', label: 'Years serving the community' },
        { key: 's2', value: '32K+', label: 'People supported' },
        { key: 's3', value: '56', label: 'Participating colleagues' },
        { key: 's4', value: '1 mission', label: 'Self-care + safety readiness' }
    ];

    stories = [
        { key: 't1', name: 'Nashala T.', quote: 'Friendly staff and a clear, hands-on CPR certification experience that made me feel ready.' },
        { key: 't2', name: 'Gabrielle U.', quote: 'Professional training with real coaching - I left more confident than I expected.' },
        { key: 't3', name: 'Audrie J.', quote: 'When a family emergency hit, I knew how to stay calm and act.' }
    ];

    examples = [
        { key: 'e1', title: 'Safety confidence that transfers', body: 'Learners leave class able to recognize emergencies sooner and start CPR/First Aid with less hesitation.' },
        { key: 'e2', title: 'Self-care that supports caregivers', body: 'Accept & Grow drop-ins help people manage stress and rebuild routines so they can care for others without burning out.' },
        { key: 'e3', title: 'Peer Support where people already gather', body: 'Peer Support at local events makes resources visible and lowers the barrier to asking for help.' }
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

    handleDonate() {
        window.location.assign(`${this.siteRoot()}/donate`);
    }
}
