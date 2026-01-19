import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MyBookingsDetailsComponent } from "./my-bookings-details.component"

interface IBooking {
  reservation_id: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  price_offer: number;
  guest_count: number;
  start_datetime: string;
  end_datetime: string;
  location: {
    name: string;
    arcgis_feature_id: string;
  };
  provider: {
    name: string;
    email: string;
  };
}

@Component({
  selector: 'app-my-bookings',
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.scss']
})
export class MyBookingsComponent implements OnInit {
  bookings: IBooking[] = [];
  loading = true;

  constructor(private http: HttpClient, private dialog: MatDialog) { }

  ngOnInit() {
    this.fetchMyBookings();
  }

  fetchMyBookings() {
    const token = sessionStorage.getItem('auth_token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<IBooking[]>("http://localhost:5001/api/reservations", { headers })
      .subscribe({
        next: (res) => {
          this.bookings = res;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching bookings', err);
          this.loading = false;
        }
      });
  }

  cancelBooking(id: number) {
    if (confirm('Are you sure you want to cancel this booking?')) {
      const token = sessionStorage.getItem('auth_token');
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      this.http.patch(`http://localhost:5001/api/reservations/${id}/cancel`, {}, { headers })
        .subscribe({
          next: () => {
            const booking = this.bookings.find(b => b.reservation_id === id);
            if (booking) booking.status = 'cancelled';
          },
          error: (err) => alert(err.error.msg)
        });
    }
  }

  editBooking(booking: IBooking) {
    const dialogRef = this.dialog.open(MyBookingsDetailsComponent, {
      width: '400px',
      data: {
        price_offer: booking.price_offer,
        guest_count: booking.guest_count
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateBooking(booking.reservation_id, result);
      }
    });
  }

  updateBooking(id: number, updatedFields: any) {
    const token = sessionStorage.getItem('auth_token');
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.put(`http://localhost:5001/api/reservations/${id}`, updatedFields, { headers })
      .subscribe({
        next: () => {
          const index = this.bookings.findIndex(b => b.reservation_id === id);
          if (index !== -1) {
            this.bookings[index].price_offer = updatedFields.price_offer;
            this.bookings[index].guest_count = updatedFields.guest_count;
          }
        },
        error: (err) => alert('Error updating booking: ' + (err.error?.msg || 'Server error'))
      });
  }

  deleteBooking(id: number) {
    if (confirm('Are you sure you want to PERMANENTLY delete this request? This action cannot be undone.')) {
      const token = sessionStorage.getItem('auth_token');
      const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

      this.http.delete(`http://localhost:5001/api/reservations/${id}/delete`, { headers })
        .subscribe({
          next: () => {
            this.bookings = this.bookings.filter(b => b.reservation_id !== id);
          },
          error: (err) => alert('Error: ' + (err.error?.msg || 'Could not delete'))
        });
    }
  }
}