import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { vi } from 'vitest';
import { ManageBacklogComponent } from '../../../app/features/manage-backlog/manage-backlog.component';
import { BacklogService } from '../../../app/core/services/backlog.service';
import { ToastService } from '../../../app/core/services/toast.service';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { BacklogCategory } from '../../../app/core/enums/enums';
import { BehaviorSubject, of } from 'rxjs';

describe('ManageBacklogComponent', () => {
    let component: ManageBacklogComponent;
    let fixture: ComponentFixture<ManageBacklogComponent>;
    let itemsSubject: BehaviorSubject<any[]>;
    const mockBacklog = { refresh: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(), archive: vi.fn(), unarchive: vi.fn(), items$: null as any };
    const mockToast = { success: vi.fn(), error: vi.fn() };
    const mockNav = { navigateTo: vi.fn() };

    const mockItems = [
        { id: '1', title: 'Task A', description: '', category: BacklogCategory.ClientFocused, estimatedHours: 10, isArchived: false, createdAt: '' },
        { id: '2', title: 'Task B', description: '', category: BacklogCategory.TechDebt, estimatedHours: 5, isArchived: true, createdAt: '' }
    ];

    beforeEach(async () => {
        itemsSubject = new BehaviorSubject<any[]>(mockItems);
        mockBacklog.items$ = itemsSubject.asObservable();

        await TestBed.configureTestingModule({
            imports: [ManageBacklogComponent, FormsModule],
            providers: [
                { provide: BacklogService, useValue: mockBacklog },
                { provide: ToastService, useValue: mockToast },
                { provide: NavigationService, useValue: mockNav }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManageBacklogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should load items on init', () => {
        expect(component.allItems.length).toBe(2);
        expect(mockBacklog.refresh).toHaveBeenCalled();
    });

    it('should filter by status (available)', () => {
        component.statusFilter = 'available';
        component.applyFilters();
        expect(component.filteredItems.every((i: any) => !i.isArchived)).toBe(true);
    });

    it('should filter by status (all)', () => {
        component.statusFilter = 'all';
        component.applyFilters();
        expect(component.filteredItems.length).toBe(2);
    });

    it('should open add form', () => {
        component.openAddForm();
        expect(component.showForm).toBe(true);
        expect(component.editingItem).toBeNull();
    });

    it('should open edit form', () => {
        component.openEditForm(mockItems[0] as any);
        expect(component.showForm).toBe(true);
        expect(component.editingItem).toBeTruthy();
    });

    it('should cancel form', () => {
        component.openAddForm();
        component.cancelForm();
        expect(component.showForm).toBe(false);
    });

    it('should save new item', () => {
        mockBacklog.create.mockReturnValue(of({} as any));
        component.openAddForm();
        component.formData.title = 'New Task';
        component.formData.estimatedHours = 8;
        component.formData.category = BacklogCategory.RAndD;
        component.saveItem();
        expect(mockBacklog.create).toHaveBeenCalled();
    });

    it('should archive item', () => {
        mockBacklog.archive.mockReturnValue(of(void 0 as any));
        component.archiveItem(mockItems[0] as any);
        expect(mockBacklog.archive).toHaveBeenCalledWith('1');
    });

    it('should unarchive item', () => {
        mockBacklog.unarchive.mockReturnValue(of(void 0 as any));
        component.unarchiveItem(mockItems[1] as any);
        expect(mockBacklog.unarchive).toHaveBeenCalledWith('2');
    });

    it('should get category label', () => {
        expect(component.getCategoryLabel(BacklogCategory.ClientFocused)).toBe('Client Focused');
        expect(component.getCategoryLabel(BacklogCategory.TechDebt)).toBe('Tech Debt');
        expect(component.getCategoryLabel(BacklogCategory.RAndD)).toBe('R&D');
    });
});
