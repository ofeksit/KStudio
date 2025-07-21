import { Component, OnInit, viewChild, ViewChild } from '@angular/core';
import { IonModal, ModalController } from '@ionic/angular';
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
import { Observable } from 'rxjs';
import {trigger, style, transition, animate} from '@angular/animations';
import { ManagePackagesComponent } from '../manage-packages/manage-packages.component';
import { OnboardingService } from '../services/onboarding.service';
import { JoyrideService } from 'ngx-joyride';
import { delay, Subscription } from 'rxjs';
import { PopoverController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AttendanceBadgeService } from '../services/attendance-badge.service';
import { AttendanceDashboardPage } from '../trainer/attendance-dashboard/attendance-dashboard.page';

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
  @ViewChild('introModal', { static: true }) introModal!: IonModal;


  showIntro = false;

  private joyrideSubscription: Subscription | undefined;
  private popoverForTutorial: HTMLIonPopoverElement | null | undefined;
  
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
  
  public attendanceBadgeCount$: Observable<number>;

  constructor(
    private readonly joyrideService: JoyrideService,
    private router: Router,
    private onboardingService: OnboardingService,
    private popoverController: PopoverController, 
    private toastController: ToastController, 
    private profileService: ProfileService, 
    private ameliaService: AmeliaService, 
    private blocksService: BlocksService, 
    private modalCtrl: ModalController, 
    private modalCtrl1: ModalController, 
    private modalCtrl2: ModalController, 
    private modalCtrl3: ModalController, 
    private modalCtrl4: ModalController,
    private authService: AuthService,
    private attendanceBadgeService: AttendanceBadgeService // 1. Inject the new service
  ) {
    this.userRole = this.authService.getUserRole();
    this.userId = this.authService.getUserID();
    this.userEmail = this.authService.getUserEmail();
    this.customerId = this.authService.getCustomerID();
    this.attendanceBadgeCount$ = this.attendanceBadgeService.badgeCount$;
  }

  ngOnInit() {
    try {
      this.loadUpcomingTrainings(); } catch (e) {
      console.error('HomePage ngOnInit: Error calling loadUpcomingTrainings', e); }

    try {
      this.setupOneSignal(); } catch (e) {
      console.error('HomePage ngOnInit: Error calling setupOneSignal', e); }

    if (this.userRole === 'team' || this.userRole === 'administrator') {
        this.attendanceBadgeService.fetchAndSetBadgeCount();
    }

    if (this.userRole === 'activesubscription') {
      this.profileService.fetchSubscriptionExpiryDate(this.userId).subscribe(
      (data) => {
        console.log('HomePage ngOnInit: fetchSubscriptionExpiryDate success.');
      },
      (error) => {
        console.error("HomePage ngOnInit: Error fetching subscription expiry date", error);
      }
    );
    }
    
    this.blocksService.getBlocks().subscribe(
      (data) => {
        this.fitnessTips = data; this.isLoading = false;
      },
      (error) => {
        // This console.error was already in your code
        console.error("HomePage ngOnInit: Error fetching blocks", error);
        this.isLoading = false; // Ensure loading state is handled on error
      }
    );

    this.authService.fetchUserFavLocation().subscribe(
      (data) => {
        this.authService.storeFavLocation(data.favorite_location);
      },
      (error) => {
        // This console.error was already in your code
        console.error("HomePage ngOnInit: Error fetching user favorite location", error);
      }
    );

    setTimeout(() => {
      try {
        new Swiper('.swiper-container', {
          slidesPerView: 'auto',
          spaceBetween: 10,
          centeredSlides: false,
          loop: true,
          freeMode: false,
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
          },
        });
      } catch (e) {
        console.error('HomePage ngOnInit: Error initializing Swiper 1 (swiper-container)', e);
      }
    }, 0);
    setTimeout(() => {
      try {
        new Swiper('.upcoming-swiper-container', {
          modules: [Pagination],
          slidesPerView: 'auto',
          spaceBetween: 10,
          centeredSlides: false,
          loop: false,
          freeMode: false,
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
          },
        });
      } catch (e) {
        console.error('HomePage ngOnInit: Error initializing Swiper 2 (upcoming-swiper-container)', e);
      }
    }, 0);

  }

  async ionViewDidEnter() {
    try {
      const hasSeenTutorial = await this.onboardingService.checkIfTutorialSeen();
      if (!hasSeenTutorial) {
        this.popupAppTutorial();
        console.log("status:", this.showIntro)
      }
    } catch (error) {
      console.error('HomePage ionViewDidEnter: Error checking tutorial status.', error);
    }
  }

  popupAppTutorial() {
    this.showIntro = true;
  }

  closeAppTutorial() {
    this.showIntro = false;
    localStorage.setItem('CapacitorStorage.hasSeenTutorial', 'true');
  }

  startAppTutorial() {
    this.showIntro = false;
    
    const stepNames = [
      'upcomingTrainingsStep', 
      'tipsStep',             
    ];
    console.log('HomePage startAppTutorial: Defined step names:', stepNames); 

    if (!this.joyrideService) {
      console.error('HomePage startAppTutorial: JoyrideService is not available!');
      return;
    }

    console.log('HomePage startAppTutorial: Attempting to start tour with JoyrideService.');
    this.joyrideSubscription = this.joyrideService.startTour({
      steps: stepNames, 
      showCounter: true,
      showPrevButton: true,
      stepDefaultPosition: 'bottom',
      customTexts: { 
        prev: 'הקודם', 
        next: 'הבא', 
        done: 'סיום'
      }
    }).subscribe({
      next: async (step) => {
        console.log('HomePage JoyrideService: Next step:', step.name, step); 

        if (step.name === 'profilePopupContentStep') {
          // ... (rest of your logic)
        } else {
          // ... (rest of your logic)
        }
      },
      complete: () => {
        console.log('HomePage JoyrideService: Tutorial completed!'); 
        this.onboardingService.markTutorialAsSeen();
        // ... (rest of your logic)
      },
      error: (e) => {
        console.error('HomePage JoyrideService: Joyride error:', e); 
        this.onboardingService.markTutorialAsSeen(); 
        // ... (rest of your logic)
      }
    });
    console.log('HomePage startAppTutorial: Tour subscription created.');
  }

  // ... (rest of your methods remain the same) ...
  async presentTutorial() {
    console.log("Presenting tutorial....");
  }
  
  setupOneSignal() {
    OneSignal.Debug.setLogLevel(6)
    OneSignal.initialize("83270e8d-d7ee-4904-91a7-47d1f71e9dd6");
    if (this.userEmail) {
      OneSignal.User.addTag("email", this.userEmail);
    }
    else {
      OneSignal.User.addTag("email", "error");
    }
    OneSignal.Notifications.addEventListener('click', async (event) => {
      let notificationData = event.notification;
      this.storeNotification(notificationData); 
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
        console.log('HomePage loadUpcomingTrainings: Successfully loaded trainings.');
      },
      (error) => {
        console.error('HomePage loadUpcomingTrainings: Error loading upcoming trainings:', error);
        this.isLoadingTrainings = false;
      }
    );
  }

  refreshData(event: any) {
    setTimeout(() => {
      this.loadData(); 
      if (this.userRole === 'team' || this.userRole === 'administrator') {
        this.attendanceBadgeService.fetchAndSetBadgeCount();
      }
      event.target.complete(); 
    }, 2000); 
  }
  
  loadData() {
    if (this.userRole === 'activesubscription') {
     this.authService.fetchPackageCustomerId(this.customerId).subscribe(
        (data) => {},
        (error) => { console.error("Error fetching package customer ID", error)}
      );

      this.profileService.fetchSubscriptionData(this.userId, this.customerId).subscribe(
        (data) => {},
        (error) => {}
      );
    }

    this.authService.fetchUserFavLocation().subscribe(
      (data) => {},
      (error) => { console.error ("Error fetching user favorite location", error); }
    );

    this.loadUpcomingTrainings();

    this.blocksService.getBlocks().subscribe(
      (data) => { this.fitnessTips = data; this.isLoading = false; },
      (error) => { console.error("Error fetching blocks", error); this.isLoading = false; }
    );

    this.authService.fetchUserRole().subscribe(
      (data) => { this.authService.storeUserRole(data.roles[0]); },
      (error) => { console.error("Error fetching role:", error)}
    );
    
  }

  
  storeNotification(notificationData: any) {    
    let notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.unshift({
      title: notificationData.title,
      message: notificationData.body,
      timestamp: new Date(),
    });
    if (notifications.length > 5) {
      notifications = notifications.slice(0, 5);
    }
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }

  async openNotifications() {
    const modal = await this.modalCtrl1.create({
      component: NotificationPopupComponent,
      cssClass: 'notification-popup',      
      presentingElement: await this.modalCtrl1.getTop(),  
      breakpoints: [0, 0.5, 1],  
      initialBreakpoint: 0.5,  
    });
    await modal.present();
    this.setDisableScroll(true);  
    modal.onDidDismiss().then(() => {
      this.setDisableScroll(false); 
    });
    return await modal.present();
  }

  openWhatsApp() {
    const phoneNumber = '+972547937089';  
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
  }

  async openTrainings() {
    const modal = await this.modalCtrl.create({
      component: TrainingsPage,
      cssClass: 'trainings-popup',
      presentingElement: await this.modalCtrl.getTop(),  
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();
    this.setDisableScroll(true);  
    modal.onDidDismiss().then(() => {
      this.setDisableScroll(false); 
    });
    return await modal.present();
  }

  private async setDisableScroll(disable: boolean) {
    // It's possible mainContent is not available when this is first called if ngOnInit fails
    if (this.mainContent && typeof this.mainContent.getScrollElement === 'function') {
      const scrollElement = await this.mainContent.getScrollElement();
      scrollElement.style.overflowY = disable ? 'hidden' : 'scroll'; 
    } else {
      console.warn('setDisableScroll: mainContent or getScrollElement not available.');
    }
  }

  async openAttendance() {
    const modal = await this.modalCtrl4.create({
      component: AttendanceDashboardPage,
      cssClass: 'attendance-popup',
      presentingElement: await this.modalCtrl4.getTop(),  
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    
    await modal.present();
    this.setDisableScroll(true);
    
    // When the modal closes, refresh the badge count
    modal.onDidDismiss().then(() => {
      this.setDisableScroll(false); 
      if (this.userRole === 'team' || this.userRole === 'administrator') {
        this.attendanceBadgeService.fetchAndSetBadgeCount();
      }
    });
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
      await modal.present();
      this.setDisableScroll(true); 
      modal.onDidDismiss().then(() => {
        this.setDisableScroll(false); 
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
      await modal.present();
      this.setDisableScroll(true); 
      modal.onDidDismiss().then(() => {
        this.setDisableScroll(false); 
      });
    } else {
      console.log("User Not Logged In!");
    }
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000, 
      color: color,
      position: 'bottom',
    });
    await toast.present(); 
  }

  confirmDelete() {
    const training = this.selectedTraining;
    const index = this.selectedIndex;
    this.isConfirmDialogVisible = false;
    training.fadeOut = true;
    setTimeout(() => {
      this.upcomingTrainings.splice(index, 1);
    }, 300); 
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
    }, 300); 
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