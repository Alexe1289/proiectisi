import { Component } from "@angular/core";
import { FirebaseService } from "src/app/services/firebase";

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {

    listItems: any[] = [];

    constructor(private fbs: FirebaseService) {
    }

    connectDb() {
        this.fbs.connectToDatabase();
        // also ensure points feed is connected
        this.fbs.connectToPoints();
        // subscribe to simple list for demo printing to console
        const list$ = this.fbs.getChangeFeedList();
        if (list$) {
            list$.subscribe((items: any[]) => {
                console.log('List items updated', items);
                this.listItems = items || [];
            });
        }
    }

    addListEntry() {
        const val = 'entry-' + new Date().toISOString();
        this.fbs.addListObject(val);
    }

    clearAllPoints() {
        this.fbs.clearPoints();
    }
}