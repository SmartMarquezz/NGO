import { LightningElement } from 'lwc';
import MEDIA from '@salesforce/resourceUrl/acpTrainingMedia';

export default class AcpSiteFooter extends LightningElement {
    logoUrl = `${MEDIA}/acpTrainingMedia/logo.png`;

    get fullRegistrationUrl() {
        return `${this.siteRoot()}/cpr-classes#full-registration`;
    }

    siteRoot() {
        const meta = document.querySelector('meta[name="basePath"]')?.getAttribute('content');
        if (meta !== null && meta !== undefined) return meta;
        return '';
    }

    handlePath(event) {
        const path = event.currentTarget.dataset.path;
        const root = this.siteRoot();
        if (!path || path === '/') {
            window.location.assign(`${root}/`);
            return;
        }
        window.location.assign(`${root}${path.startsWith('/') ? path : `/${path}`}`);
    }
}
