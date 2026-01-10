import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ROLES, Role } from '../../auth/roles';
import { getRoleFromToken } from '../../auth/jwt.util';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  email = '';
  password = '';

  message = '';
  success = false;
  currentRole: string = 'guest';

  constructor(private http: HttpClient, private router: Router, private authService: AuthService) { }

  onSubmit() {
    const payload = { email: this.email, password: this.password};

    this.http.post("http://localhost:5001/api/login", payload)
      .subscribe({
        next: (res: any) => {
          const token = res.access_token;
          localStorage.setItem('auth_token', token);
          this.authService.setUser(res.user);

          const role = getRoleFromToken(token);
          localStorage.setItem('user_role', role);
          this.currentRole = role;
          this.authService.setRole(role);

          this.message = 'Login successful! Redirecting...';
          this.success = true;
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 3000);
        },
        error: (err) => {
          console.error('Login error:', err);
          if (err.error?.error) {
            this.message = err.error.error;
          } else if (err.error?.message) {
            this.message = err.error.message;
          } else {
            this.message = 'Login failed!';
          }
          this.success = false;

          setTimeout(() => {
            this.message = '';
          }, 3000);
        }
      });
  }
}
