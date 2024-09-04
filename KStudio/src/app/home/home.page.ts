import { Component, OnInit } from '@angular/core';
import Swiper from 'swiper';
import { SwiperOptions } from 'swiper/types';
import { ModalController } from '@ionic/angular';
import { NotificationPopupComponent } from '../notification-popup/notification-popup.component';

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
  fitnessTips = [
    { title: 'Stay Hydrated', content: 'Drink at least 8 glasses of water per day!', image: 'assets/img/hydrate.jpg' },
    { title: 'Stretch Daily', content: 'Improve flexibility and reduce injury risk with daily stretching.', image: 'assets/img/stretch.jpg' },
    { title: 'Eat More Protein', content: 'Protein helps muscle recovery and keeps you full longer.', image: 'assets/img/protein.jpg' }
  ];

  // Swiper config
  slideOpts: SwiperOptions = {
    slidesPerView: 1.5,  // Number of slides visible at a time
    spaceBetween: 10,    // Space between slides
    freeMode: true,      // Allow free scrolling
  };

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.loadNextLesson();
    this.loadUpcomingLessons();
    this.loadFitnessTips();
  
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
  }
  
  async openNotifications() {
    const modal = await this.modalCtrl.create({
      component: NotificationPopupComponent,
      cssClass: 'notification-popup',  // Custom class for styling      
      presentingElement: await this.modalCtrl.getTop(),  // Ensure it's treated as a sheet
      breakpoints: [0, 0.5, 1],  // Modal will have 0 (collapsed), 50%, and full-screen options
      initialBreakpoint: 0.5,  // Start the modal at 50% of screen height
    });
    return await modal.present();
  }
  


  loadNextLesson() {
    this.nextLesson = {
      title: 'Yoga Class',
      date: 'Tomorrow at 10:00 AM',
    };
  }

  loadUpcomingLessons() {
    this.upcomingLessons = [
      {
        title: 'HIIT Workout',
        date: 'Monday at 6:00 PM',
        trainer: 'John Doe',
        image: 'assets/img/hiit.jpg',
      },
      {
        title: 'Pilates',
        date: 'Wednesday at 9:00 AM',
        trainer: 'Sarah Lee',
        image: 'assets/img/pilates.jpg',
      },
      {
        title: 'Strength Training',
        date: 'Friday at 5:00 PM',
        trainer: 'Alex Brown',
        image: 'assets/img/strength.jpg',
      },
    ];
  }

  loadFitnessTips() {
    this.fitnessTips = [
      {
        title: 'Stay Hydrated',
        content: 'Drink at least 8 glasses of water per day!',
        image: 'assets/img/hydrate.jpg',
      },
      {
        title: 'Stretch Daily',
        content: 'Improve flexibility and reduce injury risk with daily stretching.',
        image: 'assets/img/stretch.jpg',
      },
      {
        title: 'Eat More Protein',
        content: 'Protein helps muscle recovery and keeps you full longer.',
        image: 'assets/img/protein.jpg',
      },
    ];
  }
}
