import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WeeklyPlan } from '../models/weekly-plan.model';
import { environment } from '../../../environments/environment';

/**
 * Service for managing weekly plans via the .NET REST API.
 */
@Injectable({
    providedIn: 'root'
})
export class WeeklyPlanService {
    private readonly apiUrl = `${environment.apiUrl}/weekly-plans`;

    constructor(private http: HttpClient) { }

    /** Get the current active weekly plan. */
    getCurrent(): Observable<WeeklyPlan | null> {
        return this.http.get<WeeklyPlan | null>(`${this.apiUrl}/current`);
    }

    /** Get all completed weekly plans. */
    getPast(): Observable<WeeklyPlan[]> {
        return this.http.get<WeeklyPlan[]>(`${this.apiUrl}/past`);
    }

    /** Create a new weekly plan (start a new week). */
    create(planningDate: string): Observable<WeeklyPlan> {
        return this.http.post<WeeklyPlan>(this.apiUrl, { planningDate });
    }

    /** Configure plan during Setup phase (members, date, percentages). */
    setup(id: string, data: {
        planningDate: string;
        selectedMemberIds: string[];
        clientFocusedPercent: number;
        techDebtPercent: number;
        rAndDPercent: number;
    }): Observable<WeeklyPlan> {
        return this.http.put<WeeklyPlan>(`${this.apiUrl}/${id}/setup`, data);
    }

    /** Transition Setup → PlanningOpen. */
    openPlanning(id: string): Observable<WeeklyPlan> {
        return this.http.put<WeeklyPlan>(`${this.apiUrl}/${id}/open-planning`, {});
    }

    /** Freeze the plan (PlanningOpen → Frozen). */
    freeze(id: string): Observable<WeeklyPlan> {
        return this.http.put<WeeklyPlan>(`${this.apiUrl}/${id}/freeze`, {});
    }

    /** Complete the week (Frozen → Completed). */
    complete(id: string): Observable<WeeklyPlan> {
        return this.http.put<WeeklyPlan>(`${this.apiUrl}/${id}/complete`, {});
    }

    /** Cancel a weekly plan. */
    cancel(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /** Toggle "I'm done planning" status for a member. */
    togglePlanningDone(planId: string, memberId: string): Observable<{ isPlanningDone: boolean }> {
        return this.http.put<{ isPlanningDone: boolean }>(
            `${this.apiUrl}/${planId}/members/${memberId}/toggle-planning-done`, {}
        );
    }

    /** Add a member to the current plan. */
    addMember(planId: string, memberId: string): Observable<WeeklyPlan> {
        return this.http.post<WeeklyPlan>(
            `${this.apiUrl}/${planId}/members/${memberId}`, {}
        );
    }

    /** Remove a member from the current plan. */
    removeMember(planId: string, memberId: string): Observable<WeeklyPlan> {
        return this.http.delete<WeeklyPlan>(
            `${this.apiUrl}/${planId}/members/${memberId}`
        );
    }
}
