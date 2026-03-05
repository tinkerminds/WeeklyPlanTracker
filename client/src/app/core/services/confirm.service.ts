import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    danger?: boolean;
}

/**
 * Service to show custom confirmation modals instead of browser confirm/alert.
 */
@Injectable({
    providedIn: 'root'
})
export class ConfirmService {
    private confirmSubject = new Subject<{ options: ConfirmOptions; resolve: (result: boolean) => void }>();

    /** Observable stream for the confirm modal component to subscribe to. */
    confirm$ = this.confirmSubject.asObservable();

    /** Show a confirmation modal and return a promise that resolves to true/false. */
    confirm(options: ConfirmOptions): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this.confirmSubject.next({ options, resolve });
        });
    }
}
