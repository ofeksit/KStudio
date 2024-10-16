import { booleanAttribute, Component, OnInit } from '@angular/core';
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
  constructor(
    private ameliaService: AmeliaService, 
    private authService: AuthService, 
    private router: Router, 
    private platform: Platform,
      ) {
    
    this.platform.ready().then(() => {
      //this.setupOneSignal();
      
    })
    // Force light theme on app startup
    document.body.setAttribute('data-theme', 'light');
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

