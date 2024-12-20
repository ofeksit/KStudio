import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController } from '@ionic/angular';
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';
import { TrainingsPage } from '../trainings/trainings.page';
import { ProfilePopupComponent } from '../profile-popup/profile-popup.component';
import { AuthService } from '../services/auth.service';
import { BlocksService, Block } from '../services/blocks.service';
import { register } from 'swiper/element/bundle';
import OneSignal from 'onesignal-cordova-plugin';

register();

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})

export class HomePage implements OnInit {
  @ViewChild('mainContent', { static: false }) mainContent: any;

  // User data
  userName: string = 'Ruth Black';
  userMembershipType: string = 'Premium Member';

  // Lesson and Fitness Tips data
  nextLesson: any;
  upcomingLessons: any[] = [];
  fitnessTips: Block[] = [];
  isLoading: boolean = true; // Loading state

  constructor(private blocksService: BlocksService, private modalCtrl: ModalController, private modalCtrl1: ModalController, private modalCtrl2: ModalController, private authService: AuthService) {}

  ngOnInit() {
    this.setupOneSignal();
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

    this.blocksService.getBlocks().subscribe(
      (data) => { this.fitnessTips = data; this.isLoading = false; },
      (error) => { console.error("Error fetching blocks", error); this.isLoading = false; }
    );
  }
  
  setupOneSignal() {
    // Remove this method to stop OneSignal Debugging
    OneSignal.Debug.setLogLevel(6)
    
    // Replace YOUR_ONESIGNAL_APP_ID with your OneSignal App ID
    OneSignal.initialize("83270e8d-d7ee-4904-91a7-47d1f71e9dd6");
    const userEmail = this.authService.getUserEmail();
    // Retrieve the logged-in user's information (from AuthService or another source)
    if (userEmail) {
      // Tag the user in OneSignal with their unique ID or email
      OneSignal.User.addTag("email", userEmail);  // Optional: tag with email as well
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

  

  
  storeNotification(notificationData: any) {
    console.log("store notifications:", notificationData);
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
      breakpoints: [0, 0.85, 1],
      initialBreakpoint: 0.85,
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
        breakpoints: [0, 0.85, 1],
        initialBreakpoint: 0.85,
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
  
}
