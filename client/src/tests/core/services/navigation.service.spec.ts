import { TestBed } from '@angular/core/testing';
import { NavigationService } from '../../../app/core/services/navigation.service';

describe('NavigationService', () => {
    let service: NavigationService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(NavigationService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should start on login screen', () => {
        let screen: string | undefined;
        service.currentScreen$.subscribe(s => screen = s);
        expect(screen).toBeTruthy();
    });

    it('should navigate to a new screen', () => {
        service.navigateTo('home');
        let current: string | undefined;
        service.currentScreen$.subscribe(s => current = s);
        expect(current).toBe('home');
    });

    it('should go back to previous screen', () => {
        service.navigateTo('home');
        service.navigateTo('manage-team');
        service.goBack();
        let current: string | undefined;
        service.currentScreen$.subscribe(s => current = s);
        expect(current).toBe('home');
    });

    it('should not go back beyond initial screen', () => {
        const initial = service.getCurrentScreen();
        service.goBack();
        expect(service.getCurrentScreen()).toBe(initial);
    });

    it('should return current screen', () => {
        service.navigateTo('manage-backlog');
        expect(service.getCurrentScreen()).toBe('manage-backlog');
    });

    it('should maintain history stack', () => {
        service.navigateTo('home');
        service.navigateTo('manage-team');
        service.navigateTo('manage-backlog');
        service.goBack();
        expect(service.getCurrentScreen()).toBe('manage-team');
        service.goBack();
        expect(service.getCurrentScreen()).toBe('home');
    });
});
