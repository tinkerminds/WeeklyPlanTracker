import { Component, OnInit, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { WeeklyPlanService } from '../../core/services/weekly-plan.service';
import { PlanAssignmentService, PlanAssignment } from '../../core/services/plan-assignment.service';
import { NavigationService } from '../../core/services/navigation.service';
import { ToastService } from '../../core/services/toast.service';
import { WeeklyPlan } from '../../core/models/weekly-plan.model';
import { BacklogCategory } from '../../core/enums/enums';

@Component({
  selector: 'app-plan-my-work',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="plan-container">
      <button class="btn-back" (click)="nav.navigateTo('home')">← Home</button>
      <h1 class="page-title">Plan My Work</h1>

      @if (loading) {
        <div class="loading">
          <div class="skeleton skeleton-line" style="width:45%; height:18px;"></div>
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card"></div>
        </div>
      }

      @if (!loading && currentPlan) {
        <!-- Personal hours summary -->
        <div class="hours-bar">
          Your hours: <strong>{{ totalCommitted }}</strong> of 30 planned.
          <strong>{{ Math.max(0, 30 - totalCommitted) }}</strong> hours left.
          @if (isReady) {
            <span class="ready-badge">✓ You marked yourself as ready</span>
          }
        </div>

        <!-- Category budget cards -->
        <div class="category-grid">
          <div class="cat-card">
            <span class="cat-badge cat-client">Client Focused</span>
            <div class="cat-stat">Budget: {{ currentPlan.clientFocusedBudgetHours }}h</div>
            <div class="cat-stat">Claimed: {{ clientClaimed }}h</div>
            <div class="cat-stat">Left: {{ currentPlan.clientFocusedBudgetHours - clientClaimed }}h</div>
            <div class="cat-progress-track">
              <div class="cat-progress-fill cat-fill-client"
                   [style.width.%]="catPercent(clientClaimed, currentPlan.clientFocusedBudgetHours)"></div>
            </div>
          </div>
          <div class="cat-card">
            <span class="cat-badge cat-tech">Tech Debt</span>
            <div class="cat-stat">Budget: {{ currentPlan.techDebtBudgetHours }}h</div>
            <div class="cat-stat">Claimed: {{ techDebtClaimed }}h</div>
            <div class="cat-stat">Left: {{ currentPlan.techDebtBudgetHours - techDebtClaimed }}h</div>
            <div class="cat-progress-track">
              <div class="cat-progress-fill cat-fill-tech"
                   [style.width.%]="catPercent(techDebtClaimed, currentPlan.techDebtBudgetHours)"></div>
            </div>
          </div>
          <div class="cat-card">
            <span class="cat-badge cat-rnd">R&D</span>
            <div class="cat-stat">Budget: {{ currentPlan.rAndDBudgetHours }}h</div>
            <div class="cat-stat">Claimed: {{ rndClaimed }}h</div>
            <div class="cat-stat">Left: {{ currentPlan.rAndDBudgetHours - rndClaimed }}h</div>
            <div class="cat-progress-track">
              <div class="cat-progress-fill cat-fill-rnd"
                   [style.width.%]="catPercent(rndClaimed, currentPlan.rAndDBudgetHours)"></div>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="action-row">
          <button class="btn-add-work" (click)="nav.navigateTo('backlog-picker')">Add Work from Backlog</button>
          <button class="btn-done" (click)="toggleReady()">{{ readyBtnText }}</button>
        </div>

        <!-- My Plan -->
        <section class="my-plan">
          <h2>My Plan</h2>
          @if (myAssignments.length === 0) {
            <div class="empty-state-styled">
              <span class="empty-icon">📥</span>
              <div class="empty-title">No work planned yet</div>
              <div class="empty-subtitle">Click "Add Work from Backlog" to start picking tasks.</div>
            </div>
          }
          @for (a of myAssignments; track a.id) {
            <div class="plan-card" [style.animationDelay]="(0.05 * $index) + 's'" style="animation: staggerFadeIn 0.3s ease-out both;">
              <div class="plan-info">
                <span class="cat-badge" [class]="getCatClass(a.backlogItemCategory)">
                  {{ getCategoryLabel(a.backlogItemCategory) }}
                </span>
                <span class="plan-title">{{ a.backlogItemTitle }}</span>
              </div>
              <div class="plan-right">
                <span class="committed-text">{{ a.committedHours }}h committed</span>
                <button class="btn-remove" (click)="removeAssignment(a)">Remove</button>
              </div>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .plan-container { max-width: 960px; margin: 20px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
    .btn-back {
      display: inline-block; background: var(--bg-card-hover); color: var(--text-secondary); border: none;
      padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; margin-bottom: 12px;
    }
    .btn-back:hover { background: var(--border-hover); color: var(--text-primary); }
    .page-title { font-size: 24px; color: var(--text-primary); margin: 0 0 16px; }
    .hours-bar {
      background: var(--bg-secondary); border: 1px solid var(--bg-card-hover); border-radius: 10px;
      padding: 14px 20px; color: var(--text-secondary); font-size: 15px; margin-bottom: 16px;
    }
    .hours-bar strong { color: var(--text-primary); }
    .ready-badge {
      display: inline-block; padding: 4px 12px; background: var(--color-success); color: #fff;
      border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 12px;
    }
    .category-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
    .cat-card { background: var(--bg-secondary); border: 1px solid var(--bg-card-hover); border-radius: 10px; padding: 14px 16px; }
    .cat-badge {
      display: inline-block; padding: 3px 10px; border-radius: 6px;
      font-size: 12px; font-weight: 700; margin-bottom: 10px;
    }
    .cat-client { background: var(--color-primary); color: #fff; }
    .cat-tech { background: var(--color-warning); color: #fff; }
    .cat-rnd { background: var(--color-success); color: #fff; }
    .cat-stat { font-size: 13px; color: var(--text-secondary); margin-bottom: 2px; }
    .cat-progress-track { height: 6px; background: var(--bg-card-hover); border-radius: 3px; margin-top: 8px; overflow: hidden; }
    .cat-progress-fill { height: 100%; border-radius: 3px; transition: width 0.3s ease; }
    .cat-fill-client { background: var(--color-primary); }
    .cat-fill-tech { background: var(--color-warning); }
    .cat-fill-rnd { background: var(--color-success); }
    .action-row { display: flex; gap: 12px; margin-bottom: 24px; }
    .btn-add-work {
      padding: 10px 20px; background: var(--color-primary); color: #fff; border: none;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: all 0.2s;
    }
    .btn-add-work:hover { background: var(--color-primary-hover); }
    .btn-done {
      padding: 10px 20px; background: var(--border-hover); color: var(--text-primary); border: none;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: all 0.2s;
    }
    .btn-done:hover { background: var(--text-muted); }
    .my-plan h2 { font-size: 18px; color: var(--text-primary); margin-bottom: 12px; }
    .empty-plan {
      padding: 20px; background: var(--bg-secondary); border: 1px solid var(--bg-card-hover);
      border-radius: 10px; color: var(--text-secondary); font-size: 14px;
    }
    .plan-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; background: var(--bg-secondary); border: 1px solid var(--bg-card-hover);
      border-radius: 12px; margin-bottom: 8px; transition: all 0.25s;
    }
    .plan-card:hover { border-color: var(--border-hover); box-shadow: 0 4px 16px rgba(0,0,0,0.08); transform: translateY(-1px); }
    .plan-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
    .plan-title {
      font-size: 14px; font-weight: 600; color: var(--text-primary);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .plan-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
    .committed-text { font-size: 13px; color: var(--text-secondary); white-space: nowrap; }
    .btn-remove {
      background: transparent; color: var(--color-danger); border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;
      cursor: pointer; font-family: inherit; transition: all 0.2s;
    }
    .btn-remove:hover { background: rgba(239, 68, 68, 0.1); border-color: var(--color-danger); }
    .loading {
      max-width: 600px; margin: 40px auto; padding: 0 24px;
    }
  `]
})
export class PlanMyWorkComponent implements OnInit {
  Math = Math;
  loading = true;
  currentPlan: WeeklyPlan | null = null;
  myAssignments: PlanAssignment[] = [];
  allAssignments: PlanAssignment[] = [];
  isReady = false;
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

  get readyBtnText(): string {
    return this.isReady ? 'Undo \u2014 I\u2019m Not Done Yet' : 'I\u2019m Done Planning';
  }

  toggleReady(): void {
    if (!this.currentPlan) return;
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.weeklyPlanService.togglePlanningDone(this.currentPlan.id, user.id).subscribe({
      next: (res) => {
        this.isReady = res.isPlanningDone;
        if (this.isReady) {
          this.toast.success('You marked yourself as ready!');
        } else {
          this.toast.success('Unmarked \u2014 you can keep editing your plan.');
        }
      },
      error: (err) => {
        this.toast.error(err.error || 'Failed to update status.');
      }
    });
  }

  get totalCommitted(): number {
    return this.myAssignments.reduce((sum, a) => sum + a.committedHours, 0);
  }

  get clientClaimed(): number {
    return this.allAssignments
      .filter(a => a.backlogItemCategory === BacklogCategory.ClientFocused)
      .reduce((sum, a) => sum + a.committedHours, 0);
  }

  get techDebtClaimed(): number {
    return this.allAssignments
      .filter(a => a.backlogItemCategory === BacklogCategory.TechDebt)
      .reduce((sum, a) => sum + a.committedHours, 0);
  }

  get rndClaimed(): number {
    return this.allAssignments
      .filter(a => a.backlogItemCategory === BacklogCategory.RAndD)
      .reduce((sum, a) => sum + a.committedHours, 0);
  }

  catPercent(claimed: number, budget: number): number {
    if (budget === 0) return 0;
    return Math.min((claimed / budget) * 100, 100);
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

  removeAssignment(a: PlanAssignment): void {
    this.planAssignmentService.delete(a.id).subscribe({
      next: () => {
        this.myAssignments = this.myAssignments.filter(x => x.id !== a.id);
        this.allAssignments = this.allAssignments.filter(x => x.id !== a.id);
        this.toast.success(`Removed "${a.backlogItemTitle}"`);
      },
      error: (err) => {
        this.toast.error(err.error || 'Failed to remove.');
      }
    });
  }

  private loadData(): void {
    this.loading = true;
    this.weeklyPlanService.getCurrent().subscribe({
      next: (plan) => {
        if (!plan) {
          this.loading = false;
          this.toast.error('No active weekly plan found.');
          this.nav.navigateTo('home');
          return;
        }
        this.currentPlan = plan;

        // Read isReady from plan.members (returned in the detailed response)
        const user = this.authService.getCurrentUser();
        if (user && plan.members) {
          const me = plan.members.find(m => m.id === user.id);
          if (me) {
            this.isReady = me.isPlanningDone;
          }
        }

        this.planAssignmentService.getByWeek(plan.id).subscribe({
          next: (all) => {
            this.allAssignments = all;
            if (user) {
              this.myAssignments = all.filter(a => a.teamMemberId === user.id);
            }
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => {
        this.loading = false;
        this.toast.error('Failed to load plan.');
      }
    });
  }
}
