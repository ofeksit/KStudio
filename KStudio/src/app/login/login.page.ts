import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';  // For navigation after login
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  username: string = '';
  password: string = '';
  errorMessage: string = '';  // To display login errors if any
  showToast: boolean = false;
  toastMessage: string = '';
  toastColor: string = 'success';
  showProgressBar: boolean = false;

  constructor(private authService: AuthService, private router: Router, private http: HttpClient, private toastController: ToastController) {}

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }

  login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter both username and password';
      this.presentToast(this.errorMessage, 'danger');  // Show error toast
      return;
    }

    // First HTTP request: Login and retrieve token
    this.authService.login(this.username, this.password).pipe(
      switchMap((response: any) => {
        // Store the token and user ID
        this.authService.storeToken(response.data.token);
        this.authService.storeUserID(response.data.id);
        this.authService.storeUserEmail(response.data.email);

        console.log("token", response.data.token);
        console.log("id", response.data.id);
        console.log("email", response.data.email);

        // Second HTTP request: Fetch user details after token is stored
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${response.data.token}`
        });

        return this.http.get(`https://k-studio.co.il/wp-json/wp/v2/users/me`, { headers });
      }),
      catchError(error => {
        // Handle errors during either login or user details fetching
        this.errorMessage = 'Login failed or unable to retrieve user details';
        console.error('Error:', error);
        this.presentToast(this.errorMessage, 'danger');  // Show error toast
        return throwError(error);  // Throw error to stop execution
      })
    ).subscribe(
      (userDetails: any) => {
        // Handle successful response for user details
        console.log('User details fetched successfully!', userDetails);
        this.authService.storeUserRole(userDetails.slug);
        this.authService.storeUserFullName(userDetails.name);
        this.authService.storeUserGamiPts(userDetails.meta._gamipress_pts_points);

        // Show success toast and progress bar
        this.toastMessage = 'Login successful!';
        this.toastColor = 'success';
        this.showProgressBar = true;
        this.presentToast(this.toastMessage, this.toastColor);

        // Redirect to homepage after a small delay
        setTimeout(() => {
          this.router.navigate(['/home']);
          this.showProgressBar = false;
        }, 3000);  // 3 seconds delay
      },
      (error) => {
        this.errorMessage = 'Unable to fetch user details';
        console.error('Error fetching user details:', error);
        this.presentToast(this.errorMessage, 'danger');  // Show error toast
      }
    );
  }

  forgotPassword() {
    // Logic for forgot password functionality
    console.log('Forgot password clicked');
  }
}
