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


     //#region Google Calendar
     private API_KEY = 'AIzaSyDEKdEsUqP-YLZJg7FxbzXGkIo6g3QXKXI'; // API Key for google calendar
     private CALENDAR_ID = 'rmhv208cik8co84gk1qnijslu4@group.calendar.google.com'; // Calendar ID for groups trainings
     knownTrainingTypes: string[] = [ 'פילאטיס', 'יוגה', 'אימון כוח', 'Parallel 15', 'Spinning', 'TRX', 'Booty&ABS', 'All In', 'HiiT', 'POWER', '' ]; // Array of known training types
     
   fetchGoogleCalendarEventTitle(eventId: string): Promise<string> {
     console.log("eventid", eventId);
     return new Promise((resolve, reject) => {
       const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${this.CALENDAR_ID}/events/${eventId}?key=${this.API_KEY}`;
       
       this.http.get<any>(calendarApiUrl).subscribe(
         (response) => {
           if (response && response.summary) {
             const fullTitle = response.summary.trim();
   
             // Find the first known training type in the title
             const trainingType = this.knownTrainingTypes.find(type => fullTitle.includes(type));
   
             if (trainingType) {
               resolve(trainingType); // Return the found training type as the title
             } else {
               resolve('כללי'); // Fallback if no known type is found
             }
           } else {
             resolve('כללי'); // Fallback if no title is found
           }
         },
         (error) => {
           console.error('Error fetching Google Calendar event:', error); // Log the error for debugging
           resolve('כללי'); // Fallback to default if error occurs
         }
       );
     });
   }
   
     //#endregion
 
 
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
                // Loop through all bookings and match with user email
                appointment.bookings.forEach((booking: any, index: number) => {
                  if (booking.customer?.email === userEmail) {
                    console.log('User booking matched:', booking);
                    booking.googleCalendarEventId = appointment.googleCalendarEventId;
                    console.log("google", booking.googleCalendarEventId);
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
                console.log('No bookings found for appointment:', appointment);
              }
            });
          }
        }

        console.log('Final userAppointments array after filtering:', userAppointments);
        return userAppointments; // Return filtered user appointments with the user's specific booking status
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
