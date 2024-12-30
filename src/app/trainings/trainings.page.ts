import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GestureController, ModalController, SegmentValue } from '@ionic/angular';
import { HttpClient, HttpParams } from '@angular/common/http';
import * as moment from 'moment';
import { Appointment } from '../Models/appointment';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { AmeliaService } from '../services/amelia-api.service';
import { ToastController  } from '@ionic/angular';
import { HTTP } from '@awesome-cordova-plugins/http/ngx';
import { Platform } from '@ionic/angular';
import { CalendarPopupComponent } from '../calendar-popup/calendar-popup.component';


@Component({
  selector: 'app-trainings',
  templateUrl: './trainings.page.html',
  styleUrls: ['./trainings.page.scss'],
})
export class TrainingsPage implements AfterViewInit {
  
  //#region Variables
  @ViewChild('popup') popup!: ElementRef;

  //Variables which defines in constructor from other services
  customerID: string | null = ""; //Define customerID from userID | Constructor
  userId: string | null; //Define active user ID | Constructor
  userEmail: string | null = ""; //Define active user email | Constructor
  userFavLocation: string | null = ""; //Define what's the user's favorite location | Constructor
  userRole: string | null = ""; //Define user's role | Constructor

  //Participants popup variables
  showingParticipants = false; //Popup to show participants
  isPopupVisible = false; // Participants Popup
  activeAppointment: Appointment | null = null; // Track the active appointment for popup

  //List Filtetr Variables
  selectedFilterAllFav: string = 'all'; //Default filter, shows "all" tab  
  selectedType: string = '';  // Default: no type filter
  availabilityFilter: string = 'all';  // Default: show all
  showDropdown: boolean = false;  // Controls the visibility of the filter dropdown
  availableTypes: string[] = [];  // Array of available training types
  
  filteredAppointments: Appointment[] = [];
  
  //Fetching List Variables
  bookedAppointments: Appointment[] = []; //Appointments List
  combinedList: Appointment[] = []; //Final list of timeslots and appointments
  days: { formattedDate: any; date: string; day: string }[] = [];
  selectedDay: string | undefined;  // Default selected day
  knownTrainingTypes: string[] = [ 'פילאטיס', 'יוגה', 'אימון כוח', 'Parallel 15', 'Spinning', 'TRX', 'Booty&ABS', 'All In', 'HiiT', 'POWER', '' ]; // Array of known training types
  availableTimeslots: Appointment[] = []; //Timeslots list
  unfilteredList: Appointment[] = [];
  trainingsByDay: any;

  //Enrolling Variables
  isLoading: boolean = true; // Set loading to true initially
  isStandbyLoading: boolean = false;
  isStandbySuccess: boolean = false;
  isEnrollLoading: boolean = false;
  isEnrollSuccess: boolean = false;

  //Toast alerts variables
  showToast: boolean = false;
  toastMessage: string = '';
  toastColor: string = 'success';
  errorMessage: string = '';
 
  // New variables for lazy loading
  private currentDateRange: { start: Date; end: Date } | null = null;
  userServiceID: any;

  loadedStartDate: Date = new Date(); // Defaults to the current date
  loadedEndDate: Date = new Date();   // Defaults to the current date

  allAvailableDays: string[] = []; // Keeps all loaded days for the scrolling bar
  tabLoadingState: boolean = false;

  get showSkeleton(): boolean {
    return this.isLoading || this.tabLoadingState
  }

//#endregion
  
  constructor(private platform: Platform, private toastController: ToastController, private ameliaService: AmeliaService, private gestureCtrl: GestureController, private modalCtrl: ModalController, private http: HttpClient, private authService: AuthService, private httpA: HTTP,    private modalCalendar: ModalController)
    {
    this.userId = this.authService.getUserID();
    this.userEmail = this.authService.getUserEmail();
    this.customerID = this.authService.getCustomerID();
    this.userFavLocation = this.authService.getUserFavLocation();    

    this.authService.fetchPackageCustomerId(this.customerID).subscribe({
      error: (error) => {
        console.error("Error fetching package id", error);
      }
    })

  }

  //OnInit function - Checks: userLocation, userRole, trainingsTitles, starting Fetching Trainings
  async ngOnInit() {
    this.authService.fetchUserFavLocation().subscribe({
      next: (response) => {
        this.userFavLocation = response.favorite_location;
      },
      error: (error) => {
        console.error("Error fetching user fav location", error);
      }
    })

    if (this.userFavLocation === 'בן יהודה' || this.userFavLocation === 'הכל') {
      this.selectedFilterAllFav = 'all';
    } else if (this.userFavLocation === 'שלום עליכם') {
      this.selectedFilterAllFav = 'shalom';
    } else {
      this.selectedFilterAllFav = 'favorites';
    }

    this.authService.fetchUserRole().subscribe(data => {
      this.authService.storeUserRole(data.roles[0]);
      this.userRole = (data.roles[0]);
    });

    if (this.authService.getUserRole() == 'inactive') {
      this.errorMessage = 'לא ניתן לטעון אימונים,  המשתמש לא פעיל';
      this.presentToast(this.errorMessage, 'danger');
    }
    else if (this.authService.getUserRole() == 'trial-users') {
      this.errorMessage = 'לא ניתן לטעון אימונים, משתמש ניסיון';
      this.presentToast(this.errorMessage, 'danger');
    }

    // Initialize with current week's data
    await this.loadInitialData();
    const today = new Date();
    const endDate = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000); // Next 7 days
  
    this.loadedStartDate = today;
    this.loadedEndDate = endDate;
  
  }

  //afterViewInit function - Defines the modal controller
  ngAfterViewInit() {

  }

  //Define the toast popup messages controller
  async presentToast (message: string, color: string){
    const toast = await this.toastController.create({
      message: message,
      duration: 3000, 
      color: color,
      position: 'bottom',
    });
    await toast.present();
  }
  
  //Format date time format to israel format
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

  // New method to load initial data
  // Improved loadInitialData with better error handling
  private async loadInitialData() {
    this.isLoading = true;
    try {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 20);

        this.currentDateRange = {
            start: today,
            end: endDate
        };

        // Set a default location or determine dynamically if needed
        const defaultLocation = 'בן יהודה'; // Replace with dynamic logic if applicable

        await this.fetchTrainingsForDateRange(today, endDate, defaultLocation);
    } catch (error) {
        console.error('Error loading initial data:', error);
        await this.presentToast('Error loading trainings', 'danger');
    } finally {
        this.isLoading = false;
    }
  }

  private async fetchTrainingsForDateRange(startDate: Date, endDate: Date, selectedLocation: string) {
    const userID = this.authService.getUserID();
    const formatDate = (date: Date): string => moment(date).format('YYYY-MM-DD');

    const startDateFormatted = formatDate(startDate);
    const endDateFormatted = formatDate(endDate);
    const encodedLocation = encodeURIComponent(selectedLocation); // Encode the location
    
    try {
        const url = `https://k-studio.co.il/wp-json/custom-api/v1/get-trainings?startDate=${startDateFormatted}&endDate=${endDateFormatted}&userID=${userID}&location=${encodedLocation}`;
        
        const response = await firstValueFrom(this.http.get<any[]>(url));

        // Add new days to allAvailableDays
        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayStr = formatDate(new Date(d));
            if (!this.allAvailableDays.includes(dayStr)) {
                this.allAvailableDays.push(dayStr);
            }
        }
        // Process the response
        await this.combineTimeslotsAndAppointments(response);
    } catch (error) {
        console.error('Error fetching trainings:', error);
    }
  }

  async combineTimeslotsAndAppointments(response: any[]) {
    try {
        // Split the response into timeslots and appointments
        this.availableTimeslots = response.filter(item => item.type === 'timeslot');
        this.bookedAppointments = response.filter(item => item.type === 'appointment');
        
        // Combine the lists
        this.combinedList = [...this.availableTimeslots, ...this.bookedAppointments];
        
        // Sort the combined list by start_time
        this.combinedList.sort((a, b) => {
            const timeA = new Date(a.start_time).getTime();
            const timeB = new Date(b.start_time).getTime();
            return timeA - timeB;
        });

        // Create a fresh copy of the sorted list for unfiltered
        this.unfilteredList = [...this.combinedList];

        // Extract available days for filtering
        this.extractAvailableDays();

        // Get the logged-in customer's full name
        const loggedInCustomerFN = this.authService.getUserFullName();

        const promises = this.combinedList.map(async (training) => {
            if (!training.start_time || isNaN(Date.parse(training.start_time))) {
                console.error(`Invalid start_time for training:`, training);
                return;
            }

            if (training.booked >= training.total_participants && training.id !== undefined) {
                training.isStandbyEnrolled = await this.checkStandbyEnrollment(this.userEmail!, training.id);
            } else {
                training.isStandbyEnrolled = false;
            }


            if (Array.isArray(training.current_participants)) {
              training.isUserBooked = training.current_participants.some(
                  (booking: any) => booking === loggedInCustomerFN
              );
          } else {
              console.warn(`current_participants is not an array for training:`, training);
              training.isUserBooked = false;
          }
        });

        await Promise.all(promises);

        // Make sure filteredAppointments is also sorted
        this.filteredAppointments = [...this.combinedList];

        // Force a change detection cycle by creating a new reference
        this.filteredAppointments = [...this.filteredAppointments];
        
        // Update filtered appointments
        this.updateFilteredAppointments();

    } catch (error) {
        console.error('Error combining timeslots and appointments:', error);
    }
  }

  // Modified onDayChange to properly handle async operations
  onDayChange(selectedDay: SegmentValue) {
    this.selectedDay = String(selectedDay || ''); // Convert to a string and handle undefined
    this.updateFilteredAppointments(); // Update appointments based on the selected day
  }

  // Modify the filterFavAll method
  async filterFavAll(event: any) {
    this.tabLoadingState = true; // Show loading state
    this.filteredAppointments = []; // Clear current appointments while loading
    
    const selectedTab: 'all' | 'shalom' | 'favorites' = event.detail.value;
    const locationMap: { [key: string]: string } = {
      all: 'בן יהודה',
      shalom: 'שלום עליכם',
      favorites: 'favorites',
    };

    const selectedLocation = locationMap[selectedTab] || 'בן יהודה';
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30);

    try {
      await this.fetchTrainingsForDateRange(startDate, endDate, selectedLocation);
    } finally {
      this.tabLoadingState = false; // Hide loading state when done
    }
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
        tempAppointments = tempAppointments.filter(appointment =>
            moment(appointment.start_time).format('YYYY-MM-DD') === this.selectedDay
        );
    }
  
    if (this.availabilityFilter === 'available') {
        tempAppointments = tempAppointments.filter(appointment => 
            appointment.booked < appointment.total_participants
        );
    }
  
    if (this.selectedType) {
        tempAppointments = tempAppointments.filter(appointment => 
            appointment.title.name === this.selectedType
        );
    }
  
    if (this.selectedFilterAllFav === 'favorites') {
        tempAppointments = tempAppointments.filter(appointment => 
            appointment.favorite
        );
    }
  
    // Ensure the filtered list maintains the sort order
    tempAppointments.sort((a, b) => {
        const timeA = new Date(a.start_time).getTime();
        const timeB = new Date(b.start_time).getTime();
        return timeA - timeB;
    });
  
    // Create a new reference to trigger change detection
    this.filteredAppointments = [...tempAppointments];
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
  
  
    }, error => {
      console.error('Error adding user to standby list', error);
      this.isStandbyLoading = false;
      this.presentToast('שגיאה', 'danger');
    });
  }

  checkStandbyEnrollment(email: string, trainingId: number): Promise<boolean> {
    const url = 'https://k-studio.co.il/wp-json/standby-list/v1/check';
    const params = new HttpParams().set('email', email).set('trainingId', trainingId.toString());
  
    return firstValueFrom(
      this.http.get<{ isEnrolled: boolean }>(url, { params })
    )
      .then((response) => response.isEnrolled)
      .catch((error) => {
        console.error('Error checking standby enrollment', error);
        return false;
      });
  }

  // Method to enroll the user in a training session
  enrollUser(appointment: Appointment) {
    console.log("appointment requested", appointment)
    appointment.isLoading = true;
    appointment.isSuccess = false; // Reset success state
    appointment.isError = false; // Add an error state
    
    let serviceID = appointment.serviceID;
    let bookingStart = appointment.start_time;
    const formattedBookingStart = bookingStart.slice(0, 16); // Ensure ISO 8601 format if required
    
    let providerId = appointment.providerId;
    console.log("providerID", providerId)
    let customerID = this.authService.getCustomerID();
    let packageCustomerId = this.authService.getPackageCustomerId();
    
    const utcOffset = -(new Date().getTimezoneOffset());
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
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
          duration: 3600,
          persons: 1,
          extras: [],
          customFields: {},
          utcOffset: utcOffset,
          packageCustomerService: {
            packageCustomer: {
              id: packageCustomerId,
            },
          },
        },
      ],
      bookingStart: formattedBookingStart,
      timeZone: timeZone,
    };
    console.log("enrollData", enrollData)
    this.platform.ready().then(() => {
      const body = JSON.stringify(enrollData);
      this.http.post('https://k-studio.co.il/wp-json/wn/v1/bookTrainingNEW', body, {
        headers: {
          'Content-Type': 'application/json',
        },
      }).subscribe(
        (response: any) => {
          // Handle null responses
          if (response.message === null || response.data === null) {
            this.presentToast('שגיאה: לא נמצאה חבילה זמינה', 'danger');
            appointment.isError = true; // Mark error state
            appointment.isLoading = false;
            return;
          }

          // Handle specific error cases
          if (response.data?.timeSlotUnavailable) {
            this.presentToast(response.message || 'The time slot is unavailable', 'danger');
          } else if (response.data?.customerAlreadyBooked) {
            this.presentToast(response.message || 'You have already booked this training', 'success');
          } else if (response.message) {
            appointment.isSuccess = true;
            if (!appointment.current_participants) {
              appointment.current_participants = [];
            }
            appointment.booked += 1;
            const userFullName = `${this.authService.getUserFullName()}`;
            appointment.current_participants.push(userFullName);
            appointment.isUserBooked = true;
          } else {
            appointment.isSuccess = true;
          }

          appointment.isLoading = false;

          setTimeout(() => {
            appointment.isSuccess = false;
          }, 2000);
        },
        (error) => {
          console.error('Enrollment failed', JSON.stringify(error));
          appointment.isLoading = false;

          // Check for specific error related to packageCustomerId
          if (error.error && error.error.includes('"packageCustomerId" is required for booking')) {
            this.presentToast('לא נמצאה חבילה זמינה', 'danger');
          } else {
            this.presentToast('שגיאה', 'danger');
          }
          appointment.isError = true; // Mark error state
        }
      );
    });
  }
  
  async openCalendarPopup() {

    let branch = "";
    if (this.selectedFilterAllFav === 'all'){
      branch = "main";
    } else if (this.selectedFilterAllFav === 'shalom') {
      branch = "second";
    }

    console.log("branch:", branch);
    
    const modalCalendar = await this.modalCalendar.create({
      component: CalendarPopupComponent,
      componentProps: {
        branch: branch
      },
    });
    await modalCalendar.present();
  }

  getWeeklyTrainings() {
    // Replace with real API or service to fetch weekly training data
    return [];
  }

}