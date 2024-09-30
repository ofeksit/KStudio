import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { AmeliaService } from './services/amelia-api.service';
import { Platform } from '@ionic/angular';
import { register } from 'swiper/element/bundle';

register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit{
  constructor( private ameliaService: AmeliaService, private authService: AuthService, private router: Router, private platform: Platform) {
/*
    platform.ready().then(() => {
      //Debug OneSignal
      OneSignal.Debug.setLogLevel(6);
      
      //init One Signal
      OneSignal.initialize("83270e8d-d7ee-4904-91a7-47d1f71e9dd6");

      let myClickListener = async function(event: any) {
        let notificationData = JSON.stringify(event);
      };
      OneSignal.Notifications.addEventListener("click", myClickListener);
  
      // Prompts the user for notification permissions.
      // Since this shows a generic native prompt, we recommend instead using an In-App Message to prompt for notification permission (See step 7) to better communicate to your users what notifications they will get.
      OneSignal.Notifications.requestPermission(true).then((accepted: boolean) => {
        console.log("User accepted notifications: " + accepted);
      });
    });    
    
    OneSignal.Notifications.addEventListener('click', async (e) => {
      let clickData = await e.notification;

      console.log("Notification cliciked: " + clickData);
    })

    OneSignal.Notifications.requestPermission(true).then((success: Boolean) => {
      console.log("Notification permission Granted: " + success);
    })*/

    // Force light theme on app startup
    document.body.setAttribute('data-theme', 'light');
  }


  ngOnInit() {
    this.checkLoginStatus();
    this.ameliaService.fetchTitleTrainings().then(
      (data) => {
        
      },
      (error) => {
        console.log("Failed to fetch traning data on startup!");
      }
    );
  }

  checkLoginStatus() {
    if (!this.authService.isLoggedIn()){
      this.router.navigate(['/login']);
    }
  }
  
}
