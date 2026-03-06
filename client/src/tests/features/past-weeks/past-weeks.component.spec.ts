import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PastWeeksComponent } from '../../../app/features/past-weeks/past-weeks.component';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { WeeklyPlanService } from '../../../app/core/services/weekly-plan.service';
import { PlanAssignmentService } from '../../../app/core/services/plan-assignment.service';
import { DataService } from '../../../app/core/services/data.service';
import { ToastService } from '../../../app/core/services/toast.service';
import { WeekState, MemberRole, BacklogCategory, AssignmentStatus } from '../../../app/core/enums/enums';
import { of } from 'rxjs';

describe('PastWeeksComponent', () => {
    let component: PastWeeksComponent;
    let fixture: ComponentFixture<PastWeeksComponent>;

    const mockWeeks = [{
        id: 'w1', planningDate: '2026-02-25', workStartDate: '2026-02-26', workEndDate: '2026-02-28',
        state: WeekState.Completed, clientFocusedPercent: 50, techDebtPercent: 30, rAndDPercent: 20,
        createdAt: '', memberCount: 2, totalHours: 60,
        clientFocusedBudgetHours: 30, techDebtBudgetHours: 18, rAndDBudgetHours: 12,
        members: [{ id: 'm1', name: 'Alice', role: MemberRole.Lead, isPlanningDone: true }],
        assignments: []
    }];

    const mockAssignments = [
        {
            id: 'a1', weeklyPlanId: 'w1', teamMemberId: 'm1', teamMemberName: 'Alice',
            backlogItemId: 'b1', backlogItemTitle: 'Task A',
            backlogItemCategory: BacklogCategory.ClientFocused,
            committedHours: 30, hoursCompleted: 25, status: AssignmentStatus.Done
        }
    ];

    const mockPlanAssignment = { getByWeek: vi.fn().mockReturnValue(of(mockAssignments)) };

    beforeEach(async () => {
        vi.clearAllMocks();
        mockPlanAssignment.getByWeek.mockReturnValue(of(mockAssignments));

        await TestBed.configureTestingModule({
            imports: [PastWeeksComponent],
            providers: [
                { provide: NavigationService, useValue: { navigateTo: vi.fn() } },
                { provide: WeeklyPlanService, useValue: { getPast: vi.fn().mockReturnValue(of(mockWeeks)) } },
                { provide: PlanAssignmentService, useValue: mockPlanAssignment },
                { provide: DataService, useValue: { exportData: vi.fn(), importData: vi.fn() } },
                { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PastWeeksComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load past weeks', () => { expect(component.weeks.length).toBe(1); });

    it('should select a week and fetch assignments', () => {
        component.selectWeek(mockWeeks[0] as any);
        expect(mockPlanAssignment.getByWeek).toHaveBeenCalledWith('w1');
        expect(component.selectedWeek).toBeTruthy();
    });



    it('should toggle category expand', () => {
        component.toggleCatExpand('client');
        expect(component.expandedCat).toBe('client');
        component.toggleCatExpand('client');
        expect(component.expandedCat).toBeNull();
    });

    it('should format date', () => {
        const formatted = component.formatDate('2026-02-25');
        expect(formatted).toBeTruthy();
    });

    it('should get category label', () => {
        expect(component.getCatLabel('ClientFocused')).toBe('Client');
        expect(component.getCatLabel('TechDebt')).toBe('Tech Debt');
        expect(component.getCatLabel('RAndD')).toBe('R&D');
    });
});
