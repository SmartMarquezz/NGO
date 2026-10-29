import { LightningElement, track } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';

const M = `${MEDIA}/acpTrainingMedia`;

const FOCUS = {
    grow: {
        eyebrow: '1 · ACCEPT & GROW',
        title: 'Build resilience, reduce stress, grow stronger from within',
        body: 'Weekly drop-ins, suicide-prevention pathways, and resources that help people accept where they are - then grow.',
        points: [
            'Intro to Self-Care for Success',
            'Individual Self-Care support',
            'Group Self-Care / suicide awareness skills',
            'Accept & Grow Peer Certification pathways'
        ],
        cta: 'Explore Accept & Grow',
        path: '/self-care',
        image: `${M}/img_peer_warm.jpg`,
        alt: 'Calm outdoor moment for Accept and Grow',
        tag: '1'
    },
    cpr: {
        eyebrow: '2 · CPR & FIRST AID',
        title: 'Gain life-saving skills with flexible training options',
        body: 'Plus Rescuer services offer Basic Life Support, CPR, and First Aid in formats that fit real schedules.',
        points: [
            'Online only and virtual options',
            'In-person instructor-led classes',
            'Blended online + in-person skills',
            'BLS, HeartSaver, Adult & Pediatric paths'
        ],
        cta: 'View CPR & First Aid',
        path: '/cpr-classes',
        image: `${M}/img_classroom.jpg`,
        alt: 'Hands-on CPR training class',
        tag: '2'
    },
    peer: {
        eyebrow: '3 · PEER SUPPORT',
        title: 'Help that shows up where people already are',
        body: 'Free Peer Support at local events - listening, resources, and warm connections without barriers.',
        points: [
            'Self-care resources',
            'Peer volunteer opportunities at local events',
            'More Accept & Grow and Plus Rescuer resources',
            'Easy interest registration'
        ],
        cta: 'Explore Peer Support',
        path: '/community-support',
        image: `${M}/img_community_fair.jpg`,
        alt: 'Community gathering and peer support',
        tag: '3'
    }
};

export default class AcpServicesHub extends LightningElement {
    @track focusKey = 'grow';
    _observer;

    media = {
        hero: `${M}/img_golden_path.jpg`
    };

    categories = [
        {
            key: 'accept',
            title: '1 · Accept & Grow',
            summary: 'Build resilience, reduce stress, and grow stronger from within.',
            cta: 'Explore programs',
            path: '/self-care',
            image: `${M}/img_peer_warm.jpg`,
            alt: 'Accept and Grow'
        },
        {
            key: 'cpr',
            title: '2 · CPR & First Aid',
            summary: 'Life-saving skills with in-person, blended, virtual, and online options.',
            cta: 'View classes',
            path: '/cpr-classes',
            image: `${M}/img_classroom.jpg`,
            alt: 'CPR and First Aid training'
        },
        {
            key: 'peer',
            title: '3 · Peer Support',
            summary: 'Free support at local events and a simple path to request presence.',
            cta: 'Learn more',
            path: '/community-support',
            image: `${M}/img_community_fair.jpg`,
            alt: 'Peer support in the community'
        }
    ];

    get activeFocus() {
        return FOCUS[this.focusKey];
    }

    get pillGrowClass() {
        return this.focusKey === 'grow' ? 'pill is-active' : 'pill';
    }
    get pillCprClass() {
        return this.focusKey === 'cpr' ? 'pill is-active' : 'pill';
    }
    get pillPeerClass() {
        return this.focusKey === 'peer' ? 'pill is-active' : 'pill';
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

    handleFocus(event) {
        const key = event.currentTarget.dataset.focus;
        if (FOCUS[key]) this.focusKey = key;
    }

    siteRoot() {
        const meta = document.querySelector('meta[name="basePath"]')?.getAttribute('content');
        if (meta !== null && meta !== undefined) return meta;
        return '';
    }

    go(path) {
        window.location.assign(`${this.siteRoot()}${path.startsWith('/') ? path : `/${path}`}`);
    }

    handlePath(event) {
        this.go(event.currentTarget.dataset.path);
    }

    handleCard(event) {
        this.go(event.currentTarget.dataset.path);
    }
}
