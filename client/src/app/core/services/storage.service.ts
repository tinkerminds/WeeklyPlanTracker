import { Injectable } from '@angular/core';

/**
 * Service that wraps browser localStorage for all application data.
 * All data persists across page refreshes but is cleared when browser data is cleared.
 * This avoids cloud DB conflicts since there's no authentication.
 */
@Injectable({
    providedIn: 'root'
})
export class StorageService {
    private readonly STORAGE_KEY = 'weekly_plan_tracker_data';

    /** Get the entire app state from localStorage. */
    getAll<T>(key: string): T[] {
        const data = localStorage.getItem(`${this.STORAGE_KEY}_${key}`);
        return data ? JSON.parse(data) : [];
    }

    /** Save an entire collection to localStorage. */
    saveAll<T>(key: string, items: T[]): void {
        localStorage.setItem(`${this.STORAGE_KEY}_${key}`, JSON.stringify(items));
    }

    /** Clear a specific collection. */
    clear(key: string): void {
        localStorage.removeItem(`${this.STORAGE_KEY}_${key}`);
    }

    /** Clear ALL application data from localStorage. */
    clearAll(): void {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.STORAGE_KEY));
        keys.forEach(k => localStorage.removeItem(k));
    }

    /** Export all app data as a single JSON object. */
    exportAll(): Record<string, unknown> {
        const data: Record<string, unknown> = {};
        const keys = Object.keys(localStorage).filter(k => k.startsWith(this.STORAGE_KEY));
        keys.forEach(k => {
            const shortKey = k.replace(`${this.STORAGE_KEY}_`, '');
            data[shortKey] = JSON.parse(localStorage.getItem(k) || '[]');
        });
        return data;
    }

    /** Import data from a JSON object, replacing all current data. */
    importAll(data: Record<string, unknown>): void {
        this.clearAll();
        Object.entries(data).forEach(([key, value]) => {
            localStorage.setItem(`${this.STORAGE_KEY}_${key}`, JSON.stringify(value));
        });
    }
}
