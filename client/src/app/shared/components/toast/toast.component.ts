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
        <div class="toast" [class]="'toast-' + toast.type">
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" (click)="dismiss(toast.id)">×</button>
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
      gap: 8px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      border-radius: 8px;
      color: #fff;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
      min-width: 280px;
    }
    .toast-success { background: #16a34a; }
    .toast-warning { background: #d97706; }
    .toast-error { background: #dc2626; }
    .toast-close {
      background: none;
      border: none;
      color: #fff;
      font-size: 18px;
      cursor: pointer;
      margin-left: auto;
      opacity: 0.8;
    }
    .toast-close:hover { opacity: 1; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent {
  toasts: Toast[] = [];
  private toastService = inject(ToastService);

  constructor() {
    this.toastService.toasts$.subscribe((toasts: Toast[]) => this.toasts = toasts);
  }

  dismiss(id: number): void {
    this.toastService.dismiss(id);
  }
}
