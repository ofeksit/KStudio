import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import Swiper from 'swiper';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';
import { TrainingsPage } from '../trainings/trainings.page';
import { ProfilePopupComponent } from '../profile-popup/profile-popup.component';
import { AuthService } from '../services/auth.service';
import { ToastController } from '@ionic/angular';
import { BlocksService, Block } from '../services/blocks.service';
import { register } from 'swiper/element/bundle';
import OneSignal from 'onesignal-cordova-plugin';
import { AmeliaService } from '../services/amelia-api.service';
import { UpcomingAppointment } from '../Models/UpcomingAppointment';
import { ProfileService } from '../services/profile.service';
import { Pagination } from 'swiper/modules'
import {trigger, style, transition, animate} from '@angular/animations';
import { ManagePackagesComponent } from '../manage-packages/manage-packages.component';

register();

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  animations: [
    trigger('fadeOutAnimation', [
      transition('fadeIn => fadeOut', [
        animate('300ms ease-in', style({opacity: 0, transform: 'scale(0.8)'})),
      ]),
    ]),
  ],
})

export class HomePage implements OnInit {
  @ViewChild('mainContent', { static: false }) mainContent: any;

  // User data
  upcomingTrainings: UpcomingAppointment[] = [];
  isLoadingTrainings: boolean = true;

  // Lesson and Fitness Tips data
  nextLesson: any;
  fitnessTips: Block[] = [];
  isLoading: boolean = true; // Loading state
  errorMessage: string = '';
  userRole: string | null = "";
  isConfirmDialogVisible = false;
  selectedTraining: any;
  selectedIndex: number = 0;
  userId: string | null = '';
  userEmail: string | null= '';
  customerId: string | null = '';
  
  constructor(private toastController: ToastController, private profileService: ProfileService, private ameliaService: AmeliaService, private blocksService: BlocksService, private modalCtrl: ModalController, private modalCtrl1: ModalController, private modalCtrl2: ModalController, private modalCtrl3: ModalController, private authService: AuthService) {
    this.userRole = this.authService.getUserRole();
    this.userId = this.authService.getUserID();
    this.userEmail = this.authService.getUserEmail();
    this.customerId = this.authService.getCustomerID();
  }

  ngOnInit() {
    this.profileService.fetchSubscriptionExpiryDate(this.userId).subscribe(
      (error) => { console.error ("Error fetching subscription expiry date", error)}
      );

    this.blocksService.getBlocks().subscribe(
      (data) => { this.fitnessTips = data; this.isLoading = false; },
      (error) => { console.error("Error fetching blocks", error); this.isLoading = false; }
    );

    this.authService.fetchUserFavLocation().subscribe(
      (data) => { this.authService.storeFavLocation(data.favorite_location); },
      (error) => { console.error ("Error fetching user favorite location", error); }
    );

    setTimeout(() => {
      new Swiper('.swiper-container', {
        slidesPerView: 'auto',  // Dynamically adjust the number of visible slides based on their width
        spaceBetween: 10,  // Space between each slide
        centeredSlides: false,  // Avoid centering to limit scrolling
        loop: true,  // Disable looping to prevent continuous scrolling
        freeMode: false,  // Disable free mode to keep the slides constrained,
        pagination: {
          el: '.swiper-pagination',
          clickable: true,
        },
      });
    }, 0);

    setTimeout(() => {
      new Swiper('.upcoming-swiper-container', {
        modules: [Pagination], // Register the Pagination module
        slidesPerView: 'auto',
        spaceBetween: 10,
        centeredSlides: false,
        loop: false, // It's better to explicitly set loop to false
        freeMode: false,
        pagination: {
          el: '.swiper-pagination', // Corrected selector (was .upcoming-swiper-pagination in your example)
          clickable: true,
        },
      });
    }, 0);
    
    this.loadUpcomingTrainings();
    this.setupOneSignal();
  }
  
  setupOneSignal() {
    // Remove this method to stop OneSignal Debugging
    OneSignal.Debug.setLogLevel(6)
    
    // Replace YOUR_ONESIGNAL_APP_ID with your OneSignal App ID
    OneSignal.initialize("83270e8d-d7ee-4904-91a7-47d1f71e9dd6");
    
    // Retrieve the logged-in user's information (from AuthService or another source)
    if (this.userEmail) {
      // Tag the user in OneSignal with their unique ID or email
      OneSignal.User.addTag("email", this.userEmail);  // Optional: tag with email as well
    }
    else {
      OneSignal.User.addTag("email", "error");
    }

    // Handle notification clicks and store notifications
    OneSignal.Notifications.addEventListener('click', async (event) => {
      let notificationData = event.notification;
      this.storeNotification(notificationData); // Store the clicked notification
      console.log('Notification clicked: ', notificationData);
    });

    OneSignal.Notifications.requestPermission(true).then((success: Boolean) => {
      console.log("Notification permission granted " + success);
    })
  }
  
  private loadUpcomingTrainings() {
    this.isLoadingTrainings = true;
    this.ameliaService.getUpcomingTrainings().subscribe(
      (trainings) => {
        this.upcomingTrainings = trainings;
        this.isLoadingTrainings = false;
      },
      (error) => {
        console.error('Error loading upcoming trainings:', error);
        this.isLoadingTrainings = false;
      }
    );
  }

  refreshData(event: any) {
    // Simulate an API call
    setTimeout(() => {
      this.loadData(); // Your method to reload data
      event.target.complete(); // Complete the refresh
    }, 2000); // Adjust the timeout as needed
  }
  
  loadData() {
    // Example logic to load data
    this.isLoadingTrainings = true;
    this.loadUpcomingTrainings();
    this.authService.fetchUserFavLocation().subscribe(
      (data) => {},
      (error) => { console.error ("Error fetching user favorite location", error); }
    );
    this.blocksService.getBlocks().subscribe(
      (data) => { this.fitnessTips = data; this.isLoading = false; },
      (error) => { console.error("Error fetching blocks", error); this.isLoading = false; }
    );

    this.authService.fetchPackageCustomerId(this.customerId).subscribe(
      (data) => {},
      (error) => { console.error("Error fetching package customer ID", error)}
    );

    this.authService.fetchUserRole().subscribe(
      (data) => { this.authService.storeUserRole(data.roles[0]); },
      (error) => { console.error("Error fetching role:", error)}
    );

    this.profileService.fetchSubscriptionData(this.userId, this.customerId).subscribe(
      (data) => {},
      (error) => {}
    );
  }

  
  storeNotification(notificationData: any) {    
    // Retrieve existing notifications from localStorage
    let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');

    // Add the new notification to the front of the array
    notifications.unshift({
      title: notificationData.title,
      message: notificationData.body,
      timestamp: new Date(),
    });

    // Limit the array to the last 5 notifications
    if (notifications.length > 5) {
      notifications = notifications.slice(0, 5);
    }

    // Store the updated list back to localStorage
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }

  async openNotifications() {
    const modal = await this.modalCtrl1.create({
      component: NotificationPopupComponent,
      cssClass: 'notification-popup',  // Custom class for styling      
      presentingElement: await this.modalCtrl1.getTop(),  // Ensure it's treated as a sheet
      breakpoints: [0, 0.5, 1],  // Modal will have 0 (collapsed), 50%, and full-screen options
      initialBreakpoint: 0.5,  // Start the modal at 50% of screen height
    });
    
    // Disable scrolling when the modal is opened
    await modal.present();
    this.setDisableScroll(true);  // Disable background scroll when modal opens

    // Re-enable scrolling when the modal is dismissed
    modal.onDidDismiss().then(() => {
      this.setDisableScroll(false); // Re-enable background scroll when modal is closed
    });

    return await modal.present();
  }

  

  openWhatsApp() {
    const phoneNumber = '+972547937089';  // Replace with your WhatsApp number in international format
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
  }

  async openTrainings() {
    const modal = await this.modalCtrl.create({
      component: TrainingsPage,
      cssClass: 'trainings-popup',
      presentingElement: await this.modalCtrl.getTop(),  // Ensure it's treated as a sheet
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });

    // Disable scrolling when the modal is opened
    await modal.present();
    this.setDisableScroll(true);  // Disable background scroll when modal opens

    // Re-enable scrolling when the modal is dismissed
    modal.onDidDismiss().then(() => {
      this.setDisableScroll(false); // Re-enable background scroll when modal is closed
    });

    return await modal.present();
  }

  private async setDisableScroll(disable: boolean) {
    const scrollElement = await this.mainContent.getScrollElement();
    scrollElement.style.overflowY = disable ? 'hidden' : 'scroll'; // Disable or enable scrolling
  }

  async openProfile() {
    if (this.authService.isLoggedIn()) {
      const modal = await this.modalCtrl2.create({
        component: ProfilePopupComponent,
        cssClass: 'profile-popup',
        presentingElement: await this.modalCtrl2.getTop(),
        breakpoints: [0, 1],
        initialBreakpoint: 1,
        handle: true,
      });
  
      // Disable scrolling when the modal is opened
      await modal.present();
      this.setDisableScroll(true); // Disable background scroll
  
      // Re-enable scrolling when the modal is dismissed
      modal.onDidDismiss().then(() => {
        this.setDisableScroll(false); // Re-enable background scroll
      });
    } else {
      console.log("User Not Logged In!");
    }
  }

  async openManagePackages() {
    if (this.authService.isLoggedIn()) {
      const modal = await this.modalCtrl3.create({
        component: ManagePackagesComponent,
        cssClass: 'managePackages-popup',
        presentingElement: await this.modalCtrl3.getTop(),
        breakpoints: [0, 1],
        initialBreakpoint: 1,
      });
  
      // Disable scrolling when the modal is opened
      await modal.present();
      this.setDisableScroll(true); // Disable background scroll
  
      // Re-enable scrolling when the modal is dismissed
      modal.onDidDismiss().then(() => {
        this.setDisableScroll(false); // Re-enable background scroll
      });
    } else {
      console.log("User Not Logged In!");
    }
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

  confirmDelete() {
    const training = this.selectedTraining;
    const index = this.selectedIndex;

    // Close the dialog and immediately remove the training from the list
    this.isConfirmDialogVisible = false;
    training.fadeOut = true;

    setTimeout(() => {
      this.upcomingTrainings.splice(index, 1);
    }, 300); // Match the animation duration

    // Run the API request in the background
    this.profileService.cancelBooking(training.bookingId).subscribe(
      (data: any) => {
        if (data.data.cancelBookingUnavailable) {
          this.presentToast('לא ניתן לבטל אימון זה', 'danger');
        } else {
          this.presentToast('האימון בוטל בהצלחה', 'success');
        }
      },
      (error) => {
        this.presentToast('לא ניתן לבטל אימון זה, אנא נסה שנית', 'danger');
        console.error('Error occurred while canceling the booking', error);
      }
    );
  }

  animateAndDeleteTraining(training: any, index: number) {
    training.fadeOut = true;

    setTimeout(() => {
      this.deleteTraining(training.bookingId, index);
    }, 300); // Match the animation duration
  }

  deleteTraining(bookingId: string, index: number) {
    this.profileService.cancelBooking(bookingId).subscribe(
      (data: any) => {
        if (data.data.cancelBookingUnavailable) {
          this.presentToast('לא ניתן לבטל אימון זה', 'danger');
        } else {
          this.presentToast('האימון בוטל בהצלחה', 'success');
          this.upcomingTrainings.splice(index, 1);
        }
      },
      (error) => {
        this.presentToast('לא ניתן לבטל אימון זה, אנא נסה שנית', 'danger');
        console.error('Error occurred while canceling the booking', error);
      }
    );
  }

  openConfirmDialog(training: any, index: number) {
    this.selectedTraining = training;
    this.selectedIndex = index;
    this.isConfirmDialogVisible = true;
  }

  closeConfirmDialog() {
    this.isConfirmDialogVisible = false;
  }


}
