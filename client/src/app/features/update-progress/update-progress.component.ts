import { Component, OnInit, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { WeeklyPlanService } from '../../core/services/weekly-plan.service';
import { PlanAssignmentService, PlanAssignment } from '../../core/services/plan-assignment.service';
import { NavigationService } from '../../core/services/navigation.service';
import { ToastService } from '../../core/services/toast.service';
import { WeeklyPlan } from '../../core/models/weekly-plan.model';
import { BacklogCategory, AssignmentStatus } from '../../core/enums/enums';

@Component({
  selector: 'app-update-progress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="progress-container" role="main" aria-label="Update My Progress">
      <button class="back-btn" (click)="nav.navigateTo('home')" aria-label="Go back to home">← Home</button>
      <h1 class="page-title">✏️ Update My Progress</h1>

      @if (loading) {
        <div class="loading" aria-busy="true" aria-label="Loading assignments">
          <div class="skeleton skeleton-line" style="width:45%; height:18px;"></div>
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card"></div>
        </div>
      }

      @if (!loading) {
        <!-- Personal Summary -->
        <div class="summary-bar" role="status" aria-label="Personal progress summary">
          <svg class="mini-ring" viewBox="0 0 56 56" aria-hidden="true">
            <circle class="ring-bg" cx="28" cy="28" r="22" />
            <circle class="ring-fill" cx="28" cy="28" r="22"
              [style.strokeDasharray]="2 * 3.14159 * 22"
              [style.strokeDashoffset]="2 * 3.14159 * 22 * (1 - (totalCommitted > 0 ? Math.min(totalDone / totalCommitted, 1) : 0))" />
            <text x="28" y="32" text-anchor="middle" class="ring-text">{{ totalCommitted > 0 ? Math.round(totalDone / totalCommitted * 100) : 0 }}%</text>
          </svg>
          <div class="summary-text">
            <div class="summary-main">
              <strong>{{ totalDone }}h</strong> of <strong>{{ totalCommitted }}h</strong> completed
            </div>
            <div class="summary-tasks">{{ doneCount }} of {{ myAssignments.length }} tasks done · {{ blockedCount }} blocked</div>
            @if (totalDone > totalCommitted) {
              <span class="over-warning">
                ⚠️ You've put in more hours than you planned. That's okay — this will be noted.
              </span>
            }
          </div>
          @if (myAssignments.length > 0) {
            <button class="btn-save-all" (click)="saveAll()" [disabled]="isSavingAll" aria-label="Save all progress">
              {{ isSavingAll ? 'Saving...' : '💾 Save All' }}
            </button>
          }
        </div>

        <!-- Task Cards -->
        @if (myAssignments.length === 0) {
          <div class="empty-state-styled">
            <span class="empty-icon">✅</span>
            <div class="empty-title">No tasks this week</div>
            <div class="empty-subtitle">You haven't been assigned any work for this weekly plan.</div>
          </div>
        }

        @for (a of myAssignments; track a.id) {
          <div class="task-card"
               [class.card-done]="progressData[a.id]?.status === 'Done'"
               [class.card-blocked]="progressData[a.id]?.status === 'Blocked'"
               [class.card-inprogress]="progressData[a.id]?.status === 'InProgress'"
               [style.animationDelay]="(0.06 * $index) + 's'"
               style="animation: staggerFadeIn 0.3s ease-out both;"
               role="article"
               [attr.aria-label]="'Task: ' + a.backlogItemTitle">
            <div class="task-top-row">
              <div class="task-header">
                <span class="cat-badge" [class]="getCatClass(a.backlogItemCategory)">{{ getCategoryLabel(a.backlogItemCategory) }}</span>
                <span class="task-title">{{ a.backlogItemTitle }}</span>
              </div>
              <div class="task-status-indicator">
                <span class="status-dot" [class]="'dot-' + (progressData[a.id]?.status || 'NotStarted').toLowerCase()"></span>
                <span class="status-label" [class]="'slabel-' + (progressData[a.id]?.status || 'NotStarted').toLowerCase()">{{ getStatusLabel(progressData[a.id]?.status) }}</span>
              </div>
            </div>

            <div class="task-progress-row">
              <span class="committed-text">{{ progressData[a.id]?.hoursCompleted || 0 }}h / {{ a.committedHours }}h</span>
              <div class="task-bar-track">
                <div class="task-bar-fill" [class]="getBarClass(a)"
                     [style.width.%]="a.committedHours > 0 ? Math.min((progressData[a.id]?.hoursCompleted || 0) / a.committedHours * 100, 100) : 0"></div>
              </div>
            </div>

            <div class="task-controls">
              <div class="control-group">
                <label [for]="'hours-' + a.id">Hours done</label>
                <input [id]="'hours-' + a.id" type="number" [(ngModel)]="progressData[a.id].hoursCompleted"
                       min="0" step="0.5" class="input-hours"
                       [attr.aria-label]="'Hours completed for ' + a.backlogItemTitle" />
              </div>
              <div class="control-group">
                <label [for]="'status-' + a.id">Status</label>
                <select [id]="'status-' + a.id" [(ngModel)]="progressData[a.id].status" class="input-status"
                        [attr.aria-label]="'Status for ' + a.backlogItemTitle">
                  <option value="NotStarted">Not Started</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Done">Done</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
              <button class="btn-update" (click)="updateTask(a)" [disabled]="saving[a.id]"
                      [attr.aria-label]="'Update progress for ' + a.backlogItemTitle"
                      [id]="'update-btn-' + a.id">
                {{ saving[a.id] ? 'Saving...' : 'Update' }}
              </button>
            </div>
            @if (progressData[a.id].hoursCompleted > a.committedHours) {
              <div class="hours-warning" role="alert">⚠ Hours done exceeds committed hours.</div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .progress-container { max-width: 960px; margin: 20px auto; padding: 0 24px; font-family: 'Inter', sans-serif; }
    .page-title { font-size: 28px; font-weight: 700; color: var(--text-heading); margin: 0 0 20px; }

    /* Summary Bar */
    .summary-bar {
      display: flex; align-items: center; gap: 16px;
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      padding: 18px 22px; color: var(--text-secondary); font-size: 15px; margin-bottom: 24px;
      box-shadow: var(--shadow-sm);
    }
    .mini-ring { width: 56px; height: 56px; flex-shrink: 0; }
    .mini-ring .ring-bg { fill: none; stroke: var(--bg-card-hover); stroke-width: 5; }
    .mini-ring .ring-fill {
      fill: none; stroke: var(--color-primary); stroke-width: 5; stroke-linecap: round;
      transform: rotate(-90deg); transform-origin: 50% 50%;
      transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .mini-ring .ring-text { fill: var(--text-heading); font-size: 14px; font-weight: 800; font-family: 'Inter', sans-serif; }
    .summary-text { flex: 1; }
    .summary-main { font-size: 16px; color: var(--text-primary); font-weight: 600; margin-bottom: 2px; }
    .summary-main strong { color: var(--text-heading); }
    .summary-tasks { font-size: 13px; color: var(--text-muted); font-weight: 500; }
    .over-warning {
      display: block; margin-top: 6px; color: var(--color-warning); font-size: 13px; font-weight: 500;
    }
    .btn-save-all {
      padding: 10px 20px; background: var(--color-success); color: #fff; border: none;
      border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer;
      font-family: inherit; transition: all 0.2s; white-space: nowrap; flex-shrink: 0;
    }
    .btn-save-all:hover:not(:disabled) { background: var(--color-success-dark); transform: translateY(-1px); }
    .btn-save-all:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Task Cards */
    .task-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 14px;
      padding: 20px 22px; margin-bottom: 14px; transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
      box-shadow: var(--shadow-sm); border-left: 4px solid transparent;
    }
    .task-card:hover { border-color: var(--border-hover); box-shadow: var(--shadow-md); transform: translateY(-1px); }
    .card-done { border-left-color: var(--color-success); }
    .card-blocked { border-left-color: var(--color-danger); }
    .card-inprogress { border-left-color: var(--color-primary); }

    .task-top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; gap: 12px; }
    .task-header { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
    .task-title { font-size: 16px; font-weight: 700; color: var(--text-heading); }

    .task-status-indicator { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .dot-notstarted { background: var(--text-muted); }
    .dot-inprogress { background: var(--color-primary); }
    .dot-done { background: var(--color-success); }
    .dot-blocked { background: var(--color-danger); }
    .status-label { font-size: 13px; font-weight: 600; white-space: nowrap; }
    .slabel-notstarted { color: var(--text-muted); }
    .slabel-inprogress { color: var(--color-primary); }
    .slabel-done { color: var(--color-success); }
    .slabel-blocked { color: var(--color-danger); }

    /* Per-task progress bar */
    .task-progress-row { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .committed-text { font-size: 13px; color: var(--text-secondary); font-weight: 600; white-space: nowrap; min-width: 90px; }
    .task-bar-track {
      flex: 1; height: 6px; background: var(--bg-card-hover); border-radius: 3px; overflow: hidden;
    }
    .task-bar-fill {
      height: 100%; border-radius: 3px; transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .bar-default { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .bar-done { background: linear-gradient(90deg, #22c55e, #4ade80); }
    .bar-blocked { background: linear-gradient(90deg, #ef4444, #f87171); }
    .bar-over { background: linear-gradient(90deg, #f59e0b, #fbbf24); }

    /* Controls */
    .task-controls {
      display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap;
    }
    .control-group { display: flex; flex-direction: column; gap: 5px; }
    .control-group label { font-size: 12px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
    .input-hours {
      width: 100px; padding: 10px 14px; border: 2px solid var(--border-color); border-radius: 10px;
      background: var(--bg-input); color: var(--text-primary); font-size: 15px; font-family: inherit;
      transition: all 0.2s;
    }
    .input-hours:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }
    .input-status {
      padding: 10px 14px; border: 2px solid var(--border-color); border-radius: 10px;
      background: var(--bg-input); color: var(--text-primary); font-size: 14px; font-family: inherit;
      min-width: 150px; transition: all 0.2s;
    }
    .input-status:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); }

    .btn-update {
      padding: 10px 22px; background: var(--color-primary); color: #fff; border: none;
      border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer;
      font-family: inherit; transition: all 0.2s; align-self: flex-end;
      box-shadow: var(--shadow-sm);
    }
    .btn-update:hover:not(:disabled) { background: var(--color-primary-hover); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
    .btn-update:disabled { opacity: 0.5; cursor: not-allowed; }

    .hours-warning { margin-top: 10px; padding: 8px 14px; font-size: 13px; color: var(--color-warning); background: rgba(245,158,11,0.08); border-radius: 8px; border: 1px solid rgba(245,158,11,0.2); font-weight: 500; }

    .cat-badge {
      display: inline-block; padding: 4px 12px; border-radius: 20px;
      font-size: 11px; font-weight: 700; white-space: nowrap;
    }
    .cat-client { background: var(--color-primary); color: #fff; }
    .cat-tech { background: var(--color-danger); color: #fff; }
    .cat-rnd { background: var(--color-success); color: #fff; }

    .loading { max-width: 600px; margin: 40px auto; padding: 0 24px; }
  `]
})
export class UpdateProgressComponent implements OnInit {
  Math = Math;
  loading = true;
  currentPlan: WeeklyPlan | null = null;
  myAssignments: PlanAssignment[] = [];
  progressData: { [id: string]: { hoursCompleted: number; status: string } } = {};
  saving: { [id: string]: boolean } = {};
  isSavingAll = false;

  constructor(
    private authService: AuthService,
    private weeklyPlanService: WeeklyPlanService,
    private planAssignmentService: PlanAssignmentService,
    public nav: NavigationService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  get totalCommitted(): number {
    return this.myAssignments.reduce((s, a) => s + a.committedHours, 0);
  }

  get totalDone(): number {
    return this.myAssignments.reduce((s, a) => s + (this.progressData[a.id]?.hoursCompleted || 0), 0);
  }

  get doneCount(): number {
    return this.myAssignments.filter(a => this.progressData[a.id]?.status === 'Done').length;
  }

  get blockedCount(): number {
    return this.myAssignments.filter(a => this.progressData[a.id]?.status === 'Blocked').length;
  }

  getStatusLabel(status: string | undefined): string {
    switch (status) {
      case 'NotStarted': return 'Not Started';
      case 'InProgress': return 'In Progress';
      case 'Done': return 'Done';
      case 'Blocked': return 'Blocked';
      default: return 'Not Started';
    }
  }

  getBarClass(a: PlanAssignment): string {
    const data = this.progressData[a.id];
    if (!data) return 'bar-default';
    if (data.hoursCompleted > a.committedHours) return 'bar-over';
    if (data.status === 'Done') return 'bar-done';
    if (data.status === 'Blocked') return 'bar-blocked';
    return 'bar-default';
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

  saveAll(): void {
    if (this.isSavingAll) return;
    this.isSavingAll = true;
    let completed = 0;
    let errors = 0;
    const total = this.myAssignments.length;

    for (const a of this.myAssignments) {
      const data = this.progressData[a.id];
      if (!data) { completed++; continue; }
      this.saving[a.id] = true;
      this.planAssignmentService.updateProgress(a.id, {
        hoursCompleted: data.hoursCompleted,
        status: data.status
      }).subscribe({
        next: (updated) => {
          const idx = this.myAssignments.findIndex(x => x.id === a.id);
          if (idx >= 0) this.myAssignments[idx] = updated;
          this.saving[a.id] = false;
          completed++;
          if (completed === total) {
            this.isSavingAll = false;
            if (errors === 0) this.toast.success('All progress saved!');
            else this.toast.error(`${errors} task(s) failed to save.`);
          }
        },
        error: () => {
          this.saving[a.id] = false;
          errors++;
          completed++;
          if (completed === total) {
            this.isSavingAll = false;
            this.toast.error(`${errors} task(s) failed to save.`);
          }
        }
      });
    }
  }

  updateTask(a: PlanAssignment): void {
    const data = this.progressData[a.id];
    if (!data) return;

    this.saving[a.id] = true;
    this.planAssignmentService.updateProgress(a.id, {
      hoursCompleted: data.hoursCompleted,
      status: data.status
    }).subscribe({
      next: (updated) => {
        // Update the local assignment data
        const idx = this.myAssignments.findIndex(x => x.id === a.id);
        if (idx >= 0) {
          this.myAssignments[idx] = updated;
        }
        this.saving[a.id] = false;
        this.toast.success('Progress updated!');
      },
      error: (err) => {
        this.saving[a.id] = false;
        this.toast.error(err.error || 'Failed to update progress.');
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
        const user = this.authService.getCurrentUser();
        if (!user) {
          this.loading = false;
          return;
        }

        this.planAssignmentService.getByWeekAndMember(plan.id, user.id).subscribe({
          next: (assignments) => {
            this.myAssignments = assignments;
            // Initialize progress data from current values
            for (const a of assignments) {
              this.progressData[a.id] = {
                hoursCompleted: a.hoursCompleted,
                status: a.status
              };
              this.saving[a.id] = false;
            }
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }
}
