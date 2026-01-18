import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // <--- 1. Import HTTP
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';

// ArcGIS Imports
import esriConfig from '@arcgis/core/config.js';
import Map from '@arcgis/core/Map.js';
import MapView from '@arcgis/core/views/MapView.js';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js';
import BasemapToggle from '@arcgis/core/widgets/BasemapToggle.js';

@Component({
    selector: 'app-reservation-detail',
    templateUrl: './reservation-detail.component.html',
    styleUrls: ['./reservation-detail.component.scss']
})
export class ReservationDetailComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('detailMapView', { static: false }) mapViewEl!: ElementRef;
    @ViewChild('successDialog') successDialog!: TemplateRef<any>;

    offerForm: FormGroup;
    propertyId: string | null = null;
    mapView: MapView | null = null;

    // Initial Placeholder Data (Will be overwritten by real data)
    property: any = {
        name: 'Loading...',
        address: '',
        pricePerDay: 450, // Default/Placeholder since backend might not have it yet
        capacity: 0,
        location_type: '',
        description: 'A stunning venue perfect for large events, conferences, and weddings. Located in the heart of the city.',
        provider: {
            name: '',
            phone: '',
            email: '',
            responseRate: '98%',
            joined: '2019'
        },
        images: [] // Starts empty
    };

    // UI State
    currentImageIndex = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private fb: FormBuilder,
        private _location: Location,
        private dialog: MatDialog,
        private http: HttpClient // <--- Inject HttpClient
    ) {
        this.offerForm = this.fb.group({
            priceOffer: ['', Validators.required],
            dateRange: this.fb.group({
                start: [null, Validators.required],
                end: [null, Validators.required]
            }),
            guestCount: ['', Validators.required],
            message: ['']
        });
    }

    ngOnInit(): void {
        this.propertyId = this.route.snapshot.paramMap.get('id');

        // Set default price
        this.offerForm.patchValue({ priceOffer: this.property.pricePerDay });

        // Fetch Real Data
        if (this.propertyId) {
            this.fetchLocationDetails(this.propertyId);
        }
    }

    // --- 1. Fetch Data from Backend ---
    // --- 1. Fetch Single Location from Backend ---
    fetchLocationDetails(id: string) {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

        const url = `http://localhost:5001/api/client/locations/${id}`;

        this.http.get<any>(url, { headers }).subscribe({
            next: (location) => {
                if (location) {
                    this.property.name = location.name;
                    this.property.address = location.address;
                    this.property.capacity = location.capacity;
                    this.property.location_type = location.location_type;
                    this.property.provider = location.provider;
                    this.property.description = location.description;

                    // Now fetch the images for this specific location
                    this.loadLocationImages(id);
                }
            },
            error: (err) => console.error('Error fetching location details', err)
        });
    }

    // --- 2. Fetch Images from ArcGIS ---
    async loadLocationImages(id: string) {
        try {
            const listUrl = `${environment.arcgis.featureLayerUrl}/${id}/attachments?f=json&token=${environment.arcgis.token}`;
            const res = await fetch(listUrl);
            const json = await res.json();

            if (json.attachmentInfos && json.attachmentInfos.length > 0) {
                // Map the results to full URLs
                this.property.images = json.attachmentInfos.map((att: any) =>
                    `${environment.arcgis.featureLayerUrl}/${id}/attachments/${att.id}?token=${environment.arcgis.token}`
                );
            } else {
                // Fallback if no images found
                this.property.images = [];
            }
        } catch (error) {
            console.error('Failed to load images from ArcGIS', error);
        }
    }

    // --- Image Navigation ---
    nextImage() {
        if (this.property.images.length > 1) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.property.images.length;
        }
    }

    prevImage() {
        if (this.property.images.length > 1) {
            this.currentImageIndex = (this.currentImageIndex - 1 + this.property.images.length) % this.property.images.length;
        }
    }

    // --- Map Logic ---
    ngAfterViewInit(): void {
        if (this.propertyId) {
            this.initDetailMap(this.propertyId);
        }
    }

    async initDetailMap(id: string) {
        esriConfig.apiKey = environment.arcgis.apiKey;

        const locationsLayer = new FeatureLayer({
            url: environment.arcgis.featureLayerUrl,
            definitionExpression: `OBJECTID = ${id}`,
            outFields: ["*"],
            popupEnabled: false
        });

        const parkingLayer = new FeatureLayer({
            url: environment.arcgis.parkingLayerUrl,
            definitionExpression: `location_id = ${id}`,
            outFields: ["*"],
            popupEnabled: true
        });

        const map = new Map({
            basemap: 'arcgis-topographic',
            layers: [locationsLayer, parkingLayer]
        });

        this.mapView = new MapView({
            map: map,
            container: this.mapViewEl.nativeElement,
            center: [26.1025, 44.4268],
            zoom: 12,
            ui: { components: ["zoom", "attribution"] }
        });

        const toggle = new BasemapToggle({
            view: this.mapView,
            nextBasemap: "arcgis-imagery"
        });
        this.mapView.ui.add(toggle, "bottom-right");

        this.mapView.whenLayerView(locationsLayer).then((layerView) => {
            locationsLayer.queryFeatures({
                where: `OBJECTID = ${id}`,
                returnGeometry: true
            }).then((results) => {
                if (results.features.length > 0) {
                    const feature = results.features[0];
                    this.mapView!.goTo({
                        target: feature.geometry,
                        zoom: 17
                    });
                }
            });
        });
    }

    goBack() {
        this._location.back();
    }

    makeOffer() {
        if (this.offerForm.valid) {
            const token = localStorage.getItem('auth_token');
            const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
            const formValue = this.offerForm.value;
            
            const body = {
                start_datetime: formValue.dateRange.start.toISOString(),
                end_datetime: formValue.dateRange.end.toISOString(),
                price_offer: formValue.priceOffer,
                guest_count: formValue.guestCount
            };

            this.http.post(
                `http://localhost:5001/api/client/locations/${this.propertyId}/reservations`,
                body,
                { headers }
                ).subscribe({
                next: (res) => {
                    console.log('Rezervare salvată cu succes:', res);

                    const dialogRef = this.dialog.open(this.successDialog, {
                    width: '400px',
                    disableClose: true
                    });

                    dialogRef.afterClosed().subscribe(() => {
                    this.router.navigate(['/reservation']);
                    });
                },
                error: (err) => {
                    console.error('Eroare la trimiterea rezervării:', err);
                    alert('Eroare: ' + (err.error?.msg || 'Nu s-a putut salva rezervarea.'));
                }
                });
        } else {
            this.offerForm.markAllAsTouched();
        }
    }

    ngOnDestroy(): void {
        if (this.mapView) {
            this.mapView.destroy();
        }
    }
}