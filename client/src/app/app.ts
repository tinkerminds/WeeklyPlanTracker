import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NavigationService, Screen } from './core/services/navigation.service';
import { AuthService } from './core/services/auth.service';
import { TeamMemberService } from './core/services/team-member.service';
import { ToastComponent } from './shared/components/toast/toast.component';
import { TeamSetupComponent } from './features/team-setup/team-setup.component';
import { LoginComponent } from './features/login/login.component';
import { HomeComponent } from './features/home/home.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ToastComponent,
    TeamSetupComponent,
    LoginComponent,
    HomeComponent
  ],
  template: `
    <div class="app-shell">
      <!-- Top Navbar -->
      <nav class="navbar">
        <span class="navbar-brand" (click)="goHome()">📋 Weekly Plan Tracker</span>
        <div class="navbar-actions">
          @if (isLoggedIn) {
            <button class="nav-btn" (click)="switchUser()">🔄 Switch</button>
          }
          @if (currentScreen !== 'setup' && currentScreen !== 'login') {
            <button class="nav-btn" (click)="goHome()">🏠 Home</button>
          }
        </div>
      </nav>

      <!-- Screen Switcher -->
      <main class="main-content">
        @switch (currentScreen) {
          @case ('setup') { <app-team-setup></app-team-setup> }
          @case ('login') { <app-login></app-login> }
          @case ('home') { <app-home></app-home> }
          @default {
            <div class="coming-soon">
              <h2>🚧 Coming Soon</h2>
              <p>This feature is under development.</p>
              <button class="btn btn-primary" (click)="goHome()">Back to Home</button>
            </div>
          }
        }
      </main>

      <app-toast></app-toast>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    }
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 24px;
      background: rgba(30, 41, 59, 0.8);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid #334155;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .navbar-brand {
      font-family: 'Inter', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #e2e8f0;
      cursor: pointer;
      transition: color 0.2s;
    }
    .navbar-brand:hover {
      color: #3b82f6;
    }
    .navbar-actions {
      display: flex;
      gap: 8px;
    }
    .nav-btn {
      background: #334155;
      color: #94a3b8;
      border: none;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: 'Inter', sans-serif;
    }
    .nav-btn:hover {
      background: #475569;
      color: #e2e8f0;
    }
    .main-content {
      padding-bottom: 40px;
    }
    .coming-soon {
      max-width: 400px;
      margin: 80px auto;
      text-align: center;
      font-family: 'Inter', sans-serif;
    }
    .coming-soon h2 {
      font-size: 24px;
      color: #e2e8f0;
      margin-bottom: 8px;
    }
    .coming-soon p {
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .btn-primary {
      background: #3b82f6;
      color: #fff;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-primary:hover {
      background: #2563eb;
    }
  `]
})
export class App implements OnInit, OnDestroy {
  title = 'Weekly Plan Tracker';
  currentScreen: Screen = 'setup';
  isLoggedIn = false;
  private subs: Subscription[] = [];

  constructor(
    private nav: NavigationService,
    private authService: AuthService,
    private teamMemberService: TeamMemberService
  ) { }

  ngOnInit(): void {
    // Determine initial screen based on app state
    if (this.teamMemberService.anyExist()) {
      if (this.authService.isLoggedIn()) {
        this.nav.navigateTo('home');
      } else {
        this.nav.navigateTo('login');
      }
    } else {
      this.nav.navigateTo('setup');
    }

    // Subscribe to screen changes
    this.subs.push(
      this.nav.currentScreen$.subscribe(screen => this.currentScreen = screen)
    );

    // Subscribe to auth changes
    this.subs.push(
      this.authService.currentUser$.subscribe(user => this.isLoggedIn = !!user)
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  goHome(): void {
    if (this.isLoggedIn) {
      this.nav.navigateTo('home');
    } else if (this.teamMemberService.anyExist()) {
      this.nav.navigateTo('login');
    } else {
      this.nav.navigateTo('setup');
    }
  }

  switchUser(): void {
    this.authService.logout();
    this.nav.navigateTo('login');
  }
}
