import { LightningElement, wire } from 'lwc';
import getDashboardStats from '@salesforce/apex/SafetyEnrollmentController.getDashboardStats';
import { refreshApex } from '@salesforce/apex';

export default class SafetyEnrollmentDashboard extends LightningElement {
    wiredResult;
    total = 0;
    selfCareYes = 0;
    readiness = {};
    byAgency = [];
    byEmployment = [];
    byEducation = [];
    byCpr = [];
    bySelfCare = [];
    byState = [];
    recent = [];
    error;

    @wire(getDashboardStats)
    wiredStats(result) {
        this.wiredResult = result;
        const { data, error } = result;
        if (data) {
            this.error = undefined;
            this.total = data.total || 0;
            this.selfCareYes = data.selfCareYes || 0;
            this.readiness = data.readiness || {};
            this.byAgency = this.withBars(data.byAgency);
            this.byEmployment = this.withBars(data.byEmployment);
            this.byEducation = this.withBars(data.byEducation);
            this.byCpr = this.withBars(data.byCpr);
            this.bySelfCare = this.withBars(data.bySelfCare);
            this.byState = this.withBars(data.byState);
            this.recent = (data.recent || []).map((row) => ({
                ...row,
                fullName: `${row.First_Name__c || ''} ${row.Last_Name__c || ''}`.trim(),
                submitted: row.CreatedDate
                    ? new Date(row.CreatedDate).toLocaleString()
                    : ''
            }));
        } else if (error) {
            this.error = error.body?.message || 'Unable to load dashboard.';
        }
    }

    get hasData() {
        return this.total > 0;
    }

    get readinessCards() {
        const map = [
            { key: 'physical', label: 'Physical Health' },
            { key: 'mental', label: 'Mental Health' },
            { key: 'emotional', label: 'Emotional Balance' },
            { key: 'social', label: 'Social Support' },
            { key: 'confidence', label: 'CPR Confidence' },
            { key: 'nutrition', label: 'Nutrition' },
            { key: 'overall', label: 'Overall Satisfaction' }
        ];
        return map.map((item) => {
            const score = Number(this.readiness[item.key] || 0);
            return {
                ...item,
                score: score ? score.toFixed(1) : '—',
                style: `width:${score ? (score / 5) * 100 : 0}%`
            };
        });
    }

    withBars(rows = []) {
        const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1);
        return rows
            .slice()
            .sort((a, b) => Number(b.value) - Number(a.value))
            .map((row) => ({
                label: row.label,
                value: row.value,
                style: `width:${(Number(row.value) / max) * 100}%`
            }));
    }

    async handleRefresh() {
        await refreshApex(this.wiredResult);
    }
}
