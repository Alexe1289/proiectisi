import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import Map from '@arcgis/core/Map.js';
import MapView from '@arcgis/core/views/MapView.js';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js';
import esriConfig from "@arcgis/core/config.js";

@Component({
  selector: 'reservation-dashboard',
  templateUrl: './reservation-dashboard.component.html',
  styleUrls: ['./reservation-dashboard.component.scss']
})
export class ReservationDashboardComponent implements AfterViewInit {

  @ViewChild('mapViewNode', { static: true }) mapViewEl!: ElementRef;
  private readonly apiKey =
		'AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj';

	private readonly featureLayerUrl =
		'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente2/FeatureServer/0';

  view!: MapView;

  /* TEMP mock calendar data — replace with backend later */
  calendarDays = [
    { day: 1, reservation: false, request: true },
    { day: 2, reservation: true, request: false },
    { day: 3, reservation: false, request: false },
    { day: 4, reservation: true, request: false },
    { day: 5, reservation: false, request: true },
    { day: 6, reservation: false, request: false },
    { day: 7, reservation: true, request: false },
    // Fill up 30 days later
  ];

  /* TEMP list of upcoming reservations */
  upcomingReservations = [
    { locationName: "Sala Polivalentă", date: "2025-01-12", status: "approved" },
    { locationName: "Teatrul Mic", date: "2025-01-15", status: "pending" },
    { locationName: "Arena Națională", date: "2025-01-20", status: "approved" }
  ];

  ngAfterViewInit(): void {

    esriConfig.apiKey = this.apiKey;

    const locationsLayer = new FeatureLayer({
      url: this.featureLayerUrl,
      outFields: ["*"]
    });

    const map = new Map({
      basemap: "arcgis-topographic",
      layers: [locationsLayer]
    });

    this.view = new MapView({
      map,
      container: this.mapViewEl.nativeElement,
      center: [26.1025, 44.4268], // Bucharest
      zoom: 12
    });
  }
}
