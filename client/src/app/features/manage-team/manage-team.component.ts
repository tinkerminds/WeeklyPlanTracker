import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TeamMember } from '../../core/models/team-member.model';
import { MemberRole } from '../../core/enums/enums';
import { TeamMemberService } from '../../core/services/team-member.service';
import { ToastService } from '../../core/services/toast.service';
import { NavigationService } from '../../core/services/navigation.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { RoleBadgeComponent } from '../../shared/components/role-badge/role-badge.component';

@Component({
  selector: 'app-manage-team',
  standalone: true,
  imports: [CommonModule, FormsModule, RoleBadgeComponent],
  template: `
    <div class="manage-container">
      <button class="btn-back" (click)="nav.navigateTo('home')">← Home</button>
      <h2>Manage Team Members</h2>

      <div class="add-member-form">
        <input type="text" [(ngModel)]="newMemberName" placeholder="Type a name here"
          (keyup.enter)="addMember()" class="name-input" autocomplete="off" />
        <button class="btn btn-primary" (click)="addMember()" [disabled]="!newMemberName.trim()">Add This Person</button>
      </div>

      <div class="member-list">
        @for (member of members; track member.id) {
          <div class="member-card" [style.animationDelay]="(0.06 * $index) + 's'" style="animation: staggerFadeIn 0.3s ease-out both;">
            <div class="member-info">
              <span class="member-name">{{ member.name }}</span>
              <app-role-badge [role]="member.role"></app-role-badge>
            </div>
            <div class="member-actions">
              @if (member.role !== MemberRole.Lead) {
                <button class="btn btn-outline" (click)="makeLead(member)">Make Lead</button>
                <button class="btn btn-danger-sm" (click)="removeMember(member)">Remove</button>
              } @else {
                <span class="lead-check">Lead ✓</span>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .manage-container { max-width: 800px; margin: 20px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
    h2 { font-size: 22px; color: var(--text-primary); margin-bottom: 20px; }
    .add-member-form { display: flex; gap: 12px; margin-bottom: 24px; }
    .name-input { flex: 1; padding: 12px 16px; border: 2px solid var(--bg-card-hover); border-radius: 8px; background: var(--bg-secondary); color: var(--text-primary); font-size: 15px; outline: none; transition: border-color 0.2s; }
    .name-input:focus { border-color: var(--color-primary); }
    .name-input::placeholder { color: var(--text-muted); }
    .btn { padding: 10px 18px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: var(--color-primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
    .btn-outline { background: transparent; color: var(--color-primary); border: 1px solid var(--color-primary); padding: 8px 14px; font-size: 13px; }
    .btn-outline:hover { background: rgba(59,130,246,0.1); }
    .btn-danger-sm { background: transparent; color: var(--color-danger); border: 1px solid var(--color-danger); padding: 8px 14px; font-size: 13px; border-radius: 8px; }
    .btn-danger-sm:hover { background: rgba(239,68,68,0.1); }
    .member-list { display: flex; flex-direction: column; gap: 12px; }
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
export class ManageTeamComponent implements OnInit, OnDestroy {
  members: TeamMember[] = [];
  newMemberName = '';
  MemberRole = MemberRole;
  private sub!: Subscription;

  constructor(
    private teamMemberService: TeamMemberService,
    private toastService: ToastService,
    public nav: NavigationService,
    private confirmService: ConfirmService
  ) { }

  ngOnInit(): void {
    this.teamMemberService.refresh();
    this.sub = this.teamMemberService.members$.subscribe(members => this.members = members);
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  addMember(): void {
    const name = this.newMemberName.trim();
    if (!name) return;
    this.teamMemberService.create(name).subscribe({
      next: () => { this.newMemberName = ''; this.toastService.success('Member added!'); },
      error: () => this.toastService.error('Failed to add member.')
    });
  }

  makeLead(member: TeamMember): void {
    this.teamMemberService.makeLead(member.id).subscribe({
      next: () => this.toastService.success(`${member.name} is now the Team Lead!`),
      error: () => this.toastService.error('Failed to update role.')
    });
  }

  async removeMember(member: TeamMember): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: '👤 Remove Member',
      message: `Are you sure you want to remove "${member.name}" from the team? This action cannot be undone.`,
      confirmText: 'Yes, Remove',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;

    this.teamMemberService.remove(member.id).subscribe({
      next: () => this.toastService.success(`${member.name} removed.`),
      error: (err) => this.toastService.error(err.error || 'Cannot remove this member.')
    });
  }
}
