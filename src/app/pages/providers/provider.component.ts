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

@Component({
  selector: 'provider',
  templateUrl: './provider.component.html',
  styleUrls: ['./provider.component.scss'],
})
export class ProviderComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapViewNode', { static: true }) mapViewEl!: ElementRef<HTMLDivElement>;

  private view: MapView | null = null;
// AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj
//   private readonly apiKey =
//     'AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj';

  private readonly featureLayerUrl =
    'https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente2/FeatureServer/0';

  async ngAfterViewInit(): Promise<void> {
    try {
      // Configure global ArcGIS settings
    //   esriConfig.apiKey = this.apiKey;
        await IdentityManager.checkSignInStatus("https://www.arcgis.com/sharing")
  .catch(() => IdentityManager.getCredential("https://www.arcgis.com/sharing"));

      const locationsLayer = new FeatureLayer({
        url: this.featureLayerUrl,
        outFields: ['*'],
      });

      const map = new Map({
        basemap: 'arcgis-topographic',
        layers: [locationsLayer],
      });

      this.view = new MapView({
        map,
        container: this.mapViewEl.nativeElement,
        center: [26.1025, 44.4268],
        zoom: 12,
      });


      await this.view.when();
      await locationsLayer.when();

      if (locationsLayer.fullExtent) {
        this.view.goTo(locationsLayer.fullExtent).catch(() => {
        });
      }

      const editor = new Editor({
        view: this.view,
        layerInfos: [
          {
            layer: locationsLayer,
            addEnabled: true,
            updateEnabled: true,
            deleteEnabled: true, 
          },
        ],
      });

      this.view.ui.add(editor, 'top-right');
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
