import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import Map from '@arcgis/core/Map.js';
import MapView from '@arcgis/core/views/MapView.js';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js';
import esriConfig from "@arcgis/core/config.js";

@Component({
  selector: 'reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss']
})
export class ReservationComponent implements AfterViewInit {

  @ViewChild('mapViewNode', { static: true }) mapViewEl!: ElementRef;

  private readonly apiKey = 'AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj';
  private readonly featureLayerUrl = 'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente2/FeatureServer/0';

  view!: MapView;
  selectedLocation: any = null;
  selectedDate!: Date;
  availableHours: { label: string, selected: boolean, disabled: boolean }[] = [];

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

    // Click pe locație
    this.view.on("click", async (event) => {
      const hitTest = await this.view.hitTest(event);

      // Filtrăm doar hit-urile care au `graphic`
      const graphicHit = hitTest.results.find(
        (r): r is __esri.GraphicHit => 'graphic' in r && r.graphic.layer === locationsLayer
      );

      if (graphicHit) {
        this.selectedLocation = graphicHit.graphic;
        this.selectedDate = new Date(); // selectăm azi implicit
        this.loadAvailableHours(this.selectedDate);
      }
    });
  }

  loadAvailableHours(date: Date) {
    this.availableHours = [];
    const startHour = 8;
    const endHour = 20;
    const dateStr = date.toISOString().split('T')[0];

    for (let h = startHour; h < endHour; h++) {
      // verificăm dacă există rezervare deja
      const alreadyBooked = this.upcomingReservations.some(res =>
        res.locationName === this.selectedLocation.attributes.Name &&
        res.date === dateStr &&
        res.status === "approved"
      );

      this.availableHours.push({
        label: `${h}:00 - ${h + 1}:00`,
        selected: false,
        disabled: alreadyBooked
      });
    }
  }

  onDateSelected(date: Date) {
    this.selectedDate = date;
    this.loadAvailableHours(date);
  }

  confirmReservation() {
    const selectedTimes = this.availableHours
      .filter(h => h.selected && !h.disabled)
      .map(h => h.label);

    if (selectedTimes.length === 0) {
      alert("Selectează cel puțin un interval!");
      return;
    }

    const dateStr = this.selectedDate.toISOString().split('T')[0];

    // TEMP: salvăm în array local
    selectedTimes.forEach(hour => {
      this.upcomingReservations.push({
        locationName: this.selectedLocation.attributes.Name,
        date: dateStr,
        status: "pending"
      });
    });

    alert(`Rezervare făcută pentru: ${selectedTimes.join(', ')}`);
    this.loadAvailableHours(this.selectedDate); // updatează orele
  }
}
