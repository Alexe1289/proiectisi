import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface IOffer {
  reservation_id: number;
  locationName: string;
  clientName: string;
  priceOffer: number;
  startDate: string;
  endDate: string;
  guestCount: number;
  status: 'pending' | 'accepted' | 'rejected';
}

@Component({
  selector: 'app-manage-offers',
  templateUrl: './manage-offers.component.html',
  styleUrls: ['./manage-offers.component.scss']
})
export class ManageOffersComponent implements OnInit {
  offers: IOffer[] = [];
  loading = true;

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.fetchOffers();
  }

  fetchOffers() {
    const token = sessionStorage.getItem('auth_token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<IOffer[]>("http://localhost:5001/api/reservations", { headers })
      .subscribe({
        next: (res) => {
          this.offers = res;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching reservations', err);
          this.loading = false;
        }
      });
  }

  updateOfferStatus(reservationId: number, newStatus: 'accepted' | 'rejected') {
    const token = sessionStorage.getItem('auth_token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.put(`http://localhost:5001/api/reservations/${reservationId}`,
      { status: newStatus },
      { headers }
    ).subscribe({
      next: () => {
        const index = this.offers.findIndex(o => o.reservation_id === reservationId);
        if (index !== -1) this.offers[index].status = newStatus;
      },
      error: (err) => alert('Error updating status. Please try again.')
    });
  }
}