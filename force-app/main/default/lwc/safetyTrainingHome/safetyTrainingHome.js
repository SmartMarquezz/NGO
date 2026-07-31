import { LightningElement, api } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';

export default class SafetyTrainingHome extends LightningElement {
    @api enrollPath = '/enroll';

    media = {
        hero: `${MEDIA}/acpTrainingMedia/hero.jpg`,
        team: `${MEDIA}/acpTrainingMedia/team.jpg`,
        cpr: `${MEDIA}/acpTrainingMedia/cpr.jpg`,
        firstaid: `${MEDIA}/acpTrainingMedia/firstaid.jpg`,
        manikin: `${MEDIA}/acpTrainingMedia/manikin.jpg`,
        family: `${MEDIA}/acpTrainingMedia/family.jpg`,
        work: `${MEDIA}/acpTrainingMedia/work.jpg`,
        community: `${MEDIA}/acpTrainingMedia/community.jpg`,
        close: `${MEDIA}/acpTrainingMedia/close.jpg`
    };

    get courses() {
        return [
            {
                key: 'cpr',
                title: 'CPR & AED',
                detail: 'Adult, child, and infant CPR with AED skills you can use the moment someone collapses.',
                image: this.media.cpr,
                alt: 'Hands practicing chest compressions during CPR training'
            },
            {
                key: 'firstaid',
                title: 'First Aid',
                detail: 'Bleed control, burns, fractures, choking, allergic reactions, and sudden medical emergencies.',
                image: this.media.firstaid,
                alt: 'First aid and emergency medical supplies'
            },
            {
                key: 'bls',
                title: 'BLS for Providers',
                detail: 'High-performance team skills for clinics, EMS partners, and healthcare workplaces.',
                image: this.media.team,
                alt: 'Healthcare team prepared for emergency care'
            }
        ];
    }

    formats = [
        {
            key: 'classroom',
            title: 'In-Person',
            detail: 'Hands-on practice with certified instructors. Manikins, AEDs, and real coaching in the room with you.'
        },
        {
            key: 'group',
            title: 'Group / Workplace',
            detail: 'Bring All Care Plus to your team. Built for employers, clinics, schools, and community groups.'
        },
        {
            key: 'refresh',
            title: 'Skills Refresh',
            detail: 'Already certified? Stay sharp with rescuer readiness check-ins and confidence-building practice.'
        }
    ];

    get moments() {
        return [
            {
                key: 'home',
                title: 'At home',
                detail: 'Be ready for the people you love.',
                image: this.media.family,
                alt: 'People supporting one another at home'
            },
            {
                key: 'work',
                title: 'At work',
                detail: 'Meet workplace safety expectations with confidence.',
                image: this.media.work,
                alt: 'Coworkers collaborating in a workplace'
            },
            {
                key: 'community',
                title: 'In community',
                detail: 'Show up prepared when neighbors need help.',
                image: this.media.community,
                alt: 'Community volunteers supporting one another'
            }
        ];
    }

    handleEnroll() {
        const path = this.enrollPath || '/enroll';
        if (path.startsWith('http')) {
            window.location.assign(path);
            return;
        }
        const normalized = path.startsWith('/') ? path.slice(1) : path;
        const segments = window.location.pathname.split('/').filter(Boolean);
        const siteRoot = segments.length ? `/${segments[0]}` : '';
        window.location.assign(`${siteRoot}/${normalized}`);
    }
}
