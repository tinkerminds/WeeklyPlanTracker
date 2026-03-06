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
import { PastWeeksComponent } from './features/past-weeks/past-weeks.component';

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
    TeamProgressComponent,
    PastWeeksComponent
  ],
  template: `
    <div class="app-shell">
      <!-- Top Navbar -->
      <nav class="navbar">
        <span class="navbar-brand" (click)="goHome()">
          <span class="brand-icon">📋</span> Weekly Plan Tracker
        </span>
        <div class="navbar-right">
          @if (isLoggedIn) {
            <div class="nav-user">
              <div class="nav-avatar">{{ getInitials(currentUserName) }}</div>
              <div class="nav-user-info">
                <span class="nav-user-name">{{ currentUserName }}</span>
                <span class="nav-role-badge" [class.lead]="currentUserRole === 'Lead'">{{ currentUserRole === 'Lead' ? '👑 Lead' : 'Member' }}</span>
              </div>
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
              <div class="skeleton-loader">
                <div class="skeleton skeleton-line" style="width: 40%; height: 20px;"></div>
                <div class="skeleton skeleton-line-short"></div>
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
                <div class="skeleton skeleton-card"></div>
              </div>
            </div>
          }
          @case ('setup') { <div class="screen-animate"><app-team-setup></app-team-setup></div> }
          @case ('login') { <div class="screen-animate"><app-login></app-login></div> }
          @case ('home') { <div class="screen-animate"><app-home></app-home></div> }
          @case ('manage-backlog') { <div class="screen-animate"><app-manage-backlog></app-manage-backlog></div> }
          @case ('manage-team') { <div class="screen-animate"><app-manage-team></app-manage-team></div> }
          @case ('start-week') { <div class="screen-animate"><app-week-setup></app-week-setup></div> }
          @case ('plan-my-work') { <div class="screen-animate"><app-plan-my-work></app-plan-my-work></div> }
          @case ('backlog-picker') { <div class="screen-animate"><app-backlog-picker></app-backlog-picker></div> }
          @case ('review-freeze') { <div class="screen-animate"><app-review-freeze></app-review-freeze></div> }
          @case ('update-progress') { <div class="screen-animate"><app-update-progress></app-update-progress></div> }
          @case ('team-progress') { <div class="screen-animate"><app-team-progress></app-team-progress></div> }
          @case ('past-weeks') { <div class="screen-animate"><app-past-weeks></app-past-weeks></div> }
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
        <button class="footer-btn" (click)="confirmAndLoadFile()">📤 Load Data from File</button>
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
      padding: 10px 24px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9));
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(255,255,255,0.08);
      position: sticky; top: 0; z-index: 100;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .navbar-brand {
      font-family: 'Inter', sans-serif; font-size: 17px; font-weight: 800;
      color: #fff; cursor: pointer; transition: opacity 0.2s;
      display: flex; align-items: center; gap: 6px; letter-spacing: -0.3px;
    }
    .brand-icon { font-size: 20px; }
    .navbar-brand:hover { opacity: 0.85; }
    .navbar-right { display: flex; align-items: center; gap: 16px; }
    .nav-user { display: flex; align-items: center; gap: 10px; }
    .nav-avatar {
      width: 34px; height: 34px; border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 800; color: #fff;
      flex-shrink: 0; box-shadow: 0 2px 8px rgba(59,130,246,0.3);
    }
    .nav-user-info { display: flex; flex-direction: column; gap: 1px; }
    .nav-user-name {
      font-size: 13px; font-weight: 700; color: #fff; line-height: 1.2;
    }
    .nav-role-badge {
      font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.6);
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .nav-role-badge.lead { color: var(--color-warning); }
    .navbar-actions { display: flex; gap: 6px; }
    .nav-btn {
      background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85); border: 1px solid rgba(255,255,255,0.1);
      padding: 7px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif;
    }
    .nav-btn:hover { background: rgba(255,255,255,0.18); color: #fff; border-color: rgba(255,255,255,0.2); }
    .theme-btn { min-width: 80px; }
    .main-content { padding-bottom: 70px; }
    .coming-soon { max-width: 400px; margin: 80px auto; text-align: center; font-family: 'Inter', sans-serif; }

    .footer-bar {
      position: fixed; bottom: 0; left: 0; right: 0;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      padding: 10px 20px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.88));
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      border-top: 1px solid rgba(255,255,255,0.06); z-index: 100;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
    }
    .footer-btn {
      background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.65);
      border: 1px solid rgba(255,255,255,0.1); padding: 6px 14px;
      border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer;
      font-family: 'Inter', sans-serif; transition: all 0.2s; white-space: nowrap;
    }
    .footer-btn:hover { background: rgba(255,255,255,0.12); color: #fff; border-color: rgba(255,255,255,0.2); }
    .footer-btn-danger { border-color: rgba(239,68,68,0.4); color: rgba(239,68,68,0.8); }
    .footer-btn-danger:hover { background: var(--color-danger); color: #fff; border-color: var(--color-danger); }
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
    .skeleton-loader {
      width: 100%; max-width: 600px; padding: 0 24px;
    }
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

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  toggleTheme(): void {
    this.theme.toggle();
  }

  downloadData(): void {
    this.dataService.exportData();
  }

  async confirmAndLoadFile(): Promise<void> {
    const ok = await this.confirm.confirm({
      title: '📤 Load Data from File',
      message: 'This will REPLACE all your current data (team members, backlog items, plans, and progress) with the data from the selected file. This cannot be undone. Make sure you have a backup first.',
      confirmText: 'Yes, Replace My Data',
      cancelText: 'Cancel',
      danger: true
    });
    if (!ok) return;
    // Trigger file picker after confirmation
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (input) input.click();
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
