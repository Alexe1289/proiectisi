import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { MapComponent } from './pages/map/map.component';
import { HomeComponent } from './pages/home/home.component';
import { ProviderComponent } from './pages/providers/provider.component';
import { RegisterComponent } from './pages/register/register.component';
import { LoginComponent } from './pages/login/login.component';
import { ReservationComponent } from './pages/reservation/reservation.component';
import { AuthGuard } from './auth/auth.guard';
import { ROLES } from './auth/roles';
import { ReservationDetailComponent } from './pages/reservation-detail/reservation-detail.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ManageOffersComponent } from './pages/manage-offers/manage-offers.component';
import { MyBookingsComponent } from './pages/my-bookings/my-bookings.component';


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
    path: 'reservation/:id',
    component: ReservationDetailComponent,
    canActivate: [AuthGuard],
    data: { roles: [ROLES.CLIENT] }
  },
  {
    path: 'manage-offers',
    component: ManageOffersComponent,
    canActivate: [AuthGuard],
    data: { roles: [ROLES.PROVIDER] }
  },
  {
    path: 'my-bookings',
    component: MyBookingsComponent,
    canActivate: [AuthGuard],
    data: { roles: [ROLES.CLIENT] }
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
    data: { roles: [ROLES.CLIENT, ROLES.PROVIDER] }
  },
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
