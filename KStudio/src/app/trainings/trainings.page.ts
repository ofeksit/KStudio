import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GestureController, ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { Appointment } from '../Models/appointment';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { of } from 'rxjs';
import { DayTrainings } from '../Models/day-trainings';
import { AmeliaService } from '../services/amelia-api.service';

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
  userId: string | null; //Define active user ID
  userEmail: string | null = ""; //Define active user email
  isLoading: boolean = true; // Set loading to true initially
  filteredAppointments: Appointment[] = [];
  unfilteredList: Appointment[] = [];
  

  trainingsByDay: any;

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

  

  constructor(private ameliaService: AmeliaService, private gestureCtrl: GestureController, private modalCtrl: ModalController, private http: HttpClient, private authService: AuthService) {
    this.userId = this.authService.getUserID();
    this.userEmail = this.authService.getUserEmail();
  }

  async ngOnInit() {
    // Set loading to true when API call starts
    this.isLoading = true;
    this.trainingsByDay = this.ameliaService.getTrainingsTitles();
    
    // Check if the titles have already been fetched
    if (!this.trainingsByDay || Object.keys(this.trainingsByDay).every(key => this.trainingsByDay[key].length === 0)) {
      // Fetch the training titles if not already available
      await this.ameliaService.fetchTitleTrainings();
      this.trainingsByDay = this.ameliaService.getTrainingsTitles();
    }
  
    // Once titles are fetched, proceed to load the rest of the data
    Promise.all([this.fetchAvailableTimeslots(), this.fetchBookedAppointments()])
      .then(() => {
        this.combineTimeslotsAndAppointments();
        this.unfilteredList = [...this.combinedList];
        this.selectedDay = this.days.length > 0 ? this.days[0].date : ''; // Ensure selectedDay is set
        this.updateFilteredAppointments(); // Apply initial filters (including day filter)
  
        // Load favorite trainings from localStorage
        const favoriteTrainingIds = this.getFavoriteTrainings();
        this.combinedList.forEach((training) => {
          if (training.id && favoriteTrainingIds.includes(training.id)) {
            training.favorite = true;
          }
        });
  
        // Set loading to false when data is ready
        this.isLoading = false;
      })
      .catch(() => {
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
    const apiUrl = 'https://k-studio.co.il/wp-json/angular/v1/get-services/';
    // Get user role from localStorage
    const userRole = localStorage.getItem('user_role');
    console.log("userRole", userRole);
    // If no role is found, default to 'guest'
    const role = userRole ? userRole : 'guest';

    // Call the WordPress API with the role in the URL
    return this.http.get<number[]>(`${apiUrl}${role}`);
  }

  // Gets all the available timeslots
  async fetchAvailableTimeslots(): Promise<void> {
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 20); // Fetch for 30 days
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7); // Limit title fetching for the next 7 days
    
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  
    return new Promise((resolve, reject) => {
      this.getServicesByRole().subscribe(async (serviceIDs: number[]) => {
        if (serviceIDs.length === 0) {
          return reject('No service IDs found');
        }
  
        const timeslotRequests = serviceIDs.map(serviceID => {
          const url = `/api/slots&serviceId=${serviceID}&page=booking&startDateTime=${formatDate(today)}&endDateTime=${formatDate(next30Days)}`;
          return this.http.get<{ data: { slots: any } }>(url, {
            headers: { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk' }
          }).toPromise();
        });
  
        Promise.all(timeslotRequests).then(async (responses) => {
          this.availableTimeslots = [];
  
          for (const response of responses) {
            if (response && response.data && response.data.slots) {
              const timeslotsData = response.data.slots;
  
              for (const date of Object.keys(timeslotsData)) {
                for (const time of Object.keys(timeslotsData[date])) {
                  const start_time = new Date(`${date}T${time}`).toISOString();
                  const end_time = new Date(`${date}T${time}`).toISOString();
  
                  // Check if the timeslot is within the next 7 days
                  const timeslotDate = new Date(start_time);
                  let title;
                  if (timeslotDate <= next7Days) {
                    // Fetch title only for the next 7 days
                    title = { name: await this.getAppointmentTitleByDateTime(date, time) };
                  } else {
                    // Use default title for dates beyond 7 days
                    title = { name: 'אימון קבוצתי' };
                  }
  
                  this.availableTimeslots.push({
                    start_time,
                    end_time,
                    type: 'timeslot',
                    title, 
                    favorite: false,
                    current_participants: [],
                    total_participants: 8,
                    booked: 0,
                  });
                }
              }
            }
          }
          resolve();
        }).catch(error => reject(error));
      }, error => reject(error));
    });
  }

  //Gets all the appointments
  fetchBookedAppointments(): Promise<void> {
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 20); // Fetch for 30 days
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7); // Limit title fetching to the next 7 days
  
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  
    return new Promise((resolve, reject) => {
      this.getServicesByRole().subscribe((serviceIDs: number[]) => {
        const url = `/api/appointments&dates=${formatDate(today)},${formatDate(next30Days)}&page=1&skipServices=1&skipProviders=1`;
        this.http.get<{ data: { appointments: any } }>(url, { headers: { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk' } }).subscribe(
          async (response) => {
            const appointmentData = response.data.appointments;
            const now = new Date();
            const appointmentsPromises = Object.values(appointmentData).flatMap((appointment: any) =>
              appointment.appointments.filter((app: any) =>
                app.status === 'approved' && app.past === false && new Date(app.bookingStart) > now && serviceIDs.includes(app.serviceId)
              ).map(async (app: any) => {
                const appointmentStartDate = new Date(app.bookingStart);
                let appointmentTempTitle;
  
                if (appointmentStartDate <= next7Days) {
                  // Fetch title only for the next 7 days
                  appointmentTempTitle = await this.getAppointmentTitleByAppointment(app);
                } else {
                  // Use default title for appointments beyond 7 days
                  appointmentTempTitle = 'אימון קבוצתי';
                }
  
                return {
                  id: app.id,
                  start_time: app.bookingStart,
                  end_time: app.bookingEnd,
                  type: 'appointment',
                  title: { name: appointmentTempTitle }, 
                  serviceID: app.serviceId,
                  favorite: false,
                  current_participants: app.bookings.filter((booking: any) => booking.status === 'approved')
                    .map((booking: any) => `${booking.customer.firstName} ${booking.customer.lastName}`),
                  total_participants: 8,
                  booked: app.bookings.filter((booking: any) => booking.status === 'approved').length,
                  providerId: app.providerId,
                };
              })
            );
            
            this.bookedAppointments = await Promise.all(appointmentsPromises);
            resolve();
          },
          (error) => reject(error)
        );
      }, (error) => reject(error));
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

  /* Function to fetch trainings for all days and store them in list
  async fetchAllTrainings() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const day of days) {
      const today = moment();
      const targetDate = moment().day(day).format('DD/MM/YYYY');

      const response: string[] = await this.http.get<string[]>(`https://k-studio.co.il/wp-json/custom-api/v1/appointment-title/?date=${targetDate}`).toPromise() || [];

      if (response.length > 0) {
        console.log(`Trainings for ${day}:`, response);
  
          // Clean up the response and map it to the DayTrainings type
          this.trainingsByDay[day] = response.map(event => {
              const [time, title] = event.split(' - ').map(part => part.trim()); // Split time and title
              return { time, title }; // Return as a DayTrainings object
          });
      }
    }
  }*/

  async getAppointmentTitleByAppointment(appointment: any): Promise<string> {
    // Parse the date and time using the correct format "YYYY-MM-DD HH:mm:ss"
    const date = moment(appointment.bookingStart, "YYYY-MM-DD HH:mm:ss").format('DD/MM/YYYY');    
    const formattedDay = this.getDayFromDate(date.trim());
    const formattedTime = moment(appointment.bookingStart, "YYYY-MM-DD HH:mm:ss").format('HH:mm');

    // Check if the day exists in trainingsByDay
    if (this.trainingsByDay[formattedDay]) {
      // Find the training by matching the time
      const training = this.trainingsByDay[formattedDay].find((t: { time: string; }) => t.time === formattedTime);      
      // Return the title if found, or null if no match
      if (training) {
        return training.title;
      }
    }
    return 'NONE_1'; // Return null if no match found
}

  getDayFromDate(dateString: string): string {
        // Parse the date in DD/MM/YYYY format using Moment.js
    const date = moment(dateString, "DD/MM/YYYY").toDate();
    // Array of day names
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    // Get the day of the week (0-6)
    const dayIndex = date.getDay();
    // Return the corresponding day name
    return daysOfWeek[dayIndex];
  }


  // Your original function modified to use the initialized data
  async getAppointmentTitleByDateTime(date: string, time: string): Promise<string> {
    const formattedDate = moment(date, "YYYY-MM-DD").format('DD/MM/YYYY');
    const day = this.getDayFromDate(formattedDate);
    // Check if the day exists in trainingsByDay
    if (this.trainingsByDay[day]) {
      // Find the training by matching the time
      const training = this.trainingsByDay[day].find((t: { time: string; }) => t.time === time);      
      // Return the title if found, or null if no match
      if (training) {
        return training.title;
      }
    }
    return 'NONE'; // Return null if no match found
  }

  // Function to add user to standby list
  addToStandbyList(appointmentId: number, customerId: string | null, email: string | null) {
    console.log("user id:", customerId);
    console.log("email", email);
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
    const formattedBookingStart = bookingStart.slice(0, 16);
    console.log(formattedBookingStart);

    let providerId = appointment.providerId;

    let customerID = this.authService.getCustomerID();
    let userEmail = this.authService.getUserEmail();

      // Request body
  const enrollData = {
    serviceId: serviceID,
    providerId: providerId,
    bookings: [
      {
        customerId: customerID,
        status: "approved",
        duration: 3600, // Assuming the training is 1 hour (3600 seconds)
        persons: 1,
        extras: [], // Assuming no extras, modify if needed
        customFields: {},
        packageCustomerService: {
          packageCustomer: {
            id: 1732
          }
        }
      }
    ],
    bookingStart: formattedBookingStart
  };

    console.log("data", enrollData)
    // Send the request to enroll the user
    this.http.post('/api/appointments', enrollData, {
      headers: {
        'Amelia': `C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk`, // Assuming token-based authentication
        'Content-Type': 'application/json'
      }
    }).subscribe(
      (response) => {
        console.log('Enrollment successful', response);
      },
      (error) => {
        console.error('Enrollment failed', error);
      }
    );
  }
}