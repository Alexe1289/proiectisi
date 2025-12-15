import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowedRoles: string[] = route.data['roles'] || [];
    const isLoggedIn = this.authService.isLoggedIn();
    const userRole = isLoggedIn ? this.authService.getRole() : 'guest';

    if (allowedRoles.includes('guest')) {
      if (isLoggedIn) {
        this.router.navigate(['/home']);
        return false;
      }
      return true;
    }

    if (!isLoggedIn) {
      this.router.navigate(['/home']);
      return false;
    }

    if (!allowedRoles.includes(userRole)) {
      this.router.navigate(['/home']);
      return false;
    }

    return true;
  }

}