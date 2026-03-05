import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { TeamProgressComponent } from '../../../app/features/team-progress/team-progress.component';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { WeeklyPlanService } from '../../../app/core/services/weekly-plan.service';
import { PlanAssignmentService } from '../../../app/core/services/plan-assignment.service';
import { MemberRole, WeekState, BacklogCategory, AssignmentStatus } from '../../../app/core/enums/enums';
import { of } from 'rxjs';

describe('TeamProgressComponent', () => {
    let component: TeamProgressComponent;
    let fixture: ComponentFixture<TeamProgressComponent>;

    const mockPlan = {
        id: 'p1', state: WeekState.Frozen, planningDate: '2026-03-03', workStartDate: '', workEndDate: '',
        createdAt: '', clientFocusedPercent: 100, techDebtPercent: 0, rAndDPercent: 0,
        memberCount: 1, totalHours: 30, clientFocusedBudgetHours: 30, techDebtBudgetHours: 0, rAndDBudgetHours: 0,
        members: [{ id: 'm1', name: 'Alice', role: MemberRole.Lead, isPlanningDone: true }]
    };
    const mockAssignments = [
        {
            id: 'a1', weeklyPlanId: 'p1', teamMemberId: 'm1', teamMemberName: 'Alice',
            backlogItemId: 'b1', backlogItemTitle: 'Task', backlogItemCategory: BacklogCategory.ClientFocused,
            committedHours: 30, hoursCompleted: 15, status: AssignmentStatus.InProgress
        }
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TeamProgressComponent],
            providers: [
                { provide: NavigationService, useValue: { navigateTo: vi.fn() } },
                { provide: WeeklyPlanService, useValue: { getCurrent: vi.fn().mockReturnValue(of(mockPlan)) } },
                { provide: PlanAssignmentService, useValue: { getByWeek: vi.fn().mockReturnValue(of(mockAssignments)) } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TeamProgressComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load assignments', () => { expect(component.assignments.length).toBe(1); });
    it('should compute overall progress', () => { expect(component.overallPercent).toBe(50); });
    it('should compute member progress', () => {
        expect(component.members.length).toBe(1);
        expect(component.members[0].memberName).toBe('Alice');
        expect(component.members[0].committed).toBe(30);
        expect(component.members[0].done).toBe(15);
    });
    it('should compute category progress', () => {
        expect(component.categories.length).toBeGreaterThan(0);
        const client = component.categories.find(c => c.key === 'client');
        expect(client?.committed).toBe(30);
    });
    it('should get cat label', () => { expect(component.getCatLabel('ClientFocused')).toBe('Client'); });
});
