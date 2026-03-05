import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ReviewFreezeComponent } from '../../../app/features/review-freeze/review-freeze.component';
import { WeeklyPlanService } from '../../../app/core/services/weekly-plan.service';
import { PlanAssignmentService } from '../../../app/core/services/plan-assignment.service';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { ToastService } from '../../../app/core/services/toast.service';
import { ConfirmService } from '../../../app/core/services/confirm.service';
import { MemberRole, WeekState, BacklogCategory, AssignmentStatus } from '../../../app/core/enums/enums';
import { of } from 'rxjs';

describe('ReviewFreezeComponent', () => {
    let component: ReviewFreezeComponent;
    let fixture: ComponentFixture<ReviewFreezeComponent>;
    const mockWeeklyPlan = { getCurrent: vi.fn(), freeze: vi.fn(), cancel: vi.fn() };

    const mockPlan = {
        id: 'p1', state: WeekState.PlanningOpen, planningDate: '', workStartDate: '', workEndDate: '',
        createdAt: '', clientFocusedPercent: 100, techDebtPercent: 0, rAndDPercent: 0,
        memberCount: 1, totalHours: 30, clientFocusedBudgetHours: 30, techDebtBudgetHours: 0, rAndDBudgetHours: 0,
        members: [{ id: 'm1', name: 'Alice', role: MemberRole.Lead, isPlanningDone: true }]
    };
    const mockAssignments = [
        {
            id: 'a1', weeklyPlanId: 'p1', teamMemberId: 'm1', teamMemberName: 'Alice',
            backlogItemId: 'b1', backlogItemTitle: 'Task', backlogItemCategory: BacklogCategory.ClientFocused,
            committedHours: 30, hoursCompleted: 0, status: AssignmentStatus.NotStarted
        }
    ];

    beforeEach(async () => {
        mockWeeklyPlan.getCurrent.mockReturnValue(of(mockPlan));

        await TestBed.configureTestingModule({
            imports: [ReviewFreezeComponent],
            providers: [
                { provide: WeeklyPlanService, useValue: mockWeeklyPlan },
                { provide: PlanAssignmentService, useValue: { getByWeek: vi.fn().mockReturnValue(of(mockAssignments)) } },
                { provide: NavigationService, useValue: { navigateTo: vi.fn() } },
                { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
                { provide: ConfirmService, useValue: { confirm: vi.fn() } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ReviewFreezeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load plan and assignments', () => { expect(component.currentPlan).toBeTruthy(); expect(component.allAssignments.length).toBe(1); });
    it('should compute member hours', () => { expect(component.getMemberHours('m1')).toBe(30); });
    it('should get member assignments', () => { expect(component.getMemberAssignments('m1').length).toBe(1); });
    it('should compute client planned hours', () => { expect(component.clientPlanned).toBe(30); });
    it('should compute tech debt planned hours', () => { expect(component.techDebtPlanned).toBe(0); });
    it('should compute R&D planned hours', () => { expect(component.rndPlanned).toBe(0); });
    it('should freeze plan', () => {
        mockWeeklyPlan.freeze.mockReturnValue(of({}));
        component.freezePlan();
        expect(mockWeeklyPlan.freeze).toHaveBeenCalledWith('p1');
    });
    it('should get category label', () => { expect(component.getCategoryLabel(BacklogCategory.TechDebt)).toBe('Tech Debt'); });
});
