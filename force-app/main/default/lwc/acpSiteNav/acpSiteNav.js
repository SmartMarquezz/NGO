import { LightningElement, api, track } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';

export default class AcpSiteNav extends LightningElement {
    @api activePage = 'home';
    @track scrolled = false;
    logoUrl = `${MEDIA}/acpTrainingMedia/logo.png`;
    _onScroll;

    connectedCallback() {
        this._onScroll = () => {
            this.scrolled = window.scrollY > 12;
        };
        window.addEventListener('scroll', this._onScroll, { passive: true });
        this._onScroll();
    }

    disconnectedCallback() {
        window.removeEventListener('scroll', this._onScroll);
    }

    get navClass() {
        return this.scrolled ? 'nav is-scrolled' : 'nav';
    }

    get links() {
        return [
            { key: 'home', label: 'Home', path: '/' },
            { key: 'about', label: 'About Us', path: '/about' },
            {
                key: 'services',
                label: 'Services',
                path: '/our-services',
                children: [
                    { key: 'accept', label: 'Accept & Grow', path: '/self-care' },
                    { key: 'cpr', label: 'CPR & First Aid', path: '/cpr-classes' },
                    { key: 'peer', label: 'Peer Support', path: '/community-support' }
                ]
            },
            { key: 'store', label: 'Store', path: '/store' },
            {
                key: 'involved',
                label: 'Get Involved',
                path: '/get-involved',
                children: [
                    { key: 'issues', label: 'Current Issues', path: '/get-involved#current-issues' },
                    { key: 'impact', label: 'Support Impact', path: '/get-involved#support-impact' },
                    { key: 'stories', label: 'Stories of Difference', path: '/get-involved#difference' },
                    { key: 'volunteer', label: 'Volunteer Positions', path: '/get-involved#volunteer' }
                ]
            },
            { key: 'contact', label: 'Contact Us', path: '/contact' }
        ].map((link) => ({
            ...link,
            className: link.key === this.activePage ? 'nav-link is-active' : 'nav-link',
            hasChildren: Boolean(link.children?.length)
        }));
    }

    siteRoot() {
        // Custom domain maps at root (''). Force.com uses '/ACPCRTraining'.
        // Never treat the current page slug (e.g. /contact) as the community root.
        const meta = document.querySelector('meta[name="basePath"]')?.getAttribute('content');
        if (meta !== null && meta !== undefined) return meta;
        return '';
    }

    resolve(path) {
        if (!path || path === '/') return `${this.siteRoot()}/`;
        if (path.includes('#')) {
            const [base, hash] = path.split('#');
            const targetBase = !base || base === '/' ? `${this.siteRoot()}/` : `${this.siteRoot()}${base}`;
            return `${targetBase}#${hash}`;
        }
        return `${this.siteRoot()}${path.startsWith('/') ? path : `/${path}`}`;
    }

    handleNav(event) {
        const path = event.currentTarget.dataset.path;
        if (!path) return;
        window.location.assign(this.resolve(path));
    }

    handleBrand() {
        window.location.assign(`${this.siteRoot()}/`);
    }
}
