import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ModalController, SegmentValue } from '@ionic/angular';
import { HttpClient, HttpParams } from '@angular/common/http';
import * as moment from 'moment';
import { Appointment } from '../Models/appointment';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { ToastController  } from '@ionic/angular';
import { Platform } from '@ionic/angular';
import { CalendarPopupComponent } from '../calendar-popup/calendar-popup.component';
import { MusicModalComponent } from '../music-modal/music-modal.component';
import { ProfileService } from '../services/profile.service';

@Component({
  selector: 'app-trainings',
  templateUrl: './trainings.page.html',
  styleUrls: ['./trainings.page.scss'],
})
export class TrainingsPage implements OnInit {
  
  //#region Variables
  @ViewChild('popup') popup!: ElementRef;

  //Users' Details
  customerID: string | null = ""; //Define customerID from userID | Constructor
  userId: string | null; //Define active user ID | Constructor
  userEmail: string | null = ""; //Define active user email | Constructor
  userFavLocation: string = ""; //Define what's the user's favorite location | Constructor
  userRole: string | null = ""; //Define user's role | Constructor
  isTrainer: boolean = false;
  

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
  currentDateRange: { start: Date; end: Date } | null = null;

  allAvailableDays: string[] = []; // Keeps all loaded days for the scrolling bar
  tabLoadingState: boolean = false;

  // Add scrolling days for each location
  private benYehudaDays: { formattedDate: any; date: string; day: string }[] = [];
  private shalomDays: { formattedDate: any; date: string; day: string }[] = [];

  private benYehudaAppointments: Appointment[] = [];
  private shalomAppointments: Appointment[] = [];
  private benYehudaTimeslots: Appointment[] = [];
  private shalomTimeslots: Appointment[] = [];

  private benYehudaLoaded: boolean = false;
  private shalomLoaded: boolean = false;

  private isShalomLoading: boolean = false;
  private isBenYehudaLoading: boolean = true;
  

  

  // Modify the loading getter
  get showSkeleton(): boolean {
    const isLoading = (this.selectedFilterAllFav === 'shalom' && this.isShalomLoading) || 
                      (this.selectedFilterAllFav === 'all' && this.isBenYehudaLoading);    
    return isLoading;
  }

//#endregion
  

  constructor( private platform: Platform,
              private toastController: ToastController,
              private modalCtrl: ModalController,
              private http: HttpClient,
              private authService: AuthService,
              private modalCalendar: ModalController,
              private profileService: ProfileService )
    {
      if (this.authService.getUserRole() === 'trainer') { this.isTrainer = true; }
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
    this.isLoading = true; // Show loading state initially
    try {
      if (this.userRole === 'inactive') {
        this.presentToast('לא ניתן לטעון אימונים, המשתמש לא פעיל', 'danger');
      } else if (this.userRole === 'trial-users') {
        this.presentToast('לא ניתן לטעון אימונים, משתמש ניסיון', 'danger');
      }

      // Wait for the favorite location to be fetched before proceeding
      const locationResponse = this.authService.getUserFavLocation();
      this.userFavLocation = locationResponse;

      // Set the initial tab based on userFavLocation
      if (this.userFavLocation === 'בן יהודה' || this.userFavLocation === 'הכל') {
          this.selectedFilterAllFav = 'all';
      } else if (this.userFavLocation === 'שלום עליכם') {
          this.selectedFilterAllFav = 'shalom';
      }

      await this.loadInitialData();
    } catch (error) {
        console.error('Error during initialization:', error);
        this.presentToast('שגיאה במשיכת נתונים', 'danger');
    } finally {
        this.isLoading = false;
    }
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

  //Extract 
  extractAvailableDays() {
    const hebrewDays = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];
    const today = new Date().toISOString().split('T')[0];

    const allDates = this.combinedList
      .filter(item => !isNaN(new Date(item.start_time).getTime()))
      .map(item => new Date(item.start_time).toISOString().split('T')[0]);

    const newDays = Array.from(new Set(allDates)).map(date => {
      const parsedDate = new Date(date);
      const dayOfWeek = hebrewDays[parsedDate.getDay()];
      const formattedDate = `${parsedDate.getDate()}.${parsedDate.getMonth() + 1}`;

      return { date, day: dayOfWeek, formattedDate };
    });

    newDays.sort((a, b) => {
      if (a.date === today) return -1;
      if (b.date === today) return 1;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Store days in appropriate array
    if (this.selectedFilterAllFav === 'all') {
      this.benYehudaDays = newDays;
    } else if (this.selectedFilterAllFav === 'shalom') {
      this.shalomDays = newDays;
    }

    // Set days based on current tab
    this.days = this.selectedFilterAllFav === 'all' ? this.benYehudaDays : this.shalomDays;
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
  private async loadInitialData() {
        // Set loading state before any data fetching
        if (this.selectedFilterAllFav === 'all') {
          this.isBenYehudaLoading = true;
          // Force change detection
          setTimeout(() => {}, 0);
        } else if (this.selectedFilterAllFav === 'shalom') {
          this.isShalomLoading = true;
        }
    try {
      const today = new Date();
      const maxEndDate = new Date(today);
      maxEndDate.setDate(today.getDate() + 20);
      let expiryDate = this.profileService.getSubscriptionExpiryDate();
      let endDate = maxEndDate;
      
      if (expiryDate)
      {
        const [day, month, year] = expiryDate.split("/").map(Number);
        var expiryDateFormatted = new Date(year, month - 1, day);
      
        // Function to find the closer date
        const closerDate = (endDate: any, expiryDateFormatted: any, today: any) => {
          return Math.abs(endDate - today) < Math.abs(expiryDateFormatted - today) ? endDate : expiryDateFormatted;
        };

        endDate = closerDate(endDate, expiryDateFormatted, today);
      }

      
      this.currentDateRange = {
          start: today,
          end: endDate
      };
  
      let firstToFetch = this.userFavLocation;
      
      if (this.userFavLocation == "הכל")
          firstToFetch = "בן יהודה";
  
      console.time("fetchTime");
      await this.fetchTrainingsForDateRange(today, endDate, firstToFetch);
      console.timeEnd("fetchTime");
    } catch (error) {
        console.error('Error loading initial data:', error);
        await this.presentToast('שגיאה בטעינת אימונים', 'danger');
    } finally {
        if (this.selectedFilterAllFav === 'all') {
          this.isBenYehudaLoading = false;
          // Force change detection
          setTimeout(() => {}, 0);
        } else if (this.selectedFilterAllFav === 'shalom') {
          this.isShalomLoading = false;
        }
    }
  }

  private async fetchTrainingsForDateRange(startDate: Date, endDate: Date, selectedLocation: string) {
    // If data is already loaded for this location, use the cached data
    if (selectedLocation === 'בן יהודה' && this.benYehudaLoaded) {
      this.combinedList = [...this.benYehudaAppointments];
      this.unfilteredList = [...this.combinedList];
      this.updateFilteredAppointments();
      return;
    }
    if (selectedLocation === 'שלום עליכם' && this.shalomLoaded) {
      this.combinedList = [...this.shalomAppointments];
      this.unfilteredList = [...this.combinedList];
      this.updateFilteredAppointments();
      return;
    }

    const userID = this.authService.getUserID();
    const formatDate = (date: Date): string => moment(date).format('YYYY-MM-DD');
    
    try {
      const startDateFormatted = formatDate(startDate);
      const endDateFormatted = formatDate(endDate);
      console.log("endDateFormatted:", endDateFormatted)
      const encodedLocation = encodeURIComponent(selectedLocation);
      
      const url = `https://k-studio.co.il/wp-json/custom-api/v1/get-trainings?startDate=${startDateFormatted}&endDate=${endDateFormatted}&userID=${userID}&location=${encodedLocation}`;
      
      const response = await firstValueFrom(this.http.get<any[]>(url));

      // Update available days
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayStr = formatDate(new Date(d));
        if (!this.allAvailableDays.includes(dayStr)) {
          this.allAvailableDays.push(dayStr);
        }
      }

      // Process the response and store in appropriate list
      await this.combineTimeslotsAndAppointments(response);
      
      if (selectedLocation === 'בן יהודה') {
        this.benYehudaAppointments = [...this.combinedList];
        this.benYehudaLoaded = true;
      } else if (selectedLocation === 'שלום עליכם') {
        this.shalomAppointments = [...this.combinedList];
        this.shalomLoaded = true;
      }
      
    } catch (error) {
      console.error('Error fetching trainings:', error);
      throw error;
    }
  }

  async combineTimeslotsAndAppointments(response: any[]) {
    try {
        // Split the response into timeslots and appointments
        const currentTimeslots = response.filter(item => item.type === 'timeslot');
        const currentAppointments = response.filter(item => item.type === 'appointment');
        
        // Determine which location we're processing
        const isProcessingBenYehuda = this.selectedFilterAllFav === 'all';
        
        // Store in appropriate arrays
        if (isProcessingBenYehuda) {
            this.benYehudaTimeslots = currentTimeslots;
            this.benYehudaAppointments = currentAppointments;
        } else {
            this.shalomTimeslots = currentTimeslots;
            this.shalomAppointments = currentAppointments;
        }
        
        // Combine the lists based on current selected location
        this.combinedList = [
            ...(isProcessingBenYehuda ? this.benYehudaTimeslots : this.shalomTimeslots),
            ...(isProcessingBenYehuda ? this.benYehudaAppointments : this.shalomAppointments)
        ];
        
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
        //console.log("filtered", this.filteredAppointments)
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
    const selectedTab: 'all' | 'shalom' | 'favorites' = event.detail.value;
    //console.log("selectedTab:", this.selectedFilterAllFav)
    // Clear current display while switching
    this.combinedList = [];
    this.filteredAppointments = [];
    this.days = [];
    
    if (selectedTab === 'favorites') {
      this.tabLoadingState = true;
      try {
        const allAppointments = [
          ...this.benYehudaAppointments,
          ...this.shalomAppointments
        ];
        const allTimeslots = [
          ...this.benYehudaTimeslots,
          ...this.shalomTimeslots
        ];
        this.combinedList = [...allTimeslots, ...allAppointments];
        this.unfilteredList = [...this.combinedList];
        this.updateFilteredAppointments();
      } finally {
        this.tabLoadingState = false;
      }
      return;
    }
  
    const locationMap: { [key: string]: string } = {
      all: 'בן יהודה',
      shalom: 'שלום עליכם'
    };
  
    const selectedLocation = locationMap[selectedTab];
    const isDataLoaded = selectedTab === 'all' ? this.benYehudaLoaded : this.shalomLoaded;
  
    // Set loading state before any data fetching
    if (selectedTab === 'all') {
      this.isBenYehudaLoading = true;
      // Force change detection
      setTimeout(() => {}, 0);
    } else if (selectedTab === 'shalom') {
      this.isShalomLoading = true;
    }
  
    try {
      if (selectedTab === 'all') {
        this.days = this.benYehudaDays;
        if (this.benYehudaLoaded) {
          this.combinedList = [...this.benYehudaTimeslots, ...this.benYehudaAppointments];
          this.unfilteredList = [...this.combinedList];
          this.selectedDay = this.benYehudaDays.length > 0 ? this.benYehudaDays[0].date : '';
          this.updateFilteredAppointments();
        }
      } else if (selectedTab === 'shalom') {
        this.days = this.shalomDays;
        if (this.shalomLoaded) {
          this.combinedList = [...this.shalomTimeslots, ...this.shalomAppointments];
          this.unfilteredList = [...this.combinedList];
          this.selectedDay = this.shalomDays.length > 0 ? this.shalomDays[0].date : '';
          //console.log("combined List:", this.combinedList);
          this.updateFilteredAppointments();
        }
      }
  
      if (!isDataLoaded) {
        const today = new Date();
        const maxEndDate = new Date(today);
        maxEndDate.setDate(today.getDate() + 20);
        let expiryDate = this.profileService.getSubscriptionExpiryDate();
        let endDate = maxEndDate;
        
        if (expiryDate)
        {
          const [day, month, year] = expiryDate.split("/").map(Number);
          var expiryDateFormatted = new Date(year, month - 1, day);
        
          // Function to find the closer date
          const closerDate = (endDate: any, expiryDateFormatted: any, today: any) => {
            return Math.abs(endDate - today) < Math.abs(expiryDateFormatted - today) ? endDate : expiryDateFormatted;
          };
  
          endDate = closerDate(endDate, expiryDateFormatted, today);
        }
        
        await this.fetchTrainingsForDateRange(today, endDate, selectedLocation);
      }
    } finally {
      // Reset loading states after all operations
      if (selectedTab === 'all') {
        this.isBenYehudaLoading = false;
      } else {
        this.isShalomLoading = false;
      }
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
    //console.log("Selected type:", this.selectedType);  // Check if the correct type is being selected
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
  addToStandbyList(appointment: Appointment, customerId: string | null, email: string | null) {
    appointment.isStandbyLoading = true;
    appointment.isStandbySuccess = false; // Reset success state
  
    const url = 'https://k-studio.co.il/wp-json/standby-list/v1/add';
  
    const data = {
      appointment_id: appointment?.id,
      customer_id: customerId,
      email: email
    };
  
    this.http.post(url, data).subscribe(response => {
      //console.log('User added to standby list', response);      
      appointment.isStandbyLoading = false;
      appointment.isStandbySuccess = true;
  
  
    }, error => {
      console.error('Error adding user to standby list', error);
      appointment.isStandbyLoading = false;
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
    appointment.isLoading = true;
    appointment.isSuccess = false; // Reset success state
    appointment.isError = false; // Add an error state
    
    let serviceID = appointment.serviceID;
    let bookingStart = appointment.start_time;
    const formattedBookingStart = bookingStart.slice(0, 16); // Ensure ISO 8601 format if required
    
    let providerId = appointment.providerId;
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
    //console.log("enrollData", enrollData)
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


  async openMusicModal(training: any) {
    const modal = await this.modalCtrl.create({
      component: MusicModalComponent,
      componentProps: { training }
    });

    modal.onDidDismiss().then((res) => {
      if (res.data) {
        //console.log('Selected Songs:', res.data);
        // Here, you can save the selected songs to the database or display them
      }
    });

    return await modal.present();
  }

}