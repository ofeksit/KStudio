import { Component, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { GestureController, ModalController, ActionSheetController } from '@ionic/angular';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '../services/auth.service';
import { Appointment } from '../Models/appointment';
import { Training } from '../Models/training';
import { Booking } from '../Models/booking';

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
    private authService: AuthService
  ) {
    this.userName = this.authService.getUserFullName();    
    this.userRole = this.fetchUserRole(this.authService.getUserRole());
    this.userID = this.authService.getUserID();
  }
  ngOnInit() {
    this.loadUserAppointmentsLast60Days();
    console.log("username", this.userName)
    console.log("userrole", this.userRole)
  }

  // Load appointments for the logged-in user from the last 60 days
  loadUserAppointmentsLast60Days() {
    this.profileService.getLast60DaysAppointmentsForUser().subscribe((appointments: any[]) => {
      this.userAppointments = appointments;
      console.log('User Appointments (Last 60 Days):', this.userAppointments);
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
      case 'cancelled':
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
      case 'cancelled':
        return 'danger';
      case 'pending':
        return 'warning';
      default:
        return 'medium';
    }
  }
}
