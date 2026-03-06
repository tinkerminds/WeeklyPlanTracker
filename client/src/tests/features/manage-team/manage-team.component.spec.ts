import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Component, Input } from '@angular/core';
import { vi } from 'vitest';
import { ManageTeamComponent } from '../../../app/features/manage-team/manage-team.component';
import { TeamMemberService } from '../../../app/core/services/team-member.service';
import { ToastService } from '../../../app/core/services/toast.service';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { MemberRole } from '../../../app/core/enums/enums';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { RoleBadgeComponent } from '../../../app/shared/components/role-badge/role-badge.component';
import { ConfirmService } from '../../../app/core/services/confirm.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('ManageTeamComponent', () => {
    let component: ManageTeamComponent;
    let fixture: ComponentFixture<ManageTeamComponent>;
    let membersSubject: BehaviorSubject<any[]>;
    const mockToast = { success: vi.fn(), error: vi.fn() };
    const mockNav = { navigateTo: vi.fn() };
    const mockTeamService = { refresh: vi.fn(), create: vi.fn(), makeLead: vi.fn(), remove: vi.fn(), members$: null as any };
    const mockConfirm = { confirm: vi.fn().mockResolvedValue(true) };

    const mockMembers = [
        { id: '1', name: 'Alice', role: MemberRole.Lead, isActive: true, createdAt: '' },
        { id: '2', name: 'Bob', role: MemberRole.Member, isActive: true, createdAt: '' }
    ];

    beforeEach(async () => {
        vi.clearAllMocks();
        membersSubject = new BehaviorSubject<any[]>(mockMembers);
        mockTeamService.members$ = membersSubject.asObservable();

        await TestBed.configureTestingModule({
            imports: [ManageTeamComponent, FormsModule],
            providers: [
                { provide: TeamMemberService, useValue: mockTeamService },
                { provide: ToastService, useValue: mockToast },
                { provide: NavigationService, useValue: mockNav },
                { provide: ConfirmService, useValue: mockConfirm }
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA]
        })
            .overrideComponent(ManageTeamComponent, {
                remove: { imports: [RoleBadgeComponent] },
                add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] }
            })
            .compileComponents();

        fixture = TestBed.createComponent(ManageTeamComponent);
        component = fixture.componentInstance;
        // Ensure MemberRole is available on the component instance for the template
        component.MemberRole = MemberRole;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load members on init', () => {
        expect(component.members.length).toBe(2);
        expect(mockTeamService.refresh).toHaveBeenCalled();
    });

    it('should add a member', () => {
        mockTeamService.create.mockReturnValue(of({} as any));
        component.newMemberName = 'Charlie';
        component.addMember();
        expect(mockTeamService.create).toHaveBeenCalledWith('Charlie');
        expect(mockToast.success).toHaveBeenCalled();
    });

    it('should not add empty name', () => {
        component.newMemberName = '   ';
        component.addMember();
        expect(mockTeamService.create).not.toHaveBeenCalled();
    });

    it('should show error on add failure', () => {
        mockTeamService.create.mockReturnValue(throwError(() => new Error()));
        component.newMemberName = 'Charlie';
        component.addMember();
        expect(mockToast.error).toHaveBeenCalled();
    });

    it('should make member Lead', () => {
        mockTeamService.makeLead.mockReturnValue(of({} as any));
        component.makeLead(mockMembers[1] as any);
        expect(mockTeamService.makeLead).toHaveBeenCalledWith('2');
        expect(mockToast.success).toHaveBeenCalled();
    });

    it('should remove member', async () => {
        mockTeamService.remove.mockReturnValue(of(void 0 as any));
        await component.removeMember(mockMembers[1] as any);
        expect(mockConfirm.confirm).toHaveBeenCalled();
        expect(mockTeamService.remove).toHaveBeenCalledWith('2');
        expect(mockToast.success).toHaveBeenCalled();
    });

    it('should show error on remove failure', async () => {
        mockTeamService.remove.mockReturnValue(throwError(() => ({ error: 'Cannot remove lead' })));
        await component.removeMember(mockMembers[0] as any);
        expect(mockToast.error).toHaveBeenCalled();
    });

    it('should not remove member when confirmation cancelled', async () => {
        mockConfirm.confirm.mockResolvedValue(false);
        await component.removeMember(mockMembers[1] as any);
        expect(mockConfirm.confirm).toHaveBeenCalled();
        expect(mockTeamService.remove).not.toHaveBeenCalled();
    });
});
