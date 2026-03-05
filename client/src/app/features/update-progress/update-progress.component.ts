import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
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
    <div class="progress-container">
      <button class="btn-back" (click)="nav.navigateTo('home')">\u2190 Home</button>
      <h1 class="page-title">Update My Progress</h1>

      @if (loading) {
        <div class="loading"><div class="spinner"></div><p>Loading...</p></div>
      }

      @if (!loading) {
        <!-- Personal Summary -->
        <div class="summary-bar">
          Committed: <strong>{{ totalCommitted }}h</strong>.
          Currently: <strong>{{ totalDone }}h</strong> done.
          @if (totalDone > totalCommitted) {
            <span class="over-warning">
              You\u2019ve put in more hours than you planned. That\u2019s okay \u2014 this will be noted.
            </span>
          }
        </div>

        <!-- Task Cards -->
        @if (myAssignments.length === 0) {
          <div class="empty-state">No tasks assigned to you this week.</div>
        }

        @for (a of myAssignments; track a.id) {
          <div class="task-card">
            <div class="task-header">
              <span class="cat-badge" [class]="getCatClass(a.backlogItemCategory)">{{ getCategoryLabel(a.backlogItemCategory) }}</span>
              <span class="task-title">{{ a.backlogItemTitle }}</span>
            </div>
            <div class="task-details">
              <span class="committed-text">Committed: {{ a.committedHours }}h</span>
            </div>
            <div class="task-controls">
              <div class="control-group">
                <label>Hours done</label>
                <input type="number" [(ngModel)]="progressData[a.id].hoursCompleted"
                       min="0" step="0.5" class="input-hours" />
              </div>
              <div class="control-group">
                <label>Status</label>
                <select [(ngModel)]="progressData[a.id].status" class="input-status">
                  <option value="NotStarted">Not Started</option>
                  <option value="InProgress">In Progress</option>
                  <option value="Done">Done</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
              <button class="btn-update" (click)="updateTask(a)" [disabled]="saving[a.id]">
                {{ saving[a.id] ? 'Saving...' : 'Update' }}
              </button>
            </div>
            @if (progressData[a.id].hoursCompleted > a.committedHours) {
              <div class="hours-warning">\u26A0 Hours done exceeds committed hours.</div>
            }
          </div>
        }
      }
    </div>
  `,
    styles: [`
    .progress-container { max-width: 900px; margin: 20px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
    .btn-back {
      display: inline-block; background: #334155; color: #94a3b8; border: none;
      padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; margin-bottom: 12px;
    }
    .btn-back:hover { background: #475569; color: #e2e8f0; }
    .page-title { font-size: 24px; color: #e2e8f0; margin: 0 0 16px; }

    .summary-bar {
      background: #1e293b; border: 1px solid #334155; border-radius: 10px;
      padding: 14px 20px; color: #94a3b8; font-size: 15px; margin-bottom: 20px;
    }
    .summary-bar strong { color: #e2e8f0; }
    .over-warning {
      display: block; margin-top: 6px; color: #f97316; font-size: 13px; font-style: italic;
    }

    .empty-state {
      text-align: center; padding: 40px; color: #64748b;
      background: #1e293b; border-radius: 10px; border: 2px dashed #334155;
    }

    .task-card {
      background: #1e293b; border: 1px solid #334155; border-radius: 10px;
      padding: 18px 20px; margin-bottom: 12px; transition: border-color 0.2s;
    }
    .task-card:hover { border-color: #475569; }
    .task-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .task-title { font-size: 15px; font-weight: 600; color: #e2e8f0; }
    .task-details { margin-bottom: 12px; }
    .committed-text { font-size: 13px; color: #94a3b8; }

    .task-controls {
      display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap;
    }
    .control-group { display: flex; flex-direction: column; gap: 4px; }
    .control-group label { font-size: 12px; color: #64748b; font-weight: 600; }
    .input-hours {
      width: 100px; padding: 8px 12px; border: 1px solid #475569; border-radius: 8px;
      background: #0f172a; color: #e2e8f0; font-size: 14px; font-family: inherit;
    }
    .input-hours:focus { outline: none; border-color: #3b82f6; }
    .input-status {
      padding: 8px 12px; border: 1px solid #475569; border-radius: 8px;
      background: #0f172a; color: #e2e8f0; font-size: 14px; font-family: inherit;
      min-width: 140px;
    }
    .input-status:focus { outline: none; border-color: #3b82f6; }

    .btn-update {
      padding: 8px 20px; background: #3b82f6; color: #fff; border: none;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: all 0.2s; align-self: flex-end;
    }
    .btn-update:hover:not(:disabled) { background: #2563eb; }
    .btn-update:disabled { opacity: 0.5; cursor: not-allowed; }

    .hours-warning { margin-top: 8px; font-size: 12px; color: #f97316; }

    .cat-badge {
      display: inline-block; padding: 3px 10px; border-radius: 6px;
      font-size: 12px; font-weight: 700; white-space: nowrap;
    }
    .cat-client { background: #3b82f6; color: #fff; }
    .cat-tech { background: #f97316; color: #fff; }
    .cat-rnd { background: #22c55e; color: #fff; }

    .loading {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 30vh; gap: 16px; color: #94a3b8;
    }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #334155; border-top-color: #3b82f6;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class UpdateProgressComponent implements OnInit {
    loading = true;
    currentPlan: WeeklyPlan | null = null;
    myAssignments: PlanAssignment[] = [];
    progressData: { [id: string]: { hoursCompleted: number; status: string } } = {};
    saving: { [id: string]: boolean } = {};

    private cdr = inject(ChangeDetectorRef);

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
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.saving[a.id] = false;
                this.toast.error(err.error || 'Failed to update progress.');
                this.cdr.detectChanges();
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
                        this.cdr.detectChanges();
                    },
                    error: () => { this.loading = false; this.cdr.detectChanges(); }
                });
            },
            error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
    }
}
