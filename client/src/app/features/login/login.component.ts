import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TeamMember } from '../../core/models/team-member.model';
import { MemberRole } from '../../core/enums/enums';
import { TeamMemberService } from '../../core/services/team-member.service';
import { AuthService } from '../../core/services/auth.service';
import { NavigationService } from '../../core/services/navigation.service';
import { RoleBadgeComponent } from '../../shared/components/role-badge/role-badge.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RoleBadgeComponent],
  template: `
    <div class="login-container">
      <div class="login-header">
        <h1>👤 Who are you?</h1>
        <p class="subtitle">Select your name to continue.</p>
      </div>

      <div class="member-grid">
        @for (member of members; track member.id) {
          <button class="member-btn" (click)="selectMember(member)" [id]="'login-' + member.id">
            <div class="avatar">{{ getInitials(member.name) }}</div>
            <span class="name">{{ member.name }}</span>
            <app-role-badge [role]="member.role"></app-role-badge>
          </button>
        }
      </div>

      @if (members.length === 0) {
        <div class="empty-state">
          <p>No team members found.</p>
          <button class="btn btn-primary" (click)="nav.navigateTo('setup')">Set Up Team</button>
        </div>
      }


    </div>
  `,
  styles: [`
    .login-container {
      max-width: 960px;
      margin: 60px auto;
      padding: 0 24px;
      font-family: 'Inter', sans-serif;
    }
    .login-header {
      text-align: center;
      margin-bottom: 36px;
    }
    .login-header h1 {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-heading);
      margin-bottom: 8px;
    }
    .subtitle {
      color: var(--text-secondary);
      font-size: 17px;
    }
    .member-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .member-btn {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 20px 24px;
      background: var(--bg-card);
      border: 2px solid var(--border-color);
      border-radius: 14px;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      text-align: left;
      box-shadow: var(--shadow-sm);
    }
    .member-btn:hover {
      border-color: var(--color-primary);
      background: var(--login-card-hover);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    }
    .avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      color: #fff;
      flex-shrink: 0;
    }
    .name {
      flex: 1;
      font-size: 17px;
      font-weight: 700;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 2px dashed var(--bg-card-hover);
    }
    .empty-state .btn {
      margin-top: 16px;
    }
    .login-footer {
      text-align: center;
      margin-top: 24px;
    }
    .btn {
      padding: 12px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary {
      background: var(--color-primary);
      color: #fff;
    }
    .btn-primary:hover {
      background: var(--color-primary-hover);
    }
    .btn-link {
      background: none;
      color: var(--text-muted);
      padding: 8px;
      font-size: 14px;
    }
    .btn-link:hover {
      color: var(--text-secondary);
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  members: TeamMember[] = [];
  private sub!: Subscription;

  constructor(
    private teamMemberService: TeamMemberService,
    private authService: AuthService,
    public nav: NavigationService
  ) { }

  ngOnInit(): void {
    this.sub = this.teamMemberService.members$.subscribe(
      members => this.members = members
    );
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  selectMember(member: TeamMember): void {
    this.authService.login(member);
    this.nav.navigateTo('home');
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }


}
