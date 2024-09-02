import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit {
  user: any = {};  // Replace with the correct user model
  enrolledTrainings: any[] = [];  // Replace with the correct training model

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadEnrolledTrainings();
  }

  loadUserProfile() {
    // Fetch user profile from the server or use the data from the AuthService
    this.authService.getUserProfile().subscribe(data => {
      this.user = data;
    });
  }

  loadEnrolledTrainings() {
    // Fetch enrolled trainings for the user
    this.authService.getEnrolledTrainings().subscribe(data => {
      this.enrolledTrainings = data;
    });
  }

  changePassword() {
    // Implement password change logic
  }

  cancelEnrollment(trainingId: number) {
    // Implement enrollment cancellation logic
  }

  logout() {
    this.authService.logout();
  }
}
