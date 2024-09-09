import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GestureController, ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { Appointment } from '../Models/appointment';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-trainings',
  templateUrl: './trainings.page.html',
  styleUrls: ['./trainings.page.scss'],
})
export class TrainingsPage implements AfterViewInit {
  
  //#region Variables
  @ViewChild('popup') popup!: ElementRef;
  appointments: Appointment[] = [];
  selectedFilter: string = 'all';  // Default to "All" tab
  selectedType: string = '';  // Default: no type filter
  availabilityFilter: string = 'all';  // Default: show all
  showDropdown: boolean = false;  // Controls the visibility of the filter dropdown
  availableTypes: string[] = [];  // Array of available training types
  availableTimeslots: Appointment[] = []; //Timeslots list
  bookedAppointments: Appointment[] = []; //Appointments List
  combinedList: Appointment[] = []; //Final list of timeslots and appointments
  days: { formattedDate: any; date: string; day: string }[] = [];
  selectedDay: string | undefined;  // Default selected day
  showingParticipants = false; //Popup to show participants
  isPopupVisible = false; // Participants Popup
  activeAppointment: Appointment | null = null; // Track the active appointment for popup
  knownTrainingTypes: string[] = [ 'פילאטיס', 'יוגה', 'אימון כוח', 'Parallel 15', 'Spinning', 'TRX', 'Booty&ABS', 'All In', 'HiiT', 'POWER', '' ]; // Array of known training types
  userId: number = 123; //Define active user ID
  userEmail: string = "example@example.com"; //Define active user email
  isLoading: boolean = true; // Set loading to true initially
//#endregion
  //#region Google Calendar
  private API_KEY = 'AIzaSyDEKdEsUqP-YLZJg7FxbzXGkIo6g3QXKXI'; // API Key for google calendar
  private CALENDAR_ID = 'rmhv208cik8co84gk1qnijslu4@group.calendar.google.com'; // Calendar ID for groups trainings

  
fetchGoogleCalendarEventTitle(eventId: string): Promise<string> {
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


  constructor(private gestureCtrl: GestureController, private modalCtrl: ModalController, private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    // Set loading to true when API call starts
    this.isLoading = true;

    Promise.all([this.fetchAvailableTimeslots(), this.fetchBookedAppointments()]).then(() => {
      this.combineTimeslotsAndAppointments();

      // Set loading to false when data is ready
      this.isLoading = false;
    }).catch(() => {
      this.isLoading = false; // Ensure loading is disabled even in case of errors
    });
  }


  // Method to show the popup
  showPopup(appointment: Appointment) {
    this.activeAppointment = appointment;
    this.isPopupVisible = true;
  }

  // Method to hide the popup
  hidePopup() {
    this.activeAppointment = null;
    this.isPopupVisible = false;
  }

  fetchAvailableTimeslots(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = '/api/slots&serviceId=12&page=booking&startDateTime=2024-09-08'; // Adjust as needed
      this.http.get<{ data: { slots: any } }>(url, { headers: { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk' } }).subscribe(
        (response) => {
          const timeslotsData = response.data.slots;
          this.availableTimeslots = Object.keys(timeslotsData).flatMap(date =>
            Object.keys(timeslotsData[date]).map(time => ({
              start_time: new Date(`${date}T${time}`).toISOString(),
              end_time: new Date(`${date}T${time}`).toISOString(),
              type: 'timeslot',
              title: { name: 'אימון קבוצתי' }, 
              favorite: false,
              current_participants: [],
              total_participants: 8,
              booked: 0,
            }))
          );
          resolve(); // Resolve when data is ready
        },
        (error) => reject(error) // Reject on error
      );
    });
  }

  fetchBookedAppointments(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = '/api/appointments&dates=2024-09-08,2024-09-10&page=1&skipServices=1&skipProviders=1'; 
      this.http.get<{ data: { appointments: any } }>(url, { headers: { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk' } }).subscribe(
        async (response) => {
          const appointmentData = response.data.appointments;
          const now = new Date();
          const appointmentsPromises = Object.values(appointmentData).flatMap((appointment: any) =>
            appointment.appointments.filter((app: any) =>
              app.status === 'approved' && app.past === false && new Date(app.bookingStart) > now
            ).map(async (app: any) => {
              const googleCalendarTitle = app.googleCalendarEventId
                ? await this.fetchGoogleCalendarEventTitle(app.googleCalendarEventId)
                : 'אימון קבוצתי'; // Fallback to default if no Google Calendar ID
      
              return {
                id: app.id,
                start_time: app.bookingStart,
                end_time: app.bookingEnd,
                type: 'appointment',
                title: { name: googleCalendarTitle }, // Set the Google Calendar title
                serviceID: app.serviceId,
                favorite: false,
                current_participants: app.bookings.filter((booking: any) => booking.status === 'approved')
                  .map((booking: any) => `${booking.customer.firstName} ${booking.customer.lastName}`),
                total_participants: 8,
                booked: app.bookings.filter((booking: any) => booking.status === 'approved').length,
              };
            })
          );
          
          this.bookedAppointments = await Promise.all(appointmentsPromises);
          resolve(); // Resolve when data is ready
          console.log("Booked: ",this.bookedAppointments);
        },
        (error) => reject(error) // Reject on error
      );
    });
  }

// Method to enroll the user in a training session
enrollUser(appointment: Appointment) {
  let serviceID= appointment.serviceID;
  let bookingStart = appointment.start_time;
  let userID = this.authService.getUserID;
  let userEmail = this.authService.getUserEmail;

  console.log("serviceID", serviceID);
  console.log("booking Start", bookingStart);
  /* const url = 'https://k-studio.co.il/wp-json/amelia/v1/appointments/enroll';

  const data = {
    appointment_id: appointment.id,
    customer_id: this.userId,
    email: this.userEmail
  };

  this.http.post(url, data).subscribe(response => {
    console.log('User enrolled in appointment', response);
  }, error => {
    console.error('Error enrolling user', error);
  });*/
}


  
  
  
  

combineTimeslotsAndAppointments() {
  this.combinedList = [...this.availableTimeslots, ...this.bookedAppointments];

  // Ensure valid dates
  this.combinedList = this.combinedList.filter(item => {
    const startDate = new Date(item.start_time);
    const endDate = new Date(item.end_time);
    return !isNaN(startDate.getTime()) && !isNaN(endDate.getTime());
  });

  this.extractAvailableDays();

  this.combinedList.sort((a, b) => {
    const dateA = new Date(a.start_time).getTime();
    const dateB = new Date(b.start_time).getTime();
    return dateA - dateB;
  });
}


extractAvailableDays() {
  const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

  const allDates = this.combinedList
    .filter(item => {
      const date = new Date(item.start_time);
      return !isNaN(date.getTime());
    })
    .map(item => new Date(item.start_time).toISOString().split('T')[0]);

  // Remove duplicates and sort dates
  this.days = Array.from(new Set(allDates)).map(date => {
    const parsedDate = new Date(date);
    const dayOfWeek = hebrewDays[parsedDate.getDay()];
    const formattedDate = `${parsedDate.getDate()}.${parsedDate.getMonth() + 1}`;

    return {
      date,
      day: dayOfWeek,
      formattedDate,
    };
  });

  // Sort so that today is at the start
  this.days.sort((a, b) => {
    if (a.date === today) return -1;
    if (b.date === today) return 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime(); // Sort chronologically
  });

  this.selectedDay = this.days.length > 0 ? this.days[0].date : ''; // Default to the first available day (today)
}

  // Filter the combined list by selected day
  getAppointmentsForSelectedDay() {
    return this.combinedList.filter(item => {
      const date = moment(item.start_time);
      return (
        date.isValid() && // Ensure valid date
        date.format('YYYY-MM-DD') === this.selectedDay
      );
    });
  }

  closePopup() {
    this.modalCtrl.dismiss();
  }

  ngAfterViewInit() {
    setTimeout(() => {
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
    });
  }

  // Toggle favorite status
  toggleFavorite(training: any) {
    training.favorite = !training.favorite;
  }

  // Toggle dropdown visibility
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  // Clear the type filter
  clearTypeFilter() {
    this.selectedType = '';
  }

  calculateProgress(appointment: any): number {
    if (!appointment.current_participants || !appointment.total_participants) {
      return 0;
    }
    const progress = (appointment.current_participants.length / appointment.total_participants) * 100;
    return progress > 100 ? 100 : progress; // Ensure the progress doesn't exceed 100%
  }
  
  isFull(appointment: any): boolean {
    return appointment.current_participants >= appointment.total_participants;
  }

  // Function to add user to standby list
  addToStandbyList(appointmentId: number, customerId: number, email: string) {
    const url = 'https://k-studio.co.il/wp-json/standby-list/v1/add';

    const data = {
      appointment_id: appointmentId,
      customer_id: customerId,
      email: email
    };

    this.http.post(url, data).subscribe(response => {
      console.log('User added to standby list', response);
    }, error => {
      console.error('Error adding user to standby list', error);
    });
  }

  
}
