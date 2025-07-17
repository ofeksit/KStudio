import { AfterViewInit, Component, ElementRef, HostListener, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations'
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
import { AppointmentsCacheService, CachedApptSummary, ScheduleItem } from '../services/appointments-cache.service';


interface TrainingCard {
  id: number;
  type: string;
  appointmentId: number;
  providerId: number;
  start_time: string;
  title: { name: string };
  booked: number;
  total_participants: number;
  current_participants: string[];
  isUserBooked: boolean;
  isTrainer: boolean;
  favorite?: boolean;
  isStandbyEnrolled?: boolean;
  isStandbyLoading?: boolean;
  isStandbySuccess?: boolean;
  isError?: boolean;
  isLoading?: boolean;
  isSuccess?: boolean;
  songsCount: number;
  participantsLoaded?: boolean;
}


@Component({
  selector: 'app-trainings',
  templateUrl: './trainings.page.html',
  styleUrls: ['./trainings.page.scss'],
  animations: [
    trigger('buttonState', [
      state('open', style({
        transform: 'rotate(180deg)',
        // Other "on" styles
      })),
      state('closed', style({
        transform: 'rotate(0deg)',
        // Return to original styles
      })),
      transition('closed <=> open', animate('200ms ease-in-out'))
    ]),
    trigger('dropdownState', [
      state('open', style({
        opacity: 1,
        transform: 'translateY(0)',
        height: '*'
      })),
      state('closed', style({
        opacity: 0,
        transform: 'translateY(-10px)',
        height: '0'
      })),
      transition('closed => open', animate('200ms ease-out')),
      transition('open => closed', animate('200ms ease-in'))
    ])
  ]
})
export class TrainingsPage implements AfterViewInit {
  
  private readonly USE_APPT_CACHE = true;  // flip to false אם בעיה
  cachedAppointments: CachedApptSummary[] = [];
  cachedByDate: Record<string, CachedApptSummary[]> = {};
  scheduleItems: ScheduleItem[] = [];
  scheduleByDate: Record<string, ScheduleItem[]> = {};


  //#region Variables
  @ViewChild('popup') popup!: ElementRef;
  @ViewChildren('segmentButton') segmentButtons!: QueryList<ElementRef>;
  @ViewChild('segmentScroll') segmentScroll!: ElementRef;
  @ViewChild('indicator') indicator!: ElementRef;

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
  activeAppointment: any | null = null; // Track the active appointment for popup

  //List Filtetr Variables
  selectedFilterAllFav: string = 'all'; //Default filter, shows "all" tab  
  selectedType: string = '';  // Default: no type filter
  availabilityFilter: string = 'all';  // Default: show all
  showDropdown: boolean = false;  // Controls the visibility of the filter dropdown
  availableTypes: string[] = [];  // Array of available training types
  
  appointments: any[] = [];
  filteredAppointments: any[] = [];

  
  //Fetching List Variables
  bookedAppointments: Appointment[] = []; //Appointments List
  combinedList: Appointment[] = []; //Final list of timeslots and appointments
  days: { formattedDate: any; date: string; day: string }[] = [];
  selectedDay: string | undefined;  // Default selected day
  knownTrainingTypes: string[] = [ 'פילאטיס', 'יוגה', 'אימון כוח', 'Parallel 15', 'Spinning', 'TRX', 'Booty&ABS', 'All In', 'HiiT', 'POWER', '' ]; // Array of known training types
  availableTimeslots: Appointment[] = []; //Timeslots list
  unfilteredList: Appointment[] = [];
  trainingsByDay: any;

  private readonly PROVIDER_BEN_YEHUDA = 169; // בן יהודה
  private readonly PROVIDER_HAYARKON   = 643; // הירקון

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
  indicatorPosition = 357;
  indicatorWidth = 20;


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
  isAnimating: any;
  renderer: any;
  

  

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
              private profileService: ProfileService,
              private apptCache: AppointmentsCacheService
             )
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
  

  ngAfterViewInit() {
    setTimeout(() => {
      this.updateIndicatorPosition();
    }, 100); // Small delay for rendering
  }

async ionViewWillEnter() {
  console.log('[TrainingsPage] Auth', this.authService.getUserID(), this.authService.getCustomerID(), this.authService.getUserRole());

  // Set initial tab based on user's favorite location
  if (this.userFavLocation === 'בן יהודה' || this.userFavLocation === 'הכל') {
    this.selectedFilterAllFav = 'all';
  } else if (this.userFavLocation === 'הירקון') {
    this.selectedFilterAllFav = 'shalom';
  }

  if (this.USE_APPT_CACHE) {
    const usedCache = await this.loadScheduleFromCacheIfPossible();
    if (usedCache) {
      console.log('[TrainingsPage] schedule loaded from cache; skipping network.');
      // Apply initial filters after cache load
      this.filterFavAll(this.selectedFilterAllFav);
      return;
    }
  }

  // Fallback to legacy loading
  console.warn('[TrainingsPage] Cache empty or disabled → fallback legacy load');
  await this.loadInitialData();
  
  // Subscribe to cache updates
  if (this.USE_APPT_CACHE) {
    this.apptCache.schedule$.subscribe(list => {
      if (!list?.length) return;
      this.scheduleItems = list;
      this.appointments = this.mapScheduleToTrainingCards(list);
      this.indexScheduleByDate();
      this.applyScheduleToUI();
      // Reapply current filters when cache updates
      this.filterFavAll(this.selectedFilterAllFav);
    });
  }
}

private async loadScheduleFromCacheIfPossible(): Promise<boolean> {
  try {
    const items = await this.apptCache.ensureScheduleLoaded(20);
    if (!items || !items.length) {
      console.log('[TrainingsPage] Cache is empty');
      return false;
    }

    console.log('[TrainingsPage] Loading from cache:', items.length, 'items');
    
    // Map cache data to UI format
    this.scheduleItems = items;
    this.appointments = this.mapScheduleToTrainingCards(items);
    this.combinedList = [...this.appointments];
    this.unfilteredList = [...this.appointments];
    
    // Index data by date
    this.indexScheduleByDate();
    
    // Extract available days for the date picker
    this.extractAvailableDaysFromCache();
    
    // Apply to UI
    this.applyScheduleToUI();
    
    // Turn off loading states
    this.isBenYehudaLoading = false;
    this.isShalomLoading = false;
    this.isLoading = false;
    
    // Apply current filters
    this.updateFilteredAppointments();
    
    return true;
  } catch (error) {
    console.error('[TrainingsPage] Cache load failed:', error);
    return false;
  }
}

private extractAvailableDaysFromCache() {
  const hebrewDays = ['א\'', 'ב\'', 'ג\'', 'ד\'', 'ה\'', 'ו\'', 'ש\''];
  const today = new Date().toISOString().split('T')[0];

  // Determine which provider we're filtering for
  let providerId: number | null = null;
  if (this.selectedFilterAllFav === 'all') {
    providerId = this.PROVIDER_BEN_YEHUDA;
  } else if (this.selectedFilterAllFav === 'shalom') {
    providerId = this.PROVIDER_HAYARKON;
  }

  // Filter schedule items by provider if needed
  let filteredItems = this.scheduleItems;
  if (providerId !== null) {
    filteredItems = this.scheduleItems.filter(item => item.providerId === providerId);
  }

  // Get unique dates from filtered items
  const uniqueDates = Array.from(new Set(
    filteredItems.map(item => item.date).filter(date => date)
  ));

  const newDays = uniqueDates.map(date => {
    const parsedDate = new Date(date);
    const dayOfWeek = hebrewDays[parsedDate.getDay()];
    const formattedDate = `${parsedDate.getDate()}.${parsedDate.getMonth() + 1}`;

    return { date, day: dayOfWeek, formattedDate };
  });

  // Sort days with today first
  newDays.sort((a, b) => {
    if (a.date === today) return -1;
    if (b.date === today) return 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  this.days = newDays;
  this.selectedDay = this.days.length > 0 ? this.days[0].date : '';
}

private mapScheduleToTrainingCards(items: ScheduleItem[]): TrainingCard[] {
  const favoriteTrainings = this.getFavoriteTrainings();
  
  return items.map(s => ({
    id: s.appointmentId,
    type: 'training',
    appointmentId: s.appointmentId,
    providerId: s.providerId,
    start_time: s.startTime,
    title: { name: s.serviceName },
    booked: s.booked ?? 0,
    total_participants: s.capacity ?? (s.booked ?? 0),
    current_participants: [],
    isUserBooked: !!s.isUserBooked,
    isTrainer: !!s.isTrainer,
    favorite: favoriteTrainings.includes(s.appointmentId), // This now properly checks localStorage
    songsCount: 0,
  }));
}


private isApptFavorite(s: ScheduleItem): boolean {
  // אם אתה שומר favorites לפי provider או serviceName,
  // החלף בלוגיקה שלך. לבינתיים false:
  return false;
}


private indexScheduleByDate() {
  const map: Record<string, ScheduleItem[]> = {};
  for (const item of this.scheduleItems) {
    if (!item.date) continue;
    (map[item.date] ||= []).push(item);
  }
  
  // Sort within each day by startTime
  for (const date in map) {
    map[date].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
  
  this.scheduleByDate = map;
}

private applyScheduleToUI() {
  if (!this.days?.length) return;
  
  for (const day of this.days) {
    const date = day.date;
    const daySchedule = this.scheduleByDate[date] || [];
    
    // Filter by current tab if needed
    let filteredSchedule = daySchedule;
    if (this.selectedFilterAllFav === 'all') {
      filteredSchedule = daySchedule.filter(item => item.providerId === this.PROVIDER_BEN_YEHUDA); // Changed from providerId to providerId
    } else if (this.selectedFilterAllFav === 'shalom') {
      filteredSchedule = daySchedule.filter(item => item.providerId === this.PROVIDER_HAYARKON); // Changed from providerId to providerId
    }
    
    (day as any).scheduleItems = filteredSchedule;
  }
}

  //OnInit function - Checks: userLocation, userRole, trainingsTitles, starting Fetching Trainings
async ngOnInit() {    
  this.isLoading = true;
  try {
    if (this.userRole === 'inactive') {
      this.presentToast('לא ניתן לטעון אימונים, המשתמש לא פעיל', 'danger');
      return;
    } else if (this.userRole === 'trial-users') {
      this.presentToast('לא ניתן לטעון אימונים, משתמש ניסיון', 'danger');
      return;
    }

    // Wait for the favorite location to be fetched before proceeding
    const locationResponse = this.authService.getUserFavLocation();
    this.userFavLocation = locationResponse;

    // Set the initial tab based on userFavLocation
    if (this.userFavLocation === 'בן יהודה' || this.userFavLocation === 'הכל') {
        this.selectedFilterAllFav = 'all';
    } else if (this.userFavLocation === 'הירקון') {
        this.selectedFilterAllFav = 'shalom';
    }

    // Remove the conflicting cache logic from here
    // The cache loading will be handled in ionViewWillEnter
    
  } catch (error) {
      console.error('Error during initialization:', error);
      this.presentToast('שגיאה במשיכת נתונים', 'danger');
  } finally {
      this.isLoading = false;
  }
}

async openTrainerAppointment(appt: CachedApptSummary) {
  try {
    const participants = await this.apptCache.loadParticipants(appt.appointmentId);
    this.presentParticipantsModal(appt, participants);
  } catch (err) {
    console.error('Failed to load participants', err);
    // אפשר Toast
  }
}

  presentParticipantsModal(appt: CachedApptSummary, participants: any[]): void {
    console.log('Participants for appt', appt.appointmentId, participants);
  // TODO: open modal with list
  }


  /**
 * Map cached appointments (user+trainer) into existing day/time structure used
 * by the trainings page. We DON’T remove your legacy timeslot logic; רק מוסיפים
 * אינדיקציות על כמות נרשמים/האם זה אימון שאני מדריך.
 */
  private mapCacheIntoDayModel() {
    if (!this.cachedAppointments?.length) {
      this.cachedByDate = {};
      return;
    }

    const byDate: Record<string, CachedApptSummary[]> = {};
    for (const a of this.cachedAppointments) {
      (byDate[a.date] ||= []).push(a);
    }
    this.cachedByDate = byDate;

    // אם תרצה להשפיע על days קיימים / UI – כאן תעשה מיזוג לפי הצורך.
    // בינתיים רק שמור את המפה; הקוד הקיים שלך ממשיך לעבוד.
  }

  hasTrainerAppts(date: string): boolean {
    const list = this.cachedByDate[date];
    return !!(list && list.some(a => a.isTrainer));
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
    if (selectedLocation === 'הירקון' && this.shalomLoaded) {
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
      } else if (selectedLocation === 'הירקון') {
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
  const dayStr = String(selectedDay || '');
  this.selectedDay = dayStr;
  this.logDayChange(dayStr);
  
  this.updateIndicatorPosition();
  this.updateFilteredAppointments();
  
  // Additional debug
  console.log('[DEBUG] Appointments after day change:', 
    this.filteredAppointments.filter(a => 
      moment(a.start_time).format('YYYY-MM-DD') === dayStr
    ).map(a => ({
      id: a.id,
      title: a.title.name,
      time: a.start_time,
      provider: a.providerId === this.PROVIDER_BEN_YEHUDA ? 'Ben Yehuda' : 'Hayarkon'
    }))
  );
}

private updateIndicatorPosition() {
  setTimeout(() => {
    if (!this.segmentButtons || this.segmentButtons.length === 0) {
      return;
    }

    const index = this.days.findIndex(s => s.date === this.selectedDay);
    
    if (index !== -1) {
      const button = this.segmentButtons.toArray()[index]?.nativeElement;
      
      if (button && this.segmentScroll?.nativeElement) {
        const rect = button.getBoundingClientRect();
        const scrollRect = this.segmentScroll.nativeElement.getBoundingClientRect();
        
        // Calculate center position of the button
        this.indicatorPosition = (rect.left - scrollRect.left) + (button.offsetWidth / 2) - (this.indicatorWidth / 2);
        
        // Add this property to your component
        this.renderer.setStyle(this.indicator.nativeElement, 'transform', `translateX(${this.indicatorPosition}px)`);
      }
    }
  }, 50);
}

  getIndicatorPosition(): number {
    return this.indicatorPosition;
  }

  private logTabChange(selectedTab: string, reason: string = '') {
  console.groupCollapsed(`[DEBUG] Tab changed to ${selectedTab} ${reason}`);
  console.log('Current tab:', this.selectedFilterAllFav);
  console.log('Previous tab:', this.previousTab);
  console.log('Days count:', this.days.length);
  console.log('Selected day:', this.selectedDay);
  console.log('Schedule items count:', this.scheduleItems.length);
  console.log('Combined list count:', this.combinedList.length);
  console.log('Filtered appointments count:', this.filteredAppointments.length);
  console.groupEnd();
  
  // Track previous tab for debugging
  this.previousTab = selectedTab;
}

private logDayChange(selectedDay: string) {
  console.groupCollapsed(`[DEBUG] Day changed to ${selectedDay}`);
  console.log('Current tab:', this.selectedFilterAllFav);
  console.log('Days:', this.days);
  
  // Log appointments for this day
  const dayAppointments = this.filteredAppointments.filter(a => 
    moment(a.start_time).format('YYYY-MM-DD') === selectedDay
  );
  console.log('Appointments for this day:', dayAppointments);
  
  // Log provider distribution
  if (dayAppointments.length > 0) {
    const providerCounts = dayAppointments.reduce((acc, appt) => {
      const provider = appt.providerId === this.PROVIDER_BEN_YEHUDA ? 'Ben Yehuda' : 
                     appt.providerId === this.PROVIDER_HAYARKON ? 'Hayarkon' : 'Other';
      acc[provider] = (acc[provider] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Provider distribution:', providerCounts);
  }
  console.groupEnd();
}

// Add this to your class variables
private previousTab: string = '';


  // Modify the filterFavAll method
async filterFavAll(event: any) {
  console.log("event:", event)
  const selectedTab: 'all' | 'shalom' | 'favorites' = event.detail.value;
  this.logTabChange(selectedTab, `via UI selection (was ${this.selectedFilterAllFav})`);
  
  this.selectedFilterAllFav = selectedTab;
  this.combinedList = [];
  this.filteredAppointments = [];
  this.days = [];
  
  if (selectedTab === 'favorites') {
    // Get current favorites from localStorage
    const favoriteIds = this.getFavoriteTrainings();
    
    // Filter the unfilteredList to only include favorites
    this.filteredAppointments = this.unfilteredList.filter(appointment => 
      favoriteIds.includes(appointment.id)
    );
    
    // Extract available days for the favorite appointments
    this.extractAvailableDays();
    return;
  }

  // Set loading state
  if (selectedTab === 'all') this.isBenYehudaLoading = true;
  else if (selectedTab === 'shalom') this.isShalomLoading = true;

  try {
    if (this.USE_APPT_CACHE && this.scheduleItems.length > 0) {
      // Filter by providerId based on selected tab
      const providerId = selectedTab === 'all' ? this.PROVIDER_BEN_YEHUDA : this.PROVIDER_HAYARKON;
      
      // Filter schedule items by providerId and map to training cards
      const filteredSchedule = this.scheduleItems.filter(item => item.providerId === providerId);
      this.combinedList = this.mapScheduleToTrainingCards(filteredSchedule);
      this.unfilteredList = [...this.combinedList];
      
      // Extract days only for this provider
      this.extractAvailableDaysFromCache();
      
      // Update UI
      this.updateFilteredAppointments();
        console.log('[DEBUG] After filtering - Combined list:', this.combinedList);
  console.log('[DEBUG] First 3 items providerIds:', 
    this.combinedList.slice(0, 3).map(x => x.providerId));

    } else {
      // Fallback to legacy loading
      // ... existing legacy loading logic ...
    }
  } finally {
    if (selectedTab === 'all') this.isBenYehudaLoading = false;
    else this.isShalomLoading = false;
  }
}
  
  // Add this function to trigger on availability filter change
  toggleAvailabilityFilter() {
    this.availabilityFilter = this.availabilityFilter === 'all' ? 'available' : 'all';
    this.updateFilteredAppointments(); // Reapply the filter
  }

  //Updates list according the conditions
  updateFilteredAppointments() {
  console.groupCollapsed('[DEBUG] updateFilteredAppointments');
  console.log('Current tab:', this.selectedFilterAllFav);
  console.log('Selected day:', this.selectedDay);
  console.log('Availability filter:', this.availabilityFilter);
  console.log('Selected type:', this.selectedType);
  
  let tempAppointments = [...this.unfilteredList];
  console.log('Initial unfiltered count:', tempAppointments.length);

  if (this.selectedDay) {
    tempAppointments = tempAppointments.filter(appointment =>
      moment(appointment.start_time).format('YYYY-MM-DD') === this.selectedDay
    );
    console.log('After day filter:', tempAppointments.length);
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
    
  console.log('Final filtered count:', this.filteredAppointments.length);
  console.groupEnd();
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
    if (!currentFavorites.includes(training.id)) {
      currentFavorites.push(training.id);
    }
  } else {
    const index = currentFavorites.indexOf(training.id);
    if (index > -1) {
      currentFavorites.splice(index, 1);
    }
  }

  this.saveFavoriteTrainings(currentFavorites);
  
  // If we're currently on the favorites tab, update the filtered list
  if (this.selectedFilterAllFav === 'favorites') {
    this.updateFilteredAppointments();
  }
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

  // Enhanced toggle dropdown method
  toggleFilterDropdown(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    
    if (this.isAnimating) {
      return;
    }
    
    this.showDropdown = !this.showDropdown;
    this.isAnimating = true;
    
    if (this.showDropdown) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
  }

  // New method to close dropdown when clicking outside
  @HostListener('document:click', ['$event'])
  handleOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const dropdown = document.querySelector('.filter-dropdown');
    const filterButton = document.querySelector('.filter-icon')?.parentElement;
    const trainingList = document.querySelector('.training-list'); // Add selector for your training list
    
    if (this.showDropdown && 
        dropdown && filterButton &&
        !dropdown.contains(target) && 
        !filterButton.contains(target) &&
        !trainingList?.contains(target)) { // Don't close if clicking on training list
      this.showDropdown = false;
      document.body.classList.remove('no-scroll');
    }
  }

  // Optional: handle animation completion
  dropdownAnimationDone(event: any) {
    // Only mark animation as complete when it's actually done
    if (event.toState === 'closed' && !this.showDropdown) {
      this.isAnimating = false;
    } else if (event.toState === 'open' && this.showDropdown) {
      this.isAnimating = false;
    }
  }

  // Get animation state for template binding
  getDropdownState(): string {
    return this.showDropdown ? 'open' : 'closed';
  }

  //Calculate progress bar
  calculateProgress(appointment: any): number {
    if (!appointment.current_participants || !appointment.total_participants) {
      return 0;
    }
    const progress = (appointment.current_participants.length / appointment.total_participants) * 100;
    return progress > 100 ? 100 : progress; // Ensure the progress doesn't exceed 100%
  }

  capacityRatio(appt: Appointment): number {
  const total = appt?.total_participants ?? 0;
  return total > 0 ? appt.booked / total : 0;
  }

  capacityState(appt: Appointment): 'empty' | 'low' | 'medium' | 'high' | 'full' | 'over' {
    const r = this.capacityRatio(appt);
    if (r === 0)       return 'empty';
    if (r < 0.25)      return 'low';    // 0‑24%
    if (r < 0.75)      return 'medium'; // 25‑74%
    if (r < 1)         return 'high';   // 75‑99%
    if (r === 1)       return 'full';   // exactly full
    return 'over';                       // >100% (safety / overbook)
  }

  // Method to show the popup
async showParticipantsPopup(appt: TrainingCard) {
  this.activeAppointment = appt;
  this.isPopupVisible = true;

  if (!appt.current_participants?.length && !appt.participantsLoaded) {
    appt.participantsLoaded = true; // flag to prevent כפול
    try {
      const parts = await this.apptCache.loadParticipants(appt.appointmentId);
      // parts: [{name,email,...}]
      appt.current_participants = parts.map(p => p.name || p.email || 'משתתף');
    } catch (err) {
      console.error('participants load failed', err);
      appt.current_participants = [];
    }
  }
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

    console.log("data", data);
  
    this.http.post(url, data).subscribe(() => {
      //console.log('User added to standby list', response);      
      appointment.isStandbyLoading = false;
      appointment.isStandbySuccess = true;
      this.apptCache.invalidate().then(() => this.apptCache.ensureLoaded(true));
      this.apptCache.invalidateSchedule().then(() => this.apptCache.ensureScheduleLoaded(20, true));


  
  
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
      this.http.post('https://k-studio.co.il/wp-json/wn/v1/enrollTraining', body, {
        headers: {
          'Content-Type': 'application/json',
        },
      }).subscribe(
        (response: any) => {
          console.log("Response:", response)
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
            this.apptCache.invalidate().then(() => this.apptCache.ensureLoaded(true));
            this.apptCache.invalidateSchedule().then(() => this.apptCache.ensureScheduleLoaded(20, true));
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