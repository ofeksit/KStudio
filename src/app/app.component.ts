import { booleanAttribute, Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { AmeliaService } from './services/amelia-api.service';
import { Platform } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import OneSignal from 'onesignal-cordova-plugin';




register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit{
  constructor(
    private ameliaService: AmeliaService, 
    private authService: AuthService, 
    private router: Router, 
    private platform: Platform,
  ) {
    
    this.platform.ready().then(() => {
      this.setupOneSignal();

      console.log("platform's ready");
    })
    // Force light theme on app startup
    document.body.setAttribute('data-theme', 'light');
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
  
  ngOnInit() {
    this.checkLoginStatus();
    this.ameliaService.fetchTitleTrainings().then(
      (data) => {},
      (error) => {
        console.log("Failed to fetch training data on startup!");
      }
    );
  }

  checkLoginStatus() {
    if (!this.authService.isLoggedIn()){
      this.router.navigate(['/login']);
    }
  }
}

