import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * All screens in the app. No URL routing — just state-driven screen switching.
 */
export type Screen =
    | 'setup'
    | 'login'
    | 'home'
    | 'manage-team'
    | 'manage-backlog'
    | 'start-week'
    | 'setup-week'
    | 'plan-my-work'
    | 'review-freeze'
    | 'update-progress'
    | 'team-progress'
    | 'past-weeks';

@Injectable({
    providedIn: 'root'
})
export class NavigationService {
    private screenSubject = new BehaviorSubject<Screen>('setup');
    private historyStack: Screen[] = [];

    /** Observable of the current screen. */
    currentScreen$: Observable<Screen> = this.screenSubject.asObservable();

    /** Navigate to a screen. */
    navigateTo(screen: Screen): void {
        const current = this.screenSubject.getValue();
        if (current !== screen) {
            this.historyStack.push(current);
        }
        this.screenSubject.next(screen);
    }

    /** Go back to the previous screen. */
    goBack(): void {
        if (this.historyStack.length > 0) {
            const prev = this.historyStack.pop()!;
            this.screenSubject.next(prev);
        }
    }

    /** Get the current screen synchronously. */
    getCurrentScreen(): Screen {
        return this.screenSubject.getValue();
    }
}
