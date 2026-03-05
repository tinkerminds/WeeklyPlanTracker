import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ToastService } from '../../../app/core/services/toast.service';

describe('ToastService', () => {
    let service: ToastService;

    beforeEach(() => {
        service = new ToastService();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should add a success toast', () => {
        service.success('Done!');
        let toasts: any[] = [];
        service.toasts$.subscribe(t => toasts = t);
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('success');
        expect(toasts[0].message).toBe('Done!');
    });

    it('should add a warning toast', () => {
        service.warning('Careful!');
        let toasts: any[] = [];
        service.toasts$.subscribe(t => toasts = t);
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('warning');
    });

    it('should add an error toast', () => {
        service.error('Failed!');
        let toasts: any[] = [];
        service.toasts$.subscribe(t => toasts = t);
        expect(toasts.length).toBe(1);
        expect(toasts[0].type).toBe('error');
    });

    it('should allow multiple toasts', () => {
        service.success('A');
        service.error('B');
        let toasts: any[] = [];
        service.toasts$.subscribe(t => toasts = t);
        expect(toasts.length).toBe(2);
    });

    it('should dismiss a toast by id', () => {
        service.success('A');
        let toasts: any[] = [];
        service.toasts$.subscribe(t => toasts = t);
        const id = toasts[0].id;
        service.dismiss(id);
        service.toasts$.subscribe(t => toasts = t);
        expect(toasts.find((t: any) => t.id === id)).toBeUndefined();
    });

    it('should auto-dismiss toasts after timeout', async () => {
        vi.useFakeTimers();
        service.success('Auto!');
        let toasts: any[] = [];
        service.toasts$.subscribe(t => toasts = t);
        expect(toasts.length).toBe(1);
        vi.advanceTimersByTime(5000);
        service.toasts$.subscribe(t => toasts = t);
        expect(toasts.length).toBe(0);
        vi.useRealTimers();
    });
});
