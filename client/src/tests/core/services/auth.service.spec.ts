import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../../app/core/services/auth.service';
import { TeamMember } from '../../../app/core/models/team-member.model';
import { MemberRole } from '../../../app/core/enums/enums';

describe('AuthService', () => {
    let service: AuthService;

    const mockLead: TeamMember = { id: '1', name: 'Alice', role: MemberRole.Lead, isActive: true, createdAt: '' };
    const mockMember: TeamMember = { id: '2', name: 'Bob', role: MemberRole.Member, isActive: true, createdAt: '' };

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AuthService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should start with no user', () => {
        expect(service.getCurrentUser()).toBeNull();
        expect(service.isLoggedIn()).toBe(false);
    });

    it('should login a user', () => {
        service.login(mockLead);
        expect(service.getCurrentUser()).toEqual(mockLead);
        expect(service.isLoggedIn()).toBe(true);
    });

    it('should emit user via currentUser$', () => {
        service.login(mockLead);
        let emitted: any;
        service.currentUser$.subscribe(user => emitted = user);
        expect(emitted).toEqual(mockLead);
    });

    it('should logout', () => {
        service.login(mockLead);
        service.logout();
        expect(service.getCurrentUser()).toBeNull();
        expect(service.isLoggedIn()).toBe(false);
    });

    it('should detect Lead role', () => {
        service.login(mockLead);
        expect(service.isLead()).toBe(true);
    });

    it('should detect Member role', () => {
        service.login(mockMember);
        expect(service.isLead()).toBe(false);
    });

    it('should return false for isLead when not logged in', () => {
        expect(service.isLead()).toBe(false);
    });

    it('should refresh user with updated member', () => {
        service.login(mockLead);
        const updatedLead = { ...mockLead, name: 'Alice Updated' };
        service.refreshUser(updatedLead);
        expect(service.getCurrentUser()?.name).toBe('Alice Updated');
    });
});
