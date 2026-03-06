import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toasts; track toast.id) {
        <div class="toast" [class]="'toast-' + toast.type" [class.toast-exit]="toast.exiting">
          <span class="toast-icon">{{ getIcon(toast.type) }}</span>
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="dismiss(toast.id)">×</button>
          <div class="toast-progress">
            <div class="toast-progress-bar"></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .toast {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 20px 18px;
      border-radius: 10px;
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      animation: slideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1);
      min-width: 300px;
      max-width: 420px;
      overflow: hidden;
    }
    .toast-exit {
      animation: slideOut 0.3s ease-in forwards;
    }
    .toast-icon {
      font-size: 18px;
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      font-weight: 700;
    }
    .toast-success { background: linear-gradient(135deg, #16a34a, #15803d); }
    .toast-warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .toast-error { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .toast-close {
      background: none;
      border: none;
      color: rgba(255,255,255,0.7);
      font-size: 18px;
      cursor: pointer;
      margin-left: auto;
      padding: 0 2px;
      transition: color 0.2s;
    }
    .toast-close:hover { color: #fff; }
    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(0,0,0,0.15);
    }
    .toast-progress-bar {
      height: 100%;
      background: rgba(255,255,255,0.5);
      border-radius: 0 0 10px 10px;
      animation: shrink 3s linear forwards;
    }
    @keyframes slideIn {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(120%); opacity: 0; }
    }
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
  `]
})
export class ToastComponent {
  toasts: (Toast & { exiting?: boolean })[] = [];
  private toastService = inject(ToastService);

  constructor() {
    this.toastService.toasts$.subscribe((toasts: Toast[]) => this.toasts = toasts);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✗';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  }

  dismiss(id: number): void {
    const toast = this.toasts.find(t => t.id === id);
    if (toast) {
      (toast as any).exiting = true;
      setTimeout(() => this.toastService.dismiss(id), 280);
    }
  }
}
