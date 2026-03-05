import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WeeklyPlanService } from '../../../app/core/services/weekly-plan.service';
import { WeekState } from '../../../app/core/enums/enums';

describe('WeeklyPlanService', () => {
    let service: WeeklyPlanService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:5297/api/weekly-plans';

    const mockPlan = {
        id: 'p1', state: WeekState.Setup, planningDate: '2026-03-03',
        workStartDate: '', workEndDate: '', createdAt: '',
        clientFocusedPercent: 50, techDebtPercent: 30, rAndDPercent: 20,
        memberCount: 2, totalHours: 60,
        clientFocusedBudgetHours: 30, techDebtBudgetHours: 18, rAndDBudgetHours: 12,
        members: [], assignments: []
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(WeeklyPlanService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getCurrent should GET current plan', () => {
        service.getCurrent().subscribe(plan => {
            expect(plan).toBeTruthy();
        });
        const req = httpMock.expectOne(`${apiUrl}/current`);
        expect(req.request.method).toBe('GET');
        req.flush(mockPlan);
    });

    it('getPast should GET past plans', () => {
        service.getPast().subscribe(plans => {
            expect(plans.length).toBe(1);
        });
        const req = httpMock.expectOne(`${apiUrl}/past`);
        expect(req.request.method).toBe('GET');
        req.flush([mockPlan]);
    });

    it('create should POST new plan', () => {
        service.create('2026-03-03T00:00:00').subscribe(plan => {
            expect(plan.id).toBe('p1');
        });
        const req = httpMock.expectOne(apiUrl);
        expect(req.request.method).toBe('POST');
        expect(req.request.body).toEqual({ planningDate: '2026-03-03T00:00:00' });
        req.flush(mockPlan);
    });

    it('setup should PUT setup config', () => {
        const setupData = {
            planningDate: '2026-03-03', selectedMemberIds: ['1', '2'],
            clientFocusedPercent: 50, techDebtPercent: 30, rAndDPercent: 20
        };
        service.setup('p1', setupData).subscribe();
        const req = httpMock.expectOne(`${apiUrl}/p1/setup`);
        expect(req.request.method).toBe('PUT');
        req.flush(mockPlan);
    });

    it('openPlanning should PUT open-planning', () => {
        service.openPlanning('p1').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/p1/open-planning`);
        expect(req.request.method).toBe('PUT');
        req.flush(mockPlan);
    });

    it('freeze should PUT freeze', () => {
        service.freeze('p1').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/p1/freeze`);
        expect(req.request.method).toBe('PUT');
        req.flush(mockPlan);
    });

    it('complete should PUT complete', () => {
        service.complete('p1').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/p1/complete`);
        expect(req.request.method).toBe('PUT');
        req.flush(mockPlan);
    });

    it('cancel should DELETE plan', () => {
        service.cancel('p1').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/p1`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
    });

    it('togglePlanningDone should PUT toggle-planning-done', () => {
        service.togglePlanningDone('p1', 'm1').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/p1/members/m1/toggle-planning-done`);
        expect(req.request.method).toBe('PUT');
        req.flush({ isPlanningDone: true });
    });
});
