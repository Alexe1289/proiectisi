import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SearchStateService {
    // Store the results, form data, and map status
    private _searchResults: any[] = [];
    private _searchFormValue: any = null;
    private _showMap: boolean = false;

    get searchResults() { return this._searchResults; }
    get searchFormValue() { return this._searchFormValue; }
    get showMap() { return this._showMap; }

    // Save everything at once
    setSearchState(results: any[], formValue: any, showMap: boolean) {
        this._searchResults = results;
        this._searchFormValue = formValue;
        this._showMap = showMap;
    }

    // Helper to just update map status (e.g. if user toggles map)
    updateShowMap(show: boolean) {
        this._showMap = show;
    }

    // Optional: Call this if you ever want to force-clear the search (e.g. on Logout)
    clearState() {
        this._searchResults = [];
        this._searchFormValue = null;
        this._showMap = false;
    }
}