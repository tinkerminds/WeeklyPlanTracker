import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { TeamSetupComponent } from '../../../app/features/team-setup/team-setup.component';
import { TeamMemberService } from '../../../app/core/services/team-member.service';
import { ToastService } from '../../../app/core/services/toast.service';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { AuthService } from '../../../app/core/services/auth.service';
import { MemberRole } from '../../../app/core/enums/enums';

describe('TeamSetupComponent', () => {
    let component: TeamSetupComponent;
    let fixture: ComponentFixture<TeamSetupComponent>;
    const mockToast = { success: vi.fn(), warning: vi.fn(), error: vi.fn() };
    const mockNav = { navigateTo: vi.fn() };
    const mockAuth = { login: vi.fn() };
    const mockTeamService = { bulkCreate: vi.fn(), getAll: vi.fn() };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TeamSetupComponent, FormsModule],
            providers: [
                { provide: TeamMemberService, useValue: mockTeamService },
                { provide: ToastService, useValue: mockToast },
                { provide: NavigationService, useValue: mockNav },
                { provide: AuthService, useValue: mockAuth }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TeamSetupComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start with empty members list', () => {
        expect(component.members.length).toBe(0);
    });

    it('should add first member as Lead', () => {
        component.newMemberName = 'Alice';
        component.addMember();
        expect(component.members.length).toBe(1);
        expect(component.members[0].role).toBe(MemberRole.Lead);
        expect(component.members[0].name).toBe('Alice');
        expect(mockToast.success).toHaveBeenCalled();
    });

    it('should add subsequent members as Member', () => {
        component.newMemberName = 'Alice';
        component.addMember();
        component.newMemberName = 'Bob';
        component.addMember();
        expect(component.members.length).toBe(2);
        expect(component.members[1].role).toBe(MemberRole.Member);
    });

    it('should not add empty name', () => {
        component.newMemberName = '   ';
        component.addMember();
        expect(component.members.length).toBe(0);
    });

    it('should clear input after adding', () => {
        component.newMemberName = 'Alice';
        component.addMember();
        expect(component.newMemberName).toBe('');
    });

    it('should make a member Lead', () => {
        component.newMemberName = 'Alice';
        component.addMember();
        component.newMemberName = 'Bob';
        component.addMember();
        component.makeLead(component.members[1]);
        expect(component.members[1].role).toBe(MemberRole.Lead);
        expect(component.members[0].role).toBe(MemberRole.Member);
    });

    it('should remove a member', () => {
        component.newMemberName = 'Alice';
        component.addMember();
        component.newMemberName = 'Bob';
        component.addMember();
        component.removeMember(component.members[1]);
        expect(component.members.length).toBe(1);
    });

    it('should not remove last member', () => {
        component.newMemberName = 'Alice';
        component.addMember();
        component.removeMember(component.members[0]);
        expect(component.members.length).toBe(1);
        expect(mockToast.warning).toHaveBeenCalled();
    });

    it('should promote next member when Lead is removed', () => {
        component.newMemberName = 'Alice';
        component.addMember();
        component.newMemberName = 'Bob';
        component.addMember();
        component.removeMember(component.members[0]);
        expect(component.members[0].role).toBe(MemberRole.Lead);
    });
});
