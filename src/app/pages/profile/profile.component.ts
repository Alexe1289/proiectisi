import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  // User data
  userData = {
    name: '',
    email: '',
    phone: '',
    role: ''
  };

  isEditMode = false;
  message = '';
  success = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile() {
    // We assume the backend identifies the user via the JWT token in headers
    this.http.get("http://localhost:5001/api/profile").subscribe({
      next: (res: any) => {
        this.userData = res;
      },
      error: (err) => console.error('Could not load profile', err)
    });
  }

  toggleEdit() {
    if (this.isEditMode) {
      this.saveChanges();
    } else {
      this.isEditMode = true;
    }
  }

  saveChanges() {
    this.http.put("http://localhost:5001/api/profile", this.userData).subscribe({
      next: (res: any) => {
        this.message = 'Profile updated successfully!';
        this.success = true;
        this.isEditMode = false;
      },
      error: (err) => {
        this.message = 'Update failed';
        this.success = false;
      }
    });
  }

  showPasswordChange = false;
    passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
    };

    togglePasswordChange() {
    this.showPasswordChange = !this.showPasswordChange;
    // Resetăm câmpurile dacă închidem secțiunea
    if (!this.showPasswordChange) {
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
    }
    }

    onChangePassword() {
    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
        this.message = "New passwords do not match!";
        this.success = false;
        return;
    }

    // Aici va veni apelul HTTP către backend (ex: /api/profile/change-password)
    console.log('Changing password with:', this.passwordData);
    
    this.http.put("http://localhost:5001/api/profile/change-password", this.passwordData).subscribe({
        next: () => {
        this.message = "Password updated successfully!";
        this.success = true;
        this.togglePasswordChange();
        },
        error: (err) => {
        this.message = err.error.msg || "Failed to update password";
        this.success = false;
        }
    });
    }

}