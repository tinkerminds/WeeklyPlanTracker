import { Routes } from '@angular/router';
import { TeamSetupComponent } from './features/team-setup/team-setup.component';

export const routes: Routes = [
    { path: '', redirectTo: '/setup', pathMatch: 'full' },
    { path: 'setup', component: TeamSetupComponent },
    // Future routes:
    // { path: 'login', component: LoginComponent },
    // { path: 'home', component: HomeComponent },
];
