import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { WeekSetupComponent } from '../../../app/features/week-setup/week-setup.component';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { WeeklyPlanService } from '../../../app/core/services/weekly-plan.service';
import { TeamMemberService } from '../../../app/core/services/team-member.service';
import { ToastService } from '../../../app/core/services/toast.service';
import { MemberRole } from '../../../app/core/enums/enums';
import { of } from 'rxjs';

describe('WeekSetupComponent', () => {
    let component: WeekSetupComponent;
    let fixture: ComponentFixture<WeekSetupComponent>;
    const mockNav = { navigateTo: vi.fn(), goBack: vi.fn() };
    const mockWeeklyPlan = { getCurrent: vi.fn().mockReturnValue(of(null)), create: vi.fn(), setup: vi.fn(), openPlanning: vi.fn() };
    const mockTeamMember = {
        getAll: vi.fn().mockReturnValue(of([
            { id: '1', name: 'Alice', role: MemberRole.Lead, isActive: true, createdAt: '' },
            { id: '2', name: 'Bob', role: MemberRole.Member, isActive: true, createdAt: '' }
        ]))
    };
    const mockToast = { success: vi.fn(), error: vi.fn(), warning: vi.fn() };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WeekSetupComponent, FormsModule],
            providers: [
                { provide: NavigationService, useValue: mockNav },
                { provide: WeeklyPlanService, useValue: mockWeeklyPlan },
                { provide: TeamMemberService, useValue: mockTeamMember },
                { provide: ToastService, useValue: mockToast }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(WeekSetupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load members on init', () => {
        expect(component.allMembers.length).toBe(2);
    });

    it('should toggle member selection', () => {
        component.toggleMember('1');
        // After init all are selected, so toggling removes it
        expect(component.selectedMemberIds.has('1')).toBe(false);
        component.toggleMember('1');
        expect(component.selectedMemberIds.has('1')).toBe(true);
    });

    it('should update total percent on change', () => {
        component.clientPercent = 50;
        component.techDebtPercent = 30;
        component.rndPercent = 20;
        component.onPercentChange();
        expect(component.totalPercent).toBe(100);
    });

    it('should compute hours from percent', () => {
        // Both members pre-selected on init
        expect(component.getHours(50)).toBe(30); // 2 members × 30h × 50%
    });

    it('should validate form correctly when incomplete', () => {
        // percentages not set to 100
        expect(component.isValid()).toBe(false);
    });

    it('should handle date change via onDateChange', () => {
        const event = { target: { value: '2026-03-04' } } as any;
        component.onDateChange(event);
        expect(component.planningDate).toBe('2026-03-04');
        // 2026-03-04 is Wednesday, should set dateError
        expect(component.dateError).toBeTruthy();
    });
});
