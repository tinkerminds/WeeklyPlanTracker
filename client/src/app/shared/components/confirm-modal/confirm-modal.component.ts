import { Component, OnInit, OnDestroy, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmService, ConfirmOptions } from '../../../core/services/confirm.service';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [CommonModule],
    template: `
    @if (visible) {
      <div class="modal-overlay" (click)="dismiss()">
        <div class="modal-card" (click)="$event.stopPropagation()">
          <h3 class="modal-title">{{ options.title }}</h3>
          <p class="modal-message">{{ options.message }}</p>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="dismiss()">{{ options.cancelText || 'Cancel' }}</button>
            <button class="btn-confirm" [class.btn-danger]="options.danger" (click)="accept()">
              {{ options.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
    styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      z-index: 9999; animation: fadeIn 0.15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .modal-card {
      background: var(--bg-secondary); border: 1px solid var(--border-hover); border-radius: 14px;
      padding: 28px 32px; max-width: 440px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      animation: slideUp 0.2s ease;
    }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .modal-title {
      font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 700;
      color: var(--text-primary); margin: 0 0 10px;
    }
    .modal-message {
      font-family: 'Inter', sans-serif; font-size: 14px; color: var(--text-secondary);
      line-height: 1.6; margin: 0 0 24px;
    }
    .modal-actions {
      display: flex; justify-content: flex-end; gap: 10px;
    }
    .btn-cancel {
      padding: 10px 20px; background: var(--bg-card-hover); color: var(--text-secondary); border: none;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: 'Inter', sans-serif; transition: all 0.2s;
    }
    .btn-cancel:hover { background: var(--border-hover); color: var(--text-primary); }
    .btn-confirm {
      padding: 10px 20px; background: var(--color-primary); color: #fff; border: none;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer;
      font-family: 'Inter', sans-serif; transition: all 0.2s;
    }
    .btn-confirm:hover { background: var(--color-primary-hover); }
    .btn-danger { background: var(--color-danger); }
    .btn-danger:hover { background: var(--color-danger-hover); }
  `]
})
export class ConfirmModalComponent implements OnInit, OnDestroy {
    visible = false;
    options: ConfirmOptions = { title: '', message: '' };
    private resolveFn: ((result: boolean) => void) | null = null;
    private sub!: Subscription;
    constructor(private confirmService: ConfirmService) { }

    ngOnInit(): void {
        this.sub = this.confirmService.confirm$.subscribe(({ options, resolve }) => {
            this.options = options;
            this.resolveFn = resolve;
            this.visible = true;
        });
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }

    accept(): void {
        this.visible = false;
        this.resolveFn?.(true);
        this.resolveFn = null;
    }

    dismiss(): void {
        this.visible = false;
        this.resolveFn?.(false);
        this.resolveFn = null;
    }
}
