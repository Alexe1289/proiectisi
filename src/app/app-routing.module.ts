import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { MapComponent } from './pages/map/map.component';
import { HomeComponent } from './pages/home/home.component';
import { ProviderComponent} from './pages/providers/provider.component';
import { ReservationDashboardComponent } from './pages/reservation-dashboard/reservation-dashboard.component';


export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'map',
    component: MapComponent,
  },
  {
    path: 'providers',
    component: ProviderComponent,
  },
  {
    path: 'reservations',
    component: ReservationDashboardComponent,
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
