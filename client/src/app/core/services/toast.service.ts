import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'warning' | 'error';
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private toasts: Toast[] = [];
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    private nextId = 0;

    toasts$ = this.toastsSubject.asObservable();

    /** Show a success toast that auto-dismisses after 4 seconds. */
    success(message: string): void {
        this.show(message, 'success');
    }

    /** Show a warning toast that auto-dismisses after 4 seconds. */
    warning(message: string): void {
        this.show(message, 'warning');
    }

    /** Show an error toast that auto-dismisses after 5 seconds. */
    error(message: string): void {
        this.show(message, 'error');
    }

    /** Remove a toast by its ID. */
    dismiss(id: number): void {
        this.toasts = this.toasts.filter(t => t.id !== id);
        this.toastsSubject.next([...this.toasts]);
    }

    private show(message: string, type: Toast['type']): void {
        const id = this.nextId++;
        const toast: Toast = { id, message, type };
        this.toasts.push(toast);
        this.toastsSubject.next([...this.toasts]);

        const duration = type === 'error' ? 5000 : 4000;
        setTimeout(() => this.dismiss(id), duration);
    }
}
