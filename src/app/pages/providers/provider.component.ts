<<<<<<< Updated upstream
import {
	AfterViewInit,
	Component,
	ElementRef,
	OnDestroy,
	ViewChild,
} from '@angular/core';

// ArcGIS Maps SDK imports from @arcgis/core
import esriConfig from '@arcgis/core/config.js';
import Map from '@arcgis/core/Map.js';
import MapView from '@arcgis/core/views/MapView.js';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js';
import Editor from '@arcgis/core/widgets/Editor.js';
import IdentityManager from "@arcgis/core/identity/IdentityManager";
import { element } from 'protractor';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter.js';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
	selector: 'provider',
	templateUrl: './provider.component.html',
	styleUrls: ['./provider.component.scss'],
})

export class ProviderComponent implements AfterViewInit, OnDestroy {
	@ViewChild('mapViewNode', { static: true }) mapViewEl!: ElementRef<HTMLDivElement>;

	private view: MapView | null = null;
	// AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj
	private readonly apiKey =
		'AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj';

	private readonly featureLayerUrl =
		'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente2/FeatureServer/0';

	private readonly parkingLayerUrl =
		'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente/FeatureServer/0';
	private readonly token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2NTc4NjI5MSwianRpIjoiMmQ5MGFjNzQtOTBkOS00NzIyLWE1ZjMtZDkyM2YzMGZjZDJjIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjM6cHJvdmlkZXIiLCJuYmYiOjE3NjU3ODYyOTEsImNzcmYiOiIwNTdhODE1OC05Y2EwLTRjZjctOGZmZi01MGExMzMwN2Y3NDUifQ.7vBtFbhlv3dPE6ZA3Ze2GNRKBwZybZpSg8xI44bTUms";
	private allowedLocationIds: number[] = [];
	private isUpdatingParking = false;

	constructor(private http: HttpClient) { }

	async fetchAllowedLocationIds(): Promise<number[]> {

		const headers = new HttpHeaders({
			Authorization: `Bearer ${this.token}`
		});

		const response = await this.http.get<
			{ arcgis_feature_id: number }[]
		>(
			"http://localhost:5001/api/provider/locations",
			{ headers }
		).toPromise();

		console.log("Fetched allowed location IDs from backend:", response);
		return response?.map(r => r.arcgis_feature_id) ?? [];
	}
	async sendLocationToBackend(payload: {
		name: string;
		capacity: number;
		description?: string | null;
		address: string;
		location_type: string;
		arcgis_feature_id: number;
	}) {

		const headers = new HttpHeaders({
			Authorization: `Bearer ${this.token}`,
			"Content-Type": "application/json"
		});

		await this.http.post(
			"http://localhost:5001/api/provider/locations",
			payload,
			{ headers }
		).toPromise();

		console.log("Location sent to backend:", payload);
	}

	async ngAfterViewInit(): Promise<void> {
		try {
			// Configure global ArcGIS settings
			esriConfig.apiKey = this.apiKey;
			//         await IdentityManager.checkSignInStatus("https://www.arcgis.com/sharing")
			//   .catch(() => IdentityManager.getCredential("https://www.arcgis.com/sharing"));

			const locationsLayer = new FeatureLayer({
				url: this.featureLayerUrl,
				outFields: ['*'],
			});
			const parkingLayer = new FeatureLayer({
				url: this.parkingLayerUrl,
				outFields: ["*"],
			});

			parkingLayer.featureEffect = {
				filter: new FeatureFilter({
					where: "1 = 0"   // matches nothing → all hidden
				}),
				excludedEffect: "opacity(0%)"  // hide excluded features
			} as any;



			const map = new Map({
				basemap: 'arcgis-topographic',
				layers: [parkingLayer, locationsLayer],
			});

			this.view = new MapView({
				map,
				container: this.mapViewEl.nativeElement,
				center: [26.1025, 44.4268],
				zoom: 12,
			});


			await this.view.when();
			await locationsLayer.when();
			this.view.goTo({
				center: [26.1025, 44.4268], // Bucharest
				zoom: 13
			});

			this.allowedLocationIds = await this.fetchAllowedLocationIds();

			if (this.allowedLocationIds.length === 0) {
				locationsLayer.definitionExpression = "1 = 0"; // hide all
			} else {
				locationsLayer.definitionExpression =
					`OBJECTID IN (${this.allowedLocationIds.join(",")})`;
			}
			console.log("Allowed location IDs from backend:", this.allowedLocationIds);




			const editor = new Editor({
				view: this.view,
				layerInfos: [
					{
						layer: locationsLayer,
						addEnabled: true,
						updateEnabled: true,
						deleteEnabled: true,
						formTemplate: {
							elements: [
								{
									type: "group",
									label: "Location Info",
									elements: [
										{ type: "field", fieldName: "name" },
										{ type: "field", fieldName: "address" },
										{ type: "field", fieldName: "parking" },
										{ type: "field", fieldName: "capacity" },
										{ type: "field", fieldName: "location_type" }
									]
								}
							]
						} as any
					},
					{
						layer: parkingLayer,
						addEnabled: true,
						updateEnabled: true,
						deleteEnabled: true,
						formTemplate: {
							elements: [
								{
									type: "group",
									label: "Logistic Info",
									elements: [
										{ type: "field", fieldName: "capacity" },
										{ type: "field", fieldName: "parking" }
									]
								}
							]
						} as any
					}
				],
			});


			this.view.ui.add(editor, 'top-right');
			locationsLayer.on("edits", async (event) => {

				if (!event.addedFeatures || event.addedFeatures.length === 0) return;

				const added = event.addedFeatures[0];

				const objectId = added.objectId;
				console.log("New ArcGIS feature created:", objectId);

				const result = await locationsLayer.queryFeatures({
					objectIds: [objectId],
					outFields: ["*"],
					returnGeometry: false
				});

				const feature = result.features[0];
				const attrs = feature.attributes;

				this.allowedLocationIds.push(objectId);
				locationsLayer.definitionExpression = `OBJECTID IN (${this.allowedLocationIds.join(",")})`;

				await this.sendLocationToBackend({
					name: attrs.name,
					capacity: attrs.capacity,
					description: attrs.description ?? null,
					address: attrs.address,
					location_type: attrs.location_type,
					arcgis_feature_id: objectId
				});
			});

			let selectedLocationOID: number | null = null;

			this.view.on("click", async (event) => {
				const hit = await this.view!.hitTest(event);

				const result = hit.results.find((r) =>
					r.type === "graphic" && (r as any).graphic.layer === locationsLayer
				);

				if (!result) return;

				const graphic = (result as any).graphic;
				selectedLocationOID = graphic.attributes.OBJECTID;
				console.log("Selected Location OID:", selectedLocationOID);

				console.log("Clicked feature:", graphic);

				this.view!.goTo({
					target: graphic.geometry,
					zoom: 17
				});
				parkingLayer.featureEffect = {
					filter: new FeatureFilter({
						where: `location_id = ${selectedLocationOID}`
					}),
					includedEffect: "opacity(100%)",
					excludedEffect: "opacity(0%)"  // hide excluded features
				} as any;
			});

			parkingLayer.on("edits", async (event) => {
				if (this.isUpdatingParking) return;

				if (!event.addedFeatures || event.addedFeatures.length === 0) return;
				const added = event.addedFeatures[0];
				const objectId = added.objectId;
				console.log("New parking feature added:", added);
				const result = await parkingLayer.queryFeatures({
					objectIds: [objectId],
					outFields: ["*"],
					returnGeometry: true
				});
				const feature = result.features[0];
				feature.attributes.location_id = selectedLocationOID;
				this.isUpdatingParking = true;
				console.log("Updating parking feature with location_id:", feature.attributes.location_id);
				await parkingLayer.applyEdits({
					updateFeatures: [feature]
				});
				this.isUpdatingParking = false;

			});


		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Error loading map/editor', err);
		}
	}

	ngOnDestroy(): void {
		if (this.view) {
			this.view.destroy();
			this.view = null;
		}
	}
}
=======
import {
	AfterViewInit,
	Component,
	ElementRef,
	OnDestroy,
	ViewChild,
} from '@angular/core';

// ArcGIS Maps SDK imports from @arcgis/core
import esriConfig from '@arcgis/core/config.js';
import Map from '@arcgis/core/Map.js';
import MapView from '@arcgis/core/views/MapView.js';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer.js';
import Editor from '@arcgis/core/widgets/Editor.js';
import IdentityManager from "@arcgis/core/identity/IdentityManager";
import { element } from 'protractor';
import FeatureFilter from '@arcgis/core/layers/support/FeatureFilter.js';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
	selector: 'provider',
	templateUrl: './provider.component.html',
	styleUrls: ['./provider.component.scss'],
})

export class ProviderComponent implements AfterViewInit, OnDestroy {
	@ViewChild('mapViewNode', { static: true }) mapViewEl!: ElementRef<HTMLDivElement>;

	private view: MapView | null = null;
	// AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj
	private readonly apiKey =
		'AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj';

	private readonly featureLayerUrl =
		'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente2/FeatureServer/0';

	private readonly parkingLayerUrl =
		'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente/FeatureServer/0';
	private readonly token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2NTc4NjI5MSwianRpIjoiMmQ5MGFjNzQtOTBkOS00NzIyLWE1ZjMtZDkyM2YzMGZjZDJjIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjM6cHJvdmlkZXIiLCJuYmYiOjE3NjU3ODYyOTEsImNzcmYiOiIwNTdhODE1OC05Y2EwLTRjZjctOGZmZi01MGExMzMwN2Y3NDUifQ.7vBtFbhlv3dPE6ZA3Ze2GNRKBwZybZpSg8xI44bTUms";
	private allowedLocationIds: number[] = [];
	private isUpdatingParking = false;

	constructor(private http: HttpClient) { }

	async fetchAllowedLocationIds(): Promise<number[]> {

		const headers = new HttpHeaders({
			Authorization: `Bearer ${this.token}`
		});

		const response = await this.http.get<
			{ arcgis_feature_id: number }[]
		>(
			"http://localhost:5001/api/provider/locations",
			{ headers }
		).toPromise();

		console.log("Fetched allowed location IDs from backend:", response);
		return response?.map(r => r.arcgis_feature_id) ?? [];
	}
	async sendLocationToBackend(payload: {
		name: string;
		capacity: number;
		description?: string | null;
		address: string;
		location_type: string;
		arcgis_feature_id: number;
	}) {

		const headers = new HttpHeaders({
			Authorization: `Bearer ${this.token}`,
			"Content-Type": "application/json"
		});

		await this.http.post(
			"http://localhost:5001/api/provider/locations",
			payload,
			{ headers }
		).toPromise();

		console.log("Location sent to backend:", payload);
	}

	async ngAfterViewInit(): Promise<void> {
		try {
			// Configure global ArcGIS settings
			esriConfig.apiKey = this.apiKey;
			//         await IdentityManager.checkSignInStatus("https://www.arcgis.com/sharing")
			//   .catch(() => IdentityManager.getCredential("https://www.arcgis.com/sharing"));

			const locationsLayer = new FeatureLayer({
				url: this.featureLayerUrl,
				outFields: ['*'],
			});
			const parkingLayer = new FeatureLayer({
				url: this.parkingLayerUrl,
				outFields: ["*"],
			});

			parkingLayer.featureEffect = {
				filter: new FeatureFilter({
					where: "1 = 0"   // matches nothing → all hidden
				}),
				excludedEffect: "opacity(0%)"  // hide excluded features
			} as any;



			const map = new Map({
				basemap: 'arcgis-topographic',
				layers: [parkingLayer, locationsLayer],
			});

			this.view = new MapView({
				map,
				container: this.mapViewEl.nativeElement,
				center: [26.1025, 44.4268],
				zoom: 12,
			});


			await this.view.when();
			await locationsLayer.when();
			this.view.goTo({
				center: [26.1025, 44.4268], // Bucharest
				zoom: 13
			});

			this.allowedLocationIds = await this.fetchAllowedLocationIds();

			if (this.allowedLocationIds.length === 0) {
				locationsLayer.definitionExpression = "1 = 0"; // hide all
			} else {
				locationsLayer.definitionExpression =
					`OBJECTID IN (${this.allowedLocationIds.join(",")})`;
			}
			console.log("Allowed location IDs from backend:", this.allowedLocationIds);




			const editor = new Editor({
				view: this.view,
				layerInfos: [
					{
						layer: locationsLayer,
						addEnabled: true,
						updateEnabled: true,
						deleteEnabled: true,
						formTemplate: {
							elements: [
								{
									type: "group",
									label: "Location Info",
									elements: [
										{ type: "field", fieldName: "name" },
										{ type: "field", fieldName: "address" },
										{ type: "field", fieldName: "parking" },
										{ type: "field", fieldName: "capacity" },
										{ type: "field", fieldName: "location_type" }
									]
								}
							]
						} as any
					},
					{
						layer: parkingLayer,
						addEnabled: true,
						updateEnabled: true,
						deleteEnabled: true,
						formTemplate: {
							elements: [
								{
									type: "group",
									label: "Logistic Info",
									elements: [
										{ type: "field", fieldName: "capacity" },
										{ type: "field", fieldName: "parking" }
									]
								}
							]
						} as any
					}
				],
			});


			this.view.ui.add(editor, 'top-right');
			locationsLayer.on("edits", async (event) => {

				if (!event.addedFeatures || event.addedFeatures.length === 0) return;

				const added = event.addedFeatures[0];

				const objectId = added.objectId;
				console.log("New ArcGIS feature created:", objectId);

				const result = await locationsLayer.queryFeatures({
					objectIds: [objectId],
					outFields: ["*"],
					returnGeometry: false
				});

				const feature = result.features[0];
				const attrs = feature.attributes;

				this.allowedLocationIds.push(objectId);
				locationsLayer.definitionExpression = `OBJECTID IN (${this.allowedLocationIds.join(",")})`;

				await this.sendLocationToBackend({
					name: attrs.name,
					capacity: attrs.capacity,
					description: attrs.description ?? null,
					address: attrs.address,
					location_type: attrs.location_type,
					arcgis_feature_id: objectId
				});
			});

			let selectedLocationOID: number | null = null;

			this.view.on("click", async (event) => {
				const hit = await this.view!.hitTest(event);

				const result = hit.results.find((r) =>
					r.type === "graphic" && (r as any).graphic.layer === locationsLayer
				);

				if (!result) return;

				const graphic = (result as any).graphic;
				selectedLocationOID = graphic.attributes.OBJECTID;
				console.log("Selected Location OID:", selectedLocationOID);

				console.log("Clicked feature:", graphic);

				this.view!.goTo({
					target: graphic.geometry,
					zoom: 17
				});
				parkingLayer.featureEffect = {
					filter: new FeatureFilter({
						where: `location_id = ${selectedLocationOID}`
					}),
					includedEffect: "opacity(100%)",
					excludedEffect: "opacity(0%)"  // hide excluded features
				} as any;
			});

			parkingLayer.on("edits", async (event) => {
				if (this.isUpdatingParking) return;

				if (!event.addedFeatures || event.addedFeatures.length === 0) return;
				const added = event.addedFeatures[0];
				const objectId = added.objectId;
				console.log("New parking feature added:", added);
				const result = await parkingLayer.queryFeatures({
					objectIds: [objectId],
					outFields: ["*"],
					returnGeometry: true
				});
				const feature = result.features[0];
				feature.attributes.location_id = selectedLocationOID;
				this.isUpdatingParking = true;
				console.log("Updating parking feature with location_id:", feature.attributes.location_id);
				await parkingLayer.applyEdits({
					updateFeatures: [feature]
				});
				this.isUpdatingParking = false;

			});


		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('Error loading map/editor', err);
		}
	}

	ngOnDestroy(): void {
		if (this.view) {
			this.view.destroy();
			this.view = null;
		}
	}
}
>>>>>>> Stashed changes
