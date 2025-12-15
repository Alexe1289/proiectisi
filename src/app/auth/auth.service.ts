import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private roleSubject = new BehaviorSubject<string>(localStorage.getItem('user_role') || 'guest');
  role$ = this.roleSubject.asObservable();

  setRole(role: string) {
    localStorage.setItem('user_role', role);
    this.roleSubject.next(role);
  }

  getRole(): string {
    return this.roleSubject.getValue();
  }

  isLoggedIn(): boolean {
    return !(this.getRole()=='guest');
  }
}
