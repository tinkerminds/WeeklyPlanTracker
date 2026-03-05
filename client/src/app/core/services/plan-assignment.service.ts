import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BacklogCategory, AssignmentStatus } from '../enums/enums';

/// Plan assignment response from the API.
export interface PlanAssignment {
    id: string;
    weeklyPlanId: string;
    teamMemberId: string;
    teamMemberName: string;
    backlogItemId: string;
    backlogItemTitle: string;
    backlogItemCategory: BacklogCategory;
    backlogItemEstimatedHours: number;
    committedHours: number;
    hoursCompleted: number;
    status: AssignmentStatus;
    createdAt: string;
}

/**
 * Service managing plan assignments via the .NET REST API.
 * Wraps all PlanAssignmentsController endpoints.
 */
@Injectable({
    providedIn: 'root'
})
export class PlanAssignmentService {
    private readonly apiUrl = `${environment.apiUrl}/plan-assignments`;

    constructor(private http: HttpClient) { }

    /** Get all assignments for a weekly plan. */
    getByWeek(weeklyPlanId: string): Observable<PlanAssignment[]> {
        return this.http.get<PlanAssignment[]>(`${this.apiUrl}/week/${weeklyPlanId}`);
    }

    /** Get assignments for a specific member in a weekly plan. */
    getByWeekAndMember(weeklyPlanId: string, memberId: string): Observable<PlanAssignment[]> {
        return this.http.get<PlanAssignment[]>(`${this.apiUrl}/week/${weeklyPlanId}/member/${memberId}`);
    }

    /** Get a single assignment by ID. */
    getById(id: string): Observable<PlanAssignment> {
        return this.http.get<PlanAssignment>(`${this.apiUrl}/${id}`);
    }

    /** Create a new assignment (add a backlog item to a member's plan). */
    create(data: { weeklyPlanId: string; teamMemberId: string; backlogItemId: string; committedHours: number }): Observable<PlanAssignment> {
        return this.http.post<PlanAssignment>(this.apiUrl, data);
    }

    /** Update committed hours on an assignment. */
    update(id: string, committedHours: number): Observable<PlanAssignment> {
        return this.http.put<PlanAssignment>(`${this.apiUrl}/${id}`, { committedHours });
    }

    /** Remove an assignment. */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    /** Update progress (hours done + status) on an assignment. */
    updateProgress(id: string, data: { hoursCompleted: number; status: string; notes?: string }): Observable<PlanAssignment> {
        return this.http.put<PlanAssignment>(`${this.apiUrl}/${id}/progress`, data);
    }
}
