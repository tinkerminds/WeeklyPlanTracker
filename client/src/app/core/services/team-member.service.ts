import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, firstValueFrom } from 'rxjs';
import { TeamMember } from '../models/team-member.model';
import { MemberRole } from '../enums/enums';
import { environment } from '../../../environments/environment';

/**
 * Service managing team members via the .NET REST API.
 * Uses BehaviorSubject for reactive updates after each API call.
 */
@Injectable({
    providedIn: 'root'
})
export class TeamMemberService {
    private readonly apiUrl = `${environment.apiUrl}/team-members`;
    private membersSubject = new BehaviorSubject<TeamMember[]>([]);

    /** Observable stream of current team members. */
    members$ = this.membersSubject.asObservable();

    constructor(private http: HttpClient) {
        this.refresh();
    }

    /** Refresh the local cache from the API. */
    refresh(): void {
        this.http.get<TeamMember[]>(this.apiUrl).subscribe({
            next: members => this.membersSubject.next(members),
            error: () => { } // Silent fail on initial load (API might not be ready)
        });
    }

    /** Get current members array (synchronous from cache). */
    getMembers(): TeamMember[] {
        return this.membersSubject.getValue();
    }

    /** Check if any team members exist. */
    anyExist(): boolean {
        return this.getMembers().length > 0;
    }

    /** Add a new team member via API. First person becomes Lead automatically. */
    create(name: string): Observable<TeamMember> {
        return this.http.post<TeamMember>(this.apiUrl, { name }).pipe(
            tap(() => this.refresh())
        );
    }

    /** Update a team member's name. */
    update(id: string, name: string): Observable<TeamMember> {
        return this.http.put<TeamMember>(`${this.apiUrl}/${id}`, { name }).pipe(
            tap(() => this.refresh())
        );
    }

    /** Make a member the Team Lead. */
    makeLead(id: string): Observable<TeamMember> {
        return this.http.put<TeamMember>(`${this.apiUrl}/${id}/make-lead`, {}).pipe(
            tap(() => this.refresh())
        );
    }

    /** Remove (deactivate) a team member. */
    remove(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.refresh())
        );
    }

    /** Check if any members exist (API call). */
    checkExists(): Observable<boolean> {
        return this.http.get<boolean>(`${this.apiUrl}/exists`);
    }

    /** Get all active team members from the API. */
    getAll(): Observable<TeamMember[]> {
        return this.http.get<TeamMember[]>(this.apiUrl);
    }

    /** Bulk-save team members (for setup flow). Returns Promise that resolves when all are created. */
    async bulkCreate(members: { name: string; role: MemberRole }[]): Promise<void> {
        for (const member of members) {
            const created = await firstValueFrom(
                this.http.post<TeamMember>(this.apiUrl, { name: member.name })
            );
            // If this member should be lead and isn't, make them lead
            if (member.role === MemberRole.Lead && created.role !== MemberRole.Lead) {
                await firstValueFrom(
                    this.http.put<TeamMember>(`${this.apiUrl}/${created.id}/make-lead`, {})
                );
            }
        }
        this.refresh();
    }
}
