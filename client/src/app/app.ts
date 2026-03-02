import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `
    <div class="app-shell">
      <router-outlet></router-outlet>
      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    }
  `]
})
export class App {
  title = 'Weekly Plan Tracker';
}
