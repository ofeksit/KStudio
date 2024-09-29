import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { AmeliaService } from './services/amelia-api.service';
import { Platform } from '@angular/cdk/platform';
import OneSignal from 'onesignal-cordova-plugin';
import { initializeApp } from 'firebase/app';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit{
  constructor( private ameliaService: AmeliaService, private authService: AuthService, private router: Router) {
    //Debug OneSignal
    OneSignal.Debug.setLogLevel(6);

    //init One Signal
    OneSignal.initialize("83270e8d-d7ee-4904-91a7-47d1f71e9dd6");
    
    OneSignal.Notifications.addEventListener('click', async (e) => {
      let clickData = await e.notification;

      console.log("Notification cliciked: " + clickData);
    })

    OneSignal.Notifications.requestPermission(true).then((success: Boolean) => {
      console.log("Notification permission Granted: " + success);
    })

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
