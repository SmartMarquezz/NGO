import { LightningElement, api } from 'lwc';

export default class SafetyTrainingHome extends LightningElement {
    @api enrollPath = '/enroll';

    competencies = [
        {
            title: 'Basic Life Support',
            detail: 'High-quality CPR for adults, children, and infants — plus confident AED use in cardiac arrest.'
        },
        {
            title: 'Scene & Victim Assessment',
            detail: 'Assess safely, prioritize care, and act with a clear first-response plan.'
        },
        {
            title: 'Breathing & Choking Care',
            detail: 'Manage choking and breathing emergencies across age groups until help arrives.'
        },
        {
            title: 'Injury & Medical First Aid',
            detail: 'Treat wounds, burns, fractures, allergic reactions, seizures, and diabetic emergencies.'
        }
    ];

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
