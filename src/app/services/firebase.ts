import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface IDatabaseItem {
    name?: string;
    val?: string;
}

export type PointSource = 'user' | 'trailhead';

export interface IPoint {
    lat: number;
    lng: number;
    ts?: number;
    id?: string;
    source?: PointSource;
}

@Injectable({ providedIn: 'root' })
export class FirebaseService {

    // list of generic entries used by lab tasks
    listFeed: Observable<any[]>;
    objFeed: Observable<any>;

    // points feed for map
    pointsFeed: Observable<IPoint[]>;

    constructor(private db: AngularFireDatabase) {}

    // legacy helper for simple list/object used in lab task 1
    connectToDatabase() {
        this.listFeed = this.db.list('list').valueChanges();
        this.objFeed = this.db.object('obj').valueChanges();
    }

    getChangeFeedList() {
        return this.listFeed;
    }

    getChangeFeedObject() {
        return this.objFeed;
    }

    removeListItems() {
        this.db.list('list').remove();
    }

    addListObject(val: string) {
        let item: IDatabaseItem = {
            name: 'test',
            val: val
        };
        this.db.list('list').push(item);
    }

    updateObject(val: string) {
        let item: IDatabaseItem = {
            name: 'test',
            val: val
        };
        this.db.object('obj').set([item]);
    }

    // --- Map related methods ---
    // Connect to points list in RTDB and expose as observable with ids
    connectToPoints() {
        // use snapshotChanges to include the key
        this.pointsFeed = this.db
            .list('/points')
            .snapshotChanges()
            .pipe(
                map((changes: any[]) =>
                    changes.map(c => {
                        const data: any = c.payload.val();
                        const key = c.key;
                        return {
                            id: key,
                            lat: data.lat,
                            lng: data.lng,
                            ts: data.ts
                        } as IPoint;
                    })
                )
            );
        return this.pointsFeed;
    }

    // returns the points observable (connectToPoints must be called first or it will create one)
    getPointsFeed(): Observable<IPoint[]> {
        if (!this.pointsFeed) {
            return this.connectToPoints();
        }
        return this.pointsFeed;
    }

    // add a point to firebase RTDB
    addPoint(lat: number, lng: number, source: PointSource = 'user') {
        const item: IPoint = { lat, lng, ts: Date.now(), source };
        return this.db.list('/points').push(item);
    }

    // remove all points
    clearPoints() {
        return this.db.list('/points').remove();
    }

    // user position (single object) - updated at most once per second from client
    updateUserPosition(lat: number, lng: number) {
        const pos = { lat, lng, ts: Date.now() };
        return this.db.object('/userPosition').set(pos);
    }

    getUserPosition() {
        return this.db.object('/userPosition').valueChanges();
    }
}