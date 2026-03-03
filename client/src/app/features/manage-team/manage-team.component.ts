import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TeamMember } from '../../core/models/team-member.model';
import { MemberRole } from '../../core/enums/enums';
import { TeamMemberService } from '../../core/services/team-member.service';
import { ToastService } from '../../core/services/toast.service';
import { NavigationService } from '../../core/services/navigation.service';
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
          <div class="member-card">
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
    .manage-container { max-width: 600px; margin: 20px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
    .btn-back { background: none; border: none; color: #64748b; font-size: 14px; cursor: pointer; padding: 8px 0; margin-bottom: 16px; font-family: inherit; }
    .btn-back:hover { color: #94a3b8; }
    h2 { font-size: 22px; color: #e2e8f0; margin-bottom: 20px; }
    .add-member-form { display: flex; gap: 12px; margin-bottom: 24px; }
    .name-input { flex: 1; padding: 12px 16px; border: 2px solid #334155; border-radius: 8px; background: #1e293b; color: #e2e8f0; font-size: 15px; outline: none; transition: border-color 0.2s; }
    .name-input:focus { border-color: #3b82f6; }
    .name-input::placeholder { color: #64748b; }
    .btn { padding: 10px 18px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-outline { background: transparent; color: #3b82f6; border: 1px solid #3b82f6; padding: 8px 14px; font-size: 13px; }
    .btn-outline:hover { background: rgba(59,130,246,0.1); }
    .btn-danger-sm { background: transparent; color: #ef4444; border: 1px solid #ef4444; padding: 8px 14px; font-size: 13px; border-radius: 8px; }
    .btn-danger-sm:hover { background: rgba(239,68,68,0.1); }
    .member-list { display: flex; flex-direction: column; gap: 12px; }
    .member-card {
      display: flex; align-items: center; justify-content: space-between; padding: 16px 20px;
      background: #1e293b; border-radius: 12px; border: 1px solid #334155; transition: all 0.3s; animation: fadeIn 0.3s ease-out;
    }
    .member-card:hover { border-color: #475569; }
    .member-info { display: flex; align-items: center; gap: 12px; }
    .member-name { font-size: 16px; font-weight: 600; color: #e2e8f0; }
    .member-actions { display: flex; align-items: center; gap: 8px; }
    .lead-check { color: #f59e0b; font-weight: 600; font-size: 14px; }
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
        public nav: NavigationService
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

    removeMember(member: TeamMember): void {
        this.teamMemberService.remove(member.id).subscribe({
            next: () => this.toastService.success(`${member.name} removed.`),
            error: (err) => this.toastService.error(err.error || 'Cannot remove this member.')
        });
    }
}
