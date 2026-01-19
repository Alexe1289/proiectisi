import { Component, NgZone, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http'; // Added HttpParams
import esriConfig from '@arcgis/core/config.js';
import Map from '@arcgis/core/Map.js';
import MapView from '@arcgis/core/views/MapView.js';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter.js';
import { SearchStateService } from 'src/app/services/search-state.service';
import BasemapToggle from '@arcgis/core/widgets/BasemapToggle.js';
import { environment } from 'src/environments/environment';

interface LocationResult {
	arcgis_feature_id: string;
	name: string;
	address: string;
	capacity: number;
	location_type: string;
	price: number;
	description: string;
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
	searchResults: LocationResult[] = [];
	showMap = false;

	selectedLocation: any = null;
	selectedLocationImages: string[] = [];
	selectedImageIndex: number = 0;

	locationTypes: string[] = [
		'Conference Hall',
		'Arena',
		'Theater',
		'Club',
		'Outdoors',
		'Studio'
	];

	private readonly apiKey = 'AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj';
	private readonly featureLayerUrl = 'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente2/FeatureServer/0';
	private readonly parkingLayerUrl = 'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente/FeatureServer/0';

	constructor(private fb: FormBuilder, private http: HttpClient, private zone: NgZone, private searchStateService: SearchStateService) {
		this.reservationForm = this.fb.group({
			dateRange: this.fb.group({ start: [null], end: [null] }),
			locationQuery: [''],
			capacity: [''],
			locationType: ['']
		});
	}

	ngOnInit() {
		const savedResults = this.searchStateService.searchResults;
		if (savedResults && savedResults.length > 0) {
			this.searchResults = savedResults;
			this.showMap = this.searchStateService.showMap;

			if (this.searchStateService.searchFormValue) {
				this.reservationForm.patchValue(this.searchStateService.searchFormValue);
			}

			if (this.showMap) {
				setTimeout(() => this.initMap(), 0);
			}
		}
	}
	ngAfterViewInit() { }

	search() {
		const token = sessionStorage.getItem('auth_token');
		if (!token) { console.error('JWT token missing'); return; }

		const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

		const formVal = this.reservationForm.value;
		let params = new HttpParams();

		if (formVal.capacity) {
			params = params.set('capacity', formVal.capacity);
		}
		if (formVal.locationType) {
			params = params.set('location_type', formVal.locationType);
		}
		const start = formVal.dateRange?.start;
		const end = formVal.dateRange?.end;

		if (start && end) {
			const safeStart = new Date(start);
			const safeEnd = new Date(end);


			safeStart.setHours(13, 0, 0, 0);
			safeEnd.setHours(14, 0, 0, 0);
			params = params.set('start_datetime', safeStart.toISOString());
			params = params.set('end_datetime', safeEnd.toISOString());
		}

		this.http.get<any[]>("http://localhost:5001/api/client/locations/available", { headers, params }).subscribe({
			next: async (res) => {
				const query = (formVal.locationQuery || '').toLowerCase();

				const filtered = res.filter(loc => {
					console.log("loc.address:", loc.address);
					console.log("loc.name:", loc.name);
					console.log("query:", query);


					if (!query) return true;
					return (loc.name?.toLowerCase().includes(query) ?? false) ||
						(loc.address?.toLowerCase().includes(query) ?? false);
				});

				this.searchResults = filtered.map(loc => ({
					...loc,
					imageUrls: [],
					currentImageIndex: 0,
					loadingImages: true
				}));

				this.showMap = false;
				this.searchStateService.setSearchState(
					this.searchResults,
					this.reservationForm.value,
					false
				);

				await Promise.all(this.searchResults.map(loc => this.hydrateLocationWithImages(loc)));
			},
			error: (err) => console.error('Error fetching locations', err)
		});
	}

	async hydrateLocationWithImages(location: LocationResult) {
		const objectId = location.arcgis_feature_id;
		if (!objectId) { location.loadingImages = false; return; }

		try {
			const listUrl = `${this.featureLayerUrl}/${objectId}/attachments?f=json&token=${environment.arcgis.token}`;
			const res = await fetch(listUrl);
			const json = await res.json();

			if (json.attachmentInfos?.length > 0) {
				location.imageUrls = json.attachmentInfos.map((att: any) =>
					`${this.featureLayerUrl}/${objectId}/attachments/${att.id}?token=${environment.arcgis.token}`
				);
			}
		} catch (error) {
			console.error(`Failed to load images`, error);
		} finally {
			location.loadingImages = false;
		}
	}


	nextImage(e: Event, loc: LocationResult) {
		e.stopPropagation();
		if (loc.imageUrls && loc.imageUrls.length > 1) {
			loc.currentImageIndex = (loc.currentImageIndex! + 1) % loc.imageUrls.length;
		}
	}

	prevImage(e: Event, loc: LocationResult) {
		e.stopPropagation();
		if (loc.imageUrls && loc.imageUrls.length > 1) {
			loc.currentImageIndex = (loc.currentImageIndex! - 1 + loc.imageUrls.length) % loc.imageUrls.length;
		}
	}

	toggleMap() {
		this.showMap = !this.showMap;
		this.searchStateService.updateShowMap(this.showMap);
		if (this.showMap && !this.mapView) {
			setTimeout(() => this.initMap(), 0);
		} else if (this.mapView) {
			this.mapView.destroy();
			this.mapView = null as any;
		}
	}

	async initMap() {
		esriConfig.apiKey = this.apiKey;
		const locationsLayer = new FeatureLayer({
			url: this.featureLayerUrl, outFields: ["*"], popupEnabled: false,
		});
		const parkingLayer = new FeatureLayer({
			url: this.parkingLayerUrl, popupEnabled: false, outFields: ["*"],
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
			map, container: this.mapViewEl.nativeElement,
			center: [26.1025, 44.4268], zoom: 12
		});
		const toggle = new BasemapToggle({
			view: this.mapView,
			nextBasemap: "arcgis-imagery"
		});
		this.mapView.ui.add(toggle, "bottom-right");

		this.mapView.on("click", async (event) => {
			const hit = await this.mapView.hitTest(event);
			const result = hit.results.find((r) => r.type === "graphic" && (r as any).graphic.layer === locationsLayer);

			if (!result) return;

			const graphic = (result as any).graphic;
			const oid = graphic.attributes.OBJECTID;

			this.zone.run(() => {
				this.selectedLocation = graphic.attributes;
				this.selectedLocationImages = [];
				this.selectedImageIndex = 0;
			});

			await this.loadMapAttachments(oid);

			this.mapView.goTo({ target: graphic.geometry, zoom: 17 });

			parkingLayer.featureEffect = {
				filter: new FeatureFilter({ where: `location_id = ${oid}` }),
				includedEffect: "opacity(100%)", excludedEffect: "opacity(0%)"
			} as any;
		});
	}

	async loadMapAttachments(objectId: number) {
		const listUrl = `${this.featureLayerUrl}/${objectId}/attachments?f=json&token=${environment.arcgis.token}`;
		const res = await fetch(listUrl);
		const json = await res.json();

		if (json.attachmentInfos?.length > 0) {
			this.zone.run(() => {
				this.selectedLocationImages = json.attachmentInfos.map((att: any) =>
					`${this.featureLayerUrl}/${objectId}/attachments/${att.id}?token=${environment.arcgis.token}`
				);
			});
		}
	}

	nextMapImage() {
		if (this.selectedLocationImages.length > 1) {
			this.selectedImageIndex = (this.selectedImageIndex + 1) % this.selectedLocationImages.length;
		}
	}

	prevMapImage() {
		if (this.selectedLocationImages.length > 1) {
			this.selectedImageIndex = (this.selectedImageIndex - 1 + this.selectedLocationImages.length) % this.selectedLocationImages.length;
		}
	}

	closePanel() {
		this.selectedLocation = null;
		this.selectedLocationImages = [];
	}

	ngOnDestroy(): void {
		if (this.mapView) { this.mapView.destroy(); }
	}
}