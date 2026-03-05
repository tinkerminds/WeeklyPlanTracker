import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BacklogService } from '../../../app/core/services/backlog.service';
import { BacklogCategory } from '../../../app/core/enums/enums';

describe('BacklogService', () => {
    let service: BacklogService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:5297/api/backlog-items';

    const mockItem = {
        id: '1', title: 'Task 1', description: '', category: BacklogCategory.ClientFocused,
        estimatedHours: 10, isArchived: false, createdAt: ''
    };
    const mockArchivedItem = {
        id: '2', title: 'Task 2', description: '', category: BacklogCategory.TechDebt,
        estimatedHours: 5, isArchived: true, createdAt: ''
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(BacklogService);
        httpMock = TestBed.inject(HttpTestingController);

        // Constructor calls refresh(true) which makes a GET with includeArchived param
        const initReq = httpMock.expectOne(req => req.url === apiUrl && req.method === 'GET');
        initReq.flush([mockItem, mockArchivedItem]);
    });

    afterEach(() => httpMock.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getItems should return all cached items', () => {
        const items = service.getItems();
        expect(items.length).toBe(2);
    });

    it('getActiveItems should filter out archived items', () => {
        const active = service.getActiveItems();
        expect(active.length).toBe(1);
        expect(active[0].id).toBe('1');
    });

    it('create should POST item and trigger refresh', () => {
        const body = { title: 'New', description: 'Desc', category: BacklogCategory.TechDebt, estimatedHours: 5 };
        service.create(body).subscribe(item => {
            expect(item.title).toBe('New');
        });
        const req = httpMock.expectOne(req => req.method === 'POST' && req.url === apiUrl);
        req.flush({ ...mockItem, ...body });

        // flush refresh GET from tap
        const refreshReq = httpMock.expectOne(req => req.url === apiUrl && req.method === 'GET');
        refreshReq.flush([]);
    });

    it('update should PUT item and trigger refresh', () => {
        const body = { title: 'Updated', description: '', category: BacklogCategory.RAndD, estimatedHours: 8 };
        service.update('1', body).subscribe();
        const req = httpMock.expectOne(`${apiUrl}/1`);
        expect(req.request.method).toBe('PUT');
        req.flush({});

        // flush refresh GET from tap
        const refreshReq = httpMock.expectOne(req => req.url === apiUrl && req.method === 'GET');
        refreshReq.flush([]);
    });

    it('delete should DELETE item and trigger refresh', () => {
        service.delete('1').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/1`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});

        // flush refresh GET from tap
        const refreshReq = httpMock.expectOne(req => req.url === apiUrl && req.method === 'GET');
        refreshReq.flush([]);
    });

    it('archive should PUT archive and trigger refresh', () => {
        service.archive('1').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/1/archive`);
        expect(req.request.method).toBe('PUT');
        req.flush({});

        // flush refresh GET from tap
        const refreshReq = httpMock.expectOne(req => req.url === apiUrl && req.method === 'GET');
        refreshReq.flush([]);
    });

    it('unarchive should PUT unarchive and trigger refresh', () => {
        service.unarchive('1').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/1/unarchive`);
        expect(req.request.method).toBe('PUT');
        req.flush({});

        // flush refresh GET from tap
        const refreshReq = httpMock.expectOne(req => req.url === apiUrl && req.method === 'GET');
        refreshReq.flush([]);
    });

    it('refresh should update items$ observable', () => {
        service.refresh();
        const req = httpMock.expectOne(req => req.url === apiUrl && req.method === 'GET');
        req.flush([mockItem]);
        let result: any[] = [];
        service.items$.subscribe(items => result = items);
        expect(result.length).toBe(1);
    });
});
