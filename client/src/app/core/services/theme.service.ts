import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
    private readonly STORAGE_KEY = 'wpt-theme';
    isDark = true;

    constructor() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        this.isDark = saved ? saved === 'dark' : true;
        this.applyTheme();
    }

    toggle(): void {
        this.isDark = !this.isDark;
        localStorage.setItem(this.STORAGE_KEY, this.isDark ? 'dark' : 'light');
        this.applyTheme();
    }

    private applyTheme(): void {
        document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
    }
}
