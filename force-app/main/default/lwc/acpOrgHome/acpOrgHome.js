import { LightningElement } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';

const M = `${MEDIA}/acpTrainingMedia`;

export default class AcpOrgHome extends LightningElement {
    _observer;

    media = {
        logo: `${M}/logo.png`,
        hero: `${M}/img_hero_help.jpg`,
        accept: `${M}/img_peer_warm.jpg`,
        cpr: `${M}/img_classroom.jpg`,
        peer: `${M}/img_community_fair.jpg`,
        skills: `${M}/img_cpr_practice.jpg`,
        rescuer: `${M}/img_tree_sun.jpg`,
        together: `${M}/img_hands_hold.jpg`
    };

    skillItems = [
        { key: 'a', label: 'Adult & Pediatric CPR' },
        { key: 'b', label: 'Adult CPR' },
        { key: 'c', label: 'First Aid' },
        { key: 'd', label: 'BLS / AED' },
        { key: 'e', label: 'Adult CPR + First Aid + AED' },
        { key: 'f', label: 'HeartSaver & Blended Options' }
    ];

    stories = [
        {
            key: 's1',
            title: 'Accept & Grow that sticks',
            body: 'Accept & Grow participants share clearer routines, less overwhelm, and better ability to show up for life.',
            image: `${M}/img_listening_warm.jpg`,
            alt: 'Supportive conversation'
        },
        {
            key: 's2',
            title: 'CPR ready when family needed help',
            body: 'After CPR & First Aid training, a participant stayed calm and acted during a family emergency.',
            image: `${M}/img_family_warm.jpg`,
            alt: 'First Aid readiness'
        },
        {
            key: 's3',
            title: 'Peer Support on location',
            body: 'Free Peer Support at local events helps people find resources where they already gather.',
            image: `${M}/img_story_ready.jpg`,
            alt: 'Volunteers helping in the community'
        }
    ];

    renderedCallback() {
        if (this._observer) return;
        const nodes = this.template.querySelectorAll('[data-reveal]');
        if (!nodes.length) return;
        this._observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-in');
                    }
                });
            },
            { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
        );
        nodes.forEach((node) => this._observer.observe(node));
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

    go(path) {
        const root = this.siteRoot();
        if (!path || path === '/') {
            window.location.assign(`${root}/`);
            return;
        }
        window.location.assign(`${root}${path.startsWith('/') ? path : `/${path}`}`);
    }

    handleServices() {
        this.go('/our-services');
    }

    handleContact() {
        this.go('/contact');
    }

    handleImpact() {
        this.go('/get-involved#difference');
    }

    handlePath(event) {
        this.go(event.currentTarget.dataset.path);
    }

    handleCard(event) {
        const path = event.currentTarget.dataset.path;
        if (path) this.go(path);
    }
}
