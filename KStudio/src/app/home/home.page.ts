import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController } from '@ionic/angular';
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';
import { TrainingsPage } from '../trainings/trainings.page';
import { ProfilePopupComponent } from '../profile-popup/profile-popup.component';
import { AuthService } from '../services/auth.service';
import { BlocksService, Block } from '../services/blocks.service';
import { PurchaseComponent } from '../purchase/purchase.component';
import { register } from 'swiper/element/bundle';

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
    setTimeout(() => {
      new Swiper('.swiper-container', {
        slidesPerView: 'auto',  // Dynamically adjust the number of visible slides based on their width
        spaceBetween: 10,  // Space between each slide
        centeredSlides: false,  // Avoid centering to limit scrolling
        loop: true,  // Disable looping to prevent continuous scrolling
        freeMode: false,  // Disable free mode to keep the slides constrained
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
  


  async openPurchase() {
    if (this.authService.isLoggedIn()){
      const modal = await this.modalCtrl2.create({
        component: PurchaseComponent,
        cssClass: 'app-purchase',  // Custom class for styling      
        presentingElement: await this.modalCtrl2.getTop(),  // Ensure it's treated as a sheet
        breakpoints: [0, 0.85, 1],  // Modal will have 0 (collapsed), 50%, and full-screen options
        initialBreakpoint: 0.85,  // Start the modal at 50% of screen height
      });
      return await modal.present();
    }
    else {
      console.log("User Not Logged In!");
    }
  }
}
