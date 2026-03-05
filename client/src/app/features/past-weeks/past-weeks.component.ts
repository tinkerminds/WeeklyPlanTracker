import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../core/services/navigation.service';
import { WeeklyPlanService } from '../../core/services/weekly-plan.service';
import { DataService } from '../../core/services/data.service';
import { ToastService } from '../../core/services/toast.service';
import { WeeklyPlan } from '../../core/models/weekly-plan.model';

@Component({
    selector: 'app-past-weeks',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="past-page">
      <button class="back-btn" (click)="nav.navigateTo('home')">← Home</button>
      <h1>📅 Past Weeks</h1>

      @if (loading) {
        <div class="loading">Loading past weeks...</div>
      } @else if (weeks.length === 0) {
        <div class="empty">No past weeks yet.</div>
      } @else {
        <div class="weeks-list">
          @for (week of weeks; track week.id) {
            <div class="week-card">
              <div class="week-header" (click)="toggleExpand(week.id)">
                <div class="week-info">
                  <h3>Week of {{ formatDate(week.planningDate) }}</h3>
                  <p class="week-meta">
                    Work period: {{ formatDate(week.workStartDate) }} → {{ formatDate(week.workEndDate) }}
                    · {{ week.memberCount }} members · {{ week.totalHours }}h total
                  </p>
                </div>
                <div class="week-right">
                  <span class="state-badge">Completed ✅</span>
                  <span class="expand-icon">{{ expandedId === week.id ? '▼' : '▶' }}</span>
                </div>
              </div>

              @if (expandedId === week.id) {
                <div class="week-detail">
                  <!-- Category Breakdown -->
                  <div class="detail-section">
                    <h4>Category Allocation</h4>
                    <div class="cat-row">
                      <div class="cat-chip client">Client Focused {{ week.clientFocusedPercent }}% ({{ week.clientFocusedBudgetHours }}h)</div>
                      <div class="cat-chip tech">Tech Debt {{ week.techDebtPercent }}% ({{ week.techDebtBudgetHours }}h)</div>
                      <div class="cat-chip rnd">R&D {{ week.rAndDPercent }}% ({{ week.rAndDBudgetHours }}h)</div>
                    </div>
                  </div>

                  <!-- Members & Hours -->
                  @if (week.assignments && week.assignments.length > 0) {
                    <div class="detail-section">
                      <h4>Member Summary</h4>
                      <div class="member-summary">
                        @for (m of getMemberSummary(week); track m.name) {
                          <div class="member-row">
                            <span class="member-name-cell">{{ m.name }}</span>
                            <span class="member-hours-cell">{{ m.done }}h done / {{ m.committed }}h committed</span>
                            <div class="mini-bar"><div class="mini-fill" [style.width.%]="m.percent"></div></div>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Data Import Section -->
      <div class="import-section">
        <h2>📤 Load Data from a Backup File</h2>
        <p>Pick the backup file you saved before. This will replace all your current data.</p>
        <button class="btn btn-primary" (click)="fileInput.click()">Choose File</button>
        <input #fileInput type="file" accept=".json" (change)="onFileSelected($event)" style="display:none" />
      </div>
    </div>
  `,
    styles: [`
    .past-page {
      max-width: 960px; margin: 20px auto; padding: 0 24px; font-family: 'Inter', sans-serif;
    }
    .back-btn {
      background: none; border: none; color: var(--color-primary); font-size: 14px; font-weight: 600;
      cursor: pointer; padding: 8px 0; font-family: inherit;
    }
    .back-btn:hover { text-decoration: underline; }
    h1 { font-size: 28px; font-weight: 700; color: var(--text-heading); margin-bottom: 20px; }
    h2 { font-size: 20px; font-weight: 700; color: var(--text-heading); margin-bottom: 8px; }
    .loading, .empty {
      text-align: center; padding: 60px 0; color: var(--text-muted); font-size: 16px;
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
    }

    /* Week Cards */
    .weeks-list { display: flex; flex-direction: column; gap: 14px; }
    .week-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      box-shadow: var(--shadow-sm); overflow: hidden;
    }
    .week-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; cursor: pointer; transition: background 0.2s;
    }
    .week-header:hover { background: var(--bg-card-hover); }
    .week-info h3 { font-size: 17px; font-weight: 700; color: var(--text-heading); margin-bottom: 4px; }
    .week-meta { font-size: 13px; color: var(--text-secondary); }
    .week-right { display: flex; align-items: center; gap: 12px; }
    .state-badge {
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
      background: rgba(34,197,94,0.15); color: var(--color-success);
    }
    .expand-icon { font-size: 12px; color: var(--text-muted); }

    /* Week Detail */
    .week-detail { padding: 0 24px 20px; border-top: 1px solid var(--border-color); }
    .detail-section { margin-top: 16px; }
    .detail-section h4 { font-size: 14px; font-weight: 700; color: var(--text-heading); margin-bottom: 10px; }

    /* Category Chips */
    .cat-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .cat-chip {
      padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 700; color: #fff;
    }
    .cat-chip.client { background: var(--color-primary); }
    .cat-chip.tech { background: var(--color-warning); }
    .cat-chip.rnd { background: var(--color-success); }

    /* Member Summary */
    .member-summary { display: flex; flex-direction: column; gap: 8px; }
    .member-row {
      display: flex; align-items: center; gap: 16px; padding: 10px 14px;
      background: var(--bg-card-hover); border-radius: 10px;
    }
    .member-name-cell { font-size: 14px; font-weight: 700; color: var(--text-heading); min-width: 140px; }
    .member-hours-cell { font-size: 13px; color: var(--text-secondary); font-weight: 500; min-width: 200px; }
    .mini-bar {
      flex: 1; height: 6px; background: var(--border-color); border-radius: 3px; overflow: hidden;
    }
    .mini-fill { height: 100%; background: var(--color-primary); border-radius: 3px; transition: width 0.5s; }

    /* Import Section */
    .import-section {
      margin-top: 40px; padding: 24px; background: var(--bg-card); border: 1px dashed var(--border-color);
      border-radius: 14px; text-align: center;
    }
    .import-section p { color: var(--text-secondary); font-size: 14px; margin-bottom: 16px; }
    .btn { padding: 10px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: var(--color-primary); color: #fff; }
    .btn-primary:hover { background: var(--color-primary-hover); }
  `]
})
export class PastWeeksComponent implements OnInit {
    weeks: WeeklyPlan[] = [];
    loading = true;
    expandedId: string | null = null;

    constructor(
        public nav: NavigationService,
        private weeklyPlanService: WeeklyPlanService,
        private dataService: DataService,
        private toast: ToastService
    ) { }

    ngOnInit(): void {
        this.weeklyPlanService.getPast().subscribe({
            next: (weeks) => { this.weeks = weeks; this.loading = false; },
            error: () => this.loading = false
        });
    }

    toggleExpand(id: string): void {
        this.expandedId = this.expandedId === id ? null : id;
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return '';
        return dateStr.split('T')[0];
    }

    getMemberSummary(week: WeeklyPlan): { name: string; committed: number; done: number; percent: number }[] {
        if (!week.assignments) return [];
        const map = new Map<string, { name: string; committed: number; done: number }>();
        for (const a of week.assignments) {
            let m = map.get(a.teamMemberId);
            if (!m) { m = { name: a.teamMemberName, committed: 0, done: 0 }; map.set(a.teamMemberId, m); }
            m.committed += a.committedHours;
            m.done += a.hoursCompleted;
        }
        return Array.from(map.values()).map(m => ({
            ...m,
            percent: m.committed > 0 ? Math.round((m.done / m.committed) * 100) : 0
        }));
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const jsonData = JSON.parse(reader.result as string);
                this.dataService.importData(jsonData).subscribe({
                    next: () => {
                        this.toast.success('Data restored from file!');
                        this.ngOnInit();
                    },
                    error: () => this.toast.error('Failed to import data.')
                });
            } catch {
                this.toast.error('Invalid JSON file.');
            }
        };
        reader.readAsText(file);
        input.value = '';
    }
}
