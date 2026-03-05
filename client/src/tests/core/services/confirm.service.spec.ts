import { TestBed } from '@angular/core/testing';
import { ConfirmService } from '../../../app/core/services/confirm.service';

describe('ConfirmService', () => {
    let service: ConfirmService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ConfirmService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should emit confirm data and resolve true on confirm', async () => {
        let emittedData: any;
        service.confirm$.subscribe(data => emittedData = data);

        const promise = service.confirm({
            title: 'Test',
            message: 'Are you sure?',
            confirmText: 'Yes',
            cancelText: 'No'
        });

        expect(emittedData).toBeTruthy();
        expect(emittedData.options.title).toBe('Test');

        emittedData.resolve(true);
        const result = await promise;
        expect(result).toBe(true);
    });

    it('should resolve false on cancel', async () => {
        let emittedData: any;
        service.confirm$.subscribe(data => emittedData = data);

        const promise = service.confirm({
            title: 'Delete?',
            message: 'Gone forever.',
            confirmText: 'Delete',
            cancelText: 'Keep'
        });

        emittedData.resolve(false);
        const result = await promise;
        expect(result).toBe(false);
    });
});
