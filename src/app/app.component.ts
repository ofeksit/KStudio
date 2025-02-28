import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { AmeliaService } from './services/amelia-api.service';
import { Platform } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { HttpClient } from '@angular/common/http';



register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {

  currentVesion = '2.1';
  latestVersionUrl = 'https://k-studio.co.il/app-version.json';
  isUpdateDialogVisible = false;

  
  constructor(
    private ameliaService: AmeliaService, 
    private authService: AuthService, 
    private router: Router, 
    private platform: Platform,
    private httpClient: HttpClient
      ) {
    
    // Force light theme on app startup
    document.body.setAttribute('data-theme', 'light');
  }

  
  ngOnInit() {
    this.checkLoginStatus();
    this.ameliaService.fetchTitleTrainings("main").then(
      (data) => {},
      (error) => {
        console.log("Failed to fetch training data on startup!", error);
      }
    );
    this.ameliaService.fetchTitleTrainings("second").then(
      (data) => {},
      (error) => {
        console.log("Failed to fetch training data on startup!", error);
      }
    );

    this.checkAppVersion();
  }

  checkAppVersion() {
    this.httpClient.get<{ latestVersion: string}> (this.latestVersionUrl).subscribe((data) => {
      const latestVersion = data.latestVersion;
      if (this.isOutdated(this.currentVesion, latestVersion)) {
        this.isUpdateDialogVisible = true;
      }
    });
  }

  isOutdated(current: string, latest: string): boolean {
    return current.localeCompare(latest, undefined, {numeric: true}) < 0;
  }

  updateApp() {
    window.open('https://play.google.com/store/apps/details?id=io.kstudio.os'); //For Android
    //window.open('https://apps.apple.com/us/app/kstudio/id6737809810'); // For iPhone
  }

  checkLoginStatus() {
    if (!this.authService.isLoggedIn()){
      this.router.navigate(['/login']);
    }
  }
}

