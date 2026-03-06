import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, Input } from '@angular/core';
import { vi } from 'vitest';
import { LoginComponent } from '../../../app/features/login/login.component';
import { TeamMemberService } from '../../../app/core/services/team-member.service';
import { AuthService } from '../../../app/core/services/auth.service';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { MemberRole } from '../../../app/core/enums/enums';
import { BehaviorSubject } from 'rxjs';
import { RoleBadgeComponent } from '../../../app/shared/components/role-badge/role-badge.component';

// Stub component to replace RoleBadgeComponent
@Component({ selector: 'app-role-badge', standalone: true, template: '<span>stub</span>' })
class StubRoleBadgeComponent {
    @Input() role: any;
}

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let membersSubject: BehaviorSubject<any[]>;
    const mockAuth = { login: vi.fn() };
    const mockNav = { navigateTo: vi.fn() };

    beforeEach(async () => {
        membersSubject = new BehaviorSubject<any[]>([]);

        await TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [
                { provide: TeamMemberService, useValue: { members$: membersSubject.asObservable() } },
                { provide: AuthService, useValue: mockAuth },
                { provide: NavigationService, useValue: mockNav }
            ]
        })
            .overrideComponent(LoginComponent, {
                remove: { imports: [RoleBadgeComponent] },
                add: { imports: [StubRoleBadgeComponent] }
            })
            .compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should show members from service', () => {
        const members = [
            { id: '1', name: 'Alice', role: MemberRole.Lead, isActive: true, createdAt: '' },
            { id: '2', name: 'Bob', role: MemberRole.Member, isActive: true, createdAt: '' }
        ];
        membersSubject.next(members);
        fixture.detectChanges();
        expect(component.members.length).toBe(2);
    });

    it('should login on member selection', () => {
        const member = { id: '1', name: 'Alice', role: MemberRole.Lead, isActive: true, createdAt: '' };
        component.selectMember(member);
        expect(mockAuth.login).toHaveBeenCalledWith(member);
        expect(mockNav.navigateTo).toHaveBeenCalledWith('home');
    });

    it('should compute initials correctly', () => {
        expect(component.getInitials('Alice Smith')).toBe('AS');
        expect(component.getInitials('Bob')).toBe('B');
        expect(component.getInitials('John Michael Doe')).toBe('JM');
    });

    it('should show empty state when no members', () => {
        membersSubject.next([]);
        fixture.detectChanges();
        const compiled = fixture.nativeElement;
        expect(compiled.querySelector('.empty-state-styled')).toBeTruthy();
    });
});
