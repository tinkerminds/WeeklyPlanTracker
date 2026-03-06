import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationService } from '../../core/services/navigation.service';
import { WeeklyPlanService } from '../../core/services/weekly-plan.service';
import { PlanAssignmentService, PlanAssignment } from '../../core/services/plan-assignment.service';
import { DataService } from '../../core/services/data.service';
import { ToastService } from '../../core/services/toast.service';
import { WeeklyPlan, PlanAssignmentSummary } from '../../core/models/weekly-plan.model';

interface CategoryProgress {
  name: string;
  key: string;
  budget: number;
  done: number;
  percent: number;
}

interface MemberProgress {
  name: string;
  committed: number;
  done: number;
  percent: number;
  allDone: boolean;
  assignments: PlanAssignment[];
  expanded: boolean;
}

@Component({
  selector: 'app-past-weeks',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="past-page">

      <!-- ========== DETAIL VIEW ========== -->
      @if (selectedWeek) {
        <button class="back-btn" (click)="selectedWeek = null">← Back to Past Weeks</button>

        <div class="detail-title-row">
          <div>
            <h1>Past Week — {{ formatDate(selectedWeek.planningDate) }}</h1>
            <span class="state-badge">COMPLETED</span>
          </div>
          <div class="cat-tags">
            <span class="cat-tag client">Client {{ selectedWeek.clientFocusedPercent }}%</span>
            <span class="cat-tag tech">Tech Debt {{ selectedWeek.techDebtPercent }}%</span>
            <span class="cat-tag rnd">R&D {{ selectedWeek.rAndDPercent }}%</span>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-row">
          <div class="summary-card">
            <div class="summary-label">OVERALL PROGRESS</div>
            <div class="summary-value">{{ totalDoneHours }}h / {{ selectedWeek.totalHours }}h</div>
            <div class="progress-bar-track"><div class="progress-bar-fill fill-primary" [style.width.%]="overallPercent"></div></div>
            <div class="summary-sub">{{ overallPercent }}%</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">TASKS DONE</div>
            <div class="summary-value">{{ tasksDone }} / {{ totalTasks }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">BLOCKED</div>
            <div class="summary-value" [class.text-danger]="tasksBlocked > 0">{{ tasksBlocked }}</div>
          </div>
        </div>

        <!-- Status Banner -->
        @if (totalTasks > 0 && tasksDone === totalTasks) {
          <div class="status-banner success">🎉 Great work! All tasks are done this week!</div>
        } @else if (tasksBlocked > 0) {
          <div class="status-banner warn">⚠️ {{ tasksBlocked }} task(s) were blocked this week.</div>
        }

        <!-- By Category -->
        <h2>By Category</h2>
        <div class="category-list">
          @for (cat of categories; track cat.key) {
            <div class="cat-card">
              <div class="cat-header">
                <span class="cat-badge" [class]="'cat-' + cat.key">{{ cat.name | uppercase }}</span>
                <span class="cat-info">Budget: <b>{{ cat.budget }}h</b> &nbsp; Done: <b>{{ cat.done }}h ({{ cat.percent }}%)</b></span>
                <div class="cat-bar-area">
                  <div class="progress-bar-track cat-bar"><div class="progress-bar-fill" [class]="'fill-' + cat.key" [style.width.%]="Math.min(cat.percent, 100)"></div></div>
                </div>
                <button class="btn-see-details" (click)="toggleCatExpand(cat.key)">See Details {{ expandedCat === cat.key ? '▲' : '▼' }}</button>
              </div>
              @if (expandedCat === cat.key) {
                <div class="cat-tasks">
                  @for (a of getCatAssignments(cat.key); track a.id) {
                    <div class="task-row">
                      <span class="task-title">{{ a.backlogItemTitle }}</span>
                      <span class="task-hours">{{ a.hoursCompleted }}h / {{ a.committedHours }}h</span>
                      <span class="task-status" [class]="'status-' + a.status.toLowerCase()">{{ a.status }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- By Member -->
        <h2>By Member</h2>
        <div class="member-list">
          @for (member of memberProgress; track member.name) {
            <div class="member-card">
              <div class="member-header">
                <span class="member-name">{{ member.name }}</span>
                <span class="member-hours">{{ member.done }}h / {{ member.committed }}h ({{ member.percent }}%)</span>
                <div class="member-bar-area">
                  <div class="progress-bar-track member-bar"><div class="progress-bar-fill fill-member" [style.width.%]="Math.min(member.percent, 100)" [class.fill-over]="member.percent > 100"></div></div>
                </div>
                @if (member.allDone) {
                  <span class="done-badge">Done</span>
                }
                <button class="btn-see-details" (click)="member.expanded = !member.expanded">See Plan {{ member.expanded ? '▲' : '▼' }}</button>
              </div>
              @if (member.expanded) {
                <div class="member-tasks">
                  @for (a of member.assignments; track a.id) {
                    <div class="task-row">
                      <span class="cat-badge small" [class]="'cat-' + getCatKey(a.backlogItemCategory)">{{ getCatLabel(a.backlogItemCategory) }}</span>
                      <span class="task-title">{{ a.backlogItemTitle }}</span>
                      <span class="task-hours">{{ a.hoursCompleted }}h / {{ a.committedHours }}h</span>
                      <span class="task-status" [class]="'status-' + a.status.toLowerCase()">{{ a.status }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

      <!-- ========== WEEK LIST VIEW ========== -->
      } @else {
        <button class="back-btn" (click)="nav.navigateTo('home')">← Home</button>
        <h1>📅 Past Weeks</h1>

        @if (loading) {
          <div class="loading">Loading past weeks...</div>
        } @else if (weeks.length === 0) {
          <div class="empty">No past weeks yet.</div>
        } @else {
          <div class="weeks-list">
            @for (week of weeks; track week.id) {
              <button class="week-card" (click)="selectWeek(week)">
                <div class="week-info">
                  <h3>Week of {{ formatDate(week.planningDate) }}</h3>
                  <p class="week-meta">
                    Work period: {{ formatDate(week.workStartDate) }} → {{ formatDate(week.workEndDate) }}
                    · {{ week.memberCount }} members · {{ week.totalHours }}h total
                  </p>
                </div>
                <div class="week-right">
                  <span class="state-badge">Completed ✅</span>
                  <span class="expand-icon">▶</span>
                </div>
              </button>
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
      }
    </div>
  `,
  styles: [`
    .past-page {
      max-width: 960px; margin: 20px auto; padding: 0 24px; font-family: 'Inter', sans-serif;
    }
    h1 { font-size: 28px; font-weight: 700; color: var(--text-heading); margin-bottom: 4px; }
    h2 { font-size: 20px; font-weight: 700; color: var(--text-heading); margin: 28px 0 14px 0; }
    .loading, .empty {
      text-align: center; padding: 60px 0; color: var(--text-muted); font-size: 16px;
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
    }

    /* Detail Title Row */
    .detail-title-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    .cat-tags { display: flex; gap: 8px; flex-wrap: wrap; }
    .cat-tag {
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
      border: 1px solid var(--border-color); color: var(--text-secondary); background: var(--bg-card);
    }
    .cat-tag.client { border-color: rgba(59,130,246,0.4); color: var(--color-primary); }
    .cat-tag.tech { border-color: rgba(239,68,68,0.4); color: var(--color-danger); }
    .cat-tag.rnd { border-color: rgba(34,197,94,0.4); color: var(--color-success); }

    /* Summary Cards */
    .summary-row { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .summary-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      padding: 20px 24px; box-shadow: var(--shadow-sm); text-align: center;
    }
    .summary-label { font-size: 12px; font-weight: 700; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 8px; }
    .summary-value { font-size: 28px; font-weight: 800; color: var(--text-heading); }
    .summary-sub { font-size: 14px; color: var(--text-secondary); margin-top: 6px; font-weight: 600; }
    .text-danger { color: var(--color-danger) !important; }

    /* Status Banner */
    .status-banner {
      padding: 14px 20px; border-radius: 12px; font-size: 15px; font-weight: 600; margin-bottom: 8px;
    }
    .status-banner.success { background: rgba(34,197,94,0.12); color: var(--color-success); border: 1px solid rgba(34,197,94,0.25); }
    .status-banner.warn { background: rgba(245,158,11,0.12); color: var(--color-warning); border: 1px solid rgba(245,158,11,0.25); }

    /* Progress Bars */
    .progress-bar-track {
      height: 8px; background: var(--bg-card-hover); border-radius: 4px; overflow: hidden; margin-top: 10px;
    }
    .cat-bar, .member-bar { margin-top: 0; flex: 1; }
    .progress-bar-fill {
      height: 100%; border-radius: 4px; transition: width 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .fill-primary { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .fill-client { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .fill-tech { background: linear-gradient(90deg, #ef4444, #f87171); }
    .fill-rnd { background: linear-gradient(90deg, #22c55e, #4ade80); }
    .fill-member { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .fill-over { background: linear-gradient(90deg, #ef4444, #f87171); }

    /* Category List */
    .category-list { display: flex; flex-direction: column; gap: 10px; }
    .cat-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      padding: 16px 20px; box-shadow: var(--shadow-sm);
    }
    .cat-header { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .cat-badge {
      padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; color: #fff; white-space: nowrap;
    }
    .cat-badge.small { font-size: 10px; padding: 2px 10px; }
    .cat-client { background: var(--color-primary); }
    .cat-tech { background: var(--color-danger); }
    .cat-rnd { background: var(--color-success); }
    .cat-info { font-size: 14px; color: var(--text-secondary); font-weight: 500; white-space: nowrap; }
    .cat-info b { color: var(--text-heading); }
    .cat-bar-area { flex: 1; min-width: 100px; }
    .btn-see-details {
      background: none; border: none; color: var(--color-primary); font-size: 13px;
      font-weight: 600; cursor: pointer; white-space: nowrap; font-family: inherit;
    }
    .btn-see-details:hover { text-decoration: underline; }

    /* Member List */
    .member-list { display: flex; flex-direction: column; gap: 10px; }
    .member-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      padding: 16px 20px; box-shadow: var(--shadow-sm);
    }
    .member-header { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .member-name { font-size: 16px; font-weight: 700; color: var(--text-heading); min-width: 100px; }
    .member-hours { font-size: 14px; color: var(--text-secondary); font-weight: 500; white-space: nowrap; }
    .member-bar-area { flex: 1; min-width: 100px; }
    .done-badge {
      padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
      background: rgba(34,197,94,0.15); color: var(--color-success);
    }

    /* Task Detail Rows */
    .cat-tasks, .member-tasks {
      margin-top: 12px; border-top: 1px solid var(--border-color); padding-top: 10px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .task-row {
      display: flex; align-items: center; gap: 12px; padding: 8px 12px;
      background: var(--bg-card-hover); border-radius: 8px; font-size: 14px;
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

    /* Week List Cards */
    .weeks-list { display: flex; flex-direction: column; gap: 14px; }
    .week-card {
      display: flex; justify-content: space-between; align-items: center; width: 100%;
      padding: 20px 24px; cursor: pointer; transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      box-shadow: var(--shadow-sm); font-family: inherit; text-align: left; color: var(--text-primary);
    }
    .week-card:hover { border-color: var(--color-primary); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59,130,246,0.12); }
    .week-info h3 { font-size: 17px; font-weight: 700; color: var(--text-heading); margin-bottom: 4px; }
    .week-meta { font-size: 13px; color: var(--text-secondary); }
    .week-right { display: flex; align-items: center; gap: 12px; }
    .state-badge {
      padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;
      background: rgba(34,197,94,0.15); color: var(--color-success);
    }
    .expand-icon { font-size: 12px; color: var(--text-muted); }

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
  selectedWeek: WeeklyPlan | null = null;
  detailLoading = false;
  fetchedAssignments: PlanAssignment[] = [];

  // Computed detail data
  totalDoneHours = 0;
  overallPercent = 0;
  tasksDone = 0;
  tasksBlocked = 0;
  totalTasks = 0;
  categories: CategoryProgress[] = [];
  memberProgress: MemberProgress[] = [];
  expandedCat: string | null = null;
  Math = Math;

  constructor(
    public nav: NavigationService,
    private weeklyPlanService: WeeklyPlanService,
    private planAssignmentService: PlanAssignmentService,
    private dataService: DataService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.weeklyPlanService.getPast().subscribe({
      next: (weeks) => { this.weeks = weeks; this.loading = false; },
      error: () => this.loading = false
    });
  }

  selectWeek(week: WeeklyPlan): void {
    this.selectedWeek = week;
    this.detailLoading = true;
    this.planAssignmentService.getByWeek(week.id).subscribe({
      next: (assignments) => {
        this.fetchedAssignments = assignments;
        this.computeDetail(week, assignments);
        this.detailLoading = false;
      },
      error: () => {
        this.fetchedAssignments = [];
        this.computeDetail(week, []);
        this.detailLoading = false;
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return dateStr.split('T')[0];
  }

  toggleCatExpand(key: string): void {
    this.expandedCat = this.expandedCat === key ? null : key;
  }

  getCatAssignments(catKey: string): PlanAssignment[] {
    return this.fetchedAssignments.filter(a => this.getCatKey(a.backlogItemCategory) === catKey);
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

  private computeDetail(week: WeeklyPlan, assignments: PlanAssignment[]): void {
    const a = assignments;
    this.totalTasks = a.length;
    this.tasksDone = a.filter(x => x.status === 'Done').length;
    this.tasksBlocked = a.filter(x => x.status === 'Blocked').length;

    const totalCommitted = a.reduce((s, x) => s + x.committedHours, 0);
    this.totalDoneHours = a.reduce((s, x) => s + x.hoursCompleted, 0);
    this.overallPercent = totalCommitted > 0 ? Math.round((this.totalDoneHours / totalCommitted) * 100) : 0;

    // By category
    const catMap: Record<string, { name: string; key: string; budget: number; done: number }> = {
      'ClientFocused': { name: 'Client Focused', key: 'client', budget: week.clientFocusedBudgetHours, done: 0 },
      'TechDebt': { name: 'Tech Debt', key: 'tech', budget: week.techDebtBudgetHours, done: 0 },
      'RAndD': { name: 'R&D', key: 'rnd', budget: week.rAndDBudgetHours, done: 0 }
    };
    for (const x of a) {
      const cat = catMap[x.backlogItemCategory];
      if (cat) { cat.done += x.hoursCompleted; }
    }
    this.categories = Object.values(catMap).map(c => ({
      ...c,
      percent: c.budget > 0 ? Math.round((c.done / c.budget) * 100) : 0
    }));

    // By member
    const memberMap = new Map<string, MemberProgress>();
    for (const x of a) {
      let m = memberMap.get(x.teamMemberId);
      if (!m) {
        m = { name: x.teamMemberName, committed: 0, done: 0, percent: 0, allDone: false, assignments: [], expanded: false };
        memberMap.set(x.teamMemberId, m);
      }
      m.committed += x.committedHours;
      m.done += x.hoursCompleted;
      m.assignments.push(x);
    }
    this.memberProgress = Array.from(memberMap.values()).map(m => ({
      ...m,
      percent: m.committed > 0 ? Math.round((m.done / m.committed) * 100) : 0,
      allDone: m.assignments.every(a => a.status === 'Done')
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

