import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, switchMap } from 'rxjs';
import { NavigationService, Screen } from './core/services/navigation.service';
import { AuthService } from './core/services/auth.service';
import { TeamMemberService } from './core/services/team-member.service';
import { DataService } from './core/services/data.service';
import { ToastService } from './core/services/toast.service';
import { ConfirmService } from './core/services/confirm.service';
import { ThemeService } from './core/services/theme.service';
import { MemberRole } from './core/enums/enums';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmModalComponent } from './shared/components/confirm-modal/confirm-modal.component';
import { TeamSetupComponent } from './features/team-setup/team-setup.component';
import { LoginComponent } from './features/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { ManageBacklogComponent } from './features/manage-backlog/manage-backlog.component';
import { ManageTeamComponent } from './features/manage-team/manage-team.component';
import { WeekSetupComponent } from './features/week-setup/week-setup.component';
import { PlanMyWorkComponent } from './features/plan-my-work/plan-my-work.component';
import { BacklogPickerComponent } from './features/backlog-picker/backlog-picker.component';
import { ReviewFreezeComponent } from './features/review-freeze/review-freeze.component';
import { UpdateProgressComponent } from './features/update-progress/update-progress.component';
import { TeamProgressComponent } from './features/team-progress/team-progress.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ToastComponent,
    ConfirmModalComponent,
    TeamSetupComponent,
    LoginComponent,
    HomeComponent,
    ManageBacklogComponent,
    ManageTeamComponent,
    WeekSetupComponent,
    PlanMyWorkComponent,
    BacklogPickerComponent,
    ReviewFreezeComponent,
    UpdateProgressComponent,
    TeamProgressComponent
  ],
  template: `
    <div class="app-shell">
      <!-- Top Navbar -->
      <nav class="navbar">
        <span class="navbar-brand" (click)="goHome()">📋 Weekly Plan Tracker</span>
        <div class="navbar-right">
          @if (isLoggedIn) {
            <div class="nav-user">
              <span class="nav-user-name">{{ currentUserName }}</span>
              <span class="nav-role-badge" [class.lead]="currentUserRole === 'Lead'">{{ currentUserRole === 'Lead' ? 'Lead' : 'Member' }}</span>
            </div>
          }
          <div class="navbar-actions">
            @if (isLoggedIn) {
              <button class="nav-btn" (click)="switchUser()">🔄 Switch</button>
            }
            @if (currentScreen !== 'setup' && currentScreen !== 'login') {
              <button class="nav-btn" (click)="goHome()">🏠 Home</button>
            }
            <button class="nav-btn theme-btn" (click)="toggleTheme()">{{ theme.isDark ? '☀️ Light' : '🌙 Dark' }}</button>
          </div>
        </div>
      </nav>

      <!-- Screen Switcher -->
      <main class="main-content">
        @switch (currentScreen) {
          @case ('loading') {
            <div class="loading-screen">
              <div class="spinner"></div>
              <p>Loading...</p>
            </div>
          }
          @case ('setup') { <app-team-setup></app-team-setup> }
          @case ('login') { <app-login></app-login> }
          @case ('home') { <app-home></app-home> }
          @case ('manage-backlog') { <app-manage-backlog></app-manage-backlog> }
          @case ('manage-team') { <app-manage-team></app-manage-team> }
          @case ('start-week') { <app-week-setup></app-week-setup> }
          @case ('plan-my-work') { <app-plan-my-work></app-plan-my-work> }
          @case ('backlog-picker') { <app-backlog-picker></app-backlog-picker> }
          @case ('review-freeze') { <app-review-freeze></app-review-freeze> }
          @case ('update-progress') { <app-update-progress></app-update-progress> }
          @case ('team-progress') { <app-team-progress></app-team-progress> }
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
      <app-confirm-modal></app-confirm-modal>

      <!-- Footer utility bar (only after login) -->
      @if (isLoggedIn) {
      <footer class="footer-bar">
        <button class="footer-btn" (click)="downloadData()">📥 Download My Data</button>
        <button class="footer-btn" (click)="fileInput.click()">📤 Load Data from File</button>
        <button class="footer-btn" (click)="seedData()">🌱 Seed Sample Data</button>
        <button class="footer-btn footer-btn-danger" (click)="resetApp()">🗑️ Reset App</button>
        <input #fileInput type="file" accept=".json" (change)="onFileSelected($event)" style="display:none" />
      </footer>
      }
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      background: var(--gradient-bg);
      transition: background 0.3s ease;
    }
    .navbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 24px; background: #2664eb;
      border-bottom: 1px solid rgba(255,255,255,0.1); position: sticky; top: 0; z-index: 100;
    }
    .navbar-brand {
      font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 700;
      color: #fff; cursor: pointer; transition: opacity 0.2s;
    }
    .navbar-brand:hover { opacity: 0.85; }
    .navbar-right { display: flex; align-items: center; gap: 16px; }
    .nav-user { display: flex; align-items: center; gap: 8px; }
    .nav-user-name {
      font-size: 13px; font-weight: 600; color: #fff;
      padding: 4px 10px; border: 2px solid rgba(255,255,255,0.5); border-radius: 20px;
    }
    .nav-role-badge {
      font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px;
      background: var(--color-member); color: #fff; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .nav-role-badge.lead { background: var(--color-lead); color: #000; }
    .navbar-actions { display: flex; gap: 8px; }
    .nav-btn {
      background: rgba(255,255,255,0.15); color: #fff; border: none; padding: 8px 14px;
      border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 0.2s; font-family: 'Inter', sans-serif;
    }
    .nav-btn:hover { background: rgba(255,255,255,0.25); }
    .theme-btn { min-width: 90px; }
    .main-content { padding-bottom: 70px; }
    .coming-soon { max-width: 400px; margin: 80px auto; text-align: center; font-family: 'Inter', sans-serif; }

    .footer-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px 20px; background: var(--bg-footer); backdrop-filter: blur(8px);
      border-top: 1px solid var(--border-color); z-index: 100;
      transition: background 0.3s, border-color 0.3s;
    }
    .footer-btn {
      background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-color); padding: 6px 14px;
      border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer;
      font-family: 'Inter', sans-serif; transition: all 0.2s; white-space: nowrap;
    }
    .footer-btn:hover { background: var(--bg-card-hover); color: var(--text-primary); border-color: var(--border-hover); }
    .footer-btn-danger { border-color: var(--color-danger); color: var(--color-danger); }
    .footer-btn-danger:hover { background: var(--color-danger); color: #fff; }
    .coming-soon h2 { font-size: 24px; color: var(--text-heading); margin-bottom: 8px; }
    .coming-soon p { color: var(--text-secondary); margin-bottom: 24px; }
    .btn-primary {
      background: var(--color-primary); color: #fff; border: none; padding: 12px 24px;
      border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .btn-primary:hover { background: var(--color-primary-hover); }
    .loading-screen {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      min-height: 60vh; gap: 16px; font-family: 'Inter', sans-serif; color: var(--text-secondary);
    }
    .spinner {
      width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--color-primary);
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class App implements OnInit, OnDestroy {
  title = 'Weekly Plan Tracker';
  currentScreen: Screen = 'loading';
  isLoggedIn = false;
  currentUserName = '';
  currentUserRole = '';
  private subs: Subscription[] = [];
  private initDone = false;
  constructor(
    private nav: NavigationService,
    private authService: AuthService,
    private teamMemberService: TeamMemberService,
    private dataService: DataService,
    private toast: ToastService,
    private confirm: ConfirmService,
    public theme: ThemeService
  ) { }

  ngOnInit(): void {
    // 1) Subscribe to screen changes FIRST
    this.subs.push(
      this.nav.currentScreen$.subscribe(screen => {
        this.currentScreen = screen;
      })
    );

    // 2) Subscribe to auth changes
    this.subs.push(
      this.authService.currentUser$.subscribe(user => {
        this.isLoggedIn = !!user;
        this.currentUserName = user?.name || '';
        this.currentUserRole = user?.role || '';
      })
    );

    // 3) Check if team members exist, if so auto-login as Lead and go to home
    this.teamMemberService.checkExists().subscribe({
      next: (exists) => {
        this.initDone = true;
        if (exists) {
          // Fetch all members, auto-login as Lead, go straight to home
          this.teamMemberService.getAll().subscribe({
            next: (members) => {
              const lead = members.find(m => m.role === MemberRole.Lead) || members[0];
              if (lead) {
                this.authService.login(lead);
                this.currentScreen = 'home';
                this.nav.navigateTo('home');
              } else {
                this.currentScreen = 'login';
                this.nav.navigateTo('login');
              }
            },
            error: () => {
              // If fetching members fails, fall back to login
              this.currentScreen = 'login';
              this.nav.navigateTo('login');
            }
          });
        } else {
          this.currentScreen = 'setup';
          this.nav.navigateTo('setup');
        }
      },
      error: () => {
        this.initDone = true;
        this.currentScreen = 'setup';
        this.nav.navigateTo('setup');
      }
    });

    // 4) Timeout fallback — if API hasn't responded in 5 seconds, default to setup
    setTimeout(() => {
      if (!this.initDone) {
        this.initDone = true;
        this.currentScreen = 'setup';
        this.nav.navigateTo('setup');
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  goHome(): void {
    if (this.isLoggedIn) {
      this.nav.navigateTo('home');
    } else {
      // Check via API if team exists
      this.teamMemberService.checkExists().subscribe({
        next: (exists) => this.nav.navigateTo(exists ? 'login' : 'setup'),
        error: () => this.nav.navigateTo('setup')
      });
    }
  }

  switchUser(): void {
    this.authService.logout();
    this.nav.navigateTo('login');
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  downloadData(): void {
    this.dataService.exportData();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        this.dataService.importData(data).subscribe({
          next: () => {
            this.toast.success('Data restored from file!');
            this.authService.logout();
            window.location.reload();
          },
          error: () => this.toast.error('Failed to import data.')
        });
      } catch {
        this.toast.error('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  async seedData(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: '🌱 Seed Sample Data',
      message: 'This will add sample team members, backlog items, and a planning cycle. Existing data will not be erased.',
      confirmText: 'Yes, Load Sample Data',
      cancelText: 'No, Go Back',
      danger: false
    });
    if (!ok) return;
    this.dataService.seedData().subscribe({
      next: () => {
        this.toast.success('Sample data loaded!');
        this.authService.logout();
        window.location.reload();
      },
      error: () => this.toast.error('Failed to load sample data.')
    });
  }

  async resetApp(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: '🗑️ Reset App',
      message: 'This will permanently DELETE all data including team members, backlog, and plans. This action cannot be undone.',
      confirmText: 'Yes, Delete Everything',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    this.dataService.resetData().subscribe({
      next: () => {
        this.toast.success('All data has been reset.');
        this.authService.logout();
        window.location.reload();
      },
      error: () => this.toast.error('Failed to reset app.')
    });
  }
}
