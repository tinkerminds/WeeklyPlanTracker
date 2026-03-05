import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { BacklogPickerComponent } from '../../../app/features/backlog-picker/backlog-picker.component';
import { AuthService } from '../../../app/core/services/auth.service';
import { WeeklyPlanService } from '../../../app/core/services/weekly-plan.service';
import { PlanAssignmentService } from '../../../app/core/services/plan-assignment.service';
import { BacklogService } from '../../../app/core/services/backlog.service';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { ToastService } from '../../../app/core/services/toast.service';
import { MemberRole, WeekState, BacklogCategory } from '../../../app/core/enums/enums';
import { of, BehaviorSubject } from 'rxjs';

describe('BacklogPickerComponent', () => {
    let component: BacklogPickerComponent;
    let fixture: ComponentFixture<BacklogPickerComponent>;
    let itemsSubject: BehaviorSubject<any[]>;

    const mockPlan = {
        id: 'p1', state: WeekState.PlanningOpen, planningDate: '', workStartDate: '', workEndDate: '',
        createdAt: '', clientFocusedPercent: 50, techDebtPercent: 30, rAndDPercent: 20,
        memberCount: 2, totalHours: 60, clientFocusedBudgetHours: 30, techDebtBudgetHours: 18, rAndDBudgetHours: 12,
        members: [{ id: 'm1', name: 'Alice', role: MemberRole.Lead, isPlanningDone: false }]
    };
    const mockItems = [
        { id: 'b1', title: 'Task A', description: '', category: BacklogCategory.ClientFocused, estimatedHours: 10, isArchived: false, createdAt: '' },
        { id: 'b2', title: 'Task B', description: '', category: BacklogCategory.TechDebt, estimatedHours: 5, isArchived: false, createdAt: '' }
    ];

    beforeEach(async () => {
        itemsSubject = new BehaviorSubject<any[]>(mockItems);

        await TestBed.configureTestingModule({
            imports: [BacklogPickerComponent, FormsModule],
            providers: [
                { provide: AuthService, useValue: { getCurrentUser: () => ({ id: 'm1', name: 'Alice', role: MemberRole.Lead }) } },
                { provide: WeeklyPlanService, useValue: { getCurrent: vi.fn().mockReturnValue(of(mockPlan)) } },
                { provide: PlanAssignmentService, useValue: { getByWeek: vi.fn().mockReturnValue(of([])), create: vi.fn() } },
                { provide: BacklogService, useValue: { getActiveItems: vi.fn().mockReturnValue(of(mockItems)), refresh: vi.fn(), items$: itemsSubject.asObservable() } },
                { provide: NavigationService, useValue: { navigateTo: vi.fn(), goBack: vi.fn() } },
                { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(BacklogPickerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => { expect(component).toBeTruthy(); });
    it('should load available items', () => { expect(component.availableItems.length).toBe(2); });
    it('should compute hours left (getter)', () => { expect(component.hoursLeft).toBe(30); });
    it('should toggle category filter', () => {
        component.toggleFilter('ClientFocused');
        expect(component.categoryFilter).toBe('ClientFocused');
        component.toggleFilter('ClientFocused');
        expect(component.categoryFilter).toBe('');
    });
    it('should filter items by category (getter)', () => {
        component.categoryFilter = 'ClientFocused';
        const filtered = component.filteredItems;
        expect(filtered.every((i: any) => i.category === BacklogCategory.ClientFocused)).toBe(true);
    });
    it('should open modal for item', () => {
        component.openModal(mockItems[0] as any);
        expect(component.modalItem).toBeTruthy();
    });
    it('should close modal', () => {
        component.openModal(mockItems[0] as any);
        component.closeModal();
        expect(component.modalItem).toBeNull();
    });
    it('should get category label', () => { expect(component.getCategoryLabel(BacklogCategory.RAndD)).toBe('R&D'); });
});
