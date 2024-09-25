import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
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
  const endDate = this.formatDate(new Date(today.setDate(today.getDate() + 30)));
  const startDate = this.formatDate(new Date(today.setDate(today.getDate() - 60)));
  
  const url = `/api/appointments&dates=${startDate},${endDate}&skipServices=1&skipProviders=1`;

  const userEmail = this.authService.getUserEmail(); // Logged-in user's email
  //console.log("Logged-in User Email:", userEmail);

  
  return this.http.get(url, { headers: this.headers }).pipe(
    map((response: any) => {
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
              //console.log('Checking appointment:', appointment);
              
              // Check if bookings array exists inside the appointment
              if (appointment.bookings && Array.isArray(appointment.bookings)) {
                // Loop through all bookings and match with user email
                appointment.bookings.forEach((booking: any, index: number) => {
                  if (booking.customer?.email === userEmail) {
                    //console.log('User booking matched:', booking);
                    booking.googleCalendarEventId = appointment.googleCalendarEventId;
                    //console.log("google", booking.googleCalendarEventId);
                    // Create an object to store the appointment and the specific booking details
                    const userAppointment = {
                      ...appointment, // Copy the appointment details
                      matchedBooking: booking, // Store the specific booking that matches the user
                      userBookingStatus: booking.status, // Store the specific booking status
                      
                    };

                    // Push the matched appointment to the userAppointments array
                    userAppointments.push(userAppointment);
                  }
                });
              } else {
                //console.log('No bookings found for appointment:', appointment);
              }
            });
          }
        }

        //console.log('Final userAppointments array after filtering:', userAppointments);
        return userAppointments; // Return filtered user appointments with the user's specific booking status
      }

      return []; // Return empty array if no data
    })
  );
}

// Function to fetch available package slots and expiry date using customer ID
fetchAvailablePackageSlots(customerId: string | null): Observable<{ availableSlots: number, expiryDate: string }> {
  const url = `https://k-studio.co.il/wp-json/wn/v1/package-purchases/${customerId}`;

  return this.http.get(url, {}).pipe(
    map((response: any) => {
      if (response && response.data && response.data.length > 0) {
        // Navigate through the response structure to get available slots and purchased date
        const packages = response.data[0].packages;

        if (packages && packages.length > 0) {
          const purchases = packages[0].purchases;

          if (purchases && purchases.length > 0) {
            const availableSlots = purchases[0].purchase[0].available;
            const purchasedDate = purchases[0].purchased;

            // Calculate the expiry date (30 days from the purchased date)
            const expiryDate = new Date(purchasedDate);
            expiryDate.setDate(expiryDate.getDate() + 30); // Add 30 days

            // Format the expiry date to "dd/mm/yyyy"
            const formattedExpiryDate = `${expiryDate.getDate().toString().padStart(2, '0')}/${
            (expiryDate.getMonth() + 1).toString().padStart(2, '0')}/${expiryDate.getFullYear()}`;


            return {
              availableSlots: availableSlots,  // Return the available slots
              expiryDate: formattedExpiryDate  // Return the formatted expiry date
            };
          }
        }
      }

      // Default return if no data is found
      return { availableSlots: 0, expiryDate: '' };
    }),
    catchError((error) => {
      console.error('API Error:', error);  // Log the error
      return of({ availableSlots: 0, expiryDate: '' }); // Return default values on error
    })
  );
}



fetchUserPurchases(userId: string | null): Observable<any> {
  const url = `https://k-studio.co.il/wp-json/wn/v1/user-purchases/${userId}`;
  return this.http.get(url, {}).pipe(
    map((response: any) => {
      response.forEach((order: any) => {
        if (!order.invoice_link) {
          order.invoice_link = ''; // Ensure invoice link is always present
        }
      });
      return response || [];
    }),
    catchError((error) => {
      console.error('Error fetching user purchases:', error);
      return of([]); // Return an empty array if error occurs
    })
  );
}

cancelBooking(bookingId: string): Observable<any> {
  const url = `https://k-studio.co.il/wp-json/wn/v1/cancel-booking/${bookingId}`;

  return this.http.post(url, {});
}


  // Helper function to format date as YYYY-MM-DD
private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Add leading zero
    const day = date.getDate().toString().padStart(2, '0'); // Add leading zero
    return `${year}-${month}-${day}`;
}

}
