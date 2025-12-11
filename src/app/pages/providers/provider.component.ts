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
					}
				],
			});


			this.view.ui.add(editor, 'top-right');
			locationsLayer.on("edits", async (event) => {
				console.log("Layer edit event:", event);
				const feature =
					event.addedFeatures?.[0] ||
					event.updatedFeatures?.[0] ||
					event.deletedFeatures?.[0] ||
					null;

					if (!feature) return;
					// notify backend about the change
					const oid = feature.objectId;

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
