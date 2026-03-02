import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamMember } from '../../core/models/team-member.model';
import { MemberRole } from '../../core/enums/enums';
import { TeamMemberService } from '../../core/services/team-member.service';
import { ToastService } from '../../core/services/toast.service';
import { NavigationService } from '../../core/services/navigation.service';
import { RoleBadgeComponent } from '../../shared/components/role-badge/role-badge.component';

@Component({
  selector: 'app-team-setup',
  standalone: true,
  imports: [CommonModule, FormsModule, RoleBadgeComponent],
  template: `
    <div class="setup-container">
      <div class="setup-header">
        <h1>👋 Welcome! Let's set up your team.</h1>
        <p class="subtitle">Add the people on your team. Pick one person as the Team Lead.</p>
      </div>

      <div class="add-member-form">
        <input
          type="text"
          [(ngModel)]="newMemberName"
          placeholder="Type a name here"
          (keyup.enter)="addMember()"
          class="name-input"
          id="member-name-input"
          autocomplete="off"
        />
        <button class="btn btn-primary" (click)="addMember()" [disabled]="!newMemberName.trim()" id="add-member-btn">
          Add This Person
        </button>
      </div>

      <div class="member-list">
        @if (members.length === 0) {
          <div class="empty-state">
            <p>No team members added yet.</p>
          </div>
        }
        @for (member of members; track member.id) {
          <div class="member-card">
            <div class="member-info">
              <span class="member-name">{{ member.name }}</span>
              <app-role-badge [role]="member.role"></app-role-badge>
            </div>
            <div class="member-actions">
              @if (member.role !== MemberRole.Lead) {
                <button class="btn btn-outline" (click)="makeLead(member)" [id]="'make-lead-' + member.id">
                  Make Lead
                </button>
              } @else {
                <span class="lead-check">Lead ✓</span>
              }
              <button class="btn btn-remove" (click)="removeMember(member)" [id]="'remove-' + member.id" title="Remove member">
                ✕
              </button>
            </div>
          </div>
        }
      </div>

      @if (members.length > 0) {
        <button class="btn btn-done" (click)="saveAndContinue()" id="done-btn">
          Done — Go to Home Screen
        </button>
      }
    </div>
  `,
  styles: [`
    .setup-container {
      max-width: 600px;
      margin: 40px auto;
      padding: 0 20px;
      font-family: 'Inter', sans-serif;
    }
    .setup-header {
      text-align: center;
      margin-bottom: 32px;
    }
    .setup-header h1 {
      font-size: 28px;
      color: #e2e8f0;
      margin-bottom: 8px;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 16px;
    }
    .add-member-form {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }
    .name-input {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #334155;
      border-radius: 8px;
      background: #1e293b;
      color: #e2e8f0;
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s;
    }
    .name-input:focus {
      border-color: #3b82f6;
    }
    .name-input::placeholder {
      color: #64748b;
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
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn-primary {
      background: #3b82f6;
      color: #fff;
    }
    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }
    .btn-outline {
      background: transparent;
      color: #3b82f6;
      border: 1px solid #3b82f6;
      padding: 8px 16px;
      font-size: 13px;
    }
    .btn-outline:hover {
      background: rgba(59, 130, 246, 0.1);
    }
    .btn-remove {
      background: transparent;
      color: #64748b;
      border: 1px solid #475569;
      width: 32px;
      height: 32px;
      padding: 0;
      border-radius: 50%;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .btn-remove:hover {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border-color: #ef4444;
    }
    .btn-done {
      display: block;
      width: 100%;
      margin-top: 32px;
      padding: 14px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #fff;
      font-size: 16px;
    }
    .btn-done:hover {
      background: linear-gradient(135deg, #d97706, #b45309);
    }
    .member-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #64748b;
      background: #1e293b;
      border-radius: 12px;
      border: 2px dashed #334155;
    }
    .member-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #1e293b;
      border-radius: 12px;
      border: 1px solid #334155;
      transition: all 0.3s ease;
      animation: fadeIn 0.3s ease-out;
    }
    .member-card:hover {
      border-color: #475569;
    }
    .member-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .member-name {
      font-size: 16px;
      font-weight: 600;
      color: #e2e8f0;
    }
    .member-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .lead-check {
      color: #f59e0b;
      font-weight: 600;
      font-size: 14px;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class TeamSetupComponent {
  /** Temporary in-memory list — NOT saved to localStorage until "Done" is clicked.
   *  Refreshing the page clears everything. */
  members: TeamMember[] = [];
  newMemberName = '';
  MemberRole = MemberRole;

  constructor(
    private teamMemberService: TeamMemberService,
    private toastService: ToastService,
    private nav: NavigationService
  ) { }

  addMember(): void {
    const name = this.newMemberName.trim();
    if (!name) return;

    const isFirst = this.members.length === 0;
    const newMember: TeamMember = {
      id: crypto.randomUUID(),
      name,
      role: isFirst ? MemberRole.Lead : MemberRole.Member,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    this.members = [...this.members, newMember];
    this.newMemberName = '';
    this.toastService.success('Member added!');
  }

  makeLead(member: TeamMember): void {
    this.members = this.members.map(m => ({
      ...m,
      role: m.id === member.id ? MemberRole.Lead : MemberRole.Member
    }));
    this.toastService.success(`${member.name} is now the Team Lead!`);
  }

  removeMember(member: TeamMember): void {
    if (this.members.length <= 1) {
      this.toastService.warning('Cannot remove the last team member.');
      return;
    }

    const wasLead = member.role === MemberRole.Lead;
    this.members = this.members.filter(m => m.id !== member.id);

    // If we removed the Lead, make the first remaining member the Lead
    if (wasLead && this.members.length > 0) {
      this.members[0] = { ...this.members[0], role: MemberRole.Lead };
      this.toastService.success(`${member.name} removed. ${this.members[0].name} is now the Lead.`);
    } else {
      this.toastService.success(`${member.name} removed.`);
    }
  }

  /** Save to localStorage and navigate to login. */
  saveAndContinue(): void {
    this.teamMemberService.setAll(this.members);
    this.toastService.success('Team saved!');
    this.nav.navigateTo('login');
  }
}
