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
import BasemapToggle from '@arcgis/core/widgets/BasemapToggle.js';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as reactiveUtils from "@arcgis/core/core/reactiveUtils.js";

@Component({
	selector: 'provider',
	templateUrl: './provider.component.html',
	styleUrls: ['./provider.component.scss'],
})

export class ProviderComponent implements AfterViewInit, OnDestroy {
	@ViewChild('mapViewNode', { static: true }) mapViewEl!: ElementRef<HTMLDivElement>;

	private view: MapView | null = null;
	private readonly apiKey =
		'AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj';

	private readonly featureLayerUrl =
		'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente2/FeatureServer/0';

	private readonly parkingLayerUrl =
		'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente/FeatureServer/0';
	private allowedLocationIds: number[] = [];
	private isUpdatingParking = false;
	private token = sessionStorage.getItem('auth_token');
	selectedLocationName: string | null = null;
	selectedLocationOID: number | null = null;
	isSaving = false;


	constructor(private http: HttpClient,
		private snackBar: MatSnackBar
	) { }

	async deleteCascade(layer: FeatureLayer, parentId: number, layerName: string) {
		try {
			const result = await layer.queryFeatures({
				where: `location_id = ${parentId}`,
				returnGeometry: false,
				outFields: ["OBJECTID"]
			});

			if (result.features.length > 0) {
				console.log(`Cascade deleting ${result.features.length} items from ${layerName}...`);

				// 2. Delete them
				await layer.applyEdits({
					deleteFeatures: result.features
				});

				this.showMessage(`Location successfully deleted!`);
			}
		} catch (error) {
			console.error(`Error deleting from ${layerName}:`, error);
		}
	}

	private showMessage(msg: string, isError = false) {
		this.snackBar.open(msg, 'Close', {
			duration: 3000,
			panelClass: isError ? 'error-snackbar' : 'success-snackbar'
		});
	}
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
	async deleteLocationFromBackend(arcgis_feature_id: number) {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${this.token}`
		});

		await this.http.delete(
			`http://localhost:5001/api/provider/locations/${arcgis_feature_id}`,
			{ headers }
		).toPromise();

		console.log("Location successfully deleted from backend. ID:", arcgis_feature_id);
	}
	async updateLocationInBackend(payload: {
		name: string;
		capacity: number;
		description?: string | null;
		address: string;
		location_type: string;
		price: number;
		arcgis_feature_id: number;
	}) {
		const headers = new HttpHeaders({
			Authorization: `Bearer ${this.token}`,
			"Content-Type": "application/json"
		});

		await this.http.put(
			`http://localhost:5001/api/provider/locations/${payload.arcgis_feature_id}`,
			payload,
			{ headers }
		).toPromise();
		this.showMessage(`Location successfully updated!`);
		console.log("Location updated in backend:", payload);
	}

	async sendLocationToBackend(payload: {
		name: string;
		capacity: number;
		description?: string | null;
		address: string;
		location_type: string;
		price: number;
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

		this.showMessage(`Location successfully created!`);
		console.log("Location sent to backend:", payload);
	}

	async ngAfterViewInit(): Promise<void> {
		try {
			esriConfig.apiKey = this.apiKey;

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
					where: "1 = 0"
				}),
				excludedEffect: "opacity(0%)"
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
				center: [26.1025, 44.4268],
				zoom: 13
			});

			this.allowedLocationIds = await this.fetchAllowedLocationIds();

			if (this.allowedLocationIds.length === 0) {
				locationsLayer.definitionExpression = "1 = 0";
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
										{ type: "field", fieldName: "location_type" },
										{ type: "field", fieldName: "price" },
										{ type: "field", fieldName: "description" }
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
									]
								}
							]
						} as any
					}
				],
			});


			this.view.ui.add(editor, 'top-right');
			locationsLayer.on("edits", async (event) => {
				console.log("Edits Event Fired:", event);

				if (event.addedFeatures && event.addedFeatures.length > 0) {

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
						price: attrs.price,
						arcgis_feature_id: objectId
					});
					this.selectedLocationName = attrs.name || "Unnamed Location";
					this.selectedLocationOID = objectId;

				}
				if (event.deletedFeatures && event.deletedFeatures.length > 0) {
					console.log("Processing deleted features...");
					for (const deleted of event.deletedFeatures) {
						const objectId = deleted.objectId;
						console.log("ArcGIS feature deleted:", objectId);
						this.allowedLocationIds = this.allowedLocationIds.filter(id => id !== objectId);

						if (this.allowedLocationIds.length === 0) {
							locationsLayer.definitionExpression = "1 = 0";
						} else {
							locationsLayer.definitionExpression = `OBJECTID IN (${this.allowedLocationIds.join(",")})`;
						}


						await this.deleteLocationFromBackend(objectId);
						await this.deleteCascade(parkingLayer, objectId, "parking locations");
					}
				}
				if (event.updatedFeatures && event.updatedFeatures.length > 0) {
					for (const updated of event.updatedFeatures) {
						const objectId = updated.objectId;
						console.log("ArcGIS feature updated:", objectId);

						const result = await locationsLayer.queryFeatures({
							objectIds: [objectId],
							outFields: ["*"],
							returnGeometry: false
						});

						if (result.features.length > 0) {
							const feature = result.features[0];
							const attrs = feature.attributes;

							await this.updateLocationInBackend({
								name: attrs.name,
								capacity: attrs.capacity,
								description: attrs.description ?? null,
								address: attrs.address,
								location_type: attrs.location_type,
								price: attrs.price,
								arcgis_feature_id: objectId
							});
						}
					}
				}

			});

			reactiveUtils.watch(
				() => editor.activeWorkflow,
				(workflow) => {
					if (workflow && workflow.type === "update") {
						console.log("Editor workflow started for update:", workflow);
						const editableItem = (workflow as any).editableItem;
						const feature = editableItem?.feature;

						if (feature && feature.layer === locationsLayer) {
							console.log("Editing feature:", feature);
							this.selectedLocationOID = feature.attributes.OBJECTID;
							this.selectedLocationName = feature.attributes.name || "Unnamed Location";
						}
					}
				}
			);
			this.view.on("click", async (event) => {
				const hit = await this.view!.hitTest(event);
				const result = hit.results.find((r) =>
					r.type === "graphic" && (r as any).graphic.layer === locationsLayer
				);

				if (!result) return;

				const graphic = (result as any).graphic;
				this.selectedLocationOID = graphic.attributes.OBJECTID;
				console.log("Selected Location OID:", this.selectedLocationOID);

				console.log("Clicked feature:", graphic);
				this.selectedLocationName = graphic.attributes.name || "Unnamed Location";

				this.view!.goTo({
					target: graphic.geometry,
					zoom: 17
				});
				parkingLayer.featureEffect = {
					filter: new FeatureFilter({
						where: `location_id = ${this.selectedLocationOID}`
					}),
					includedEffect: "opacity(100%)",
					excludedEffect: "opacity(0%)"
				} as any;
			});

			const toggle = new BasemapToggle({
				view: this.view,
				nextBasemap: "arcgis-imagery"
			});

			this.view.ui.add(toggle, "bottom-right");

			parkingLayer.on("edits", async (event) => {
				if (this.isUpdatingParking) return;

				if (!event.addedFeatures || event.addedFeatures.length === 0) return;
				const added = event.addedFeatures[0];
				const objectId = added.objectId;
				console.log("New parking feature added:", added);
				this.showMessage('Saving new location...');
				const result = await parkingLayer.queryFeatures({
					objectIds: [objectId],
					outFields: ["*"],
					returnGeometry: true
				});
				const feature = result.features[0];
				feature.attributes.location_id = this.selectedLocationOID;
				this.isUpdatingParking = true;
				console.log("Updating parking feature with location_id:", feature.attributes.location_id);
				await parkingLayer.applyEdits({
					updateFeatures: [feature]
				});
				parkingLayer.featureEffect = {
					filter: new FeatureFilter({
						where: `location_id = ${this.selectedLocationOID}`
					}),
					includedEffect: "opacity(100%)",
					excludedEffect: "opacity(0%)"
				} as any;
				this.isUpdatingParking = false;

			});


		} catch (err) {
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