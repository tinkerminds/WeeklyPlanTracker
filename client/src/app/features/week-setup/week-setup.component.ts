import { Component, OnInit, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../../core/services/navigation.service';
import { WeeklyPlanService } from '../../core/services/weekly-plan.service';
import { TeamMemberService } from '../../core/services/team-member.service';
import { ToastService } from '../../core/services/toast.service';
import { TeamMember } from '../../core/models/team-member.model';
import { WeeklyPlan } from '../../core/models/weekly-plan.model';

@Component({
  selector: 'app-week-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="setup-container">
      <!-- Header -->
      <div class="header">
        <button class="back-btn" (click)="nav.goBack()">← Back</button>
        <h1>🚀 Start a New Week</h1>
        <p class="subtitle">Configure the upcoming planning cycle</p>
      </div>

      <!-- Step 1: Planning Date -->
      <section class="section">
        <h2 class="section-title">Planning date (pick a Tuesday)</h2>
        <input
          type="date"
          class="date-input"
          [value]="planningDate"
          [min]="minDate"
          (change)="onDateChange($event)"
          [class.input-error]="dateError"
        />
        @if (dateError) {
          <span class="error-msg">{{ dateError }}</span>
        }
        @if (planningDate) {
          <div class="date-info">Work period: {{ workStart }} to {{ workEnd }}</div>
        }
      </section>

      <!-- Step 2: Select Team Members -->
      <section class="section">
        <h2 class="section-title">👥 Select Team Members</h2>
        <p class="section-desc">Choose who's participating this week (30 hours each).</p>

        @if (allMembers.length === 0) {
          <div class="empty-msg">No team members found. Add some first.</div>
        } @else {
          <div class="member-grid">
            @for (member of allMembers; track member.id) {
              <button
                class="member-card"
                [class.selected]="selectedMemberIds.has(member.id)"
                (click)="toggleMember(member.id)"
              >
                <span class="member-check">{{ selectedMemberIds.has(member.id) ? '✅' : '⬜' }}</span>
                <span class="member-name">{{ member.name }}</span>
                <span class="member-role" [class.role-lead]="member.role === 'Lead'">
                  {{ member.role === 'Lead' ? '👑' : '👤' }}
                </span>
              </button>
            }
          </div>
          <div class="selection-summary">
            {{ selectedMemberIds.size }} member{{ selectedMemberIds.size !== 1 ? 's' : '' }} selected
            · {{ selectedMemberIds.size * 30 }} total hours
          </div>
        }
      </section>

      <!-- Step 3: Category Split -->
      <section class="section">
        <h2 class="section-title">How should the hours be split?</h2>

        <div class="percent-grid">
          <div class="percent-field">
            <label class="percent-label">Client Focused %</label>
            <input type="number" min="0" max="100"
              class="percent-input" [(ngModel)]="clientPercent" (ngModelChange)="onPercentChange()" />
          </div>
          <div class="percent-field">
            <label class="percent-label">Tech Debt %</label>
            <input type="number" min="0" max="100"
              class="percent-input" [(ngModel)]="techDebtPercent" (ngModelChange)="onPercentChange()" />
          </div>
          <div class="percent-field">
            <label class="percent-label">R&D %</label>
            <input type="number" min="0" max="100"
              class="percent-input" [(ngModel)]="rndPercent" (ngModelChange)="onPercentChange()" />
          </div>
        </div>

        <div class="total-bar" [class.total-ok]="totalPercent === 100" [class.total-error]="totalPercent !== 100">
          Total: {{ totalPercent }}%
          @if (totalPercent !== 100) {
            <span class="total-hint">(must be 100%)</span>
          } @else {
            <span class="total-hint">✓</span>
          }
        </div>
      </section>

      <!-- Action Buttons -->
      <div class="actions">
        <button class="btn btn-secondary" (click)="nav.goBack()">Cancel</button>
        <button
          class="btn btn-primary"
          [disabled]="!isValid() || saving"
          (click)="createAndSetup()"
        >
          {{ saving ? 'Creating...' : '✨ Create & Open Planning' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .setup-container {
      max-width: 800px;
      margin: 32px auto;
      padding: 0 20px 60px;
      font-family: 'Inter', sans-serif;
    }
    .header { margin-bottom: 32px; }
    .header h1 { font-size: 24px; color: var(--text-primary); margin: 0 0 4px; }
    .subtitle { color: var(--text-secondary); font-size: 14px; margin: 0; }

    .section {
      background: var(--bg-secondary); border: 1px solid var(--bg-card-hover); border-radius: 14px;
      padding: 24px; margin-bottom: 20px;
    }
    .section-title { font-size: 16px; color: var(--text-primary); margin: 0 0 4px; }
    .section-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 16px; }

    /* Date input */
    .date-input {
      width: 100%; padding: 12px 14px; background: var(--bg-primary); border: 1px solid var(--bg-card-hover);
      border-radius: 8px; color: var(--text-primary); font-size: 14px; font-family: inherit;
      outline: none; transition: border-color 0.2s; cursor: pointer;
      color-scheme: dark;
    }
    .date-input::-webkit-calendar-picker-indicator {
      filter: invert(0.7);
      cursor: pointer;
    }
    .date-input:focus { border-color: var(--color-primary); }
    .input-error { border-color: var(--color-danger) !important; }
    .error-msg { display: block; color: var(--color-danger); font-size: 12px; margin-top: 6px; }
    .date-info {
      margin-top: 8px; color: var(--text-info); font-size: 13px;
    }

    /* Member grid */
    .member-grid { display: flex; flex-direction: column; gap: 8px; }
    .member-card {
      display: flex; align-items: center; gap: 12px; padding: 14px 16px;
      background: var(--bg-primary); border: 1px solid var(--bg-card-hover); border-radius: 10px;
      cursor: pointer; transition: all 0.2s; font-family: inherit; font-size: 14px;
      color: var(--text-primary); width: 100%; text-align: left;
    }
    .member-card:hover { border-color: var(--border-hover); background: var(--bg-card-active); }
    .member-card.selected { border-color: var(--color-primary); background: rgba(59, 130, 246, 0.08); }
    .member-check { font-size: 16px; }
    .member-name { flex: 1; font-weight: 500; }
    .member-role { font-size: 16px; }
    .role-lead { color: var(--color-warning); }
    .selection-summary {
      margin-top: 10px; font-size: 13px; color: var(--text-secondary); text-align: center;
    }
    .empty-msg { color: var(--text-muted); text-align: center; padding: 20px; font-size: 14px; }

    /* Percent inputs */
    .percent-grid {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;
    }
    .percent-field { display: flex; flex-direction: column; gap: 6px; }
    .percent-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .percent-input {
      width: 100%; padding: 12px 14px; background: var(--bg-primary); border: 1px solid var(--bg-card-hover);
      border-radius: 8px; color: var(--text-primary); font-size: 16px; font-family: inherit;
      outline: none; transition: border-color 0.2s;
    }
    .percent-input:focus { border-color: var(--color-primary); }

    /* Total bar */
    .total-bar {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 16px; padding: 10px 14px; border-radius: 8px;
      font-size: 14px; font-weight: 600;
    }
    .total-ok { background: rgba(34, 197, 94, 0.1); color: var(--text-success-light); border: 1px solid rgba(34, 197, 94, 0.2); }
    .total-error { background: rgba(239, 68, 68, 0.1); color: var(--text-danger-light); border: 1px solid rgba(239, 68, 68, 0.2); }
    .total-hint { font-weight: 400; font-size: 13px; }

    /* Action buttons */
    .actions {
      display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;
    }
    .btn {
      padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: inherit; border: none;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: var(--color-primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
    .btn-secondary { background: var(--bg-card-hover); color: var(--text-secondary); }
    .btn-secondary:hover { background: var(--border-hover); color: var(--text-primary); }
  `]
})
export class WeekSetupComponent implements OnInit {
  allMembers: TeamMember[] = [];
  selectedMemberIds = new Set<string>();
  planningDate = '';
  minDate = '';
  dateError = '';
  workStart = '';
  workEnd = '';

  clientPercent = 0;
  techDebtPercent = 0;
  rndPercent = 0;
  totalPercent = 0;
  saving = false;

  constructor(
    public nav: NavigationService,
    private weeklyPlanService: WeeklyPlanService,
    private teamMemberService: TeamMemberService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    // Load all team members
    this.teamMemberService.getAll().subscribe({
      next: (members) => {
        this.allMembers = members.filter(m => m.isActive);
        // Pre-select all members
        this.allMembers.forEach(m => this.selectedMemberIds.add(m.id));
      }
    });

    // Set min date to today
    this.minDate = this.formatDate(new Date());
    // Default planning date to next Tuesday
    this.planningDate = this.getNextTuesday();
    this.validateDate();
    this.updateWorkDates();
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.planningDate = input.value;
    this.validateDate();
    this.updateWorkDates();
  }

  toggleMember(id: string): void {
    if (this.selectedMemberIds.has(id)) {
      this.selectedMemberIds.delete(id);
    } else {
      this.selectedMemberIds.add(id);
    }
  }

  onPercentChange(): void {
    this.totalPercent = this.clientPercent + this.techDebtPercent + this.rndPercent;
  }

  getHours(percent: number): number {
    return Math.round(this.selectedMemberIds.size * 30 * percent / 100);
  }

  isValid(): boolean {
    return (
      !!this.planningDate &&
      !this.dateError &&
      this.selectedMemberIds.size > 0 &&
      this.totalPercent === 100
    );
  }

  createAndSetup(): void {
    if (!this.isValid() || this.saving) return;
    this.saving = true;

    // Step 1: Create the plan
    this.weeklyPlanService.create(this.planningDate + 'T00:00:00').subscribe({
      next: (plan) => {
        // Step 2: Configure with members and percentages
        this.weeklyPlanService.setup(plan.id, {
          planningDate: this.planningDate + 'T00:00:00',
          selectedMemberIds: Array.from(this.selectedMemberIds),
          clientFocusedPercent: this.clientPercent,
          techDebtPercent: this.techDebtPercent,
          rAndDPercent: this.rndPercent
        }).subscribe({
          next: (configuredPlan) => {
            // Step 3: Open planning immediately
            this.weeklyPlanService.openPlanning(configuredPlan.id).subscribe({
              next: () => {
                this.saving = false;
                this.toast.success('Week created and planning is open! 🎉');
                this.nav.navigateTo('home');
              },
              error: (err) => {
                this.saving = false;
                this.toast.error('Plan created but failed to open planning: ' + (err.error?.message || err.message));
              }
            });
          },
          error: (err) => {
            this.saving = false;
            this.toast.error('Failed to configure plan: ' + (err.error || err.message));
          }
        });
      },
      error: (err) => {
        this.saving = false;
        this.toast.error('Failed to create plan: ' + (err.error || err.message));
      }
    });
  }

  private getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private validateDate(): void {
    if (!this.planningDate) {
      this.dateError = '';
      return;
    }
    const date = new Date(this.planningDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      this.dateError = 'Date cannot be in the past.';
    } else if (date.getDay() !== 2) {
      this.dateError = 'Planning date must be a Tuesday.';
    } else {
      this.dateError = '';
    }
  }

  private updateWorkDates(): void {
    if (!this.planningDate) {
      this.workStart = '';
      this.workEnd = '';
      return;
    }
    const d = new Date(this.planningDate + 'T00:00:00');
    const start = new Date(d); start.setDate(d.getDate() + 1);
    const end = new Date(d); end.setDate(d.getDate() + 6);
    this.workStart = start.toISOString().split('T')[0];
    this.workEnd = end.toISOString().split('T')[0];
  }

  private getNextTuesday(): string {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun ... 6=Sat
    const daysUntilTuesday = (2 - dayOfWeek + 7) % 7 || 7; // always next tuesday, not today even if today is tuesday
    const next = new Date(today);
    next.setDate(today.getDate() + daysUntilTuesday);
    return this.formatDate(next);
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
