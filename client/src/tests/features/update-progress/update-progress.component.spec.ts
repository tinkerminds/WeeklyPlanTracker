import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { UpdateProgressComponent } from '../../../app/features/update-progress/update-progress.component';
import { AuthService } from '../../../app/core/services/auth.service';
import { WeeklyPlanService } from '../../../app/core/services/weekly-plan.service';
import { PlanAssignmentService } from '../../../app/core/services/plan-assignment.service';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { ToastService } from '../../../app/core/services/toast.service';
import { MemberRole, WeekState, BacklogCategory, AssignmentStatus } from '../../../app/core/enums/enums';
import { of } from 'rxjs';

describe('UpdateProgressComponent', () => {
    let component: UpdateProgressComponent;
    let fixture: ComponentFixture<UpdateProgressComponent>;
    const mockPlanAssignment = { getByWeekAndMember: vi.fn(), updateProgress: vi.fn() };

    const mockPlan = {
        id: 'p1', state: WeekState.Frozen, planningDate: '', workStartDate: '', workEndDate: '',
        createdAt: '', clientFocusedPercent: 50, techDebtPercent: 30, rAndDPercent: 20,
        memberCount: 2, totalHours: 60, clientFocusedBudgetHours: 30, techDebtBudgetHours: 18, rAndDBudgetHours: 12,
        members: [{ id: 'm1', name: 'Alice', role: MemberRole.Lead, isPlanningDone: true }]
    };
    const mockAssignments = [
        {
            id: 'a1', weeklyPlanId: 'p1', teamMemberId: 'm1', teamMemberName: 'Alice',
            backlogItemId: 'b1', backlogItemTitle: 'Task', backlogItemCategory: BacklogCategory.ClientFocused,
            committedHours: 20, hoursCompleted: 5, status: AssignmentStatus.InProgress
        }
    ];

    beforeEach(async () => {
        mockPlanAssignment.getByWeekAndMember.mockReturnValue(of(mockAssignments));

        await TestBed.configureTestingModule({
            imports: [UpdateProgressComponent, FormsModule],
            providers: [
                { provide: AuthService, useValue: { getCurrentUser: () => ({ id: 'm1', name: 'Alice', role: MemberRole.Lead }) } },
                { provide: WeeklyPlanService, useValue: { getCurrent: vi.fn().mockReturnValue(of(mockPlan)) } },
                { provide: PlanAssignmentService, useValue: mockPlanAssignment },
                { provide: NavigationService, useValue: { navigateTo: vi.fn() } },
                { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(UpdateProgressComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load assignments', () => { expect(component.myAssignments.length).toBe(1); });
    it('should compute total committed', () => { expect(component.totalCommitted).toBe(20); });
    it('should compute total done', () => { expect(component.totalDone).toBe(5); });
    it('should update task progress', () => {
        mockPlanAssignment.updateProgress.mockReturnValue(of(mockAssignments[0]));
        component.progressData['a1'] = { hoursCompleted: 10, status: AssignmentStatus.InProgress };
        component.updateTask(mockAssignments[0] as any);
        expect(mockPlanAssignment.updateProgress).toHaveBeenCalledWith('a1', expect.objectContaining({ hoursCompleted: 10 }));
    });
    it('should get category label', () => { expect(component.getCategoryLabel(BacklogCategory.ClientFocused)).toBe('Client Focused'); });
    it('should get cat class', () => { expect(component.getCatClass(BacklogCategory.TechDebt)).toBeTruthy(); });
});
