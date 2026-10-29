import { LightningElement, wire } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';
import getOfferings from '@salesforce/apex/SafetyEnrollmentController.getOfferings';

const M = `${MEDIA}/acpTrainingMedia`;

export default class AcpStorePage extends LightningElement {
    _observer;
    media = {
        hero: `${M}/img_store_kit.jpg`
    };

    catalogSections = [
        {
            key: 'nutrition',
            eyebrow: 'NUTRITION',
            title: 'Fuel for steady days',
            lead: 'Guides and kitchen-table resources that support healthy routines alongside peer and self-care work.',
            items: [
                {
                    key: 'nut-guide',
                    type: 'Guide',
                    title: 'Everyday nutrition starter guide',
                    summary: 'Simple plate-building and snack ideas for busy weeks — not a meal plan, a starting point.',
                    price: 'Ask for link',
                    path: '/contact',
                    image: `${M}/img_books_sun.jpg`,
                    alt: 'Nutrition guide on a sunlit table',
                    cta: 'Ask to purchase',
                    external: false
                },
                {
                    key: 'nut-journal',
                    type: 'Journal',
                    title: 'Food & mood check-in journal',
                    summary: 'A light weekly tracker pairing meals with energy and mood notes.',
                    price: 'Ask for link',
                    path: '/contact',
                    image: `${M}/img_journaling_light.jpg`,
                    alt: 'Journaling notebook',
                    cta: 'Ask to purchase',
                    external: false
                }
            ]
        },
        {
            key: 'mindfulness',
            eyebrow: 'MINDFULNESS',
            title: 'Meditation and calm practice',
            lead: 'Books and tools for breath work, quiet check-ins, and daily mindfulness — aligned with Accept & Grow.',
            items: [
                {
                    key: 'mind-breath',
                    type: 'Practice kit',
                    title: 'Breath & grounding card deck',
                    summary: 'Short prompts for 2–5 minute resets before or after a drop-in session.',
                    price: 'Ask for link',
                    path: '/contact',
                    image: `${M}/img_calm_breath.jpg`,
                    alt: 'Calm breathing practice',
                    cta: 'Ask to purchase',
                    external: false
                },
                {
                    key: 'mind-dawn',
                    type: 'Book',
                    title: 'Morning mindfulness booklet',
                    summary: 'Gentle morning routines that pair with self-care resources on the site.',
                    price: 'Ask for link',
                    path: '/contact',
                    image: `${M}/img_selfcare_dawn.jpg`,
                    alt: 'Self-care dawn light',
                    cta: 'Ask to purchase',
                    external: false
                }
            ]
        },
        {
            key: 'safety',
            eyebrow: 'SAFETY TRAINING',
            title: 'Manuals and class supplies',
            lead: 'AHA / HeartSaver manuals and practice supplies. American Red Cross course materials can sell without holding seat inventory.',
            items: [
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
                    summary: 'Training barrier devices for practice and class kits.',
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
            ]
        }
    ];

    liveStoreItems = [];

    @wire(getOfferings, { offeringType: 'Store' })
    wiredStore({ data }) {
        if (!data || !data.length) {
            this.liveStoreItems = [];
            return;
        }
        this.liveStoreItems = data.map((item, idx) => ({
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

    get sections() {
        const live = this.liveStoreItems || [];
        if (!live.length) return this.catalogSections;
        return this.catalogSections.map((section) => {
            if (section.key !== 'safety') return section;
            return { ...section, items: live };
        });
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
