import { Component, OnInit } from '@angular/core';
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';
import { ModalController } from '@ionic/angular';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';
import { TrainingsPage } from '../trainings/trainings.page';
import { ProfilePopupComponent } from '../profile-popup/profile-popup.component';
import { AuthService } from '../services/auth.service';
import { BlocksService, Block } from '../services/blocks.service';
import { PurchaseComponent } from '../purchase/purchase.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  // User data
  userName: string = 'Ruth Black';
  userMembershipType: string = 'Premium Member';

  // Lesson and Fitness Tips data
  nextLesson: any;
  upcomingLessons: any[] = [];
  fitnessTips: Block[] = [];

  // Swiper config
  slideOpts: SwiperOptions = {
    slidesPerView: 1.5,  // Number of slides visible at a time
    spaceBetween: 10,    // Space between slides
    freeMode: true,      // Allow free scrolling
  };

  constructor(private blocksService: BlocksService, private modalCtrl: ModalController, private modalCtrl1: ModalController, private modalCtrl2: ModalController, private authService: AuthService) {}

  ngOnInit() {
    setTimeout(() => {
      new Swiper('.swiper-container', {
        slidesPerView: 'auto',  // Dynamically adjust the number of visible slides based on their width
        spaceBetween: 15,  // Space between each slide
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
      (data) => this.fitnessTips = data,
      (error) => console.error("Error fetching blocks", error)
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
    return await modal.present();
  }

  

  openWhatsApp() {
    const phoneNumber = 'YOUR_PHONE_NUMBER';  // Replace with your WhatsApp number in international format
    window.open(`https://wa.me/${phoneNumber}`, '_blank');
  }

  async openTrainings() {
    const modal = await this.modalCtrl.create({
      component: TrainingsPage,
      cssClass: 'trainings-popup',  // Custom class for styling      
      presentingElement: await this.modalCtrl.getTop(),  // Ensure it's treated as a sheet
      breakpoints: [0, 0.85, 1],  // Modal will have 0 (collapsed), 50%, and full-screen options
      initialBreakpoint: 0.85,  // Start the modal at 50% of screen height
    });
    return await modal.present();
  }

  async openProfile() {
    if (this.authService.isLoggedIn()){
      const modal = await this.modalCtrl2.create({
        component: ProfilePopupComponent,
        cssClass: 'profile-popup',  // Custom class for styling      
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
