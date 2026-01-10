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
import { RegisterComponent } from './pages/register/register.component';

import { FormsModule } from '@angular/forms';
import { MaterialModule } from "./material.module";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from "./pages/login/login.component";
import { ReservationComponent } from "./pages/reservation/reservation.component";

import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ReservationDetailComponent } from './pages/reservation-detail/reservation-detail.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ArcgisAuthService } from "./services/arcgis-auth.service";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    MapComponent,
    ProviderComponent,
    RegisterComponent,
    LoginComponent,
    ReservationComponent,
    ReservationDetailComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    MaterialModule,
    MatTabsModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    FlexLayoutModule,
    AngularFireModule.initializeApp(environment.firebase, 'AngularDemoFirebase'),
    AngularFireDatabaseModule,
    BrowserAnimationsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  providers: [ArcgisAuthService],
  bootstrap: [AppComponent]
})
export class AppModule { }
