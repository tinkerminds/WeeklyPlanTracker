import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PlanAssignmentService } from '../../../app/core/services/plan-assignment.service';
import { BacklogCategory, AssignmentStatus } from '../../../app/core/enums/enums';

describe('PlanAssignmentService', () => {
    let service: PlanAssignmentService;
    let httpMock: HttpTestingController;
    const apiUrl = 'http://localhost:5297/api/plan-assignments';

    const mockAssignment = {
        id: '1', weeklyPlanId: 'p1', teamMemberId: 'm1', teamMemberName: 'Alice',
        backlogItemId: 'b1', backlogItemTitle: 'Task', backlogItemCategory: BacklogCategory.ClientFocused,
        backlogItemEstimatedHours: 10,
        committedHours: 10, hoursCompleted: 0, status: AssignmentStatus.NotStarted, createdAt: ''
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting()]
        });
        service = TestBed.inject(PlanAssignmentService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getByWeek should GET assignments by plan', () => {
        service.getByWeek('p1').subscribe(assignments => {
            expect(assignments.length).toBe(1);
        });
        const req = httpMock.expectOne(`${apiUrl}/week/p1`);
        expect(req.request.method).toBe('GET');
        req.flush([mockAssignment]);
    });

    it('getByWeekAndMember should GET filtered assignments', () => {
        service.getByWeekAndMember('p1', 'm1').subscribe(assignments => {
            expect(assignments.length).toBe(1);
        });
        const req = httpMock.expectOne(`${apiUrl}/week/p1/member/m1`);
        expect(req.request.method).toBe('GET');
        req.flush([mockAssignment]);
    });

    it('create should POST new assignment', () => {
        const body = { weeklyPlanId: 'p1', teamMemberId: 'm1', backlogItemId: 'b1', committedHours: 8 };
        service.create(body).subscribe(a => {
            expect(a.committedHours).toBe(10);
        });
        const req = httpMock.expectOne(apiUrl);
        expect(req.request.method).toBe('POST');
        req.flush(mockAssignment);
    });

    it('update should PUT hours', () => {
        service.update('1', 15).subscribe();
        const req = httpMock.expectOne(`${apiUrl}/1`);
        expect(req.request.method).toBe('PUT');
        expect(req.request.body).toEqual({ committedHours: 15 });
        req.flush({});
    });

    it('delete should DELETE assignment', () => {
        service.delete('1').subscribe();
        const req = httpMock.expectOne(`${apiUrl}/1`);
        expect(req.request.method).toBe('DELETE');
        req.flush({});
    });

    it('updateProgress should PUT progress', () => {
        const body = { hoursCompleted: 5, status: AssignmentStatus.InProgress as any as string, notes: 'WIP' };
        service.updateProgress('1', body).subscribe();
        const req = httpMock.expectOne(`${apiUrl}/1/progress`);
        expect(req.request.method).toBe('PUT');
        req.flush({});
    });
});
