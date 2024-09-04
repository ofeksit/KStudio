import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
// Temporarily comment out the Share import until the plugin is correctly installed
// import { Share } from '@capacitor/share';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

  // User data
  userName: string = 'Ruth Black';  // Placeholder; later, this will be fetched from a user API or login service
  userMembershipType: string = 'Premium Member';  // Mock data

  // Lesson and Fitness Tips data
  nextLesson: any;
  upcomingLessons: any[] = [];
  fitnessTips: any[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    // Initializing data, could later fetch from API or local storage
    this.loadNextLesson();
    this.loadUpcomingLessons();
    this.loadFitnessTips();
  }

  // Load next lesson data (mockup for now)
  loadNextLesson() {
    this.nextLesson = {
      title: 'Yoga Class',
      date: 'Tomorrow at 10:00 AM',
    };
  }

  // Load upcoming lessons (mock data for now)
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

  // Load fitness tips (mock data for now)
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

  // Function to handle enroll button click (this could be expanded with API logic later)
  enrollInLesson(lesson: any) {
    console.log('Enrolled in lesson:', lesson);
    // This could redirect to a lesson details page or send an API request to enroll
    this.router.navigate(['/manage-enrollments']);
  }

  // Slide options for the fitness tips section
  slideOpts = {
    initialSlide: 0,
    speed: 400,
    slidesPerView: 2, // Adjust for how many slides should show in the view
  }

  // Function to handle sharing via WhatsApp, Facebook, Instagram
  // Temporarily comment out the Share functionality to avoid errors
  /*
  async shareApp(platform: string) {
    let shareMessage = {
      title: 'Join K Studio!',
      text: 'Check out this awesome fitness studio app!',
      url: 'https://yourapp.com',
    };

    switch (platform) {
      case 'whatsapp':
        await Share.share({
          ...shareMessage,
          dialogTitle: 'Share via WhatsApp',
        });
        break;
      case 'facebook':
        await Share.share({
          ...shareMessage,
          dialogTitle: 'Share via Facebook',
        });
        break;
      case 'instagram':
        await Share.share({
          ...shareMessage,
          dialogTitle: 'Share via Instagram',
        });
        break;
    }
  }
  */
}
