import { LightningElement, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getDashboardStats from '@salesforce/apex/SafetyEnrollmentController.getDashboardStats';
import refreshDashboardStats from '@salesforce/apex/SafetyEnrollmentController.refreshDashboardStats';
import backfillContacts from '@salesforce/apex/SafetyEnrollmentController.backfillContacts';
import { refreshApex } from '@salesforce/apex';

const display = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
};

export default class SafetyEnrollmentDashboard extends NavigationMixin(LightningElement) {
    wiredResult;
    total = 0;
    selfCareYes = 0;
    withContact = 0;
    readiness = {};
    byAgency = [];
    byCpr = [];
    bySelfCare = [];
    recent = [];
    selectedId;
    searchTerm = '';
    error;
    statusMessage;
    isBusy = false;

    @wire(getDashboardStats)
    wiredStats(result) {
        this.wiredResult = result;
        const { data, error } = result;
        if (data) {
            this.applyStats(data);
        } else if (error) {
            this.error = (error.body && error.body.message) || 'Unable to load dashboard.';
        }
    }

    applyStats(data) {
        this.error = undefined;
        this.total = data.total || 0;
        this.selfCareYes = data.selfCareYes || 0;
        this.withContact = data.withContact || 0;
        this.readiness = data.readiness || {};
        this.byAgency = this.withBars(data.byAgency);
        this.byCpr = this.withBars(data.byCpr);
        this.bySelfCare = this.withBars(data.bySelfCare);
        this.recent = (data.recent || []).map((row) => this.mapRow(row));
        if (!this.selectedId && this.recent.length) {
            this.selectedId = this.recent[0].Id;
        } else if (this.selectedId && !this.recent.some((r) => r.Id === this.selectedId)) {
            this.selectedId = this.recent[0] ? this.recent[0].Id : undefined;
        }
    }

    mapRow(row) {
        const fullName = `${row.First_Name__c || ''} ${row.Last_Name__c || ''}`.trim() || 'Learner';
        const initials = fullName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => (p[0] ? p[0].toUpperCase() : ''))
            .join('');
        const confidence = Number(row.CPR_Confidence__c || 0);
        return {
            ...row,
            fullName,
            initials: initials || 'AC',
            submitted: row.CreatedDate ? new Date(row.CreatedDate).toLocaleString() : '',
            contactName: row.Contact__r && row.Contact__r.Name ? row.Contact__r.Name : '',
            hasContact: Boolean(row.Contact__c),
            classLabel: [row.Class_Date__c, row.Class_Time__c].filter(Boolean).join(' · ') || 'Class TBD',
            confidenceLabel: confidence ? `${confidence}/5` : '-',
            confidenceStyle: `width:${confidence ? (confidence / 5) * 100 : 0}%`,
            cprChip: row.CPR_Previously__c || 'CPR ?',
            selfCareChip: row.Learn_Self_Care__c || 'Self-care ?',
            cardClass: row.Id === this.selectedId ? 'learner is-active' : 'learner'
        };
    }

    get hasData() {
        return this.total > 0;
    }

    get refreshLabel() {
        return this.isBusy ? 'Working…' : 'Refresh';
    }

    get filteredLearners() {
        const term = (this.searchTerm || '').trim().toLowerCase();
        const rows = !term
            ? this.recent
            : this.recent.filter((row) => {
                  const hay = [
                      row.fullName,
                      row.Email__c,
                      row.Phone__c,
                      row.Group_Name__c,
                      row.Profession__c,
                      row.Certifying_Agency__c,
                      row.contactName,
                      row.Name
                  ]
                      .filter(Boolean)
                      .join(' ')
                      .toLowerCase();
                  return hay.includes(term);
              });
        return rows.map((row) => ({
            ...row,
            cardClass: row.Id === this.selectedId ? 'learner is-active' : 'learner'
        }));
    }

    get selected() {
        return this.recent.find((row) => row.Id === this.selectedId) || null;
    }

    get hasSelection() {
        return Boolean(this.selected);
    }

    get selectedScores() {
        if (!this.selected) return [];
        const s = this.selected;
        return [
            { key: 'physical', label: 'Physical', value: s.Physical_Health__c },
            { key: 'mental', label: 'Mental', value: s.Mental_Health__c },
            { key: 'emotional', label: 'Emotional', value: s.Emotional_Health__c },
            { key: 'social', label: 'Social', value: s.Social_Network__c },
            { key: 'confidence', label: 'CPR Confidence', value: s.CPR_Confidence__c },
            { key: 'nutrition', label: 'Nutrition', value: s.Nutritional_Choices__c },
            { key: 'overall', label: 'Overall', value: s.Overall_Health_Satisfaction__c }
        ].map((item) => {
            const score = Number(item.value || 0);
            return {
                ...item,
                display: score ? score.toFixed(0) : '-',
                style: `--score:${score || 0};width:${score ? (score / 5) * 100 : 0}%`
            };
        });
    }

    get detailSections() {
        const s = this.selected;
        if (!s) return [];
        return [
            {
                key: 'class',
                title: 'Class & contact',
                tone: 'navy',
                items: [
                    { label: 'Enrollment #', value: display(s.Name) },
                    { label: 'Great day?', value: display(s.Great_Day__c) },
                    { label: 'Class date', value: display(s.Class_Date__c) },
                    { label: 'Class time', value: display(s.Class_Time__c) },
                    { label: 'Email', value: display(s.Email__c) },
                    { label: 'Phone', value: display(s.Phone__c) },
                    { label: 'Date of birth', value: display(s.Date_of_Birth__c) },
                    { label: 'Group', value: display(s.Group_Name__c) },
                    { label: 'Profession', value: display(s.Profession__c) }
                ]
            },
            {
                key: 'address',
                title: 'Address & agency',
                tone: 'gold',
                items: [
                    { label: 'Street', value: display(s.Street_Address__c) },
                    { label: 'City', value: display(s.City__c) },
                    { label: 'State', value: display(s.State__c) },
                    { label: 'Postal code', value: display(s.Postal_Code__c) },
                    { label: 'Certifying agency', value: display(s.Certifying_Agency__c) },
                    { label: 'Agency (other)', value: display(s.Certifying_Agency_Other__c) }
                ]
            },
            {
                key: 'background',
                title: 'Background',
                tone: 'navy',
                items: [
                    { label: 'Ethnicity', value: display(s.Ethnicity__c) },
                    { label: 'Ethnicity (other)', value: display(s.Ethnicity_Other__c) },
                    { label: 'Marital status', value: display(s.Marital_Status__c) },
                    { label: 'Sex at birth', value: display(s.Sex_at_Birth__c) },
                    { label: 'Employment', value: display(s.Employment_Status__c) },
                    { label: 'Education', value: display(s.Highest_Education__c) },
                    { label: 'CPR previously', value: display(s.CPR_Previously__c) }
                ]
            },
            {
                key: 'selfcare',
                title: 'Self-care',
                tone: 'gold',
                items: [
                    { label: 'Want to learn self-care?', value: display(s.Learn_Self_Care__c) },
                    { label: 'Peer help interest', value: display(s.Self_Care_Peer_Help__c) },
                    { label: 'Peer help (other)', value: display(s.Self_Care_Peer_Other__c) }
                ]
            }
        ];
    }

    get readinessCards() {
        const map = [
            { key: 'physical', label: 'Physical' },
            { key: 'mental', label: 'Mental' },
            { key: 'emotional', label: 'Emotional' },
            { key: 'confidence', label: 'CPR Confidence' },
            { key: 'overall', label: 'Overall' }
        ];
        return map.map((item) => {
            const score = Number(this.readiness[item.key] || 0);
            return {
                ...item,
                score: score ? score.toFixed(1) : '-',
                style: `width:${score ? (score / 5) * 100 : 0}%`
            };
        });
    }

    withBars(rows = []) {
        const max = Math.max(...rows.map((r) => Number(r.value) || 0), 1);
        return rows
            .slice()
            .sort((a, b) => Number(b.value) - Number(a.value))
            .slice(0, 5)
            .map((row) => ({
                label: row.label,
                value: row.value,
                style: `width:${(Number(row.value) / max) * 100}%`
            }));
    }

    handleSearch(event) {
        this.searchTerm = event.target.value;
    }

    handleSelect(event) {
        this.selectedId = event.currentTarget.dataset.id;
    }

    openContact() {
        if (!this.selected || !this.selected.Contact__c) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.selected.Contact__c,
                objectApiName: 'Contact',
                actionName: 'view'
            }
        });
    }

    openEnrollment() {
        if (!this.selected || !this.selected.Id) return;
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.selected.Id,
                objectApiName: 'Safety_Enrollment__c',
                actionName: 'view'
            }
        });
    }

    async handleRefresh() {
        this.isBusy = true;
        this.error = undefined;
        this.statusMessage = 'Refreshing latest enrollments…';
        try {
            if (this.wiredResult) {
                await refreshApex(this.wiredResult);
            }
            const data = await refreshDashboardStats();
            this.applyStats(data);
            this.statusMessage = `Updated ${new Date().toLocaleTimeString()} - ${this.total} enrollment${
                this.total === 1 ? '' : 's'
            }.`;
        } catch (e) {
            this.error = (e && e.body && e.body.message) || e.message || 'Unable to refresh dashboard.';
            this.statusMessage = undefined;
        } finally {
            this.isBusy = false;
        }
    }

    async handleBackfill() {
        this.isBusy = true;
        this.error = undefined;
        this.statusMessage = 'Syncing Contacts with form answers…';
        try {
            const count = await backfillContacts();
            if (this.wiredResult) {
                await refreshApex(this.wiredResult);
            }
            const data = await refreshDashboardStats();
            this.applyStats(data);
            this.statusMessage =
                count > 0
                    ? `Synced ${count} learner Contact${count === 1 ? '' : 's'} with their form answers.`
                    : 'All enrollments already synced to Contacts.';
        } catch (e) {
            this.error = (e && e.body && e.body.message) || e.message || 'Unable to sync Contacts.';
            this.statusMessage = undefined;
        } finally {
            this.isBusy = false;
        }
    }
}
