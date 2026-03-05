import { Component, OnInit, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { WeeklyPlanService } from '../../core/services/weekly-plan.service';
import { PlanAssignmentService, PlanAssignment } from '../../core/services/plan-assignment.service';
import { BacklogService, BacklogItem } from '../../core/services/backlog.service';
import { NavigationService } from '../../core/services/navigation.service';
import { ToastService } from '../../core/services/toast.service';
import { WeeklyPlan } from '../../core/models/weekly-plan.model';
import { BacklogCategory } from '../../core/enums/enums';

@Component({
  selector: 'app-backlog-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="picker-container">
      <button class="btn-back" (click)="nav.navigateTo('plan-my-work')">← Go Back</button>
      <h1 class="page-title">Pick a Backlog Item</h1>
      <p class="subtitle">You have <strong>{{ hoursLeft }}</strong> hours left to plan.</p>

      @if (loading) {
        <div class="loading"><div class="spinner"></div><p>Loading...</p></div>
      }

      @if (!loading) {
        <!-- Category filter pills -->
        <div class="filter-row">
          <button class="filter-pill cat-client-pill" [class.active]="categoryFilter === 'ClientFocused'"
                  (click)="toggleFilter('ClientFocused')">
            Client Focused ({{ clientLeft }}h left)
          </button>
          <button class="filter-pill cat-tech-pill" [class.active]="categoryFilter === 'TechDebt'"
                  (click)="toggleFilter('TechDebt')">
            Tech Debt ({{ techDebtLeft }}h left)
          </button>
          <button class="filter-pill cat-rnd-pill" [class.active]="categoryFilter === 'RAndD'"
                  (click)="toggleFilter('RAndD')">
            R&D ({{ rndLeft }}h left)
          </button>
        </div>

        <!-- Item list -->
        @if (filteredItems.length === 0) {
          <div class="empty-state">No backlog items are available in the categories you selected.</div>
        }
        @for (item of filteredItems; track item.id) {
          <div class="item-card">
            <div class="item-info">
              <div class="item-header">
                <span class="cat-badge" [class]="getCatClass(item.category)">{{ getCategoryLabel(item.category) }}</span>
                <span class="item-title">{{ item.title }}</span>
              </div>
              @if (item.description) {
                <p class="item-desc">{{ item.description }}</p>
              }
              <span class="item-est">{{ item.estimatedHours }}h est.</span>
            </div>
            <button class="btn-pick" (click)="openModal(item)">Pick This Item</button>
          </div>
        }
      }

      <!-- Modal -->
      @if (modalItem) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-box" (click)="$event.stopPropagation()">
            <h2>How many hours will you work on this?</h2>
            <div class="modal-item-info">
              <span class="cat-badge" [class]="getCatClass(modalItem.category)">{{ getCategoryLabel(modalItem.category) }}</span>
              <span class="modal-item-title">{{ modalItem.title }}</span>
            </div>
            <div class="modal-stats">
              <div>Your hours left: <strong>{{ hoursLeft }}</strong></div>
              <div>{{ getCategoryLabel(modalItem.category) }} budget left: <strong>{{ getCategoryBudgetLeft(modalItem.category) }}h</strong></div>
              <div class="modal-est">Estimate for this item: {{ modalItem.estimatedHours }}h. You can enter any amount.</div>
            </div>
            <div class="modal-input-group">
              <label>Hours to commit</label>
              <input type="number" [(ngModel)]="modalHours" min="1" [max]="maxHoursForModal" class="modal-input" />
            </div>
            @if (modalError) {
              <div class="modal-error">{{ modalError }}</div>
            }
            <div class="modal-actions">
              <button class="btn-add-plan" (click)="confirmAdd()" [disabled]="adding">Add to My Plan</button>
              <button class="btn-cancel" (click)="closeModal()">Cancel</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .picker-container { max-width: 900px; margin: 20px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
    .btn-back {
      display: inline-block; background: #334155; color: #94a3b8; border: none;
      padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: inherit; margin-bottom: 12px;
    }
    .btn-back:hover { background: #475569; color: #e2e8f0; }
    .page-title { font-size: 24px; color: #e2e8f0; margin: 0 0 4px; }
    .subtitle { color: #94a3b8; font-size: 15px; margin-bottom: 16px; }
    .subtitle strong { color: #e2e8f0; }

    /* Filter pills */
    .filter-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-pill {
      padding: 7px 16px; background: #1e293b; color: #94a3b8; border: 1px solid #334155;
      border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: all 0.2s;
    }
    .filter-pill:hover { border-color: #475569; color: #e2e8f0; }
    .cat-client-pill { background: #3b82f6; color: #fff; border-color: #3b82f6; }
    .cat-client-pill.active { background: #2563eb; border-color: #2563eb; box-shadow: 0 0 0 2px rgba(59,130,246,0.4); }
    .cat-tech-pill { background: #f97316; color: #fff; border-color: #f97316; }
    .cat-tech-pill.active { background: #ea580c; border-color: #ea580c; box-shadow: 0 0 0 2px rgba(249,115,22,0.4); }
    .cat-rnd-pill { background: #22c55e; color: #fff; border-color: #22c55e; }
    .cat-rnd-pill.active { background: #16a34a; border-color: #16a34a; box-shadow: 0 0 0 2px rgba(34,197,94,0.4); }

    /* Item cards */
    .item-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px; background: #1e293b; border: 1px solid #334155;
      border-radius: 10px; margin-bottom: 10px;
    }
    .item-card:hover { border-color: #475569; }
    .item-info { flex: 1; min-width: 0; }
    .item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .item-title { font-size: 15px; font-weight: 600; color: #e2e8f0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .item-desc { font-size: 13px; color: #64748b; margin: 2px 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .item-est { font-size: 12px; color: #94a3b8; }
    .btn-pick {
      padding: 8px 16px; background: #3b82f6; color: #fff; border: none;
      border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
      font-family: inherit; white-space: nowrap; transition: all 0.2s; flex-shrink: 0;
    }
    .btn-pick:hover { background: #2563eb; }

    .cat-badge {
      display: inline-block; padding: 3px 10px; border-radius: 6px;
      font-size: 12px; font-weight: 700; white-space: nowrap;
    }
    .cat-client { background: #3b82f6; color: #fff; }
    .cat-tech { background: #f97316; color: #fff; }
    .cat-rnd { background: #22c55e; color: #fff; }
    .empty-state {
      text-align: center; padding: 24px; color: #64748b;
      background: #1e293b; border-radius: 10px; border: 2px dashed #334155;
    }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-box {
      background: #1e293b; border: 1px solid #475569; border-radius: 14px;
      padding: 28px 32px; max-width: 480px; width: 90%;
    }
    .modal-box h2 { font-size: 18px; color: #e2e8f0; margin: 0 0 16px; }
    .modal-item-info { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .modal-item-title { font-size: 15px; font-weight: 600; color: #e2e8f0; }
    .modal-stats { margin-bottom: 16px; font-size: 14px; color: #94a3b8; }
    .modal-stats div { margin-bottom: 4px; }
    .modal-stats strong { color: #e2e8f0; }
    .modal-est { font-style: italic; color: #64748b; }
    .modal-input-group { margin-bottom: 12px; }
    .modal-input-group label { display: block; font-size: 13px; color: #94a3b8; margin-bottom: 6px; }
    .modal-input {
      width: 100%; padding: 10px 14px; border: 1px solid #475569; border-radius: 8px;
      background: #0f172a; color: #e2e8f0; font-size: 16px; font-family: inherit;
    }
    .modal-input:focus { outline: none; border-color: #3b82f6; }
    .modal-error { color: #ef4444; font-size: 13px; margin-bottom: 10px; }
    .modal-actions { display: flex; gap: 10px; }
    .btn-add-plan {
      flex: 1; padding: 10px 20px; background: #3b82f6; color: #fff; border: none;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: all 0.2s;
    }
    .btn-add-plan:hover:not(:disabled) { background: #2563eb; }
    .btn-add-plan:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cancel {
      padding: 10px 20px; background: #475569; color: #e2e8f0; border: none;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: inherit;
    }
    .btn-cancel:hover { background: #64748b; }

    .loading {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 30vh; gap: 16px; color: #94a3b8;
    }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #334155; border-top-color: #3b82f6;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class BacklogPickerComponent implements OnInit {
  loading = true;
  currentPlan: WeeklyPlan | null = null;
  allAssignments: PlanAssignment[] = [];
  myAssignments: PlanAssignment[] = [];
  availableItems: BacklogItem[] = [];
  categoryFilter = '';

  // Modal state
  modalItem: BacklogItem | null = null;
  modalHours = 0;
  modalError = '';
  adding = false;
  constructor(
    private authService: AuthService,
    private weeklyPlanService: WeeklyPlanService,
    private planAssignmentService: PlanAssignmentService,
    private backlogService: BacklogService,
    public nav: NavigationService,
    private toast: ToastService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  toggleFilter(cat: string): void {
    this.categoryFilter = this.categoryFilter === cat ? '' : cat;
  }

  get hoursLeft(): number {
    const used = this.myAssignments.reduce((s, a) => s + a.committedHours, 0);
    return Math.max(0, 30 - used);
  }

  get clientLeft(): number {
    if (!this.currentPlan) return 0;
    const claimed = this.allAssignments
      .filter(a => a.backlogItemCategory === BacklogCategory.ClientFocused)
      .reduce((s, a) => s + a.committedHours, 0);
    return Math.max(0, this.currentPlan.clientFocusedBudgetHours - claimed);
  }

  get techDebtLeft(): number {
    if (!this.currentPlan) return 0;
    const claimed = this.allAssignments
      .filter(a => a.backlogItemCategory === BacklogCategory.TechDebt)
      .reduce((s, a) => s + a.committedHours, 0);
    return Math.max(0, this.currentPlan.techDebtBudgetHours - claimed);
  }

  get rndLeft(): number {
    if (!this.currentPlan) return 0;
    const claimed = this.allAssignments
      .filter(a => a.backlogItemCategory === BacklogCategory.RAndD)
      .reduce((s, a) => s + a.committedHours, 0);
    return Math.max(0, this.currentPlan.rAndDBudgetHours - claimed);
  }

  get filteredItems(): BacklogItem[] {
    const assignedIds = new Set(this.myAssignments.map(a => a.backlogItemId));
    let items = this.availableItems.filter(i => !assignedIds.has(i.id) && !i.isArchived);
    if (this.categoryFilter) {
      items = items.filter(i => i.category === this.categoryFilter);
    }
    return items;
  }

  get maxHoursForModal(): number {
    if (!this.modalItem) return 30;
    const catLeft = this.getCategoryBudgetLeft(this.modalItem.category);
    return Math.min(this.hoursLeft, catLeft);
  }

  getCategoryLabel(cat: BacklogCategory | string): string {
    switch (cat) {
      case BacklogCategory.ClientFocused: return 'Client Focused';
      case BacklogCategory.TechDebt: return 'Tech Debt';
      case BacklogCategory.RAndD: return 'R&D';
      default: return String(cat);
    }
  }

  getCatClass(cat: BacklogCategory | string): string {
    switch (cat) {
      case BacklogCategory.ClientFocused: return 'cat-client';
      case BacklogCategory.TechDebt: return 'cat-tech';
      case BacklogCategory.RAndD: return 'cat-rnd';
      default: return '';
    }
  }

  getCategoryBudgetLeft(cat: BacklogCategory | string): number {
    switch (cat) {
      case BacklogCategory.ClientFocused: return this.clientLeft;
      case BacklogCategory.TechDebt: return this.techDebtLeft;
      case BacklogCategory.RAndD: return this.rndLeft;
      default: return 0;
    }
  }

  openModal(item: BacklogItem): void {
    this.modalItem = item;
    this.modalHours = 0;
    this.modalError = '';
    this.adding = false;
  }

  closeModal(): void {
    this.modalItem = null;
    this.modalHours = 0;
    this.modalError = '';
  }

  confirmAdd(): void {
    if (!this.modalItem || !this.currentPlan) return;

    // Validation
    if (!this.modalHours || this.modalHours <= 0) {
      this.modalError = 'Hours must be greater than 0.';
      return;
    }
    if (this.modalHours > this.hoursLeft) {
      this.modalError = `You only have ${this.hoursLeft} hours left.`;
      return;
    }
    const catLeft = this.getCategoryBudgetLeft(this.modalItem.category);
    if (this.modalHours > catLeft) {
      this.modalError = `${this.getCategoryLabel(this.modalItem.category)} only has ${catLeft}h budget left.`;
      return;
    }

    this.adding = true;
    this.modalError = '';

    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.planAssignmentService.create({
      weeklyPlanId: this.currentPlan.id,
      teamMemberId: user.id,
      backlogItemId: this.modalItem.id,
      committedHours: this.modalHours
    }).subscribe({
      next: (assignment) => {
        this.myAssignments = [...this.myAssignments, assignment];
        this.allAssignments = [...this.allAssignments, assignment];
        this.toast.success(`Added! ${this.modalItem!.title} \u2014 ${this.modalHours}h`);
        this.closeModal();
        this.adding = false;
      },
      error: (err) => {
        this.modalError = err.error || 'Failed to add item.';
        this.adding = false;
      }
    });
  }

  private loadData(): void {
    this.loading = true;
    this.weeklyPlanService.getCurrent().subscribe({
      next: (plan) => {
        if (!plan) {
          this.loading = false;
          this.nav.navigateTo('home');
          return;
        }
        this.currentPlan = plan;

        this.backlogService.refresh();
        this.backlogService.items$.subscribe(items => {
          this.availableItems = items;
        });

        this.planAssignmentService.getByWeek(plan.id).subscribe({
          next: (all) => {
            this.allAssignments = all;
            const user = this.authService.getCurrentUser();
            if (user) {
              this.myAssignments = all.filter(a => a.teamMemberId === user.id);
            }
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => { this.loading = false; }
    });
  }
}
