import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';
import { Appointment } from '../Models/appointment';
import { environment } from 'src/environments/environment';
import { Platform  } from '@ionic/angular';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';


@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk', // API Key
  });

  constructor(private platform: Platform, private httpA: HTTP, private http: HttpClient, private authService: AuthService) {}

  // Get last 60 days appointments and filter for logged-in user by email
  getLast60DaysAppointmentsForUser(): Observable<any> {
    const today = new Date();
    const endDate = this.formatDate(new Date(today.setDate(today.getDate() + 30)));
    const startDate = this.formatDate(new Date(today.setDate(today.getDate() - 60)));

    const url = `${environment.apiBaseUrl}/appointments&dates=${startDate},${endDate}&skipServices=1&skipProviders=1`;
    const userEmail = this.authService.getUserEmail(); // Logged-in user's email
    const headers = { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk' };

    return new Observable((observer) => {
      this.platform.ready().then(() => {
        if (this.platform.is('cordova')) {
          // Use Cordova HTTP plugin
          this.httpA.get(url, {}, headers).then((response) => {
            const parsedResponse = JSON.parse(response.data);
            const appointmentsData = parsedResponse.data?.appointments || {};
            let userAppointments: any[] = [];

            // Loop through each date in the appointments object
            for (const date in appointmentsData) {
              if (appointmentsData.hasOwnProperty(date) && Array.isArray(appointmentsData[date].appointments)) {
                // Iterate over each appointment on the given date
                appointmentsData[date].appointments.forEach((appointment: any) => {
                  // Check if bookings array exists inside the appointment
                  if (appointment.bookings && Array.isArray(appointment.bookings)) {
                    // Loop through all bookings and match with user email
                    appointment.bookings.forEach((booking: any) => {
                      if (booking.customer?.email === userEmail) {
                        booking.googleCalendarEventId = appointment.googleCalendarEventId;

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
                  }
                });
              }
            }

            // Emit the filtered user appointments
            observer.next(userAppointments);
            observer.complete();
          }).catch((error) => {
            observer.error(`Error fetching appointments: ${error}`);
          });
        } else {
          // Use HttpClient for non-Cordova environments
          this.http.get(url, { headers: this.headers }).subscribe(
            (response: any) => {
              const appointmentsData = response.data?.appointments || {};
              let userAppointments: any[] = [];

              // Loop through each date in the appointments object
              for (const date in appointmentsData) {
                if (appointmentsData.hasOwnProperty(date) && Array.isArray(appointmentsData[date].appointments)) {
                  // Iterate over each appointment on the given date
                  appointmentsData[date].appointments.forEach((appointment: any) => {
                    // Check if bookings array exists inside the appointment
                    if (appointment.bookings && Array.isArray(appointment.bookings)) {
                      // Loop through all bookings and match with user email
                      appointment.bookings.forEach((booking: any) => {
                        if (booking.customer?.email === userEmail) {
                          booking.googleCalendarEventId = appointment.googleCalendarEventId;

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
                    }
                  });
                }
              }

              // Emit the filtered user appointments
              observer.next(userAppointments);
              observer.complete();
            },
            (error) => {
              observer.error(`Error fetching appointments: ${error}`);
            }
          );
        }
      });
    });
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

  getUserPackageCustomerID(){
    let customerId = this.authService.getPackageCustomerId();
    const url = `https://k-studio.co.il/wp-json/wn/v1/package-purchases/${customerId}`;

    return this.http.get(url, {}).pipe(
      map((packageResponse: any) => {
        
        // Extract the packageCustomerId and store it in local storage
        if (packageResponse && packageResponse.data && packageResponse.data[0] && 
            packageResponse.data[0].packages[0] && 
            packageResponse.data[0].packages[0].purchases[0] && 
            packageResponse.data[0].packages[0].purchases[0].packageCustomerId) {
            const packageCustomerId = packageResponse.data[0].packages[0].purchases[0].packageCustomerId;
            this.authService.storePackageCustomerID(packageCustomerId);
        }
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

  updateFavoriteLocation(location: string): Observable<any> {
    const url = `https://k-studio.co.il/wp-json/custom-api/v1/set-favorite-location`;
    const userId = localStorage.getItem('user_id'); // Replace with your method of fetching the current user ID
    const headers = new HttpHeaders({
      Authorization: `Bearer ${localStorage.getItem('token')}`, // Replace with your token management method
    });

    const body = {
      user_id: userId,
      favorite_location: location,
    };

    return this.http.post(url, body, { headers });
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
