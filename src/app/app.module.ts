import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";

import { AppComponent } from "./app.component";
import { MapComponent as MapComponent } from "./pages/map/map.component";
import { AppRoutingModule } from "./app-routing.module";

import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

import { FlexLayoutModule } from '@angular/flex-layout';
import { HomeComponent } from "./pages/home/home.component";

import { AngularFireModule } from '@angular/fire/compat';
import { AngularFireDatabaseModule } from '@angular/fire/compat/database';
import { environment } from "src/environments/environment";
import { ProviderComponent } from "./pages/providers/provider.component";
import { ReservationDashboardComponent } from "./pages/reservation-dashboard/reservation-dashboard.component";
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    MapComponent,
    ProviderComponent,
    ReservationDashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatTabsModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    FlexLayoutModule,
    AngularFireModule.initializeApp(environment.firebase, 'AngularDemoFirebase'),
    AngularFireDatabaseModule,
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
