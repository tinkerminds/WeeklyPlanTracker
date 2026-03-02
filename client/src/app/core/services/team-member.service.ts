import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { TeamMember } from '../models/team-member.model';
import { MemberRole } from '../enums/enums';
import { StorageService } from './storage.service';

/**
 * Service managing team members using browser localStorage.
 * No backend API calls — all data stays in the browser.
 */
@Injectable({
    providedIn: 'root'
})
export class TeamMemberService {
    private readonly STORAGE_KEY = 'team_members';
    private membersSubject = new BehaviorSubject<TeamMember[]>([]);

    /** Observable stream of current team members. */
    members$ = this.membersSubject.asObservable();

    constructor(private storage: StorageService) {
        // Load from localStorage on init
        this.loadFromStorage();
    }

    /** Get all active team members as an observable. */
    getAll(): Observable<TeamMember[]> {
        return this.members$;
    }

    /** Get current members array (synchronous). */
    getMembers(): TeamMember[] {
        return this.membersSubject.getValue();
    }

    /** Check if any team members exist. */
    anyExist(): boolean {
        return this.getMembers().length > 0;
    }

    /** Add a new team member. First person added becomes Lead automatically. */
    create(name: string): TeamMember {
        const members = this.getMembers();
        const isFirstMember = members.length === 0;

        const newMember: TeamMember = {
            id: this.generateId(),
            name: name.trim(),
            role: isFirstMember ? MemberRole.Lead : MemberRole.Member,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        const updated = [...members, newMember];
        this.saveAndEmit(updated);
        return newMember;
    }

    /** Update a team member's name. */
    update(id: string, name: string): TeamMember | null {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === id);
        if (index === -1) return null;

        members[index] = { ...members[index], name: name.trim() };
        this.saveAndEmit([...members]);
        return members[index];
    }

    /** Make a member the Team Lead (swaps from current Lead). */
    makeLead(id: string): boolean {
        const members = this.getMembers();
        const updated = members.map(m => ({
            ...m,
            role: m.id === id ? MemberRole.Lead : MemberRole.Member
        }));
        this.saveAndEmit(updated);
        return true;
    }

    /** Remove (deactivate) a team member. Cannot remove Lead or last member. */
    remove(id: string): { success: boolean; error?: string } {
        const members = this.getMembers();
        const member = members.find(m => m.id === id);

        if (!member) return { success: false, error: 'Member not found.' };
        if (member.role === MemberRole.Lead) return { success: false, error: 'Cannot remove the Team Lead. Reassign the Lead role first.' };
        if (members.length <= 1) return { success: false, error: 'Cannot remove the last team member.' };

        const updated = members.filter(m => m.id !== id);
        this.saveAndEmit(updated);
        return { success: true };
    }

    /** Get the current Team Lead. */
    getLead(): TeamMember | undefined {
        return this.getMembers().find(m => m.role === MemberRole.Lead);
    }

    /** Replace all members (used by seed/import). */
    setAll(members: TeamMember[]): void {
        this.saveAndEmit(members);
    }

    /** Clear all team members. */
    clearAll(): void {
        this.storage.clear(this.STORAGE_KEY);
        this.membersSubject.next([]);
    }

    private loadFromStorage(): void {
        const members = this.storage.getAll<TeamMember>(this.STORAGE_KEY);
        this.membersSubject.next(members);
    }

    private saveAndEmit(members: TeamMember[]): void {
        this.storage.saveAll(this.STORAGE_KEY, members);
        this.membersSubject.next(members);
    }

    private generateId(): string {
        return crypto.randomUUID();
    }
}
