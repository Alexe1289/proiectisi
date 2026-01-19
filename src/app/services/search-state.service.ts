import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class SearchStateService {
    private _searchResults: any[] = [];
    private _searchFormValue: any = null;
    private _showMap: boolean = false;

    get searchResults() { return this._searchResults; }
    get searchFormValue() { return this._searchFormValue; }
    get showMap() { return this._showMap; }

    setSearchState(results: any[], formValue: any, showMap: boolean) {
        this._searchResults = results;
        this._searchFormValue = formValue;
        this._showMap = showMap;
    }

    updateShowMap(show: boolean) {
        this._showMap = show;
    }
    clearState() {
        this._searchResults = [];
        this._searchFormValue = null;
        this._showMap = false;
    }
}