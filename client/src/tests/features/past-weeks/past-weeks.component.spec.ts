import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PastWeeksComponent } from '../../../app/features/past-weeks/past-weeks.component';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { WeeklyPlanService } from '../../../app/core/services/weekly-plan.service';
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
        assignments: [
            {
                id: 'a1', teamMemberId: 'm1', teamMemberName: 'Alice', backlogItemId: 'b1', backlogItemTitle: 'T',
                backlogItemCategory: BacklogCategory.ClientFocused, committedHours: 30, hoursCompleted: 25, status: AssignmentStatus.Done
            }
        ]
    }];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PastWeeksComponent],
            providers: [
                { provide: NavigationService, useValue: { navigateTo: vi.fn() } },
                { provide: WeeklyPlanService, useValue: { getPast: vi.fn().mockReturnValue(of(mockWeeks)) } },
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
    it('should toggle expand', () => {
        component.toggleExpand('w1');
        expect(component.expandedId).toBe('w1');
        component.toggleExpand('w1');
        expect(component.expandedId).toBeNull();
    });
    it('should format date', () => {
        const formatted = component.formatDate('2026-02-25');
        expect(formatted).toBeTruthy();
    });
    it('should get member summary', () => {
        const summary = component.getMemberSummary(mockWeeks[0] as any);
        expect(summary.length).toBe(1);
        expect(summary[0].name).toBe('Alice');
        expect(summary[0].committed).toBe(30);
    });
});
