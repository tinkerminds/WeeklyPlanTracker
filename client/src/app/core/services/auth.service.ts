import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TeamMember } from '../models/team-member.model';
import { MemberRole } from '../enums/enums';

/**
 * Tracks the currently logged-in user in memory only.
 * Page refresh = must re-select user on "Who are you?" screen.
 * No browser storage used — all team data lives in Azure SQL via the API.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<TeamMember | null>(null);

    /** Observable of the current logged-in user. */
    currentUser$ = this.currentUserSubject.asObservable();

    /** Log in as a team member (in-memory only). */
    login(member: TeamMember): void {
        this.currentUserSubject.next(member);
    }

    /** Log out the current user. */
    logout(): void {
        this.currentUserSubject.next(null);
    }

    /** Get the current user synchronously. */
    getCurrentUser(): TeamMember | null {
        return this.currentUserSubject.getValue();
    }

    /** Check if a user is logged in. */
    isLoggedIn(): boolean {
        return this.getCurrentUser() !== null;
    }

    /** Check if the current user is the Team Lead. */
    isLead(): boolean {
        return this.getCurrentUser()?.role === MemberRole.Lead;
    }

    /** Update the stored user (e.g., when role changes). */
    refreshUser(updatedMember: TeamMember): void {
        this.currentUserSubject.next(updatedMember);
    }
}
