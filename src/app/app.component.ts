import { Component, Inject, OnInit } from '@angular/core';
import { NavigationEnd, Event, Router } from '@angular/router';
import { ROLES, Role } from './auth/roles';
import { AuthService } from './auth/auth.service';
import { ArcgisAuthService } from './services/arcgis-auth.service';

interface ITab {
  name: string;
  link: string;
  roles?: string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {

  tabs: ITab[] = [{
    name: 'Home',
    link: '/home',
    roles: [ROLES.GUEST, ROLES.CLIENT, ROLES.PROVIDER]
  }, {
    name: 'Map',
    link: '/map',
    roles: [ROLES.CLIENT, ROLES.PROVIDER]
  }, {
    name: 'Register',
    link: '/register',
    roles: [ROLES.GUEST]
  }, {
    name: 'Login',
    link: '/login',
    roles: [ROLES.GUEST]
  }, {
    name: 'Provider',
    link: '/provider',
    roles: [ROLES.PROVIDER]
  }, {
    name: 'Reservation',
    link: '/reservation',
    roles: [ROLES.CLIENT]
  },
  ];

  activeTab = this.tabs[0].link;

  role: string = 'guest';
  currentRole: string = 'guest';

  constructor(private router: Router, private authService: AuthService, private arcgisAuthService: ArcgisAuthService) {
    this.authService.role$.subscribe(role => {
      this.role = role;
      this.currentRole = role;
    });

    this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.activeTab = event.url;
        console.log(event);
      }
    });
  }

  async ngOnInit() {
    await this.arcgisAuthService.getValidToken();
  }

  // See app.component.html
  mapLoadedEvent(status: boolean) {
    console.log('The map loaded: ' + status);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  get visibleTabs(): ITab[] {
    return this.tabs.filter(tab => tab.roles.includes(this.role));
  }

}

