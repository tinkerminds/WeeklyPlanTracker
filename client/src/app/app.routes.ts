import { Routes } from '@angular/router';
import { TeamSetupComponent } from './features/team-setup/team-setup.component';
import { LoginComponent } from './features/login/login.component';
import { HomeComponent } from './features/home/home.component';
import { hasTeamGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'setup', component: TeamSetupComponent },
    { path: 'login', component: LoginComponent, canActivate: [hasTeamGuard] },
    { path: 'home', component: HomeComponent, canActivate: [hasTeamGuard, authGuard] },
    { path: '**', redirectTo: '/login' },
];
