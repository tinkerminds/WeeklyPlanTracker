import { Component, OnInit, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WeeklyPlanService } from '../../core/services/weekly-plan.service';
import { PlanAssignmentService, PlanAssignment } from '../../core/services/plan-assignment.service';
import { NavigationService } from '../../core/services/navigation.service';
import { ToastService } from '../../core/services/toast.service';
import { WeeklyPlan, WeeklyPlanMember } from '../../core/models/weekly-plan.model';
import { ConfirmService } from '../../core/services/confirm.service';
import { BacklogCategory } from '../../core/enums/enums';

@Component({
  selector: 'app-review-freeze',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="review-container">
      <button class="btn-back" (click)="nav.navigateTo('home')">\u2190 Home</button>
      <h1 class="page-title">Review the Team\u2019s Plan</h1>

      @if (loading) {
        <div class="loading"><div class="spinner"></div><p>Loading...</p></div>
      }

      @if (!loading && currentPlan) {
        <p class="summary-line">
          Week of {{ currentPlan.planningDate | date:'yyyy-MM-dd' }}.
          {{ currentPlan.memberCount }} team members.
          {{ currentPlan.totalHours }} total hours.
        </p>

        <!-- Category Summary -->
        <h2 class="section-title">Category Summary</h2>
        <div class="cat-table">
          <div class="cat-row cat-header">
            <span class="cat-col-category">Category</span>
            <span class="cat-col">Budget</span>
            <span class="cat-col">Planned</span>
            <span class="cat-col-status">Status</span>
          </div>
          <div class="cat-row">
            <span class="cat-col-category"><span class="cat-badge cat-client">Client Focused</span></span>
            <span class="cat-col">{{ currentPlan.clientFocusedBudgetHours }}h</span>
            <span class="cat-col">{{ clientPlanned }}h</span>
            <span class="cat-col-status">
              @if (clientPlanned === currentPlan.clientFocusedBudgetHours) {
                <span class="status-match">\u2705 Match</span>
              } @else {
                <span class="status-off">\u26A0 Off by {{ Math.abs(currentPlan.clientFocusedBudgetHours - clientPlanned) }}h</span>
              }
            </span>
          </div>
          <div class="cat-row">
            <span class="cat-col-category"><span class="cat-badge cat-tech">Tech Debt</span></span>
            <span class="cat-col">{{ currentPlan.techDebtBudgetHours }}h</span>
            <span class="cat-col">{{ techDebtPlanned }}h</span>
            <span class="cat-col-status">
              @if (techDebtPlanned === currentPlan.techDebtBudgetHours) {
                <span class="status-match">\u2705 Match</span>
              } @else {
                <span class="status-off">\u26A0 Off by {{ Math.abs(currentPlan.techDebtBudgetHours - techDebtPlanned) }}h</span>
              }
            </span>
          </div>
          <div class="cat-row">
            <span class="cat-col-category"><span class="cat-badge cat-rnd">R&D</span></span>
            <span class="cat-col">{{ currentPlan.rAndDBudgetHours }}h</span>
            <span class="cat-col">{{ rndPlanned }}h</span>
            <span class="cat-col-status">
              @if (rndPlanned === currentPlan.rAndDBudgetHours) {
                <span class="status-match">\u2705 Match</span>
              } @else {
                <span class="status-off">\u26A0 Off by {{ Math.abs(currentPlan.rAndDBudgetHours - rndPlanned) }}h</span>
              }
            </span>
          </div>
        </div>

        <!-- Member Summary -->
        <h2 class="section-title">Member Summary</h2>
        @for (member of members; track member.id) {
          <div class="member-card" (click)="toggleExpand(member.id)">
            <div class="member-row">
              <span class="member-name">{{ member.name }}</span>
              <span class="member-hours" [class.hours-ok]="getMemberHours(member.id) === 30"
                    [class.hours-off]="getMemberHours(member.id) !== 30">
                {{ getMemberHours(member.id) }} / 30h
              </span>
              <span class="member-ready">
                @if (member.isPlanningDone) {
                  <span class="ready-badge">\u2713 Ready</span>
                } @else {
                  <span class="not-ready-badge">Not Ready</span>
                }
              </span>
            </div>
            @if (expandedMember === member.id) {
              <div class="member-items">
                @if (getMemberAssignments(member.id).length === 0) {
                  <div class="no-items">No items planned yet.</div>
                }
                @for (a of getMemberAssignments(member.id); track a.id) {
                  <div class="member-item">
                    <span class="cat-badge" [class]="getCatClass(a.backlogItemCategory)">{{ getCategoryLabel(a.backlogItemCategory) }}</span>
                    <span class="item-title">{{ a.backlogItemTitle }}</span>
                    <span class="item-hours">{{ a.committedHours }}h</span>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Validation Issues -->
        @if (freezeIssues.length > 0) {
          <div class="warning-box">
            <strong class="warning-title">Can\u2019t freeze yet:</strong>
            @for (issue of freezeIssues; track issue) {
              <div class="warning-item">\u2022 {{ issue }}</div>
            }
          </div>
        }

        <!-- Action buttons -->
        <div class="action-row">
          <button class="btn-freeze" (click)="freezePlan()" [disabled]="freezeIssues.length > 0 || freezing">
            \u2744\uFE0F Freeze the Plan
          </button>
          <button class="btn-cancel" (click)="cancelPlanning()">Cancel Planning</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .review-container { max-width: 900px; margin: 20px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
    .btn-back {
      display: inline-block; background: var(--bg-card-hover); color: var(--text-secondary); border: none;
      padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; margin-bottom: 12px;
    }
    .btn-back:hover { background: var(--border-hover); color: var(--text-primary); }
    .page-title { font-size: 24px; color: var(--text-primary); margin: 0 0 4px; }
    .summary-line { color: var(--text-secondary); font-size: 14px; margin-bottom: 20px; }
    .section-title { font-size: 18px; color: var(--text-primary); margin: 20px 0 10px; font-weight: 700; }

    /* Category Summary Table */
    .cat-table {
      background: var(--bg-secondary); border: 1px solid var(--bg-card-hover); border-radius: 10px;
      overflow: hidden; margin-bottom: 24px;
    }
    .cat-row {
      display: grid; grid-template-columns: 1.5fr 1fr 1fr 1.5fr;
      padding: 12px 16px; border-bottom: 1px solid var(--bg-card-hover); align-items: center;
    }
    .cat-row:last-child { border-bottom: none; }
    .cat-header { font-weight: 700; color: var(--text-secondary); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    .cat-col-category { }
    .cat-col { color: var(--text-primary); font-size: 14px; }
    .cat-col-status { font-size: 14px; }
    .status-match { color: var(--color-success); }
    .status-off { color: var(--color-danger); }

    .cat-badge {
      display: inline-block; padding: 3px 10px; border-radius: 6px;
      font-size: 12px; font-weight: 700; white-space: nowrap;
    }
    .cat-client { background: var(--color-primary); color: #fff; }
    .cat-tech { background: var(--color-warning); color: #fff; }
    .cat-rnd { background: var(--color-success); color: #fff; }

    /* Member Summary */
    .member-card {
      background: var(--bg-secondary); border: 1px solid var(--bg-card-hover); border-radius: 10px;
      padding: 16px 20px; margin-bottom: 10px; cursor: pointer; transition: border-color 0.2s;
    }
    .member-card:hover { border-color: var(--border-hover); }
    .member-row {
      display: flex; align-items: center; gap: 16px;
    }
    .member-name { font-size: 15px; font-weight: 600; color: var(--text-primary); flex: 1; }
    .member-hours { font-size: 14px; font-weight: 600; }
    .hours-ok { color: var(--color-success); }
    .hours-off { color: var(--color-warning); }
    .ready-badge {
      display: inline-block; padding: 4px 12px; background: var(--color-success); color: #fff;
      border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .not-ready-badge {
      display: inline-block; padding: 4px 12px; background: var(--border-hover); color: var(--text-secondary);
      border-radius: 20px; font-size: 12px; font-weight: 600;
    }
    .member-items { margin-top: 12px; border-top: 1px solid var(--bg-card-hover); padding-top: 10px; }
    .member-item {
      display: flex; align-items: center; gap: 10px; padding: 6px 0; font-size: 14px; color: var(--text-primary);
    }
    .item-title { flex: 1; }
    .item-hours { color: var(--text-secondary); font-size: 13px; }
    .no-items { font-size: 13px; color: var(--text-muted); font-style: italic; }

    /* Warning box */
    .warning-box {
      background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3);
      border-left: 4px solid var(--color-danger); border-radius: 10px; padding: 16px 20px;
      margin: 20px 0; color: var(--text-danger-muted);
    }
    .warning-title { color: var(--color-danger); font-size: 15px; display: block; margin-bottom: 8px; }
    .warning-item { font-size: 14px; margin-bottom: 2px; }

    /* Actions */
    .action-row { display: flex; gap: 10px; margin-top: 20px; margin-bottom: 40px; }
    .btn-freeze {
      padding: 12px 24px; background: var(--color-primary); color: #fff; border: none;
      border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer;
      font-family: inherit; transition: all 0.2s;
    }
    .btn-freeze:hover:not(:disabled) { background: var(--color-primary-hover); }
    .btn-freeze:disabled { opacity: 0.4; cursor: not-allowed; }
    .btn-cancel {
      padding: 12px 20px; background: var(--color-danger); color: #fff; border: none;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
    }
    .btn-cancel:hover { background: var(--color-danger-hover); }

    .loading {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 30vh; gap: 16px; color: var(--text-secondary);
    }
    .spinner {
      width: 36px; height: 36px; border: 3px solid var(--bg-card-hover); border-top-color: var(--color-primary);
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ReviewFreezeComponent implements OnInit {
  Math = Math;
  loading = true;
  freezing = false;
  currentPlan: WeeklyPlan | null = null;
  members: WeeklyPlanMember[] = [];
  allAssignments: PlanAssignment[] = [];
  freezeIssues: string[] = [];
  expandedMember: string | null = null;
  constructor(
    private weeklyPlanService: WeeklyPlanService,
    private planAssignmentService: PlanAssignmentService,
    public nav: NavigationService,
    private toast: ToastService,
    private confirmService: ConfirmService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  toggleExpand(memberId: string): void {
    this.expandedMember = this.expandedMember === memberId ? null : memberId;
  }

  getMemberHours(memberId: string): number {
    return this.allAssignments
      .filter(a => a.teamMemberId === memberId)
      .reduce((s, a) => s + a.committedHours, 0);
  }

  getMemberAssignments(memberId: string): PlanAssignment[] {
    return this.allAssignments.filter(a => a.teamMemberId === memberId);
  }

  get clientPlanned(): number {
    return this.allAssignments
      .filter(a => a.backlogItemCategory === BacklogCategory.ClientFocused)
      .reduce((s, a) => s + a.committedHours, 0);
  }

  get techDebtPlanned(): number {
    return this.allAssignments
      .filter(a => a.backlogItemCategory === BacklogCategory.TechDebt)
      .reduce((s, a) => s + a.committedHours, 0);
  }

  get rndPlanned(): number {
    return this.allAssignments
      .filter(a => a.backlogItemCategory === BacklogCategory.RAndD)
      .reduce((s, a) => s + a.committedHours, 0);
  }

  getCategoryLabel(cat: BacklogCategory | string): string {
    switch (cat) {
      case BacklogCategory.ClientFocused: return 'Client Focused';
      case BacklogCategory.TechDebt: return 'Tech Debt';
      case BacklogCategory.RAndD: return 'R&D';
      default: return String(cat);
    }
  }

  getCatClass(cat: BacklogCategory | string): string {
    switch (cat) {
      case BacklogCategory.ClientFocused: return 'cat-client';
      case BacklogCategory.TechDebt: return 'cat-tech';
      case BacklogCategory.RAndD: return 'cat-rnd';
      default: return '';
    }
  }

  freezePlan(): void {
    if (!this.currentPlan) return;
    this.freezing = true;

    this.weeklyPlanService.freeze(this.currentPlan.id).subscribe({
      next: () => {
        this.freezing = false;
        this.toast.success('Plan is frozen! The team can now track progress.');
        this.nav.navigateTo('home');
      },
      error: (err) => {
        this.freezing = false;
        this.toast.error(err.error?.message || 'Failed to freeze the plan.');
      }
    });
  }

  async cancelPlanning(): Promise<void> {
    if (!this.currentPlan) return;
    const ok = await this.confirmService.confirm({
      title: '🗑️ Cancel Planning',
      message: 'Are you sure you want to cancel this week\u2019s planning? This will erase all plans and cannot be undone.',
      confirmText: 'Yes, Cancel Planning',
      cancelText: 'Keep Planning',
      danger: true
    });
    if (!ok) return;

    this.weeklyPlanService.cancel(this.currentPlan.id).subscribe({
      next: () => {
        this.toast.success('This week\u2019s planning has been cancelled.');
        this.nav.navigateTo('home');
      },
      error: (err) => {
        this.toast.error(err.error || 'Failed to cancel planning.');
      }
    });
  }

  private loadData(): void {
    this.loading = true;
    this.weeklyPlanService.getCurrent().subscribe({
      next: (plan) => {
        if (!plan) {
          this.loading = false;
          this.nav.navigateTo('home');
          return;
        }
        this.currentPlan = plan;
        this.members = plan.members || [];

        this.planAssignmentService.getByWeek(plan.id).subscribe({
          next: (all) => {
            this.allAssignments = all;
            this.computeIssues();
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  private computeIssues(): void {
    if (!this.currentPlan) return;
    const issues: string[] = [];

    // Check each member has exactly 30 hours
    for (const member of this.members) {
      const hours = this.getMemberHours(member.id);
      if (hours !== 30) {
        issues.push(`${member.name} has ${hours} hours (needs ${30 - hours} more).`);
      }
    }

    // Check category totals match budget
    if (this.clientPlanned !== this.currentPlan.clientFocusedBudgetHours) {
      issues.push(`Client Focused has ${this.clientPlanned}h planned but budget is ${this.currentPlan.clientFocusedBudgetHours}h.`);
    }
    if (this.techDebtPlanned !== this.currentPlan.techDebtBudgetHours) {
      issues.push(`Tech Debt has ${this.techDebtPlanned}h planned but budget is ${this.currentPlan.techDebtBudgetHours}h.`);
    }
    if (this.rndPlanned !== this.currentPlan.rAndDBudgetHours) {
      issues.push(`R&D has ${this.rndPlanned}h planned but budget is ${this.currentPlan.rAndDBudgetHours}h.`);
    }

    this.freezeIssues = issues;
  }
}
