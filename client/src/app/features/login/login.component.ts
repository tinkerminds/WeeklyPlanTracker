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
          <button class="btn btn-primary" (click)="goToSetup()">Set Up Team</button>
        </div>
      }

      <div class="login-footer">
        <button class="btn btn-link" (click)="goToSetup()">⚙️ Manage Team</button>
      </div>
    </div>
  `,
    styles: [`
    .login-container {
      max-width: 500px;
      margin: 60px auto;
      padding: 0 20px;
      font-family: 'Inter', sans-serif;
    }
    .login-header {
      text-align: center;
      margin-bottom: 36px;
    }
    .login-header h1 {
      font-size: 28px;
      color: #e2e8f0;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 16px;
    }
    .member-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .member-btn {
      display: flex;
      align-items: center;
      gap: 16px;
      width: 100%;
      padding: 16px 20px;
      background: #1e293b;
      border: 2px solid #334155;
      border-radius: 12px;
      color: #e2e8f0;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      text-align: left;
    }
    .member-btn:hover {
      border-color: #3b82f6;
      background: #1e3a5f;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    }
    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      color: #fff;
      flex-shrink: 0;
    }
    .name {
      flex: 1;
      font-size: 16px;
      font-weight: 600;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #64748b;
      background: #1e293b;
      border-radius: 12px;
      border: 2px dashed #334155;
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
      background: #3b82f6;
      color: #fff;
    }
    .btn-primary:hover {
      background: #2563eb;
    }
    .btn-link {
      background: none;
      color: #64748b;
      padding: 8px;
      font-size: 14px;
    }
    .btn-link:hover {
      color: #94a3b8;
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
    members: TeamMember[] = [];
    private sub!: Subscription;

    constructor(
        private teamMemberService: TeamMemberService,
        private authService: AuthService,
        private nav: NavigationService
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

    goToSetup(): void {
        this.nav.navigateTo('setup');
    }
}
