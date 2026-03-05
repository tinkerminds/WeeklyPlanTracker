import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Service for data management: export, import, seed, and reset.
 */
@Injectable({
    providedIn: 'root'
})
export class DataService {
    private readonly apiUrl = `${environment.apiUrl}/data`;

    constructor(private http: HttpClient) { }

    /** Export all data as JSON (downloads as file). */
    exportData(): void {
        this.http.get(`${this.apiUrl}/export`).subscribe({
            next: (data) => {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `weekly-plan-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        });
    }

    /** Import data from a JSON file. */
    importData(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/import`, data);
    }

    /** Load sample seed data. */
    seedData(): Observable<any> {
        return this.http.post(`${this.apiUrl}/seed`, {});
    }

    /** Reset all data. */
    resetData(): Observable<any> {
        return this.http.delete(`${this.apiUrl}/reset`);
    }
}
