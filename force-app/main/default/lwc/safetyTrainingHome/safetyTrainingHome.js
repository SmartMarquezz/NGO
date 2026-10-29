import { LightningElement, api } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';

const M = `${MEDIA}/acpTrainingMedia`;
const ENROLLWARE_CALENDAR = 'https://allcareplus.enrollware.com/calendar';

export default class SafetyTrainingHome extends LightningElement {
    @api enrollPath = '/enroll';
    _observer;
    enrollwareUrl = ENROLLWARE_CALENDAR;

    media = {
        banner: `${M}/img_classroom.jpg`,
        practice: `${M}/img_cpr_practice.jpg`,
        blended: `${M}/img_class_room.jpg`,
        virtual: `${M}/img_team_circle.jpg`,
        online: `${M}/img_books_sun.jpg`,
        resources: `${M}/img_handshake_sun.jpg`
    };

    get classes() {
        return [
            {
                key: 'bls',
                title: 'Basic Life Support (BLS)',
                audience: 'Healthcare providers, clinical teams, and students in medical programs',
                format: 'In-person or blended skills session',
                length: 'About 4 hours (skills session shorter after online portion)',
                includes: 'High-quality CPR, AED use, choking relief, and team-based response',
                note: 'American Heart Association BLS Provider path for people who need a healthcare-level card.',
                image: `${M}/img_bls_class.jpg`,
                alt: 'Basic Life Support training',
                enrollwareUrl: ENROLLWARE_CALENDAR
            },
            {
                key: 'adult-ped-fa',
                title: 'Adult & Pediatric First Aid / CPR / AED',
                audience: 'Teachers, coaches, caregivers, parents, and workplace teams',
                format: 'In-person or blended',
                length: 'Typically half-day depending on format',
                includes: 'First aid + CPR + AED for adults and children',
                note: 'Best all-around option when your workplace or school asks for First Aid with CPR/AED.',
                image: `${M}/img_firstaid_bag.jpg`,
                alt: 'Adult and Pediatric First Aid CPR AED',
                enrollwareUrl: ENROLLWARE_CALENDAR
            },
            {
                key: 'adult-fa',
                title: 'Adult First Aid / CPR / AED',
                audience: 'Adult workplaces, offices, and community responders',
                format: 'In-person or blended',
                length: 'Typically half-day depending on format',
                includes: 'Adult first aid, CPR, and AED skills',
                note: 'Choose this when pediatric content is not required.',
                image: `${M}/img_aed_ready.jpg`,
                alt: 'Adult First Aid CPR AED',
                enrollwareUrl: ENROLLWARE_CALENDAR
            },
            {
                key: 'adult-ped-cpr',
                title: 'Adult & Pediatric CPR / AED',
                audience: 'Anyone who needs CPR/AED for adults and children without full First Aid',
                format: 'In-person or blended',
                length: 'Shorter than full First Aid + CPR courses',
                includes: 'CPR and AED for adults and children',
                note: 'Good when the requirement is CPR/AED only.',
                image: `${M}/img_ped_cpr.jpg`,
                alt: 'Adult and Pediatric CPR',
                enrollwareUrl: ENROLLWARE_CALENDAR
            },
            {
                key: 'adult-cpr',
                title: 'Adult CPR / AED',
                audience: 'Community members and workplaces focused on adult response',
                format: 'In-person or blended',
                length: 'Focused skills session',
                includes: 'Adult CPR and AED practice',
                note: 'A focused adult CPR path when pediatric training is not needed.',
                image: `${M}/img_adult_cpr.jpg`,
                alt: 'Adult CPR',
                enrollwareUrl: ENROLLWARE_CALENDAR
            },
            {
                key: 'first-aid',
                title: 'First Aid',
                audience: 'Schools, camps, offices, and community groups',
                format: 'In-person or blended',
                length: 'Course length varies by agency and format',
                includes: 'Bleeding, burns, medical emergencies, and everyday first aid skills',
                note: 'Essential first aid skills for everyday emergencies. Can pair with CPR when required.',
                image: `${M}/img_fa_only.jpg`,
                alt: 'First Aid class',
                enrollwareUrl: ENROLLWARE_CALENDAR
            }
        ];
    }

    connectedCallback() {
        this._onHash = () => this.handleHash();
        window.addEventListener('hashchange', this._onHash);
    }

    renderedCallback() {
        this.handleHash();
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

    disconnectedCallback() {
        window.removeEventListener('hashchange', this._onHash);
        if (this._observer) {
            this._observer.disconnect();
            this._observer = null;
        }
    }

    handleHash() {
        const hash = window.location.hash;
        if (hash === '#register' || hash === '#inquiry') {
            this.scrollToSection('inquiry', false);
        } else if (hash === '#classes') {
            this.scrollToSection('classes', false);
        } else if (hash === '#seat' || hash === '#full-register') {
            this.scrollToSection('seat', false);
        } else if (hash === '#full-registration') {
            this.scrollToSection('full-registration', false);
        }
    }

    scrollToSection(name, smooth = true) {
        const map = {
            classes: ['.classes', '[data-section="classes"]', '#classes'],
            inquiry: ['.inquiry-wrap', '[data-section="inquiry"]', '[data-inquiry]', '#register'],
            seat: ['.seat-wrap', '[data-section="seat"]', '[data-seat]', '#seat'],
            'full-registration': [
                '.full-enroll-wrap',
                '[data-section="full-registration"]',
                '[data-full-registration]',
                '#full-registration'
            ]
        };
        const selectors = map[name] || [`[data-section="${name}"]`];
        let el = null;
        for (const sel of selectors) {
            el = this.template.querySelector(sel);
            if (el) break;
        }
        if (!el) return false;
        try {
            el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        } catch (e) {
            const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
            window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
        }
        // Second pass after sticky nav / fonts settle
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        window.setTimeout(() => {
            const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
            if (Math.abs(top - window.pageYOffset) > 12) {
                window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
            }
        }, 120);
        return true;
    }

    handleBrowseClasses(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#classes`);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        window.setTimeout(() => this.scrollToSection('classes', true), 0);
    }

    handleInquiry(event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#register`);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        window.setTimeout(() => this.scrollToSection('inquiry', true), 0);
    }

    handleOpenEnrollware() {
        window.open(ENROLLWARE_CALENDAR, '_blank', 'noopener');
    }
}
