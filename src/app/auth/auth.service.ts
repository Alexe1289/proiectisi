import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private roleSubject = new BehaviorSubject<string>(sessionStorage.getItem('user_role') || 'guest');
  role$ = this.roleSubject.asObservable();

  setRole(role: string) {
    sessionStorage.setItem('user_role', role);
    this.roleSubject.next(role);
  }

  getRole(): string {
    return this.roleSubject.getValue();
  }

  isLoggedIn(): boolean {
    return !(this.getRole() == 'guest');
  }

  /* Current user */
  private currentUserSubject = new BehaviorSubject<any>(JSON.parse(sessionStorage.getItem('user_data') || 'null'));

  constructor() { }

  setUser(user: any): void {
    sessionStorage.setItem('user_data', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getUser() {
    return this.currentUserSubject.asObservable();
  }

  logout() {
    this.setRole('guest');
    this.setUser(null);
    sessionStorage.removeItem('token');
  }
}
