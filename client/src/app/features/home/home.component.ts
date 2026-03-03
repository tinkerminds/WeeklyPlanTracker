import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';
import { WeeklyPlanService } from '../../core/services/weekly-plan.service';
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
      color: #e2e8f0;
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
      color: #f59e0b;
    }
    .role-member {
      background: rgba(59, 130, 246, 0.2);
      color: #3b82f6;
    }
    .status-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 10px;
      color: #93c5fd;
      font-size: 14px;
      margin-bottom: 28px;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3b82f6;
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
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      text-align: left;
      color: #e2e8f0;
    }
    .menu-card:hover {
      border-color: #475569;
      background: #253449;
    }
    .card-danger {
      border-color: rgba(239, 68, 68, 0.3);
    }
    .card-danger:hover {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
    .card-danger .card-title {
      color: #ef4444;
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
      color: #e2e8f0;
    }
    .card-subtitle {
      font-size: 13px;
      color: #94a3b8;
    }
    .card-arrow {
      font-size: 22px;
      color: #475569;
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

  private cdr = inject(ChangeDetectorRef);

  constructor(
    private authService: AuthService,
    public nav: NavigationService,
    private weeklyPlanService: WeeklyPlanService
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
    } else {
      this.nav.navigateTo(card.screen as any);
    }
  }

  private checkActivePlan(): void {
    this.weeklyPlanService.getCurrent().subscribe({
      next: (plan) => {
        this.hasActivePlan = !!plan;
        this.buildMenu();
        this.cdr.detectChanges();
      },
      error: () => {
        this.hasActivePlan = false;
        this.buildMenu();
        this.cdr.detectChanges();
      }
    });
  }

  private buildMenu(): void {
    if (this.isLead) {
      if (this.hasActivePlan) {
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
        this.statusMessage = "No active plan. Click 'Start a New Week' to begin!";
        this.menuCards = [
          { icon: '🚀', title: 'Start a New Week', subtitle: 'Set up a new planning cycle.', screen: 'start-week' },
          { icon: '📋', title: 'Manage Backlog', subtitle: 'Add, edit, or browse work items.', screen: 'manage-backlog' },
          { icon: '👥', title: 'Manage Team Members', subtitle: 'Add or remove team members.', screen: 'manage-team' },
          { icon: '📅', title: 'View Past Weeks', subtitle: 'Look at completed planning cycles.', screen: 'past-weeks' },
        ];
      }
    } else {
      if (this.hasActivePlan) {
        this.statusMessage = "Planning is open — pick your backlog items and commit your 30 hours.";
        this.menuCards = [
          { icon: '📝', title: 'Plan My Work', subtitle: 'Pick backlog items and commit your 30 hours.', screen: 'plan-my-work' },
          { icon: '📋', title: 'Manage Backlog', subtitle: 'Add, edit, or browse work items.', screen: 'manage-backlog' },
          { icon: '📅', title: 'View Past Weeks', subtitle: 'Look at completed planning cycles.', screen: 'past-weeks' },
        ];
      } else {
        this.statusMessage = "No active plan right now. Check back when your Team Lead starts a new week.";
        this.menuCards = [
          { icon: '📋', title: 'Manage Backlog', subtitle: 'Add, edit, or browse work items.', screen: 'manage-backlog' },
          { icon: '📅', title: 'View Past Weeks', subtitle: 'Look at completed planning cycles.', screen: 'past-weeks' },
        ];
      }
    }
  }

  private cancelWeek(): void {
    if (!confirm('Are you sure you want to cancel this week\'s planning? This will erase all plans.')) return;

    this.weeklyPlanService.getCurrent().subscribe({
      next: (plan) => {
        if (!plan) return;
        this.weeklyPlanService.cancel(plan.id).subscribe({
          next: () => {
            this.hasActivePlan = false;
            this.buildMenu();
          }
        });
      }
    });
  }
}

