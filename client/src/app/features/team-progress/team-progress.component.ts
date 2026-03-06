import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../core/services/navigation.service';
import { WeeklyPlanService } from '../../core/services/weekly-plan.service';
import { PlanAssignmentService, PlanAssignment } from '../../core/services/plan-assignment.service';

interface CategoryProgress {
  name: string;
  key: string;
  committed: number;
  done: number;
  percent: number;
}

interface MemberProgress {
  memberId: string;
  memberName: string;
  committed: number;
  done: number;
  percent: number;
  tasksDone: number;
  tasksBlocked: number;
  assignments: PlanAssignment[];
  expanded: boolean;
}

@Component({
  selector: 'app-team-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-page">
      <button class="back-btn" (click)="nav.navigateTo('home')">← Home</button>
      <h1>📊 Team Progress</h1>
      <p class="subtitle" *ngIf="weekLabel">{{ weekLabel }}</p>

      @if (loading) {
        <div class="loading">Loading progress...</div>
      } @else if (assignments.length === 0) {
        <div class="empty">No assignments found for this week.</div>
      } @else {
        <!-- Overall Summary Cards -->
        <div class="summary-row">
          <div class="summary-card ring-card">
            <svg class="progress-ring" viewBox="0 0 120 120">
              <circle class="ring-bg" cx="60" cy="60" r="52" />
              <circle class="ring-fill" cx="60" cy="60" r="52"
                [style.strokeDasharray]="2 * 3.14159 * 52"
                [style.strokeDashoffset]="2 * 3.14159 * 52 * (1 - overallPercent / 100)" />
              <text x="60" y="56" text-anchor="middle" class="ring-text">{{ overallPercent }}%</text>
              <text x="60" y="72" text-anchor="middle" class="ring-label">Progress</text>
            </svg>
          </div>
          <div class="summary-card">
            <div class="summary-value">{{ tasksDone }} / {{ totalTasks }}</div>
            <div class="summary-label">Tasks Done</div>
          </div>
          <div class="summary-card blocked-card">
            <div class="summary-value">{{ tasksBlocked }}</div>
            <div class="summary-label">Blocked</div>
          </div>
        </div>

        <!-- By Category -->
        <h2>By Category</h2>
        <div class="category-grid">
          @for (cat of categories; track cat.key) {
            <div class="cat-card">
              <div class="cat-header">
                <span class="cat-badge" [class]="'cat-' + cat.key">{{ cat.name }}</span>
                <span class="cat-hours">{{ cat.done }}h done of {{ cat.committed }}h</span>
              </div>
              <div class="progress-bar-track"><div class="progress-bar-fill" [class]="'fill-' + cat.key" [style.width.%]="cat.percent"></div></div>
            </div>
          }
        </div>

        <!-- By Member -->
        <h2>By Member</h2>
        <div class="member-list">
          @for (member of members; track member.memberId) {
            <div class="member-card" [style.animationDelay]="(0.08 * $index) + 's'" style="animation: staggerFadeIn 0.35s ease-out both;">
              <div class="member-header" (click)="member.expanded = !member.expanded">
                <div class="member-info">
                  <span class="member-name">{{ member.memberName }}</span>
                  <span class="member-hours">{{ member.done }}h done of {{ member.committed }}h</span>
                </div>
                <div class="member-right">
                  <div class="member-percent">{{ member.percent }}%</div>
                  <span class="expand-icon">{{ member.expanded ? '▼' : '▶' }}</span>
                </div>
              </div>
              <div class="member-bar-track"><div class="progress-bar-fill" [style.width.%]="member.percent"></div></div>

              @if (member.expanded) {
                <div class="member-tasks">
                  @for (a of member.assignments; track a.id) {
                    <div class="task-row" [style.animationDelay]="(0.05 * $index) + 's'" style="animation: staggerFadeIn 0.3s ease-out both;">
                      <span class="task-badge" [class]="'cat-' + getCatKey(a.backlogItemCategory)">{{ getCatLabel(a.backlogItemCategory) }}</span>
                      <span class="task-title">{{ a.backlogItemTitle }}</span>
                      <span class="task-hours">{{ a.hoursCompleted }}h / {{ a.committedHours }}h</span>
                      <span class="status-dot" [class]="'dot-' + a.status.toLowerCase()"></span>
                      <span class="task-status" [class]="'status-' + a.status.toLowerCase()">{{ a.status }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .progress-page {
      max-width: 960px; margin: 20px auto; padding: 0 24px; font-family: 'Inter', sans-serif;
    }
    h1 { font-size: 28px; font-weight: 700; color: var(--text-heading); margin-bottom: 4px; }
    h2 { font-size: 20px; font-weight: 700; color: var(--text-heading); margin: 28px 0 14px 0; }
    .subtitle { color: var(--text-secondary); font-size: 15px; margin-bottom: 24px; }
    .loading, .empty { text-align: center; padding: 60px 0; color: var(--text-muted); font-size: 16px; }

    /* Summary Cards */
    .summary-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; margin-top: 20px; }
    .summary-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      padding: 20px 24px; box-shadow: var(--shadow-sm);
    }
    .summary-value { font-size: 32px; font-weight: 800; color: var(--text-heading); }
    .summary-label { font-size: 14px; color: var(--text-secondary); margin-top: 4px; font-weight: 600; }
    .blocked-card .summary-value { color: var(--color-danger); }

    /* Progress bars */
    .progress-bar-track {
      width: 100%; height: 10px; background: var(--bg-card-hover); border-radius: 5px; margin-top: 10px; overflow: hidden;
    }
    .member-bar-track {
      width: 100%; height: 6px; background: var(--bg-card-hover); border-radius: 3px; margin-top: 8px; overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%; border-radius: 5px; background: var(--color-primary); transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .fill-client { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .fill-tech { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .fill-rnd { background: linear-gradient(90deg, #22c55e, #4ade80); }

    /* SVG Progress Ring */
    .ring-card { display: flex; align-items: center; justify-content: center; }
    .progress-ring { width: 120px; height: 120px; }
    .ring-bg { fill: none; stroke: var(--bg-card-hover); stroke-width: 8; }
    .ring-fill {
      fill: none; stroke: var(--color-primary); stroke-width: 8;
      stroke-linecap: round; transform: rotate(-90deg); transform-origin: 50% 50%;
      transition: stroke-dashoffset 1s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .ring-text { fill: var(--text-heading); font-size: 22px; font-weight: 800; font-family: 'Inter', sans-serif; }
    .ring-label { fill: var(--text-secondary); font-size: 11px; font-weight: 600; font-family: 'Inter', sans-serif; }

    /* Status Dots */
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .dot-notstarted { background: var(--text-muted); }
    .dot-inprogress { background: var(--color-primary); }
    .dot-done { background: var(--color-success); }
    .dot-blocked { background: var(--color-danger); }

    /* Category Grid */
    .category-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
    .cat-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      padding: 18px 20px; box-shadow: var(--shadow-sm);
    }
    .cat-header { display: flex; justify-content: space-between; align-items: center; }
    .cat-hours { font-size: 13px; color: var(--text-secondary); font-weight: 600; }
    .cat-badge {
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; color: #fff;
    }
    .cat-client { background: var(--color-primary); }
    .cat-tech { background: var(--color-warning); }
    .cat-rnd { background: var(--color-success); }

    /* Member List */
    .member-list { display: flex; flex-direction: column; gap: 12px; }
    .member-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      padding: 18px 22px; box-shadow: var(--shadow-sm);
    }
    .member-header {
      display: flex; justify-content: space-between; align-items: center; cursor: pointer;
    }
    .member-info { display: flex; flex-direction: column; gap: 2px; }
    .member-name { font-size: 16px; font-weight: 700; color: var(--text-heading); }
    .member-hours { font-size: 13px; color: var(--text-secondary); font-weight: 500; }
    .member-right { display: flex; align-items: center; gap: 12px; }
    .member-percent { font-size: 18px; font-weight: 800; color: var(--color-primary); }
    .expand-icon { font-size: 12px; color: var(--text-muted); }

    /* Task Detail Rows */
    .member-tasks {
      margin-top: 14px; border-top: 1px solid var(--border-color); padding-top: 12px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .task-row {
      display: flex; align-items: center; gap: 12px; padding: 8px 12px;
      background: var(--bg-card-hover); border-radius: 8px; font-size: 14px;
    }
    .task-badge {
      padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
    }
    .task-title { flex: 1; font-weight: 600; color: var(--text-primary); }
    .task-hours { font-size: 13px; color: var(--text-secondary); font-weight: 600; white-space: nowrap; }
    .task-status {
      padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap;
    }
    .status-notstarted { background: rgba(148,163,184,0.2); color: var(--text-secondary); }
    .status-inprogress { background: rgba(59,130,246,0.15); color: var(--color-primary); }
    .status-done { background: rgba(34,197,94,0.15); color: var(--color-success); }
    .status-blocked { background: rgba(239,68,68,0.15); color: var(--color-danger); }
  `]
})
export class TeamProgressComponent implements OnInit {
  loading = true;
  weekLabel = '';
  assignments: PlanAssignment[] = [];
  overallPercent = 0;
  tasksDone = 0;
  tasksBlocked = 0;
  totalTasks = 0;
  categories: CategoryProgress[] = [];
  members: MemberProgress[] = [];

  constructor(
    public nav: NavigationService,
    private weeklyPlanService: WeeklyPlanService,
    private planAssignmentService: PlanAssignmentService
  ) { }

  ngOnInit(): void {
    this.weeklyPlanService.getCurrent().subscribe({
      next: (plan) => {
        if (!plan) {
          this.loading = false;
          return;
        }
        this.weekLabel = `Week of ${plan.planningDate?.split('T')[0]} · ${plan.memberCount} members · ${plan.memberCount * 30}h total`;
        this.planAssignmentService.getByWeek(plan.id).subscribe({
          next: (assignments) => {
            this.assignments = assignments;
            this.computeProgress();
            this.loading = false;
          },
          error: () => this.loading = false
        });
      },
      error: () => this.loading = false
    });
  }

  private computeProgress(): void {
    const a = this.assignments;
    this.totalTasks = a.length;
    this.tasksDone = a.filter(x => x.status === 'Done').length;
    this.tasksBlocked = a.filter(x => x.status === 'Blocked').length;

    const totalCommitted = a.reduce((s, x) => s + x.committedHours, 0);
    const totalDone = a.reduce((s, x) => s + x.hoursCompleted, 0);
    this.overallPercent = totalCommitted > 0 ? Math.round((totalDone / totalCommitted) * 100) : 0;

    // By category
    const catMap: Record<string, { name: string; key: string; committed: number; done: number }> = {
      'ClientFocused': { name: 'Client Focused', key: 'client', committed: 0, done: 0 },
      'TechDebt': { name: 'Tech Debt', key: 'tech', committed: 0, done: 0 },
      'RAndD': { name: 'R&D', key: 'rnd', committed: 0, done: 0 }
    };
    for (const x of a) {
      const cat = catMap[x.backlogItemCategory];
      if (cat) { cat.committed += x.committedHours; cat.done += x.hoursCompleted; }
    }
    this.categories = Object.values(catMap).map(c => ({
      ...c,
      percent: c.committed > 0 ? Math.round((c.done / c.committed) * 100) : 0
    }));

    // By member
    const memberMap = new Map<string, MemberProgress>();
    for (const x of a) {
      let m = memberMap.get(x.teamMemberId);
      if (!m) {
        m = {
          memberId: x.teamMemberId, memberName: x.teamMemberName,
          committed: 0, done: 0, percent: 0, tasksDone: 0, tasksBlocked: 0,
          assignments: [], expanded: false
        };
        memberMap.set(x.teamMemberId, m);
      }
      m.committed += x.committedHours;
      m.done += x.hoursCompleted;
      m.assignments.push(x);
      if (x.status === 'Done') m.tasksDone++;
      if (x.status === 'Blocked') m.tasksBlocked++;
    }
    this.members = Array.from(memberMap.values()).map(m => ({
      ...m,
      percent: m.committed > 0 ? Math.round((m.done / m.committed) * 100) : 0
    }));
  }

  getCatKey(cat: string): string {
    if (cat === 'ClientFocused') return 'client';
    if (cat === 'TechDebt') return 'tech';
    return 'rnd';
  }

  getCatLabel(cat: string): string {
    if (cat === 'ClientFocused') return 'Client';
    if (cat === 'TechDebt') return 'Tech Debt';
    return 'R&D';
  }
}
