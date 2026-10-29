import { LightningElement, wire } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';
import getOfferings from '@salesforce/apex/SafetyEnrollmentController.getOfferings';

const M = `${MEDIA}/acpTrainingMedia`;

export default class AcpStorePage extends LightningElement {
    _observer;
    media = {
        hero: `${M}/img_store_kit.jpg`
    };

    fallbackProducts = [
        {
            key: 'manual',
            type: 'Book',
            title: 'AHA BLS Provider Manual',
            summary: 'Required reading for BLS Provider courses.',
            price: 'QB link TBD',
            path: '/contact',
            image: `${M}/img_store_manual.jpg`,
            alt: 'BLS provider manual',
            cta: 'Ask to purchase',
            external: false
        },
        {
            key: 'heartsaver',
            type: 'Book',
            title: 'HeartSaver Student Workbook',
            summary: 'Student workbook for HeartSaver CPR AED training.',
            price: 'QB link TBD',
            path: '/contact',
            image: `${M}/img_store_kit.jpg`,
            alt: 'HeartSaver workbook',
            cta: 'Ask to purchase',
            external: false
        },
        {
            key: 'shield',
            type: 'Supply',
            title: 'CPR face shields (pack)',
            summary: 'Training-related barrier devices for practice and class kits.',
            price: 'QB link TBD',
            path: '/contact',
            image: `${M}/img_store_shield.jpg`,
            alt: 'CPR face shields',
            cta: 'Ask to purchase',
            external: false
        },
        {
            key: 'gloves',
            type: 'Supply',
            title: 'Training gloves',
            summary: 'Disposable gloves for skills practice and course kits.',
            price: 'QB link TBD',
            path: '/contact',
            image: `${M}/img_store_gloves2.jpg`,
            alt: 'Training gloves',
            cta: 'Ask to purchase',
            external: false
        }
    ];

    storeItems = [];

    @wire(getOfferings, { offeringType: 'Store' })
    wiredStore({ data }) {
        if (!data || !data.length) {
            this.storeItems = this.fallbackProducts;
            return;
        }
        this.storeItems = data.map((item, idx) => ({
            key: item.id || `store-${idx}`,
            type: item.agency || 'Store',
            title: item.name,
            summary: item.description || 'Training-related item available for purchase.',
            price: item.priceLabel || 'See payment link',
            path: item.paymentLink || '/contact',
            image: idx % 2 === 0 ? `${M}/img_store_manual.jpg` : `${M}/img_store_kit.jpg`,
            alt: item.name,
            cta: item.paymentLink ? 'Buy with QuickBooks' : 'Ask to purchase',
            external: Boolean(item.paymentLink)
        }));
    }

    get products() {
        return this.storeItems.length ? this.storeItems : this.fallbackProducts;
    }

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

    handlePath(event) {
        const path = event.currentTarget.dataset.path;
        const external = event.currentTarget.dataset.external === 'true';
        if (external && path && path.startsWith('http')) {
            window.open(path, '_blank', 'noopener');
            return;
        }
        if (!path) return;
        if (path.startsWith('http')) {
            window.open(path, '_blank', 'noopener');
            return;
        }
        window.location.assign(`${this.siteRoot()}${path}`);
    }
}
