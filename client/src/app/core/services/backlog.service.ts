import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { BacklogCategory } from '../enums/enums';
import { environment } from '../../../environments/environment';

/// <summary>Backlog item model matching the API response.</summary>
export interface BacklogItem {
    id: string;
    title: string;
    description: string | null;
    category: BacklogCategory;
    estimatedHours: number;
    isArchived: boolean;
    createdAt: string;
}

/**
 * Service managing backlog items via the .NET REST API.
 * Uses BehaviorSubject for reactive updates after each API call.
 */
@Injectable({
    providedIn: 'root'
})
export class BacklogService {
    private readonly apiUrl = `${environment.apiUrl}/backlog-items`;
    private itemsSubject = new BehaviorSubject<BacklogItem[]>([]);

    /** Observable stream of all backlog items (non-archived by default). */
    items$ = this.itemsSubject.asObservable();

    constructor(private http: HttpClient) {
        this.refresh();
    }

    /** Refresh items from the API (includes archived for full list). */
    refresh(includeArchived = true): void {
        let params = new HttpParams();
        if (includeArchived) params = params.set('includeArchived', 'true');

        this.http.get<BacklogItem[]>(this.apiUrl, { params }).subscribe({
            next: items => this.itemsSubject.next(items),
            error: () => { }
        });
    }

    /** Get all items from cache. */
    getItems(): BacklogItem[] {
        return this.itemsSubject.getValue();
    }

    /** Get non-archived items from cache. */
    getActiveItems(): BacklogItem[] {
        return this.getItems().filter(i => !i.isArchived);
    }

    /** Create a new backlog item. */
    create(item: { title: string; description?: string; category: BacklogCategory; estimatedHours: number }): Observable<BacklogItem> {
        return this.http.post<BacklogItem>(this.apiUrl, item).pipe(
            tap(() => this.refresh())
        );
    }

    /** Update a backlog item. */
    update(id: string, item: { title: string; description?: string; category: BacklogCategory; estimatedHours: number }): Observable<BacklogItem> {
        return this.http.put<BacklogItem>(`${this.apiUrl}/${id}`, item).pipe(
            tap(() => this.refresh())
        );
    }

    /** Archive a backlog item. */
    archive(id: string): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}/archive`, {}).pipe(
            tap(() => this.refresh())
        );
    }

    /** Unarchive a backlog item. */
    unarchive(id: string): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}/unarchive`, {}).pipe(
            tap(() => this.refresh())
        );
    }

    /** Delete a backlog item permanently. */
    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
            tap(() => this.refresh())
        );
    }
}
