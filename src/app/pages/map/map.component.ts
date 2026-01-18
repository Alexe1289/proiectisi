import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from "@angular/core";

import esriConfig from "@arcgis/core/config";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"]
})
export class MapComponent implements OnInit, OnDestroy {

  @ViewChild("mapViewNode", { static: true })
  private mapViewEl!: ElementRef<HTMLDivElement>;

  private view!: MapView;
  private map!: Map;

  private readonly locationsLayerUrl =
    "https://services7.arcgis.com/MFmKAyIlHZMTXjGS/arcgis/rest/services/LocatiiEvenimente2/FeatureServer/0";

  zoom = 12;
  center: number[] = [26.1025, 44.4268];
  basemap = "arcgis-topographic";

  async ngOnInit() {
    await this.initializeMap();
  }

  async initializeMap() {
    try {
      esriConfig.apiKey =
        "AAPTxy8BH1VEsoebNVZXo8HurJWqcGsDXcgXORUKOHbx4SEyKajspwDLD_FV7kULXZy8YJalSsjCnjmJmmdMu_sovrAGh6NI6FVe1YzcpE8q9yLdbS7A8OwUYSqOGHxv4CA9lFsAB0P01OVZ0CsH9MNqZ-AEFs4cedGv8iHP93cLVe8J1mRIAhmzxNt6ZBLPsIAaffldLkParSywYEK8DqrMRH1f1fuLYkApbnPEKjhL55Y.AT1_Ji8b2dCj";

      const locationsLayer = new FeatureLayer({
        url: this.locationsLayerUrl,
        outFields: ["*"],
        popupTemplate: {
          title: "{name}",
          content: `
            <b>Adresă:</b> {address}<br/>
            <b>Capacitate:</b> {capacity}<br/>
            <b>Tip locație:</b> {location_type}
          `
        }
      });

      this.map = new Map({
        basemap: this.basemap,
        layers: [locationsLayer]
      });

      this.view = new MapView({
        container: this.mapViewEl.nativeElement,
        map: this.map,
        center: this.center,
        zoom: this.zoom
      });

      await this.view.when();
      console.log("Map loaded!");


      this.view.on("click", async (event) => {
        const hit = await this.view.hitTest(event);

        const result = hit.results.find(
          (r) =>
            r.type === "graphic" &&
            (r as any).graphic.layer === locationsLayer
        );

        if (!result) return;

        const graphic = (result as any).graphic;

        this.view.goTo({
          target: graphic.geometry,
          zoom: 16
        });
      });

    } catch (error) {
      console.error("Map loading error!", error);
    }
  }

  ngOnDestroy() {
    if (this.view) {
      this.view.destroy();
    }
  }
}
