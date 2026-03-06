import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BacklogService, BacklogItem } from '../../core/services/backlog.service';
import { ToastService } from '../../core/services/toast.service';
import { NavigationService } from '../../core/services/navigation.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { BacklogCategory } from '../../core/enums/enums';

@Component({
  selector: 'app-manage-backlog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="backlog-container">
      <button class="btn-back" (click)="nav.navigateTo('home')">← Home</button>

      @if (showForm) {
        <div class="form-section">
          <h2>{{ editingItem ? 'Edit Backlog Item' : 'Add a New Backlog Item' }}</h2>
          <div class="form-group">
            <label>Category</label>
            <select [(ngModel)]="formData.category" class="form-control" [disabled]="!!editingItem">
              <option [value]="BacklogCategory.ClientFocused">Client Focused</option>
              <option [value]="BacklogCategory.TechDebt">Tech Debt</option>
              <option [value]="BacklogCategory.RAndD">R&D</option>
            </select>
          </div>
          <div class="form-group">
            <label>Title</label>
            <input type="text" [(ngModel)]="formData.title" (ngModelChange)="checkDuplicate()" placeholder="What's this work item?" class="form-control" autocomplete="off" />
            @if (duplicateWarning) {
              <div class="duplicate-warning">⚠ A similar item already exists: "{{ duplicateWarning }}"</div>
            }
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea [(ngModel)]="formData.description" placeholder="Describe the work (optional)" class="form-control textarea" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Estimated Hours</label>
            <input type="number" [(ngModel)]="formData.estimatedHours" min="1" class="form-control small" />
          </div>
          <div class="form-actions">
            <button class="btn btn-primary" (click)="saveItem()" [disabled]="!formData.title.trim() || formData.estimatedHours <= 0">Save This Item</button>
            @if (editingItem) {
              <button class="btn btn-danger" (click)="deleteItem()">Delete This Item</button>
            }
            <button class="btn btn-secondary" (click)="cancelForm()">← Go Back</button>
          </div>
        </div>
      } @else {
        <h2>Manage Backlog</h2>
        <button class="btn btn-primary add-btn" (click)="openAddForm()">+ Add a New Backlog Item</button>
        <div class="filters">
          <div class="category-filters">
            <button class="filter-pill" [class.active]="filterClient" [class.pill-blue]="filterClient" (click)="toggleFilter('client')">Client Focused</button>
            <button class="filter-pill" [class.active]="filterTech" [class.pill-red]="filterTech" (click)="toggleFilter('tech')">Tech Debt</button>
            <button class="filter-pill" [class.active]="filterRnD" [class.pill-green]="filterRnD" (click)="toggleFilter('rnd')">R&D</button>
          </div>
          <div class="right-filters">
            <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilters()" class="form-control small-select">
              <option value="available">Available Only</option>
              <option value="all">Show All</option>
              <option value="archived">Archived</option>
            </select>
            <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="applyFilters()" placeholder="Search by title" class="form-control search-input" autocomplete="off" />
          </div>
        </div>
        <div class="item-list">
          @if (filteredItems.length === 0) {
            <div class="empty-state-styled">
              <span class="empty-icon">📋</span>
              <div class="empty-title">No items found</div>
              <div class="empty-subtitle">Try adjusting your filters or add a new backlog item.</div>
              <button class="btn btn-primary" (click)="openAddForm()">+ Add Item</button>
            </div>
          }
          @for (item of filteredItems; track item.id) {
            <div class="item-card" [class.archived]="item.isArchived" [style.animationDelay]="(0.05 * $index) + 's'" style="animation: staggerFadeIn 0.3s ease-out both;">
              <div class="item-main">
                <span class="item-title">{{ item.title }}</span>
                <div class="item-badges">
                  <span class="category-badge" [class]="'cat-' + item.category">{{ getCategoryLabel(item.category) }}</span>
                  <span class="status-badge" [class.badge-archived]="item.isArchived">{{ item.isArchived ? 'Archived' : 'Available' }}</span>
                  <span class="hours-text">{{ item.estimatedHours }}h est.</span>
                </div>
              </div>
              <div class="item-actions">
                <button class="btn btn-outline-sm" (click)="openEditForm(item)">View & Edit</button>
                @if (!item.isArchived) {
                  <button class="btn btn-danger-sm" (click)="archiveItem(item)">Archive</button>
                } @else {
                  <button class="btn btn-outline-sm" (click)="unarchiveItem(item)">Restore</button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .backlog-container { max-width: 960px; margin: 20px auto; padding: 0 20px; font-family: 'Inter', sans-serif; }
    h2 { font-size: 22px; color: var(--text-primary); margin-bottom: 20px; }
    .add-btn { margin-bottom: 20px; }
    .filters { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
    .category-filters { display: flex; gap: 8px; }
    .right-filters { display: flex; gap: 8px; }
    .filter-pill { padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border-hover); background: transparent; color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .filter-pill.active { color: #fff; }
    .pill-blue { background: var(--color-primary); border-color: var(--color-primary); }
    .pill-red { background: var(--color-danger); border-color: var(--color-danger); }
    .pill-green { background: var(--color-success); border-color: var(--color-success); }
    .search-input { width: 160px; }
    .small-select { padding: 6px 10px !important; font-size: 13px !important; border-radius: 8px !important; }
    .item-list { display: flex; flex-direction: column; gap: 10px; }
    .item-card { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; background: var(--bg-secondary); border: 1px solid var(--bg-card-hover); border-radius: 10px; transition: all 0.2s; gap: 12px; }
    .item-card:hover { border-color: var(--border-hover); }
    .item-card.archived { opacity: 0.6; }
    .item-main { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .item-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .item-badges { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    .category-badge { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
    .cat-ClientFocused { background: rgba(59,130,246,0.2); color: var(--color-primary); }
    .cat-TechDebt { background: rgba(239,68,68,0.2); color: var(--color-danger); }
    .cat-RAndD { background: rgba(34,197,94,0.2); color: var(--color-success); }
    .status-badge { padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; background: rgba(148,163,184,0.2); color: var(--text-secondary); }
    .badge-archived { background: rgba(239,68,68,0.15); color: var(--text-danger-light); }
    .hours-text { font-size: 12px; color: var(--text-muted); }
    .item-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .btn { padding: 10px 18px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: var(--color-primary); color: #fff; }
    .btn-primary:hover:not(:disabled) { background: var(--color-primary-hover); }
    .btn-secondary { background: var(--bg-card-hover); color: var(--text-secondary); }
    .btn-secondary:hover { background: var(--border-hover); color: var(--text-primary); }
    .btn-danger { background: var(--color-danger); color: #fff; }
    .btn-danger:hover { background: var(--color-danger-hover); }
    .btn-outline-sm { padding: 6px 12px; background: transparent; color: var(--color-primary); border: 1px solid var(--color-primary); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-outline-sm:hover { background: rgba(59,130,246,0.1); }
    .btn-danger-sm { padding: 6px 12px; background: transparent; color: var(--color-danger); border: 1px solid var(--color-danger); border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
    .btn-danger-sm:hover { background: rgba(239,68,68,0.1); }
    .empty-state { text-align: center; padding: 40px; color: var(--text-muted); background: var(--bg-secondary); border-radius: 12px; border: 2px dashed var(--bg-card-hover); }
    .form-section { animation: fadeIn 0.2s ease-out; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
    .form-control { width: 100%; padding: 10px 14px; border: 2px solid var(--bg-card-hover); border-radius: 8px; background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; outline: none; transition: border-color 0.2s; font-family: inherit; box-sizing: border-box; }
    .form-control:focus { border-color: var(--color-primary); }
    .form-control.small { width: 120px; }
    .form-control.textarea { resize: vertical; }
    .duplicate-warning { color: var(--color-warning); font-size: 12px; font-weight: 600; margin-top: 6px; }
    .form-actions { display: flex; gap: 10px; margin-top: 24px; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ManageBacklogComponent implements OnInit, OnDestroy {
  BacklogCategory = BacklogCategory;
  allItems: BacklogItem[] = [];
  filteredItems: BacklogItem[] = [];
  filterClient = false;
  filterTech = false;
  filterRnD = false;
  statusFilter = 'available';
  searchQuery = '';
  showForm = false;
  editingItem: BacklogItem | null = null;
  formData = this.emptyForm();
  duplicateWarning = '';
  private sub!: Subscription;

  constructor(
    private backlogService: BacklogService,
    private toastService: ToastService,
    public nav: NavigationService,
    private confirmService: ConfirmService
  ) { }

  ngOnInit(): void {
    this.backlogService.refresh();
    this.sub = this.backlogService.items$.subscribe(items => {
      this.allItems = items;
      this.applyFilters();
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  toggleFilter(type: string): void {
    if (type === 'client') this.filterClient = !this.filterClient;
    if (type === 'tech') this.filterTech = !this.filterTech;
    if (type === 'rnd') this.filterRnD = !this.filterRnD;
    this.applyFilters();
  }

  applyFilters(): void {
    let items = [...this.allItems];
    if (this.statusFilter === 'available') items = items.filter(i => !i.isArchived);
    else if (this.statusFilter === 'archived') items = items.filter(i => i.isArchived);
    const anyCategory = this.filterClient || this.filterTech || this.filterRnD;
    if (anyCategory) {
      items = items.filter(i => {
        if (this.filterClient && i.category === BacklogCategory.ClientFocused) return true;
        if (this.filterTech && i.category === BacklogCategory.TechDebt) return true;
        if (this.filterRnD && i.category === BacklogCategory.RAndD) return true;
        return false;
      });
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      items = items.filter(i => i.title.toLowerCase().includes(q));
    }
    this.filteredItems = items;
  }

  getCategoryLabel(cat: BacklogCategory): string {
    switch (cat) {
      case BacklogCategory.ClientFocused: return 'Client Focused';
      case BacklogCategory.TechDebt: return 'Tech Debt';
      case BacklogCategory.RAndD: return 'R&D';
    }
  }

  openAddForm(): void { this.formData = this.emptyForm(); this.editingItem = null; this.duplicateWarning = ''; this.showForm = true; }

  openEditForm(item: BacklogItem): void {
    this.editingItem = item;
    this.formData = { title: item.title, description: item.description || '', category: item.category, estimatedHours: item.estimatedHours };
    this.duplicateWarning = '';
    this.showForm = true;
  }

  cancelForm(): void { this.showForm = false; this.editingItem = null; this.duplicateWarning = ''; }

  checkDuplicate(): void {
    const title = this.formData.title.trim().toLowerCase();
    if (title.length < 3) { this.duplicateWarning = ''; return; }
    const match = this.allItems.find(i =>
      i.title.toLowerCase().includes(title) &&
      (!this.editingItem || i.id !== this.editingItem.id)
    );
    this.duplicateWarning = match ? match.title : '';
  }

  saveItem(): void {
    if (this.editingItem) {
      this.backlogService.update(this.editingItem.id, this.formData).subscribe({
        next: () => { this.toastService.success('Backlog item saved!'); this.showForm = false; this.editingItem = null; },
        error: () => this.toastService.error('Failed to save item.')
      });
    } else {
      this.backlogService.create(this.formData).subscribe({
        next: () => { this.toastService.success('Backlog item saved!'); this.showForm = false; },
        error: () => this.toastService.error('Failed to create item.')
      });
    }
  }

  deleteItem(): void {
    if (!this.editingItem) return;
    this.backlogService.delete(this.editingItem.id).subscribe({
      next: () => { this.toastService.success('Backlog item deleted.'); this.showForm = false; this.editingItem = null; },
      error: () => this.toastService.error('Failed to delete item.')
    });
  }

  async archiveItem(item: BacklogItem): Promise<void> {
    const ok = await this.confirmService.confirm({
      title: '📦 Archive Item',
      message: `Are you sure you want to archive "${item.title}"? It will no longer appear in available items.`,
      confirmText: 'Yes, Archive',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;

    this.backlogService.archive(item.id).subscribe({
      next: () => this.toastService.success('Backlog item archived.'),
      error: () => this.toastService.error('Failed to archive item.')
    });
  }

  unarchiveItem(item: BacklogItem): void {
    this.backlogService.unarchive(item.id).subscribe({
      next: () => this.toastService.success('Backlog item restored.'),
      error: () => this.toastService.error('Failed to restore item.')
    });
  }

  private emptyForm() {
    return { title: '', description: '', category: BacklogCategory.ClientFocused, estimatedHours: 0 };
  }
}
