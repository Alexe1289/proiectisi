import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from '../../auth/auth.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    public currentRole: string = 'guest';

    constructor(private router: Router, public authService: AuthService) {
    }

    ngOnInit() {
        this.authService.role$.subscribe(role => {
        this.currentRole = role;
        });
    }

    navigateToMap() {
        this.router.navigate(['/map']);
    }

    navigateToLogin() {
        this.router.navigate(['/login']);
    }

    navigateToRegister() {
        this.router.navigate(['/register']);
    }

    navigateToProvider() {
        this.router.navigate(['/provider']);
    }

    navigateToReservation() {
        this.router.navigate(['/reservation']);
    }

}