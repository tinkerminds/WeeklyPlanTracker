import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TeamMember } from '../models/team-member.model';
import { MemberRole } from '../enums/enums';

/**
 * Tracks the currently logged-in user via sessionStorage.
 * Uses sessionStorage (not localStorage) so closing the browser tab logs out.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly SESSION_KEY = 'weekly_plan_tracker_current_user';
    private currentUserSubject = new BehaviorSubject<TeamMember | null>(null);

    currentUser$ = this.currentUserSubject.asObservable();

    constructor() {
        this.loadFromSession();
    }

    /** Log in as a team member. */
    login(member: TeamMember): void {
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(member));
        this.currentUserSubject.next(member);
    }

    /** Log out the current user. */
    logout(): void {
        sessionStorage.removeItem(this.SESSION_KEY);
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
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(updatedMember));
        this.currentUserSubject.next(updatedMember);
    }

    private loadFromSession(): void {
        const data = sessionStorage.getItem(this.SESSION_KEY);
        if (data) {
            this.currentUserSubject.next(JSON.parse(data));
        }
    }
}
