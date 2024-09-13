import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { GestureController, ModalController, ActionSheetController } from '@ionic/angular';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '../services/auth.service';
import { Appointment } from '../Models/appointment';
import { Training } from '../Models/training';
import { Booking } from '../Models/booking';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile-popup',
  templateUrl: './profile-popup.component.html',
  styleUrls: ['./profile-popup.component.scss'],
})
export class ProfilePopupComponent implements AfterViewInit {
  @ViewChild('popup') popup!: ElementRef;

  userName: string | null;  // Fetched dynamically
  userRole: string | null = '';  // Fetched dynamically
  userPhoto: string = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';  // Placeholder for avatar image
  userID: string | null = '';
  knownTrainingTypes: string[] = [ 'פילאטיס', 'יוגה', 'אימון כוח', 'Parallel 15', 'Spinning', 'TRX', 'Booty&ABS', 'All In', 'HiiT', 'POWER', '' ]; // Array of known training types
  nextRenewalDate?: string;  // Subscription specific
  slotsLeft?: number;  // Amelia package specific
  selectedTab: string = 'trainings';  // Default selected tab

  userAppointments: Booking[] = [];
  userPurchases: any[] = [];
  
  constructor(
    private gestureCtrl: GestureController,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private profileService: ProfileService,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.userName = this.authService.getUserFullName();    
    this.userRole = this.fetchUserRole(this.authService.getUserRole());
    this.userID = this.authService.getUserID();
  }

    //#region Google Calendar
    private API_KEY = 'AIzaSyDEKdEsUqP-YLZJg7FxbzXGkIo6g3QXKXI'; // API Key for google calendar
    private CALENDAR_ID = 'rmhv208cik8co84gk1qnijslu4@group.calendar.google.com'; // Calendar ID for groups trainings
  
    
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

    
  ngOnInit() {
    this.loadUserAppointmentsLast60Days();
    console.log("username", this.userName)
    console.log("userrole", this.userRole)
  }

  loadUserAppointmentsLast60Days() {
    this.profileService.getLast60DaysAppointmentsForUser().subscribe((appointments: any[]) => {
      const promises: Promise<any>[] = [];
  
      // Process each appointment
      appointments.forEach((appointment: any) => {
        // Access the matched booking and its status
        const booking = appointment.matchedBooking;
        const status = appointment.userBookingStatus; // This is the user's specific booking status
  
        if (booking) {
          // Ensure the booking object contains the status and title
          appointment.userBookingStatus = status; // Set the user's specific booking status
          console.log("google:", booking.googleCalendarEventId)
          if (booking.googleCalendarEventId) {
            console.log("enters");
            console.log("event id is:", booking.googleca)
            // If there is a Google Calendar event ID, fetch the title
            const promise = this.profileService.fetchGoogleCalendarEventTitle(booking.googleCalendarEventId)
              .then((title: string) => {
                booking.title = title; // Set the title from the Google Calendar event
              })
              .catch((error) => {
                console.error('Error fetching Google Calendar event title:', error);
                booking.title = 'כללי'; // Default title if there was an error
              });
  
            promises.push(promise);
          } else {
            // No eventId, use a default or existing title
            booking.title = 'כללי';
          }
        }
      });
  
      // Wait for all the titles to be fetched before updating the view
      Promise.all(promises).then(() => {
        // Update the user appointments after fetching titles
        this.userAppointments = appointments;
        console.log('User Appointments (Last 60 Days):', this.userAppointments);
      });
    });
  }
  

  //Fetch user role to hebrew description
  fetchUserRole (role: string | null): string {
    if (role === 'author')
      return 'מתאמנת';
    else if (role === 'administrator')
      return 'מנהל';
    else if (role === 'activesubscription')
      return 'מנוי פעיל';
    else if (role === 'trainer')
      return 'מאמן';
    else if (role === 'team')
      return 'צוות';
    else if (role === 'trial-users')
      return 'מתאמנת ניסיון';
    else if (role === 'inactive')
      return 'לא פעילה';
    else if (role === 'personal')
      return 'מתאמנת אישית';
    return '';
  }

  ngAfterViewInit() {
    const gesture = this.gestureCtrl.create({
      el: this.popup.nativeElement,
      gestureName: 'swipe-to-close',
      onMove: (ev) => {
        if (ev.deltaY > 100) {
          this.modalCtrl.dismiss();
        }
      },
    });
    gesture.enable(true);

  }

  closePopup() {
    this.modalCtrl.dismiss();
  }

  async showActions(training: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Actions',
      buttons: [
        {
          text: 'Cancel Training',
          role: 'destructive',
          icon: 'close-circle-outline',
          handler: () => {
            console.log('Cancel training:', training);
          },
        },
        {
          text: 'Reschedule',
          icon: 'time-outline',
          handler: () => {
            console.log('Reschedule training:', training);
          },
        },
        {
          text: 'Close',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  // Download purchase invoice
  downloadInvoice(order: any) {
    console.log('Downloading invoice for order:', order.orderNumber);
    // Add logic to download the invoice
  }

  // Get status icons for trainings
  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved':
        return 'checkmark-circle-outline';
      case 'canceled':
        return 'close-circle-outline';
      case 'pending':
        return 'time-outline';
      default:
        return 'alert-circle-outline';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'success';
      case 'canceled':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'medium';
    }
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'approved':
        return 'מאושר';  // Hebrew for "approved"
      case 'cancelled':
        return 'בוטל';  // Hebrew for "cancelled"
      case 'pending':
        return 'ממתין';  // Hebrew for "pending"
      default:
        return 'לא ידוע';  // Hebrew for "unknown"
    }
  }
}
