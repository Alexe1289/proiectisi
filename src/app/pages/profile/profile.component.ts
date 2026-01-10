import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../auth/auth.service';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  userData = {
    name: '',
    email: '',
    phone: '',
    role: ''
  };

  isEditMode = false;
  message = '';
  success = false;
  private messageTimeout: any;

  constructor(private http: HttpClient, private authService: AuthService) {}

ngOnInit(): void {
    this.authService.getUser().subscribe({
      next: (user) => {
        if (user) {
          this.userData = { ...user };
        }
      },
      error: (err) => console.error('Eroare la preluarea datelor din AuthService', err)
    });
  }

private showMessage(text: string, isSuccess: boolean) {
    if (this.messageTimeout) clearTimeout(this.messageTimeout);
    
    this.message = text;
    this.success = isSuccess;

    this.messageTimeout = setTimeout(() => {
      this.message = '';
    }, 3000);
  }

  /* Backup data */
  backupData: any = null;

  toggleEdit() {
    if (this.isEditMode) {
      this.saveChanges();
    } else {
      this.backupData = { ...this.userData };
      this.isEditMode = true;
    }
  }

  saveChanges() {
    const token = localStorage.getItem('auth_token');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.put("http://localhost:5001/api/user/me", this.userData, { headers } ).subscribe({
      next: (res: any) => {
        this.showMessage('Profile updated successfully!', true);
        this.isEditMode = false;

        this.authService.setUser(this.userData);
      },
      error: (err) => {
        this.showMessage(err.error?.msg || 'Update failed!', false);
      }
    });
  }

  cancelEdit() {
    if (this.backupData) {
      this.userData = { ...this.backupData };
    }
    this.isEditMode = false;
    this.message = '';
  }

  showPasswordChange = false;
    passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
    };

    togglePasswordChange() {
    this.showPasswordChange = !this.showPasswordChange;
    if (!this.showPasswordChange) {
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
    }
    }

    onChangePassword() {
      if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
          this.showMessage("New passwords do not match!", false);
          return;
      }

      const token = localStorage.getItem('auth_token');
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
      
      this.http.put("http://localhost:5001/api/profile/change-password", this.passwordData, { headers } ).subscribe({
          next: () => {
            this.showMessage("Password updated successfully!", true);
            this.togglePasswordChange();
          },
          error: (err) => {
            this.showMessage(err.error?.msg || "Failed to update password", false);
          }
      });
    }

}