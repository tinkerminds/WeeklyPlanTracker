import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TeamMember } from '../../core/models/team-member.model';
import { MemberRole } from '../../core/enums/enums';
import { TeamMemberService } from '../../core/services/team-member.service';
import { ToastService } from '../../core/services/toast.service';
import { NavigationService } from '../../core/services/navigation.service';
import { AuthService } from '../../core/services/auth.service';
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
                <button class="btn btn-outline" (click)="makeLead(member)">Make Lead</button>
              } @else {
                <span class="lead-check">Lead ✓</span>
              }
              <button class="btn btn-remove" (click)="removeMember(member)" title="Remove member">✕</button>
            </div>
          </div>
        }
      </div>

      @if (members.length > 0) {
        <button class="btn btn-done" (click)="saveAndContinue()" [disabled]="isSaving" id="done-btn">
          {{ isSaving ? 'Saving...' : 'Done — Go to Home Screen' }}
        </button>
      }
    </div>
  `,
  styles: [`
    .setup-container { max-width: 600px; margin: 40px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
    .setup-header { text-align: center; margin-bottom: 32px; }
    .setup-header h1 { font-size: 28px; color: var(--text-primary); margin-bottom: 8px; }
    .subtitle { color: var(--text-secondary); font-size: 16px; }
    .add-member-form { display: flex; gap: 12px; margin-bottom: 24px; }
    .name-input {
      flex: 1; padding: 12px 16px; border: 2px solid var(--bg-card-hover); border-radius: 8px;
      background: var(--bg-secondary); color: var(--text-primary); font-size: 15px; outline: none; transition: border-color 0.2s;
    }
    .name-input:focus { border-color: var(--color-primary); }
    .name-input::placeholder { color: var(--text-muted); }
    .btn { padding: 12px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: var(--color-primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
    .btn-outline { background: transparent; color: var(--color-primary); border: 1px solid var(--color-primary); padding: 8px 16px; font-size: 13px; }
    .btn-outline:hover { background: rgba(59, 130, 246, 0.1); }
    .btn-remove {
      background: transparent; color: var(--text-muted); border: 1px solid var(--border-hover);
      width: 32px; height: 32px; padding: 0; border-radius: 50%; font-size: 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .btn-remove:hover { background: rgba(239, 68, 68, 0.1); color: var(--color-danger); border-color: var(--color-danger); }
    .btn-done {
      display: block; width: 100%; margin-top: 32px; padding: 14px;
      background: linear-gradient(135deg, var(--color-warning), var(--color-warning)); color: #fff; font-size: 16px;
    }
    .btn-done:hover:not(:disabled) { background: linear-gradient(135deg, var(--color-warning), var(--color-warning)); }
    .member-list { display: flex; flex-direction: column; gap: 12px; }
    .empty-state { text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-secondary); border-radius: 12px; border: 2px dashed var(--bg-card-hover); }
    .member-card {
      display: flex; align-items: center; justify-content: space-between; padding: 16px 20px;
      background: var(--bg-secondary); border-radius: 12px; border: 1px solid var(--bg-card-hover); transition: all 0.3s; animation: fadeIn 0.3s ease-out;
    }
    .member-card:hover { border-color: var(--border-hover); }
    .member-info { display: flex; align-items: center; gap: 12px; }
    .member-name { font-size: 16px; font-weight: 600; color: var(--text-primary); }
    .member-actions { display: flex; align-items: center; gap: 8px; }
    .lead-check { color: var(--color-warning); font-weight: 600; font-size: 14px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class TeamSetupComponent {
  /** Temporary in-memory list — saved to backend API when "Done" is clicked. */
  members: { id: string; name: string; role: MemberRole }[] = [];
  newMemberName = '';
  isSaving = false;
  MemberRole = MemberRole;

  constructor(
    private teamMemberService: TeamMemberService,
    private toastService: ToastService,
    private nav: NavigationService,
    private authService: AuthService
  ) { }

  addMember(): void {
    const name = this.newMemberName.trim();
    if (!name) return;

    const isFirst = this.members.length === 0;
    this.members = [...this.members, {
      id: crypto.randomUUID(),
      name,
      role: isFirst ? MemberRole.Lead : MemberRole.Member
    }];
    this.newMemberName = '';
    this.toastService.success('Member added!');
  }

  makeLead(member: { id: string; name: string; role: MemberRole }): void {
    this.members = this.members.map(m => ({
      ...m,
      role: m.id === member.id ? MemberRole.Lead : MemberRole.Member
    }));
    this.toastService.success(`${member.name} is now the Team Lead!`);
  }

  removeMember(member: { id: string; name: string; role: MemberRole }): void {
    if (this.members.length <= 1) {
      this.toastService.warning('Cannot remove the last team member.');
      return;
    }
    const wasLead = member.role === MemberRole.Lead;
    this.members = this.members.filter(m => m.id !== member.id);
    if (wasLead && this.members.length > 0) {
      this.members[0] = { ...this.members[0], role: MemberRole.Lead };
      this.toastService.success(`${member.name} removed. ${this.members[0].name} is now the Lead.`);
    } else {
      this.toastService.success(`${member.name} removed.`);
    }
  }

  /** Save all members to the .NET API, auto-login as Lead, and go to home. */
  async saveAndContinue(): Promise<void> {
    this.isSaving = true;
    try {
      await this.teamMemberService.bulkCreate(this.members);
      this.toastService.success('Team saved!');

      // Fetch saved members from API to get correct IDs, then auto-login as Lead
      const { firstValueFrom } = await import('rxjs');
      const savedMembers = await firstValueFrom(this.teamMemberService.getAll());
      const lead = savedMembers.find(m => m.role === 'Lead') || savedMembers[0];
      if (lead) {
        this.authService.login(lead);
      }
      this.nav.navigateTo('home');
    } catch (err) {
      this.toastService.error('Failed to save team. Please try again.');
    } finally {
      this.isSaving = false;
    }
  }
}
