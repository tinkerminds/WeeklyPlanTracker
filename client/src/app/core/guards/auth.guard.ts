import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TeamMemberService } from '../services/team-member.service';

/** Redirects to /setup if no team members exist. */
export const hasTeamGuard: CanActivateFn = () => {
    const teamService = inject(TeamMemberService);
    const router = inject(Router);

    if (!teamService.anyExist()) {
        router.navigate(['/setup']);
        return false;
    }
    return true;
};

/** Redirects to /login if user is not logged in. */
export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
        router.navigate(['/login']);
        return false;
    }
    return true;
};
