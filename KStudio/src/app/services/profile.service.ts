import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';
import { Appointment } from '../Models/appointment';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk', // API Key
  });

  constructor(private http: HttpClient, private authService: AuthService) {}
 
 
  // Get last 60 days appointments and filter for logged-in user by email
  getLast60DaysAppointmentsForUser(): Observable<any> {
    const today = new Date();
    const endDate = this.formatDate(today);
    const startDate = this.formatDate(new Date(today.setDate(today.getDate() - 60)));

    const url = `/api/appointments&dates=${startDate},${endDate}&skipServices=1&skipProviders=1`;

    const userEmail = this.authService.getUserEmail(); // Logged-in user's email
    console.log("Logged-in User Email:", userEmail);

    return this.http.get(url, { headers: this.headers }).pipe(
      map((response: any) => {
        console.log('API Response:', response);

        if (response && response.data && response.data.appointments) {
          let userAppointments: any[] = [];

          // Loop through each date in the appointments object
          for (const date in response.data.appointments) {
            if (
              response.data.appointments.hasOwnProperty(date) &&
              Array.isArray(response.data.appointments[date].appointments)
            ) {
              // Iterate over each appointment on the given date
              response.data.appointments[date].appointments.forEach((appointment: any) => {
                console.log('Checking appointment:', appointment);

                // Check if bookings array exists inside the appointment
                if (appointment.bookings && Array.isArray(appointment.bookings)) {
                  // Filter bookings by matching customer.email
                  const matchingBookings = appointment.bookings.filter((booking: any) => {
                    console.log('Checking booking:', booking);
                    console.log('Booking customer email:', booking.customer?.email);
                    console.log('Comparing with logged-in userEmail:', userEmail);

                    // Compare customer.email with logged-in userEmail
                    return booking.customer?.email === userEmail;
                  });

                  // If there are matching bookings, store the appointment
                  if (matchingBookings.length > 0) {
                    console.log('User appointment found:', appointment);
                    userAppointments.push(appointment);
                  }
                } else {
                  console.log('No bookings found for appointment:', appointment);
                }
              });
            }
          }

          console.log('Final userAppointments array after filtering:', userAppointments);
          return userAppointments; // Return filtered user appointments
        }

        return []; // Return empty array if no data
      })
    );
  }


  // Helper function to format date as YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Add leading zero
    const day = date.getDate().toString().padStart(2, '0'); // Add leading zero
    return `${year}-${month}-${day}`;
  }

}
