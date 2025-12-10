import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  OnDestroy
} from "@angular/core";

import esri = __esri; // Esri TypeScript Types

import Config from '@arcgis/core/config';
import WebMap from '@arcgis/core/WebMap';
import MapView from '@arcgis/core/views/MapView';
import Bookmarks from '@arcgis/core/widgets/Bookmarks';
import Expand from '@arcgis/core/widgets/Expand';

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from '@arcgis/core/Graphic';
import * as locator from "@arcgis/core/rest/locator";
import Point from '@arcgis/core/geometry/Point';
import Polyline from '@arcgis/core/geometry/Polyline';
import Polygon from '@arcgis/core/geometry/Polygon';

import FeatureLayer from '@arcgis/core/layers/FeatureLayer';

import FeatureSet from '@arcgis/core/rest/support/FeatureSet';
import RouteParameters from '@arcgis/core/rest/support/RouteParameters';
import * as route from "@arcgis/core/rest/route.js";

import { FirebaseService, IPoint } from 'src/app/services/firebase';
import { Subscription } from 'rxjs';

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.scss"]
})
export class MapComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

  map: esri.Map;
  view: esri.MapView;
  graphicsLayer: esri.GraphicsLayer;
  graphicsLayerUserPoints: esri.GraphicsLayer;
  graphicsLayerRoutes: esri.GraphicsLayer;
  trailheadsLayer: esri.FeatureLayer;

  zoom = 10;
  center: Array<number> = [-118.73682450024377, 34.07817583063242];
  basemap = "streets-vector";
  loaded = false;
  directionsElement: any;

  pointsSub: Subscription;
  centerWatcher: any;
  private _lastPosTs = 0;

  constructor(private fbs: FirebaseService) {}

  ngOnInit() {
    this.initializeMap().then(() => {
      this.loaded = this.view.ready;
      this.mapLoadedEvent.emit(true);
      // after map is ready, start firebase sync
      this.setupFirebaseSync();
    });
  }

  async initializeMap() {
    try {
      Config.apiKey = "AAPTxy8BH1VEsoebNVZXo8HurHuh_cihYcFZqImHGpYEztIswSBTbfQsyfuHn-32oKutSi0q2KAixw7rawtvUDETpHcC7VRnWAjuILlrONxkvTeaxxDypqmUTF1DIrJvEy5IRmclKdKw0Xo_sZmg3PIUZ67FBvuM0r0tGcwmf3gYhwnbxNW_5O3gs1BaNJWsX2xiI3o_EK53tC-MnP3o_2E9s_YdnMS5Dsjv7Lk0lTDIoPM.AT1_fZ4BJUIF";

      const mapProperties: esri.WebMapProperties = {
        basemap: this.basemap
      };
      this.map = new WebMap(mapProperties);

      this.addFeatureLayers();
      this.addGraphicsLayer();

      const mapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this.center,
        zoom: this.zoom,
        map: this.map
      };
      this.view = new MapView(mapViewProperties);

      this.view.on('pointer-move', ["Shift"], (event) => {
        const point = this.view.toMap({ x: event.x, y: event.y });
        console.log("Map pointer moved: ", point.longitude, point.latitude);
      });

      await this.view.when();
      console.log("ArcGIS map loaded");
      this.addRouting();

      this.view.on('click', async (evt) => {
        try {
          const hit = await this.view.hitTest(evt);
          const hitTrailhead = hit && hit.results && hit.results.some(r => r.layer === this.trailheadsLayer);
          if (hitTrailhead) return; // trailheads handled in addRouting

          const pt = this.view.toMap({ x: evt.x, y: evt.y });
          if (pt && this.fbs) {
            await this.fbs.addPoint(pt.latitude, pt.longitude, 'user'); // 👈 tag as user
          }
        } catch (err) {
          console.warn('Error handling map click', err);
        }
      });

      this.lab02();
      this.search()

      return this.view;
    } catch (error) {
      console.error("Error loading the map: ", error);
      alert("Error loading the map");
    }
  }

  setupFirebaseSync() {
    try {
      // connect to points feed
      this.fbs.connectToPoints();

      // subscribe to points and render them
      this.pointsSub = this.fbs.getPointsFeed().subscribe((points: IPoint[]) => {
        // clear existing user points and render fresh
        if (this.graphicsLayerUserPoints) {
          this.graphicsLayerUserPoints.removeAll();
        }
        if (points && points.length > 0) {
          points.forEach(p => {
            // addPoint expects lat,lng
            this.addPoint(p.lat, p.lng);
          });
        }
      });

      // start watching the map center and update user position at most once per second
      this.startUserPositionWatch();
    } catch (err) {
      console.error('Error setting up Firebase sync', err);
    }
  }

  /**
   * Watch the map center and update the user's position in Firebase at most once per second.
   */
  startUserPositionWatch() {
    if (!this.view || !this.fbs) return;
    try {
      // view.watch returns a handle with a remove() method
      this.centerWatcher = this.view.watch('center', (center: any) => {
        if (!center) return;
        const now = Date.now();
        if (now - this._lastPosTs < 1000) return; // throttle to 1s
        this._lastPosTs = now;
        try {
          // center has latitude and longitude properties
          this.fbs.updateUserPosition(center.latitude, center.longitude);
        } catch (err) {
          console.warn('Failed to update user position', err);
        }
      });
    } catch (err) {
      console.error('Error starting center watcher', err);
    }
  }

  addFeatureLayers() {
    this.trailheadsLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0",
      outFields: ['*']
    });
    this.map.add(this.trailheadsLayer);

    const trailsLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0"
    });
    this.map.add(trailsLayer, 0);

    const parksLayer = new FeatureLayer({
      url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Parks_and_Open_Space/FeatureServer/0"
    });
    this.map.add(parksLayer, 0);

    console.log("Feature layers added");
  }

  addGraphicsLayer() {
    this.graphicsLayer = new GraphicsLayer();
    this.map.add(this.graphicsLayer);
    this.graphicsLayerUserPoints = new GraphicsLayer();
    this.map.add(this.graphicsLayerUserPoints);
    this.graphicsLayerRoutes = new GraphicsLayer();
    this.map.add(this.graphicsLayerRoutes);
  }

  addRouting() {
    const routeUrl = "https://route-api.arcgis.com/arcgis/rest/services/World/Route/NAServer/Route_World";
    this.view.on("click", (event) => {
      this.view.hitTest(event).then(async (elem: esri.HitTestResult) => {
        if (elem?.results?.length) {
          const trailRes = elem.results.find(e => e.layer === this.trailheadsLayer);
          const point: esri.Point = trailRes?.mapPoint;

          if (point) {
            try {
              await this.fbs.addPoint(point.latitude, point.longitude, 'trailhead');
            } catch (e) {
              console.warn('Failed to save trailhead point', e);
            }

            // existing routing behavior
            if (this.graphicsLayerUserPoints.graphics.length === 0) {
              this.addPoint(point.latitude, point.longitude);
            } else if (this.graphicsLayerUserPoints.graphics.length === 1) {
              this.addPoint(point.latitude, point.longitude);
              this.calculateRoute(routeUrl);
            } else {
              this.removePoints();
            }
          }
        }
      });
    });
  }


  addPoint(lat: number, lng: number) {
    let point = new Point({
      longitude: lng,
      latitude: lat
    });

    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: [226, 119, 40],  // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 1
      }
    };

    let pointGraphic: esri.Graphic = new Graphic({
      geometry: point,
      symbol: simpleMarkerSymbol
    });

    this.graphicsLayerUserPoints.add(pointGraphic);
  }

  /**
   * Add the current map center as a point in Firebase (points subscription will render it)
   */
  async addCenterAsPoint() {
    if (!this.view) return;
    const c: any = this.view.center;
    if (!c) return;
    try {
      await this.fbs.addPoint(c.latitude, c.longitude);
    } catch (err) {
      console.error('Error adding point to Firebase', err);
    }
  }

  removePoints() {
    this.graphicsLayerUserPoints.removeAll();
  }

  removeRoutes() {
    this.graphicsLayerRoutes.removeAll();
  }

  async calculateRoute(routeUrl: string) {
    const routeParams = new RouteParameters({
      stops: new FeatureSet({
        features: this.graphicsLayerUserPoints.graphics.toArray()
      }),
      returnDirections: true
    });

    try {
      const data = await route.solve(routeUrl, routeParams);
      this.displayRoute(data);
    } catch (error) {
      console.error("Error calculating route: ", error);
      alert("Error calculating route");
    }
  }

  displayRoute(data: any) {
    for (const result of data.routeResults) {
      result.route.symbol = {
        type: "simple-line",
        color: [5, 150, 255],
        width: 3
      };
      this.graphicsLayerRoutes.graphics.add(result.route);
    }
    if (data.routeResults.length > 0) {
      this.showDirections(data.routeResults[0].directions.features);
    } else {
      alert("No directions found");
    }
  }

  clearRouter() {
    if (this.view) {
      // Remove all graphics related to routes
      this.removeRoutes();
      this.removePoints();
      console.log("Route cleared");
      this.view.ui.remove(this.directionsElement);
      this.view.ui.empty("top-right");
      console.log("Directions cleared");
    }
  }

  showDirections(features: any[]) {
    this.directionsElement = document.createElement("ol");
    this.directionsElement.classList.add("esri-widget", "esri-widget--panel", "esri-directions__scroller");
    this.directionsElement.style.marginTop = "0";
    this.directionsElement.style.padding = "15px 15px 15px 30px";

    features.forEach((result, i) => {
      const direction = document.createElement("li");
      direction.innerHTML = `${result.attributes.text} (${result.attributes.length} miles)`;
      this.directionsElement.appendChild(direction);
    });

    this.view.ui.empty("top-right");
    this.view.ui.add(this.directionsElement, "top-right");
  }

  ngOnDestroy() {
    if (this.view) {
      this.view.container = null;
    }
    // cleanup firebase subscriptions / timers
    try {
      if (this.pointsSub) this.pointsSub.unsubscribe();
      if (this.centerWatcher && this.centerWatcher.remove) this.centerWatcher.remove();
    } catch (err) {
      console.warn('Error during MapComponent cleanup', err);
    }
  }

  lab02() {
    // Point
    const point = new Point({
      longitude: -118.80657463861,
      latitude: 34.0005930608889
    });

    const simpleMarkerSymbol = {
      type: "simple-marker",
      color: [226, 119, 40], // Orange
      outline: {
        color: [255, 255, 255], // White
        width: 1,
      },
    };

    const pointGraphic = new Graphic({ geometry: point, symbol: simpleMarkerSymbol });

    // Line
    // Create a line geometry
    const polyline = new Polyline ({
      paths: [
        [
          [-118.821527826096, 34.0139576938577],
          [-118.814893761649, 34.0080602407843],
          [-118.808878330345, 34.0016642996246],
        ]
      ],
    });

    const simpleLineSymbol = {
      type: "simple-line",
      color: [226, 119, 40], // Orange
      width: 2,
    };

    const polylineGraphic = new Graphic({ geometry: polyline, symbol: simpleLineSymbol });

    const polygon = new Polygon ({
      rings: [
        [
          [-118.818984489994, 34.0137559967283], //Longitude, latitude
          [-118.806796597377, 34.0215816298725], //Longitude, latitude
          [-118.791432890735, 34.0163883241613], //Longitude, latitude
          [-118.79596686535, 34.008564864635], //Longitude, latitude
          [-118.808558110679, 34.0035027131376], //Longitude, latitude
        ]
      ],
    });

    const simpleFillSymbol = {
      type: "simple-fill",
      color: [227, 139, 79, 0.8], // Orange, opacity 80%
      outline: { color: [255, 255, 255], width: 1 },
    };

    const polygonGraphic = new Graphic({
      geometry: polygon,
      symbol: simpleFillSymbol,

    });

    this.graphicsLayer.addMany([pointGraphic, polylineGraphic, polygonGraphic]);
  }

  search() {
    const placesSelectElement = document.querySelector<HTMLSelectElement>("#places-select");

    const locatorUrl = "http://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer";
    const view = this.view;

    view.watch("stationary", async (isStationary) => {
      if (!isStationary) return;
      await findPlaces(placesSelectElement.value, view.center);
    });

    placesSelectElement.addEventListener("change", async () => {
      await findPlaces(placesSelectElement.value, view.center);
    });

    async function findPlaces(category, point) {
      const results = await locator.addressToLocations(locatorUrl, {
        address: { Category: category },
        location: point,
        locationType: point,
        categories: [category],
        maxLocations: 25,
        outFields: ["Place_addr", "PlaceName"],
      })

      view.closePopup();
      view.graphics.removeAll();

      const simpleMarkerSymbol = {
        type: "simple-marker",
        color: "#ff0000ff",
        size: "12px",
        outline: {
          color: "#ffffff",
          width: "2px",
        }
      };

      results.forEach((result) => {
        view.graphics.add(
          new Graphic({
            attributes: result.attributes,
            geometry: result.location,
            symbol: simpleMarkerSymbol,
            popupTemplate: {
              title: "{PlaceName}",
              content: "{Place_addr}",
            },
          }),
        );
      });

    }

  }
}
