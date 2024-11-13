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
import { ToastController  } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { Platform } from '@ionic/angular';


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
  showToast: boolean = false;
  toastMessage: string = '';
  toastColor: string = 'success';
  errorMessage: string = '';
  isStandbyLoading: boolean = false;
  isStandbySuccess: boolean = false;
  isEnrollLoading: boolean = false;
  isEnrollSuccess: boolean = false;
  customerID: string | null = "";

//#endregion
  
  constructor(private platform: Platform, private toastController: ToastController, private ameliaService: AmeliaService, private gestureCtrl: GestureController, private modalCtrl: ModalController, private http: HttpClient, private authService: AuthService, private httpA: HTTP) {
    this.userId = this.authService.getUserID();
    this.userEmail = this.authService.getUserEmail();
    this.customerID = this.authService.getCustomerID();
  }

  async ngOnInit() {
    // Set loading to true when API call starts
    if (this.authService.getUserRole() == 'inactive'){
      this.errorMessage = 'לא ניתן לטעון אימונים,  המשתמש לא פעיל'
      this.presentToast(this.errorMessage, 'danger');
    }
    this.isLoading = true;
    this.trainingsByDay = this.ameliaService.getTrainingsTitles();
    this.authService.fetchPackageCustomerId(this.customerID).subscribe({
      next: (response) => {
        
      },
      error: (error) => {
        console.error("Error fetching package id", error);
      }
    })

    
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

  async presentToast (message: string, color: string){
    const toast = await this.toastController.create({
      message: message,
      duration: 3000, 
      color: color,
      position: 'bottom',
    });
    await toast.present();
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
  getServicesByRole(): Observable<number[]> {
    const apiUrl = 'https://k-studio.co.il/wp-json/angular/v1/get-services/';
    const userRole = localStorage.getItem('user_role') || 'guest';
    return this.http.get<number[]>(`${apiUrl}${userRole}`);
  }

  formatDateTimeInIsraelTime(dateString: string, timeString: string): string {
    const localDate = new Date(`${dateString}T${timeString}`);
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Jerusalem',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
  
    // Format the date and time as per Israeli time zone
    const israelTime = new Intl.DateTimeFormat('en-CA', options).format(localDate); // Using 'en-CA' to format as yyyy-mm-dd
  
    // Adjust the format to return yyyy-mm-dd hh:mm:ss
    const [datePart, timePart] = israelTime.replace(',', '').split(' ');
    const formattedDate = datePart.replace(/\//g, '-');
    return `${formattedDate} ${timePart}`;
  }

  async fetchAvailableTimeslots(): Promise<void> {
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 20); // Fetch for 20 days
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7); // Limit title fetching for the next 7 days
  
  // Updated formatDate function to format the date as yyyy-mm-dd
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
          const url = `${environment.apiBaseUrl}/slots&serviceId=${serviceID}&page=booking&startDateTime=${formatDate(today)}&endDateTime=${formatDate(next30Days)}`;
  
          if (this.platform.is('cordova')) {
            return this.httpA.get(url, {}, {
              'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk' // Headers
            }).then(response => {

              return JSON.parse(response.data);
            }).catch(error => {
              reject(`Error fetching timeslots for service ID ${serviceID}: ${error}`);
            });
          } else {
            return this.http.get(url, {
              headers: {
                'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk' // Headers
              }
            }).toPromise().then(response => {
              return response;
            }).catch(error => {
              reject(`Error fetching timeslots for service ID ${serviceID}: ${error}`);
            });
          }
        });
  
        Promise.all(timeslotRequests).then(async (responses) => {
          this.availableTimeslots = [];
  
          for (const response of responses) {
            if (response && response.data && response.data.slots) {
              const timeslotsData = response.data.slots;
  
              for (const date of Object.keys(timeslotsData)) {
                const formattedDate = formatDate(new Date(date));

                for (const time of Object.keys(timeslotsData[date])) {
                  const start_time = this.formatDateTimeInIsraelTime(formattedDate, time);                  
  
                  let title = { name: await this.getAppointmentTitleByDateTime(date, time) };
                  this.availableTimeslots.push({
                    start_time,
                    type: 'timeslot',
                    title,
                    favorite: false,
                    current_participants: [],
                    serviceID: 12, 
                    providerId: 169,
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
  
  fetchBookedAppointments(): Promise<void> {
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);
  
    const formatDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
  
    return new Promise((resolve, reject) => {
      this.platform.ready().then(() => {
        this.getServicesByRole().subscribe((serviceIDs: number[]) => {
          const url = `${environment.apiBaseUrl}/appointments&dates=${formatDate(today)},${formatDate(next30Days)}`;
  
          const loggedInCustomerId = this.authService.getCustomerID();  
          if (this.platform.is('cordova')) {
            this.httpA.get(url, {}, {
              'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk'
            }).then(async (response) => {
              const parsedResponse = JSON.parse(response.data);
              const appointmentData = parsedResponse.data.appointments;
  
              const now = new Date();
              const appointmentsPromises = Object.values(appointmentData).flatMap((appointment: any) =>
                appointment.appointments.flatMap((app: any) => {  // Iterate through appointments                  
  
                  // Log the type of customerId for debugging
  
  
                  // Ensure both IDs are numbers for comparison
                  const normalizedCustomerId = typeof loggedInCustomerId === 'string' ? parseInt(loggedInCustomerId) : loggedInCustomerId;
  
                  // Check if the user is booked
                  // Check if the user is booked and the status is 'approved'
                  console.log("Mobile");
                  console.log('Normalized Customer ID:', normalizedCustomerId);
                  console.log('Booking Data:', app.bookings);

                  const isUserBooked = app.bookings.some((booking: any) => booking.customerId === normalizedCustomerId && booking.status === 'approved');

  
                  let appointmentTempTitle;
                  const appointmentStartDate = new Date(app.bookingStart);
  
                  if (appointmentStartDate <= next7Days) {
                    return this.getAppointmentTitleByAppointment(app).then((appointmentTitle: any) => {
                      appointmentTempTitle = appointmentTitle;
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
                        isUserBooked: isUserBooked, // Updated field
                      };
                    });
                  } else {
                    appointmentTempTitle = 'אימון קבוצתי';
                    return Promise.resolve({
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
                      isUserBooked: isUserBooked, // Updated field
                    });
                  }
                })
              );
  
              this.bookedAppointments = await Promise.all(appointmentsPromises);
              resolve();
            }).catch(error => {
              reject(`Error fetching appointments: ${error}`);
            });
          } else {
            this.http.get(url, {
              headers: {
                'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk'
              }
            }).toPromise().then(async (response: any) => {
              const appointmentData = response.data.appointments;              
  
              const now = new Date();
              const appointmentsPromises = Object.values(appointmentData).flatMap((appointment: any) =>
                appointment.appointments.flatMap((app: any) => {  // Iterate through appointments                  
  
                  // Ensure both IDs are numbers for comparison
                  const normalizedCustomerId = typeof loggedInCustomerId === 'string' ? parseInt(loggedInCustomerId) : loggedInCustomerId;
  
                  // Check if the user is booked
                  console.log("Computer");
                  const isUserBooked = app.bookings.some((booking: any) => booking.customerId === normalizedCustomerId && booking.status === 'approved');
  
                  let appointmentTempTitle;
                  const appointmentStartDate = new Date(app.bookingStart);
  
                  if (appointmentStartDate <= next7Days) {
                    return this.getAppointmentTitleByAppointment(app).then((appointmentTitle: any) => {
                      appointmentTempTitle = appointmentTitle;
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
                        isUserBooked: isUserBooked, // Updated field
                      };
                    });
                  } else {
                    appointmentTempTitle = 'אימון קבוצתי';
                    return Promise.resolve({
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
                      isUserBooked: isUserBooked, // Updated field
                    });
                  }
                })
              );
  
              this.bookedAppointments = await Promise.all(appointmentsPromises);
              resolve();
            }).catch(error => {
              reject(`Error fetching appointments: ${error}`);
            });
          }
        }, (error) => reject(error));
      });
    });
  }
  
  //Combine between appointments and timeslots
  combineTimeslotsAndAppointments() {
    this.combinedList = [...this.availableTimeslots, ...this.bookedAppointments];
    this.unfilteredList = [...this.combinedList];
    this.extractAvailableDays();
    this.combinedList.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }

  //Extract 
  extractAvailableDays() {
    const hebrewDays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const today = new Date().toISOString().split('T')[0];

    const allDates = this.combinedList
      .filter(item => !isNaN(new Date(item.start_time).getTime()))
      .map(item => new Date(item.start_time).toISOString().split('T')[0]);

    this.days = Array.from(new Set(allDates)).map(date => {
      const parsedDate = new Date(date);
      const dayOfWeek = hebrewDays[parsedDate.getDay()];
      const formattedDate = `${parsedDate.getDate()}.${parsedDate.getMonth() + 1}`;

      return { date, day: dayOfWeek, formattedDate };
    });

    this.days.sort((a, b) => {
      if (a.date === today) return -1;
      if (b.date === today) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    this.selectedDay = this.days.length > 0 ? this.days[0].date : '';
  }

  extractAvailableTypes() {
    const typesSet = new Set(this.filteredAppointments.map(appointment => appointment.title.name));
    this.availableTypes = Array.from(typesSet);
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

    if (this.selectedDay) {
      tempAppointments = tempAppointments.filter(appointment => moment(appointment.start_time).format('YYYY-MM-DD') === this.selectedDay);
    }

    if (this.availabilityFilter === 'available') {
      tempAppointments = tempAppointments.filter(appointment => appointment.booked < appointment.total_participants);
    }

    if (this.selectedType) {
      tempAppointments = tempAppointments.filter(appointment => appointment.title.name === this.selectedType);
    }

    if (this.selectedFilterAllFav === 'favorites') {
      tempAppointments = tempAppointments.filter(appointment => appointment.favorite);
    }

    this.filteredAppointments = tempAppointments;
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
    document.body.classList.remove('no-scroll');
    this.modalCtrl.dismiss();
  }

  // Toggle favorite status and save to localStorage
  toggleFavorite(training: any) {
    training.favorite = !training.favorite;
    const currentFavorites = this.getFavoriteTrainings();

    if (training.favorite) {
      currentFavorites.push(training.id);
    } else {
      const index = currentFavorites.indexOf(training.id);
      if (index > -1) {
        currentFavorites.splice(index, 1);
      }
    }

    this.saveFavoriteTrainings(currentFavorites);
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
    return 'כללי'; // Return null if no match found
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
    return 'כללי'; // Return null if no match found
  }

  // Function to add user to standby list
  addToStandbyList(appointmentId: number, customerId: string | null, email: string | null) {
    this.isStandbyLoading = true;
    this.isStandbySuccess = false; // Reset success state
  
    const url = 'https://k-studio.co.il/wp-json/standby-list/v1/add';
  
    const data = {
      appointment_id: appointmentId,
      customer_id: customerId,
      email: email
    };
  
    this.http.post(url, data).subscribe(response => {
      console.log('User added to standby list', response);      
      this.isStandbyLoading = false;
      this.isStandbySuccess = true;
  
      // Reset the button after a delay
      setTimeout(() => {
        this.isStandbySuccess = false;
      }, 2000);
  
    }, error => {
      console.error('Error adding user to standby list', error);
      this.isStandbyLoading = false;
      this.presentToast('שגיאה', 'danger');
    });
  }

  // Method to enroll the user in a training session
  enrollUser(appointment: Appointment) {
    // Initialize individual loading and success flags for the appointment
    appointment.isLoading = true;
    appointment.isSuccess = false; // Reset success state

    let serviceID = appointment.serviceID;
    let bookingStart = appointment.start_time;
    const formattedBookingStart = bookingStart.slice(0, 16); // Ensure ISO 8601 format if required

    let providerId = appointment.providerId;
    let customerID = this.authService.getCustomerID();
    let packageCustomerId = this.authService.getPackageCustomerId();

    // Calculate the current UTC offset in minutes
    const utcOffset = -(new Date().getTimezoneOffset());
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; // Retrieve user's timezone

    // Request body for WordPress API
    const enrollData = {
      type: 'appointment',
      serviceId: serviceID,
      providerId: providerId,
      locationId: null,
      notifyParticipants: 0,
      bookings: [
        {
          customerId: customerID,
          status: 'approved',
          duration: 3600, // Assuming the training is 1 hour (3600 seconds)
          persons: 1, // Assuming booking is for 1 person
          extras: [], // Assuming no extras, modify if needed
          customFields: {}, // Any custom fields if applicable
          utcOffset: utcOffset, // Set utcOffset here in minutes
          packageCustomerService: {
            packageCustomer: {
              id: packageCustomerId, // Package Customer ID, can be null if no package is being used
            },
          },
        },
      ],
      bookingStart: formattedBookingStart, // Starting time for the booking
      timeZone: timeZone // Add user's time zone to the request
    };

    // Check if Cordova is available and use the appropriate method
    this.platform.ready().then(() => {
      // Fallback to Angular HttpClient if Cordova is not available
      const body = JSON.stringify(enrollData);
      this.http.post('https://k-studio.co.il/wp-json/wn/v1/book-training', body, {
        headers: {
          'Content-Type': 'application/json',
        },
      }).subscribe(
        (response: any) => {
          

          // Handle the time slot unavailable or already booked cases
          if (response.data?.timeSlotUnavailable) {
            this.presentToast(response.message || 'The time slot is unavailable', 'danger');
          } else if (response.data?.customerAlreadyBooked) {
            this.presentToast(response.message || 'You have already booked this training', 'success');
          } else if (response.message) {
            // Enrollment was successful
            appointment.isSuccess = true;

            if (!appointment.current_participants) {
              appointment.current_participants = [];
            }

            // Update participants and booked count immediately after success
            appointment.booked += 1;
            const userFullName = `${this.authService.getUserFullName()}`;
            appointment.current_participants.push(userFullName);

            // Mark the user as booked so the button changes
            appointment.isUserBooked = true;
          } else {
            appointment.isSuccess = true; // Fallback to success if no error conditions
          }

          appointment.isLoading = false;

          // Reset the button after 2 seconds
          setTimeout(() => {
            appointment.isSuccess = false;
          }, 2000);
        },
        (error) => {
          console.error('Enrollment failed', JSON.stringify(error));
          appointment.isLoading = false;
          this.presentToast('שגיאה', 'danger');
        }
      );
    });
  }

}