import { TestBed } from '@angular/core/testing';
import { ThemeService } from '../../../app/core/services/theme.service';

describe('ThemeService', () => {
    let service: ThemeService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({});
        service = TestBed.inject(ThemeService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should toggle theme', () => {
        const initial = service.isDark;
        service.toggle();
        expect(service.isDark).toBe(!initial);
    });

    it('should persist theme to localStorage', () => {
        service.toggle();
        const stored = localStorage.getItem('wpt-theme');
        expect(stored).toBeTruthy();
    });

    it('should apply theme to document element', () => {
        service.toggle();
        const attr = document.documentElement.getAttribute('data-theme');
        expect(attr).toBeTruthy();
    });
});
