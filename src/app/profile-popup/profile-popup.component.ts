import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { GestureController, ModalController, ActionSheetController } from '@ionic/angular';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '../services/auth.service';
import { Booking } from '../Models/booking';
import { ToastController } from '@ionic/angular';
import { AmeliaService } from '../services/amelia-api.service';
import * as moment from 'moment';
import { Md5 } from 'ts-md5';


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
  userEmail: string | null = '';
  userID: string | null = '';
  customerID: string | null = '';
  knownTrainingTypes: string[] = [ 'פילאטיס', 'יוגה', 'אימון כוח', 'Parallel 15', 'Spinning', 'TRX', 'Booty&ABS', 'All In', 'HiiT', 'POWER', '' ]; // Array of known training types
  nextRenewalDate?: string;  // Subscription specific
  slotsLeft?: number;  // Amelia package specific
  selectedTab: string = 'trainings';  // Default selected tab
  isLoading: boolean = true; // Set loading to true initially
  errorMessage: string = '';
  trainingsByDay: any;
  availabilityFilter: string = '';
  showDropdown: boolean = false;
  selectedType: string = '';
  userAppointments: Booking[] = [];
  filteredAppointments: Booking[] = [];
  unfilteredAppointments: Booking[] = [];
  userPurchases: any[] = [];
  gravatarUrl: string = '';
  
  
  constructor(
    private gestureCtrl: GestureController,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private profileService: ProfileService,
    private authService: AuthService,
    private toastController: ToastController,
    private ameliaService: AmeliaService
  ) {
    this.userName = this.authService.getUserFullName();    
    this.userRole = this.translateUserRole(this.authService.getUserRole());
    this.customerID = this.authService.getCustomerID();
    this.userID = this.authService.getUserID();
    this.userEmail = this.authService.getUserEmail();
    this.setGravatarUrl();
  }

  setGravatarUrl(){
    if (this.userEmail){
      const hash = Md5.hashStr(this.userEmail.trim().toLowerCase());
      console.log("hash:", hash);
      this.gravatarUrl = `https://www.gravatar.com/avatar/${hash}?d=identicon`;
    }
  }

  // Method to format the date from dd/mm/yyyy to dd.mm.yyyy
  formatDate(dateString: string): string {
    return dateString.replace(/\//g, '.');  // Replace all slashes with dots
  }
    
    
  async ngOnInit() {
    this.profileService.fetchAvailablePackageSlots(this.customerID).subscribe(
      ({ availableSlots, expiryDate }) => {
        this.slotsLeft = availableSlots;  // Assign the available slots
        this.nextRenewalDate = this.formatDate(expiryDate);  // Format the expiry date
      },
      (error) => {
        console.error('Error fetching available slots and expiry date:', error);
        this.slotsLeft = 0;
        this.nextRenewalDate = '';  // Handle error by setting default values
      }
    );
  
    this.trainingsByDay = this.ameliaService.getTrainingsTitles();
    this.profileService.getUserPackageCustomerID();
    
    // Check if the titles have already been fetched
    if (!this.trainingsByDay || Object.keys(this.trainingsByDay).every(key => this.trainingsByDay[key].length === 0)) {
      // Fetch the training titles if not already available
      await this.ameliaService.fetchTitleTrainings();
      this.trainingsByDay = this.ameliaService.getTrainingsTitles();
    }

    // Load the last saved filter choice from local storage (if exists)
    const savedFilter = localStorage.getItem('userFilterChoice');
    if (savedFilter) {
      this.availabilityFilter = savedFilter;
    }
    this.authService.fetchUserRole().subscribe(data => {this.authService.storeUserRole(data.roles[0]); this.userRole = this.translateUserRole(data.roles[0]);});
    this.loadUserAppointmentsLast60Days();
    // Apply the filter after loading appointments
    this.updateFilteredAppointments();

    
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000, // Duration in milliseconds
      color: color,
      position: 'bottom',
    });
    await toast.present(); // Make sure the toast is presented
  }

  loadUserAppointmentsLast60Days() {
    this.isLoading = true;
    this.profileService.getLast60DaysAppointmentsForUser().subscribe(async (appointments: any[]) => {
      const promises: Promise<any>[] = [];
      
      for (const appointment of appointments) {
        const booking = appointment.matchedBooking;
        const status = appointment.userBookingStatus;
  
        if (booking) {
          console.log("booking start", appointment.bookingStart)
          appointment.userBookingStatus = status;
          const bookingDate = moment(appointment.bookingStart).format('YYYY-MM-DD');
          const bookingTime = moment(appointment.bookingStart).format('HH:mm');
  
          const promise = this.getAppointmentTitleByDateTime(bookingDate, bookingTime)
            .then((title: string) => {
              appointment.title = title || 'כללי';  // Set the title or fallback to 'כללי'
            })
            .catch((error) => {
              console.error('Error fetching appointment title:', error);
              appointment.title = 'כללי';  // Fallback title in case of error
            });
  
          promises.push(promise);
        }
      }
  
      await Promise.all(promises);
      // Sort the appointments by the bookingStart datetime in descending order.
      this.userAppointments = appointments.sort((a, b) => moment(b.bookingStart).diff(moment(a.bookingStart)));
      this.filteredAppointments = [...this.userAppointments];
  
      this.updateFilteredAppointments();
  
      this.isLoading = false;
    }, error => {
      this.isLoading = false;  // Handle error
      console.error('Error loading appointments:', error);
    });
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
  
  //Fetch user role to hebrew description
  translateUserRole (role: string | null): string {
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

  checksUserPackage () {
    
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
      header: 'פעולות',
      buttons: [
        {
          text: 'ביטול אימון',
          role: 'destructive',
          icon: 'close-circle-outline',
          handler: () => {
            this.cancelBooking(training.matchedBooking.id);
          },
        },
        {
          text: 'סגור',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  downloadInvoice(order: any) {
    if (order.invoice_link) {
      window.open(order.invoice_link, '_blank'); // Opens the invoice link in a new tab
    } else {
      console.error('No invoice link available for this order.');
      this.errorMessage = "לא ניתן להפיק חשבונית בעבור הזמנה זו."
      this.presentToast(this.errorMessage, 'danger');
    }
  }

  // Get status icons for trainings
  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved':
        return 'checkmark-circle-outline';
      case 'canceled':
        return 'close-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      case 'pending':
        return 'time-outline';
      case 'refunded':
        return 'cash-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      default:
        return 'alert-circle-outline';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'success';
      case 'completed':
        return 'success';
      case 'canceled':
        return 'danger';
      case 'cancelled':
        return 'danger';
      case 'pending':
        return 'warning';
      case 'refunded':
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

  cancelBooking(bookingId: string) {
    this.profileService.cancelBooking(bookingId).subscribe(
      (data: any) => {
        if (data.data.cancelBookingUnavailable)
        {
          this.errorMessage = 'לא ניתן לבטל אימון זה'
          this.presentToast(this.errorMessage, 'danger');
        }
        else {
          this.errorMessage = 'האימון בוטל בהצלחה'
          this.presentToast(this.errorMessage, 'success');
          console.log("data in cancelling", data);
        }
      },
      (error) => {
        this.errorMessage = 'לא ניתן לבטל אימון זה, אנא נסה שנית'
        this.presentToast(this.errorMessage, 'danger');
        console.error('Error occurred while canceling the booking', error);
      }
    );
  }

  async showSettings() {
  const actionSheet = await this.actionSheetCtrl.create({
    header: 'הגדרות',
    buttons: [
      {
        text: 'התנתק',
        role: 'destructive',
        icon: 'log-out-outline',
        handler: () => {
          this.authService.logout();  // Implement this in your AuthService
          this.modalCtrl.dismiss();  // Close the modal after logging out
          window.location.reload();  // Refresh the application
          console.log('Logged out');
        }
      },
      {
        text: 'סגור',
        icon: 'close',
        role: 'cancel',
      }
    ]
  });
  await actionSheet.present();
}

  loadUserPurchases() {
  this.profileService.fetchUserPurchases(this.userID).subscribe((purchases: any[]) => {
    console.log("purchases", purchases);
    this.userPurchases = purchases;
  });
  }

  onTabChange(event: any) {
    this.selectedTab = event.detail.value;
    
    if (this.selectedTab == 'purchases')
      this.loadUserPurchases();
  }

  // Toggle dropdown visibility
  toggleFilterDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  // Call this method when availability or type filters change
  onFilterChange() {
    this.updateFilteredAppointments();
    // Save the current filter choice to local storage
    localStorage.setItem('userFilterChoice', this.availabilityFilter);
  }

  updateFilteredAppointments() {
    let tempAppointments = [...this.userAppointments];  // Ensure you are working with a copy
       
    // Filter by availability filter (approved, cancelled, or all)
    if (this.availabilityFilter === 'approved') {
      tempAppointments = tempAppointments.filter(appointment => appointment.userBookingStatus === 'approved');
    } else if (this.availabilityFilter === 'cancelled') {
      tempAppointments = tempAppointments.filter(appointment => appointment.userBookingStatus === 'canceled');
    } 
    // If 'all' is selected, no filtering is needed
  
    // Update the displayed filtered list
    this.filteredAppointments = tempAppointments;
  }


  
}
