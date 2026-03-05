import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DataService } from '../../../app/core/services/data.service';

describe('DataService', () => {
    let service: DataService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:5297/api/data';

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(DataService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('exportData should GET export and create download', () => {
        // exportData is void and subscribes internally
        service.exportData();
        const req = httpMock.expectOne(`${apiUrl}/export`);
        expect(req.request.method).toBe('GET');
        req.flush({ teamMembers: [] });
    });

    it('importData should POST import', () => {
        const data = { teamMembers: [{ name: 'Alice' }] };
        service.importData(data).subscribe();
        const req = httpMock.expectOne(`${apiUrl}/import`);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual(data);
        req.flush({});
    });

    it('seedData should POST seed', () => {
        service.seedData().subscribe();
        const req = httpMock.expectOne(`${apiUrl}/seed`);
        expect(req.request.method).toBe('POST');
        req.flush({});
    });

    it('resetData should DELETE reset', () => {
        service.resetData().subscribe();
        const req = httpMock.expectOne(`${apiUrl}/reset`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
    });
});
