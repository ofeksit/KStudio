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
  
  selectedFilterAllFav: string = 'all';  // Default to "All" tab
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
  filteredAppointments: Appointment[] = [];
  unfilteredList: Appointment[] = [];
  private apiUrl = 'https://k-studio.co.il/wp-json/angular/v1/get-services/';

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
      this.unfilteredList = [...this.combinedList];
      this.selectedDay = this.days.length > 0 ? this.days[0].date : ''; // Ensure selectedDay is set
      this.updateFilteredAppointments();  // Apply initial filters (including day filter)

      // Load favorite trainings from localStorage
      const favoriteTrainingIds = this.getFavoriteTrainings();
      this.combinedList.forEach(training => {
        if (training.id && favoriteTrainingIds.includes(training.id)) {
          training.favorite = true;
        }
      });
      // Set loading to false when data is ready
      this.isLoading = false;
    }).catch(() => {
      this.isLoading = false; // Ensure loading is disabled even in case of errors
    });
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
  
  //Get Services ID by loggedin role user
  getServicesByRole() {
    // Get user role from localStorage
    const userRole = localStorage.getItem('user_role');
    console.log("userRole", userRole);
    // If no role is found, default to 'guest'
    const role = userRole ? userRole : 'guest';

    // Call the WordPress API with the role in the URL
    return this.http.get<number[]>(`${this.apiUrl}${role}`);
  }

  // Gets all the available timeslots
  fetchAvailableTimeslots(): Promise<void> {
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return new Promise((resolve, reject) => {
      // Fetch the serviceIDs from the role
      this.getServicesByRole().subscribe((serviceIDs: number[]) => {
        if (serviceIDs.length === 0) {
          return reject('No service IDs found');
        }

        // Create a promise for each serviceID request
        const timeslotRequests = serviceIDs.map(serviceID => {
          const url = `/api/slots&serviceId=${serviceID}&page=booking&startDateTime=${formatDate(today)}`;
          return this.http.get<{ data: { slots: any } }>(url, {
            headers: { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk' }
          }).toPromise();
        });

        // Wait for all requests to finish
        Promise.all(timeslotRequests).then((responses) => {
          // Combine all timeslots from the responses
          this.availableTimeslots = responses.flatMap((response: any) => {
            const timeslotsData = response.data.slots;

            return Object.keys(timeslotsData).flatMap(date =>
              Object.keys(timeslotsData[date]).map(time => ({
                start_time: new Date(`${date}T${time}`).toISOString(),
                end_time: new Date(`${date}T${time}`).toISOString(),
                type: 'timeslot',
                title: { name: 'אימון קבוצתי' }, // Default title
                favorite: false,
                current_participants: [],
                total_participants: 8,
                booked: 0,
              }))
            );
          });
          resolve(); // Resolve when all data is ready
        }).catch(error => reject(error)); // Handle any error in the requests
      }, error => reject(error)); // Error handling for service IDs
    });
  }

  //Gets all the appointments
  fetchBookedAppointments(): Promise<void> {
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Assume serviceID contains the required service IDs
    //let serviceID: number[] = this.getServicesByRole(); // This is a placeholder, adjust as needed for async handling

    return new Promise((resolve, reject) => {
      this.getServicesByRole().subscribe((serviceIDs: number[]) => {
        console.log("serviceIDS", serviceIDs);
      const url = '/api/appointments&dates='+formatDate(today)+','+formatDate(next30Days)+'&page=1&skipServices=1&skipProviders=1'; 
      this.http.get<{ data: { appointments: any } }>(url, { headers: { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk' } }).subscribe(
        async (response) => {
          const appointmentData = response.data.appointments;
          const now = new Date();
          const appointmentsPromises = Object.values(appointmentData).flatMap((appointment: any) =>
            appointment.appointments.filter((app: any) =>
              app.status === 'approved' && app.past === false && new Date(app.bookingStart) > now && serviceIDs.includes(app.serviceId)
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
        },
        (error) => reject(error) // Reject on error
      );
    }, (error) => reject(error)); // Error handling for service IDs
  });
  }

  //Combine between appointments and timeslots
  combineTimeslotsAndAppointments() {
    this.combinedList = [...this.availableTimeslots, ...this.bookedAppointments];
    this.unfilteredList = [...this.combinedList];  

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

  //Extract 
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

  extractAvailableTypes() {
    const typesSet = new Set(this.filteredAppointments.map(appointment => appointment.title.name));
    this.availableTypes = Array.from(typesSet); // Convert Set back to Array for display
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

  // Method to handle day change and update available types
  onDayChange() {
    this.updateFilteredAppointments();  // Update available types based on selected day
  }

  // Modify the filter function to work on unfilteredList and populate filteredAppointments
  filterFavAll(event: any) {
    this.selectedFilterAllFav = event.detail.value;
    this.updateFilteredAppointments();  // Reapply all filters when switching tabs
  }

  // Add this function to trigger on availability filter change
  toggleAvailabilityFilter() {
    this.availabilityFilter = this.availabilityFilter === 'all' ? 'available' : 'all';
    this.updateFilteredAppointments(); // Reapply the filter
  }

  //Updates list according the conditions
  updateFilteredAppointments() {
    let tempAppointments = [...this.unfilteredList];
  
    // Filter by selected day
    if (this.selectedDay) {
      tempAppointments = tempAppointments.filter(appointment => {
        const appointmentDate = moment(appointment.start_time).format('YYYY-MM-DD');
        return appointmentDate === this.selectedDay;
      });
    }
  
    // Filter by availability (show only available if 'available' is selected)
    if (this.availabilityFilter === 'available') {
      tempAppointments = tempAppointments.filter(appointment => appointment.booked < appointment.total_participants);
    }
  
    // Filter by type (if a type is selected)
    if (this.selectedType) {
      console.log("Applying type filter:", this.selectedType);  // Debugging the type filter application
      tempAppointments = tempAppointments.filter(appointment => appointment.title.name === this.selectedType);
    }
  
    // Filter by favorites if needed
    if (this.selectedFilterAllFav === 'favorites') {
      tempAppointments = tempAppointments.filter(appointment => appointment.favorite);
    }
  
    // Update the displayed filtered list
    this.filteredAppointments = tempAppointments;
  
    // After filtering, extract available types from the filtered list
    this.extractAvailableTypes();
  }

  // Call this method when availability or type filters change
  onFilterChange() {
    this.updateFilteredAppointments();
  }
  
  // Add this function to trigger on type change
  onTypeChange() {
    console.log("Selected type:", this.selectedType);  // Check if the correct type is being selected
    this.updateFilteredAppointments(); // Reapply the filter
  }

  //Reset type filter using red "X" button
  resetTypeFilter() {
    this.selectedType = '';  // Clear the type filter
    this.updateFilteredAppointments();  // Reapply all filters
  }

  // Remove past favorites from favorites
  removePastFavorites() {
    const now = new Date();
    const currentFavorites = this.getFavoriteTrainings();
    
    const validFavorites = currentFavorites.filter(favoriteId => {
      const training = this.combinedList.find(t => t.id === favoriteId);
      return training && new Date(training.start_time) > now;
    });

    this.saveFavoriteTrainings(validFavorites); // Update localStorage with only valid favorites
  }

  //Function to dismiss the modal
  closeModal() {
    this.modalCtrl.dismiss();
  }

  // Toggle favorite status and save to localStorage
  toggleFavorite(training: any) {
    training.favorite = !training.favorite;
    
    // Save favorites to localStorage
    const currentFavorites = this.getFavoriteTrainings();
    
    if (training.favorite) {
      currentFavorites.push(training.id); // Add the favorite training ID
    } else {
      const index = currentFavorites.indexOf(training.id);
      if (index > -1) {
        currentFavorites.splice(index, 1); // Remove from favorites
      }
    }
    
    this.saveFavoriteTrainings(currentFavorites); // Save updated favorites
  }

  // Get favorites from localStorage
  getFavoriteTrainings(): number[] {
    const favorites = localStorage.getItem('favoriteTrainings');
    return favorites ? JSON.parse(favorites) : [];
  }

  // Save updated favorites to localStorage
  saveFavoriteTrainings(favorites: number[]) {
    localStorage.setItem('favoriteTrainings', JSON.stringify(favorites));
  }

  // Toggle dropdown visibility
  toggleFilterDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  //Calculate progress bar
  calculateProgress(appointment: any): number {
    if (!appointment.current_participants || !appointment.total_participants) {
      return 0;
    }
    const progress = (appointment.current_participants.length / appointment.total_participants) * 100;
    return progress > 100 ? 100 : progress; // Ensure the progress doesn't exceed 100%
  }

  //Checks if training is full
  isFull(appointment: any): boolean {
    return appointment.current_participants >= appointment.total_participants;
  }



  // Method to show the popup
  showParticipantsPopup(appointment: Appointment) {
    this.activeAppointment = appointment;
    this.isPopupVisible = true;
  }

  // Method to hide the popup
  hideParticipantsPopup() {
    this.activeAppointment = null;
    this.isPopupVisible = false;
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

}
