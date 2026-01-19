import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  role = '';
  name = '';
  email = '';
  phone = '';
  password = '';

  message = '';
  success = false;

  constructor(private http: HttpClient, private router: Router) { }


  ngOnInit(): void {
  }

  onSubmit() {
    const payload = {
      role: this.role,
      name: this.name,
      email: this.email,
      phone: this.phone,
      password: this.password
    };

    this.http.post("http://localhost:5001/api/register", payload).
      subscribe({
        next: (res: any) => {
          this.message = 'Account created successfully! Redirecting to Login...';
          this.success = true;

          setTimeout(() => {
            this.message = '';
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (err) => {
          this.message = err.error.error || 'Signup failed';
          this.success = false;

          setTimeout(() => {
            this.message = '';
          }, 3000);
        }
      });
  }

}
