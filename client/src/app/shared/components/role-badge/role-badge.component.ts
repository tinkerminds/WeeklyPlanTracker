import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberRole } from '../../../core/enums/enums';

@Component({
    selector: 'app-role-badge',
    standalone: true,
    imports: [CommonModule],
    template: `
    <span class="badge" [class.badge-lead]="role === MemberRole.Lead" [class.badge-member]="role === MemberRole.Member">
      {{ role === MemberRole.Lead ? 'Team Lead' : 'Team Member' }}
    </span>
  `,
    styles: [`
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      font-family: 'Inter', sans-serif;
    }
    .badge-lead {
      background: rgba(245, 158, 11, 0.2);
      color: var(--color-warning);
      border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .badge-member {
      background: rgba(59, 130, 246, 0.2);
      color: var(--color-primary);
      border: 1px solid rgba(59, 130, 246, 0.4);
    }
  `]
})
export class RoleBadgeComponent {
    @Input() role: MemberRole = MemberRole.Member;
    MemberRole = MemberRole;
}
