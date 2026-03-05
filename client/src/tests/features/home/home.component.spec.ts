import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { HomeComponent } from '../../../app/features/home/home.component';
import { AuthService } from '../../../app/core/services/auth.service';
import { NavigationService } from '../../../app/core/services/navigation.service';
import { WeeklyPlanService } from '../../../app/core/services/weekly-plan.service';
import { ToastService } from '../../../app/core/services/toast.service';
import { ConfirmService } from '../../../app/core/services/confirm.service';
import { MemberRole, WeekState } from '../../../app/core/enums/enums';
import { BehaviorSubject, of } from 'rxjs';

describe('HomeComponent', () => {
    let component: HomeComponent;
    let fixture: ComponentFixture<HomeComponent>;
    let currentUserSubject: BehaviorSubject<any>;
    const mockNav = { navigateTo: vi.fn() };
    const mockWeeklyPlanService = { getCurrent: vi.fn(), cancel: vi.fn(), complete: vi.fn() };

    const leadUser = { id: '1', name: 'Alice', role: MemberRole.Lead, isActive: true, createdAt: '' };
    const memberUser = { id: '2', name: 'Bob', role: MemberRole.Member, isActive: true, createdAt: '' };

    beforeEach(async () => {
        currentUserSubject = new BehaviorSubject<any>(leadUser);
        mockWeeklyPlanService.getCurrent.mockReturnValue(of(null));

        await TestBed.configureTestingModule({
            imports: [HomeComponent],
            providers: [
                { provide: AuthService, useValue: { currentUser$: currentUserSubject.asObservable() } },
                { provide: NavigationService, useValue: mockNav },
                { provide: WeeklyPlanService, useValue: mockWeeklyPlanService },
                { provide: ToastService, useValue: { success: vi.fn(), error: vi.fn() } },
                { provide: ConfirmService, useValue: { confirm: vi.fn() } }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(HomeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should detect Lead user', () => {
        expect(component.isLead).toBe(true);
        expect(component.user?.name).toBe('Alice');
    });

    it('should detect Member user', () => {
        currentUserSubject.next(memberUser);
        fixture.detectChanges();
        expect(component.isLead).toBe(false);
    });

    it('should show Start New Week for Lead with no plan', () => {
        mockWeeklyPlanService.getCurrent.mockReturnValue(of(null));
        currentUserSubject.next(leadUser);
        fixture.detectChanges();
        expect(component.menuCards.some(c => c.title.includes('Start a New Week'))).toBe(true);
    });

    it('should show Plan My Work for Lead with PlanningOpen', () => {
        mockWeeklyPlanService.getCurrent.mockReturnValue(of({ id: '1', state: WeekState.PlanningOpen }));
        currentUserSubject.next(leadUser);
        fixture.detectChanges();
        expect(component.menuCards.some(c => c.title.includes('Plan My Work'))).toBe(true);
    });

    it('should show Set Up for Lead with Setup state', () => {
        mockWeeklyPlanService.getCurrent.mockReturnValue(of({ id: '1', state: WeekState.Setup }));
        currentUserSubject.next(leadUser);
        fixture.detectChanges();
        expect(component.menuCards.some(c => c.title.includes('Set Up'))).toBe(true);
    });

    it('should show Update Progress for Member with Frozen plan', () => {
        mockWeeklyPlanService.getCurrent.mockReturnValue(of({ id: '1', state: WeekState.Frozen }));
        currentUserSubject.next(memberUser);
        fixture.detectChanges();
        expect(component.menuCards.some(c => c.title.includes('Update My Progress'))).toBe(true);
    });

    it('should navigate on card click', () => {
        component.onCardClick({ icon: '', title: '', subtitle: '', screen: 'manage-team' });
        expect(mockNav.navigateTo).toHaveBeenCalledWith('manage-team');
    });

    it('should return correct greeting based on time', () => {
        const greeting = component.getGreeting();
        expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting);
    });
});
