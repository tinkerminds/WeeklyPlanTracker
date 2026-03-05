import { Component, OnInit, OnDestroy, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';
import { WeeklyPlanService } from '../../core/services/weekly-plan.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { TeamMember } from '../../core/models/team-member.model';
import { MemberRole } from '../../core/enums/enums';

interface MenuCard {
  icon: string;
  title: string;
  subtitle: string;
  screen: string;
  danger?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <!-- Greeting -->
      <div class="greeting-section">
        <h1>{{ getGreeting() }}, {{ user?.name }}!</h1>
        <span class="role-tag" [class.role-lead]="isLead" [class.role-member]="!isLead">
          {{ isLead ? '👑 Team Lead' : '👤 Team Member' }}
        </span>
      </div>

      <!-- Status Message -->
      <div class="status-bar">
        <span class="status-dot"></span>
        <span>{{ statusMessage }}</span>
      </div>

      <!-- Menu Cards -->
      <div class="card-grid">
        @for (card of menuCards; track card.title) {
          <button class="menu-card" [class.card-danger]="card.danger" (click)="onCardClick(card)">
            <span class="card-icon">{{ card.icon }}</span>
            <div class="card-text">
              <span class="card-title">{{ card.title }}</span>
              <span class="card-subtitle">{{ card.subtitle }}</span>
            </div>
            <span class="card-arrow">›</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 640px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: 'Inter', sans-serif;
    }
    .greeting-section {
      margin-bottom: 24px;
    }
    .greeting-section h1 {
      font-size: 24px;
      color: var(--text-primary);
      margin-bottom: 6px;
    }
    .role-tag {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    .role-lead {
      background: rgba(245, 158, 11, 0.2);
      color: var(--color-warning);
    }
    .role-member {
      background: rgba(59, 130, 246, 0.2);
      color: var(--color-primary);
    }
    .status-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 10px;
      color: var(--text-info);
      font-size: 14px;
      margin-bottom: 28px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-primary);
      flex-shrink: 0;
    }
    .card-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .menu-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      width: 100%;
      padding: 18px 20px;
      background: var(--bg-secondary);
      border: 1px solid var(--bg-card-hover);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      text-align: left;
      color: var(--text-primary);
    }
    .menu-card:hover {
      border-color: var(--border-hover);
      background: var(--bg-card-active);
    }
    .card-danger {
      border-color: rgba(239, 68, 68, 0.3);
    }
    .card-danger:hover {
      border-color: var(--color-danger);
      background: rgba(239, 68, 68, 0.1);
    }
    .card-danger .card-title {
      color: var(--color-danger);
    }
    .card-icon {
      font-size: 22px;
      flex-shrink: 0;
    }
    .card-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .card-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
    }
    .card-arrow {
      font-size: 22px;
      color: var(--border-hover);
      flex-shrink: 0;
      display: none;
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  user: TeamMember | null = null;
  isLead = false;
  menuCards: MenuCard[] = [];
  statusMessage = '';
  hasActivePlan = false;
  private sub!: Subscription;
  constructor(
    private authService: AuthService,
    public nav: NavigationService,
    private weeklyPlanService: WeeklyPlanService,
    private toast: ToastService,
    private confirmService: ConfirmService
  ) { }

  ngOnInit(): void {
    this.sub = this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.isLead = user?.role === MemberRole.Lead;
      this.checkActivePlan();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  onCardClick(card: MenuCard): void {
    if (card.screen === 'cancel-week') {
      this.cancelWeek();
    } else if (card.screen === 'finish-week') {
      this.finishWeek();
    } else {
      this.nav.navigateTo(card.screen as any);
    }
  }

  private planState: string = '';
  private currentPlanId: string = '';

  private checkActivePlan(): void {
    this.weeklyPlanService.getCurrent().subscribe({
      next: (plan) => {
        this.hasActivePlan = !!plan;
        this.planState = plan?.state || '';
        this.currentPlanId = plan?.id || '';
        this.buildMenu();
      },
      error: () => {
        this.hasActivePlan = false;
        this.planState = '';
        this.buildMenu();
      }
    });
  }

  private buildMenu(): void {
    if (this.isLead) {
      if (this.hasActivePlan && this.planState === 'Frozen') {
        // Lead — Frozen state
        this.statusMessage = "Plan is frozen — the team is now tracking progress.";
        this.menuCards = [
          { icon: '📊', title: 'See Team Progress', subtitle: 'Check how the team is doing.', screen: 'team-progress' },
          { icon: '✏️', title: 'Update My Progress', subtitle: 'Report hours and status on your tasks.', screen: 'update-progress' },
          { icon: '✅', title: 'Finish This Week', subtitle: 'Close out this cycle.', screen: 'finish-week' },
          { icon: '📋', title: 'Manage Backlog', subtitle: 'Add, edit, or browse work items.', screen: 'manage-backlog' },
          { icon: '👥', title: 'Manage Team Members', subtitle: 'Add or remove team members.', screen: 'manage-team' },
          { icon: '📅', title: 'View Past Weeks', subtitle: 'Look at completed planning cycles.', screen: 'past-weeks' },
        ];
      } else if (this.hasActivePlan && this.planState === 'Setup') {
        // Lead — Setup state
        this.statusMessage = "Week setup in progress — configure the plan and open planning.";
        this.menuCards = [
          { icon: '⚙️', title: 'Set Up This Week\'s Plan', subtitle: 'Configure members, date, and percentages.', screen: 'start-week' },
          { icon: '📋', title: 'Manage Backlog', subtitle: 'Add, edit, or browse work items.', screen: 'manage-backlog' },
          { icon: '👥', title: 'Manage Team Members', subtitle: 'Add or remove team members.', screen: 'manage-team' },
          { icon: '📅', title: 'View Past Weeks', subtitle: 'Look at completed planning cycles.', screen: 'past-weeks' },
          { icon: '🗑️', title: "Cancel This Week's Planning", subtitle: 'Erase all plans and start over.', screen: 'cancel-week', danger: true },
        ];
      } else if (this.hasActivePlan) {
        // Lead — PlanningOpen state
        this.statusMessage = "Planning is open — team members can pick their work items.";
        this.menuCards = [
          { icon: '❄️', title: 'Review and Freeze the Plan', subtitle: "Check everyone's hours and lock the plan.", screen: 'review-freeze' },
          { icon: '📝', title: 'Plan My Work', subtitle: 'Pick backlog items and commit hours.', screen: 'plan-my-work' },
          { icon: '📋', title: 'Manage Backlog', subtitle: 'Add, edit, or browse work items.', screen: 'manage-backlog' },
          { icon: '👥', title: 'Manage Team Members', subtitle: 'Add or remove team members.', screen: 'manage-team' },
          { icon: '📅', title: 'View Past Weeks', subtitle: 'Look at completed planning cycles.', screen: 'past-weeks' },
          { icon: '🗑️', title: "Cancel This Week's Planning", subtitle: 'Erase all plans and start over.', screen: 'cancel-week', danger: true },
        ];
      } else {
        // Lead — No active week
        this.statusMessage = "No active plan. Click 'Start a New Week' to begin!";
        this.menuCards = [
          { icon: '🚀', title: 'Start a New Week', subtitle: 'Set up a new planning cycle.', screen: 'start-week' },
          { icon: '📋', title: 'Manage Backlog', subtitle: 'Add, edit, or browse work items.', screen: 'manage-backlog' },
          { icon: '👥', title: 'Manage Team Members', subtitle: 'Add or remove team members.', screen: 'manage-team' },
          { icon: '📅', title: 'View Past Weeks', subtitle: 'Look at completed planning cycles.', screen: 'past-weeks' },
        ];
      }
    } else {
      if (this.hasActivePlan && this.planState === 'Frozen') {
        // Member — Frozen state
        this.statusMessage = "Plan is frozen — report your progress on assigned tasks.";
        this.menuCards = [
          { icon: '✏️', title: 'Update My Progress', subtitle: 'Report hours and status on your tasks.', screen: 'update-progress' },
          { icon: '📊', title: 'See Team Progress', subtitle: 'See how the team is doing overall.', screen: 'team-progress' },
          { icon: '📋', title: 'Manage Backlog', subtitle: 'Add, edit, or browse work items.', screen: 'manage-backlog' },
          { icon: '📅', title: 'View Past Weeks', subtitle: 'Look at completed planning cycles.', screen: 'past-weeks' },
        ];
      } else if (this.hasActivePlan) {
        // Member — PlanningOpen state
        this.statusMessage = "Planning is open — pick your backlog items and commit your 30 hours.";
        this.menuCards = [
          { icon: '📝', title: 'Plan My Work', subtitle: 'Pick backlog items and commit your 30 hours.', screen: 'plan-my-work' },
          { icon: '📋', title: 'Manage Backlog', subtitle: 'Add, edit, or browse work items.', screen: 'manage-backlog' },
          { icon: '📅', title: 'View Past Weeks', subtitle: 'Look at completed planning cycles.', screen: 'past-weeks' },
        ];
      } else {
        // Member — No active week
        this.statusMessage = "No active plan right now. Check back when your Team Lead starts a new week.";
        this.menuCards = [
          { icon: '📋', title: 'Manage Backlog', subtitle: 'Add, edit, or browse work items.', screen: 'manage-backlog' },
          { icon: '📅', title: 'View Past Weeks', subtitle: 'Look at completed planning cycles.', screen: 'past-weeks' },
        ];
      }
    }
  }

  private async cancelWeek(): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: '🗑️ Cancel Planning',
      message: 'Are you sure you want to cancel this week\'s planning? This will erase all plans and cannot be undone.',
      confirmText: 'Yes, Cancel Planning',
      cancelText: 'Keep Planning',
      danger: true
    });
    if (!ok) return;

    this.weeklyPlanService.getCurrent().subscribe({
      next: (plan) => {
        if (!plan) return;
        this.weeklyPlanService.cancel(plan.id).subscribe({
          next: () => {
            this.hasActivePlan = false;
            this.planState = '';
            this.buildMenu();
          }
        });
      }
    });
  }

  private async finishWeek(): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: '✅ Finish This Week',
      message: 'Are you sure you want to finish this week? It will be archived to Past Weeks.',
      confirmText: 'Yes, Finish Week',
      cancelText: 'Not Yet'
    });
    if (!ok) return;

    if (!this.currentPlanId) return;
    this.weeklyPlanService.complete(this.currentPlanId).subscribe({
      next: () => {
        this.hasActivePlan = false;
        this.planState = '';
        this.buildMenu();
      },
      error: (err) => {
        this.toast.error(err.error || 'Failed to complete the week.');
      }
    });
  }
}

