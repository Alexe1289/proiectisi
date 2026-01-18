import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ArcgisAuthService {
    private readonly GENERATE_TOKEN_URL = 'https://www.arcgis.com/sharing/rest/generateToken';
    private readonly USERNAME = 'abcdef128912';
    private readonly PASSWORD = '^%"q"J\'H+wj^v2k';

    constructor(private http: HttpClient) { }

    async getValidToken(): Promise<string> {
        const body = new HttpParams()
            .set('username', this.USERNAME)
            .set('password', this.PASSWORD)
            .set('f', 'json')
            .set('referer', 'http://localhost:4200')
            .set('expiration', '1200');

        const headers = new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded'
        });

        try {
            const response: any = await firstValueFrom(
                this.http.post(this.GENERATE_TOKEN_URL, body.toString(), { headers })
            );

            if (response.token) {
                console.log('Auto-generated new ArcGIS Token:', response.token);


                environment.arcgis.token = response.token;

                return response.token;
            } else {
                console.error('Failed to generate token:', response);
                return '';
            }
        } catch (error) {
            console.error('ArcGIS Auth Error:', error);
            return '';
        }
    }
}