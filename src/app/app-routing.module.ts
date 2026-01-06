import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { MapComponent } from './pages/map/map.component';
import { HomeComponent } from './pages/home/home.component';
import { ProviderComponent} from './pages/providers/provider.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { ReservationComponent } from './pages/reservation/reservation.component';
import { AuthGuard } from './auth/auth.guard';
import { ROLES } from './auth/roles';

export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    data: { roles: [ROLES.GUEST, ROLES.CLIENT, ROLES.PROVIDER] }
  },
  {
    path: 'map',
    component: MapComponent,
    canActivate: [AuthGuard],
    data: { roles: [ROLES.CLIENT, ROLES.PROVIDER] }
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [AuthGuard],
    data: { roles: [ROLES.GUEST] }
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [AuthGuard],
    data: { roles: [ROLES.GUEST] }
  },
  {
    path: 'provider',
    component: ProviderComponent,
    canActivate: [AuthGuard],
    data: { roles: [ROLES.PROVIDER] }
  },
  {
    path: 'reservation',
    component: ReservationComponent,
    canActivate: [AuthGuard],
    data: { roles: [ROLES.CLIENT] }
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  }
];

const config: ExtraOptions = {
  useHash: false,
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
