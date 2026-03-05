import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PlanMyWorkComponent } from '../../../app/features/plan-my-work/plan-my-work.component';
import { AuthService } from '../../../app/core/services/auth.service';
import { WeeklyPlanService } from '../../../app/core/services/weekly-plan.service';
import { PlanAssignmentService } from '../../../app/core/services/plan-assignment.service';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { ToastService } from '../../../app/core/services/toast.service';
import { MemberRole, WeekState, BacklogCategory, AssignmentStatus } from '../../../app/core/enums/enums';
import { of } from 'rxjs';

describe('PlanMyWorkComponent', () => {
    let component: PlanMyWorkComponent;
    let fixture: ComponentFixture<PlanMyWorkComponent>;
    const mockNav = { navigateTo: vi.fn() };
    const mockPlanAssignment = { getByWeek: vi.fn(), getByWeekAndMember: vi.fn(), delete: vi.fn() };

    const mockPlan = {
        id: 'p1', state: WeekState.PlanningOpen, planningDate: '', workStartDate: '', workEndDate: '', createdAt: '',
        clientFocusedPercent: 50, techDebtPercent: 30, rAndDPercent: 20, memberCount: 2, totalHours: 60,
        clientFocusedBudgetHours: 30, techDebtBudgetHours: 18, rAndDBudgetHours: 12,
        members: [{ id: 'm1', name: 'Alice', role: MemberRole.Lead, isPlanningDone: false }]
    };

    const mockAssignments = [
        {
            id: 'a1', weeklyPlanId: 'p1', teamMemberId: 'm1', teamMemberName: 'Alice',
            backlogItemId: 'b1', backlogItemTitle: 'Task', backlogItemCategory: BacklogCategory.ClientFocused,
            committedHours: 10, hoursCompleted: 0, status: AssignmentStatus.NotStarted
        }
    ];

    beforeEach(async () => {
        mockPlanAssignment.getByWeek.mockReturnValue(of(mockAssignments));
        mockPlanAssignment.getByWeekAndMember.mockReturnValue(of(mockAssignments));

        await TestBed.configureTestingModule({
            imports: [PlanMyWorkComponent],
            providers: [
                { provide: AuthService, useValue: { getCurrentUser: () => ({ id: 'm1', name: 'Alice', role: MemberRole.Lead }) } },
                { provide: WeeklyPlanService, useValue: { getCurrent: vi.fn().mockReturnValue(of(mockPlan)) } },
                { provide: PlanAssignmentService, useValue: mockPlanAssignment },
                { provide: NavigationService, useValue: mockNav },
                { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PlanMyWorkComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load plan and assignments', () => { expect(component.currentPlan).toBeTruthy(); expect(component.myAssignments.length).toBe(1); });
    it('should compute total committed hours', () => { expect(component.totalCommitted).toBe(10); });
    it('should compute client claimed hours', () => { expect(component.clientClaimed).toBe(10); });
    it('should compute tech debt claimed hours', () => { expect(component.techDebtClaimed).toBe(0); });
    it('should compute R&D claimed hours', () => { expect(component.rndClaimed).toBe(0); });
    it('should get category label', () => { expect(component.getCategoryLabel(BacklogCategory.ClientFocused)).toBe('Client Focused'); });
    it('should remove assignment', () => {
        mockPlanAssignment.delete.mockReturnValue(of(void 0));
        component.removeAssignment(mockAssignments[0] as any);
        expect(mockPlanAssignment.delete).toHaveBeenCalledWith('a1');
    });
});
