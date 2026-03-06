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
        <div class="loading">
          <div class="skeleton skeleton-line" style="width:50%; height:18px;"></div>
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card"></div>
          <div class="skeleton skeleton-card"></div>
        </div>
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
          <div class="empty-state-styled">
            <span class="empty-icon">📦</span>
            <div class="empty-title">No items available</div>
            <div class="empty-subtitle">All backlog items are either assigned or filtered out.</div>
          </div>
        }
        @for (item of filteredItems; track item.id) {
          <div class="item-card" [style.animationDelay]="(0.05 * $index) + 's'" style="animation: staggerFadeIn 0.3s ease-out both;">
            <div class="item-info">
              <div class="item-header">
                <span class="cat-badge" [class]="getCatClass(item.category)">{{ getCategoryLabel(item.category) }}</span>
                <span class="item-title">{{ item.title }}</span>
              </div>
              @if (item.description) {
                <p class="item-desc" [class.expanded]="expandedItems.has(item.id)" (click)="toggleDescription(item.id)">
                  {{ item.description }}
                </p>
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
    .picker-container { max-width: 960px; margin: 20px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
    .page-title { font-size: 24px; color: var(--text-primary); margin: 0 0 4px; }
    .subtitle { color: var(--text-secondary); font-size: 15px; margin-bottom: 16px; }
    .subtitle strong { color: var(--text-primary); }

    /* Filter pills */
    .filter-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-pill {
      padding: 7px 16px; background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--bg-card-hover);
      border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: all 0.2s;
    }
    .filter-pill:hover { border-color: var(--border-hover); color: var(--text-primary); }
    .cat-client-pill { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .cat-client-pill.active { background: var(--color-primary-hover); border-color: var(--color-primary-hover); box-shadow: 0 0 0 2px rgba(59,130,246,0.4); }
    .cat-tech-pill { background: var(--color-warning); color: #fff; border-color: var(--color-warning); }
    .cat-tech-pill.active { background: var(--color-warning); border-color: var(--color-warning); box-shadow: 0 0 0 2px rgba(249,115,22,0.4); }
    .cat-rnd-pill { background: var(--color-success); color: #fff; border-color: var(--color-success); }
    .cat-rnd-pill.active { background: var(--color-success-dark); border-color: var(--color-success-dark); box-shadow: 0 0 0 2px rgba(34,197,94,0.4); }

    /* Item cards */
    .item-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px; background: var(--bg-secondary); border: 1px solid var(--bg-card-hover);
      border-radius: 10px; margin-bottom: 10px;
    }
    .item-card:hover { border-color: var(--border-hover); }
    .item-info { flex: 1; min-width: 0; }
    .item-header { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
    .item-title { font-size: 15px; font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .item-desc {
      font-size: 13px; color: var(--text-muted); margin: 2px 0 4px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      cursor: pointer; transition: all 0.2s;
    }
    .item-desc:hover { color: var(--text-secondary); }
    .item-desc.expanded { white-space: normal; overflow: visible; }
    .item-est { font-size: 12px; color: var(--text-secondary); }
    .btn-pick {
      padding: 8px 16px; background: var(--color-primary); color: #fff; border: none;
      border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
      font-family: inherit; white-space: nowrap; transition: all 0.2s; flex-shrink: 0;
    }
    .btn-pick:hover { background: var(--color-primary-hover); }

    .cat-badge {
      display: inline-block; padding: 3px 10px; border-radius: 6px;
      font-size: 12px; font-weight: 700; white-space: nowrap;
    }
    .cat-client { background: var(--color-primary); color: #fff; }
    .cat-tech { background: var(--color-warning); color: #fff; }
    .cat-rnd { background: var(--color-success); color: #fff; }
    .empty-state {
      text-align: center; padding: 24px; color: var(--text-muted);
      background: var(--bg-secondary); border-radius: 10px; border: 2px dashed var(--bg-card-hover);
    }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 200;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-box {
      background: var(--bg-secondary); border: 1px solid var(--border-hover); border-radius: 14px;
      padding: 28px 32px; max-width: 480px; width: 90%;
    }
    .modal-box h2 { font-size: 18px; color: var(--text-primary); margin: 0 0 16px; }
    .modal-item-info { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
    .modal-item-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .modal-stats { margin-bottom: 16px; font-size: 14px; color: var(--text-secondary); }
    .modal-stats div { margin-bottom: 4px; }
    .modal-stats strong { color: var(--text-primary); }
    .modal-est { font-style: italic; color: var(--text-muted); }
    .modal-input-group { margin-bottom: 12px; }
    .modal-input-group label { display: block; font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
    .modal-input {
      width: 100%; padding: 10px 14px; border: 1px solid var(--border-hover); border-radius: 8px;
      background: var(--bg-primary); color: var(--text-primary); font-size: 16px; font-family: inherit;
    }
    .modal-input:focus { outline: none; border-color: var(--color-primary); }
    .modal-error { color: var(--color-danger); font-size: 13px; margin-bottom: 10px; }
    .modal-actions { display: flex; gap: 10px; }
    .btn-add-plan {
      flex: 1; padding: 10px 20px; background: var(--color-primary); color: #fff; border: none;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: all 0.2s;
    }
    .btn-add-plan:hover:not(:disabled) { background: var(--color-primary-hover); }
    .btn-add-plan:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-cancel {
      padding: 10px 20px; background: var(--border-hover); color: var(--text-primary); border: none;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: inherit;
    }
    .btn-cancel:hover { background: var(--text-muted); }

    .loading {
      max-width: 600px; margin: 40px auto; padding: 0 24px;
    }
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
  expandedItems = new Set<string>();
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

  toggleDescription(id: string): void {
    if (this.expandedItems.has(id)) this.expandedItems.delete(id);
    else this.expandedItems.add(id);
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
