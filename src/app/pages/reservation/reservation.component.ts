import { Component, NgZone, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import esriConfig from '@arcgis/core/config.js';
import Map from '@arcgis/core/Map.js';
import MapView from '@arcgis/core/views/MapView.js';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter.js';

// Interface to extend the location data with UI specific properties
interface LocationResult {
  OBJECTID: number;
  name: string;
  address: string;
  capacity: number;
  location_type: string;
  // UI specific fields
  imageUrls?: string[];
  currentImageIndex?: number;
  loadingImages?: boolean;
  [key: string]: any;
}

@Component({
  selector: 'app-reservation',
  templateUrl: './reservation.component.html',
  styleUrls: ['./reservation.component.scss']
})
export class ReservationComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapViewNode', { static: false }) mapViewEl!: ElementRef;
  mapView!: MapView;
  reservationForm: FormGroup;

  // Typed array for better handling
  searchResults: LocationResult[] = [];

  showMap = false;
  selectedLocation: any = null;
  selectedLocationImage: string | null = null;

  private readonly ARCGIS_TOKEN = 'mzFcMRqhxzPAoRJavp2MJimJ161_xQX9HpQnjt-dpoUXn4C1DV-VDz3hET-d-iJ23Etq93Eezd6hTQHUDWdR0_BQttAgZ77ogaW7SiwL6-eKYm3b4dEMRND94CDU0_yQFTIkcaiYjr6bSXfhlDiFtCLhrqNbf13A8ZCKnLkoqiVEz_5wYye_yFW8bRptnI4F';
  private readonly apiKey = 'AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj';

  private readonly featureLayerUrl = 'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente2/FeatureServer/0';
  private readonly parkingLayerUrl = 'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente/FeatureServer/0';

  constructor(private fb: FormBuilder, private http: HttpClient, private zone: NgZone) {
    this.reservationForm = this.fb.group({
      dateRange: this.fb.group({
        start: [null],
        end: [null]
      }),
      locationQuery: ['']
    });
  }

  ngAfterViewInit() { }

  search() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('JWT token missing');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any[]>("http://localhost:5001/api/client/locations", { headers }).subscribe({
      next: async (res) => {
        console.log('Locations received:', res);

        // Initialize results with image properties
        this.searchResults = res.map(loc => ({
          ...loc,
          imageUrls: [],
          currentImageIndex: 0,
          loadingImages: true
        }));

        this.showMap = false;

        // Fetch images for all results in parallel (or sequentially if preferred)
        // We do this after setting searchResults so the UI renders the cards immediately
        await Promise.all(this.searchResults.map(loc => this.hydrateLocationWithImages(loc)));
      },
      error: (err) => console.error('Error fetching locations', err)
    });
  }

  // --- Image Carousel Logic ---

  async hydrateLocationWithImages(location: LocationResult) {
    if (!location.OBJECTID) {
      location.loadingImages = false;
      return;
    }

    try {
      const listUrl = `${this.featureLayerUrl}/${location.OBJECTID}/attachments?f=json&token=${this.ARCGIS_TOKEN}`;
      const res = await fetch(listUrl);
      const json = await res.json();

      if (json.attachmentInfos && json.attachmentInfos.length > 0) {
        location.imageUrls = json.attachmentInfos.map((att: any) =>
          `${this.featureLayerUrl}/${location.OBJECTID}/attachments/${att.id}?token=${this.ARCGIS_TOKEN}`
        );
      }
    } catch (error) {
      console.error(`Failed to load images for ${location.name}`, error);
    } finally {
      location.loadingImages = false;
    }
  }

  nextImage(e: Event, loc: LocationResult) {
    e.stopPropagation(); // Prevent clicking the card
    if (loc.imageUrls && loc.imageUrls.length > 1) {
      loc.currentImageIndex = (loc.currentImageIndex! + 1) % loc.imageUrls.length;
    }
  }

  prevImage(e: Event, loc: LocationResult) {
    e.stopPropagation();
    if (loc.imageUrls && loc.imageUrls.length > 1) {
      loc.currentImageIndex =
        (loc.currentImageIndex! - 1 + loc.imageUrls.length) % loc.imageUrls.length;
    }
  }

  // --- Map Logic ---

  toggleMap() {
    this.showMap = !this.showMap;
    if (this.showMap && !this.mapView) {
      setTimeout(() => this.initMap(), 0);
    } else {
      if (this.mapView) {
        this.mapView.destroy();
        this.mapView = null as any; // forceful cast to clear
      }
    }
  }

  async initMap() {
    esriConfig.apiKey = this.apiKey;

    const locationsLayer = new FeatureLayer({
      url: this.featureLayerUrl,
      outFields: ["*"],
      popupEnabled: false,
    });

    const parkingLayer = new FeatureLayer({
      url: this.parkingLayerUrl,
      popupEnabled: false,
      outFields: ["*"],
    });

    parkingLayer.featureEffect = {
      filter: new FeatureFilter({ where: "1 = 0" }),
      excludedEffect: "opacity(0%)"
    } as any;

    const map = new Map({
      basemap: 'arcgis-topographic',
      layers: [locationsLayer, parkingLayer]
    });

    this.mapView = new MapView({
      map,
      container: this.mapViewEl.nativeElement,
      center: [26.1025, 44.4268], // Bucharest
      zoom: 12
    });

    let selectedLocationOID: number | null = null;

    this.mapView.on("click", async (event) => {
      const hit = await this.mapView.hitTest(event);
      const result = hit.results.find((r) =>
        r.type === "graphic" && (r as any).graphic.layer === locationsLayer
      );

      if (!result) return;

      const graphic = (result as any).graphic;
      this.zone.run(() => {
        this.selectedLocation = graphic.attributes;
      });
      selectedLocationOID = graphic.attributes.OBJECTID;

      await this.loadAttachments(graphic.attributes.OBJECTID);

      this.mapView.goTo({
        target: graphic.geometry,
        zoom: 17
      });

      parkingLayer.featureEffect = {
        filter: new FeatureFilter({ where: `location_id = ${selectedLocationOID}` }),
        includedEffect: "opacity(100%)",
        excludedEffect: "opacity(0%)"
      } as any;
    });
  }

  async loadAttachments(objectId: number) {
    // Reusing logic logic similar to hydrate but for single selection
    const listUrl = `${this.featureLayerUrl}/${objectId}/attachments?f=json&token=${this.ARCGIS_TOKEN}`;
    const res = await fetch(listUrl);
    const json = await res.json();

    const attachments = json.attachmentInfos;
    if (!attachments || !attachments.length) {
      this.selectedLocationImage = null;
      return;
    }
    const attachmentId = attachments[0].id;
    this.selectedLocationImage = `${this.featureLayerUrl}/${objectId}/attachments/${attachmentId}?token=${this.ARCGIS_TOKEN}`;
  }

  closePanel() {
    this.selectedLocation = null;
  }

  ngOnDestroy(): void {
    if (this.mapView) {
      this.mapView.destroy();
    }
  }
}