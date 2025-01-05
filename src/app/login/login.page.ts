import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { throwError, of } from 'rxjs';
import { ToastController } from '@ionic/angular';
import { Keyboard } from '@capacitor/keyboard';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  showToast: boolean = false;
  toastMessage: string = '';
  toastColor: string = 'success';
  showProgressBar: boolean = false;
  isLoading: boolean = false; // Track loading state

  // Variables for toggling password visibility
  passwordType: string = 'password';  // default password type
  passwordIcon: string = 'eye-off';   // default icon

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private toastController: ToastController
  ) {
    // Listen for the keyboard to open
    Keyboard.addListener('keyboardWillShow', () => {
      console.log('Keyboard is opening');
      document.body.classList.add('keyboard-open'); // Add a class to handle keyboard behavior
    });

    // Listen for the keyboard to close
    Keyboard.addListener('keyboardWillHide', () => {
      console.log('Keyboard is closing');
      document.body.classList.remove('keyboard-open');
    });
  }

  async presentToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000, // Duration in milliseconds
      color: color,
      position: 'top',
    });
    await toast.present(); // Make sure the toast is presented
  }

  login() {
    if (!this.username || !this.password) {
        this.errorMessage = 'אנא מלא את שם המשתמש והסיסמה';
        this.presentToast(this.errorMessage, 'danger');
        return;
    }

    // Set loading state to true
    this.isLoading = true;

    this.authService.login(this.username, this.password).pipe(
      switchMap((response: any) => {
          // Store token, ID, and email in local storage
          this.authService.storeToken(response.data.token);
          this.authService.storeUserID(response.data.id);
          this.authService.storeUserEmail(response.data.email);
  
          const headers = new HttpHeaders({
              'Authorization': `Bearer ${response.data.token}`
          });
  
          // First request: Get user details
          return this.http.get(`https://k-studio.co.il/wp-json/wp/v2/users/me`, { headers });
      }),
      switchMap((userDetails: any) => {
          // Store user details in local storage
          this.authService.storeUserFullName(userDetails.name);
          this.authService.storeUserGamiPts(userDetails.meta._gamipress_pts_points);
  
          const headers = new HttpHeaders({
              'Authorization': `Bearer ${this.authService.getToken()}`
          });
  
          // Second request: Get user role
          return this.http.get(`https://k-studio.co.il/wp-json/custom-api/v1/user-role/${userDetails.id}`, { headers });
      }),
      switchMap((userRoleResponse: any) => {
          // Store user role in local storage
          const userRole = userRoleResponse.roles[0];
          this.authService.storeUserRole(userRole);
  
          // If user is administrator, skip Amelia API calls and return a dummy response
          if (userRole === 'administrator') {
              return of({ 
                  skipAmelia: true,
                  customerId: null,
                  packages: []
              });
          }
  
          // For non-administrators, proceed with Amelia API calls
          const userEmail = this.authService.getUserEmail();
          const ameliaApiUrl = `https://k-studio.co.il/wp-json/custom-api/v1/amelia-customer-id?email=${userEmail}`;
          return this.http.get(ameliaApiUrl);
      }),
      switchMap((ameliaResponse: any) => {
          // Skip package fetching for administrators
          if (ameliaResponse.skipAmelia) {
              return of(ameliaResponse);
          }
  
          // Store the customer ID in local storage if the Amelia API call was successful
          if (ameliaResponse && ameliaResponse.customerId) {
              this.authService.storeCustomerID(ameliaResponse.customerId);
          }
  
          // Fetch packageCustomerId using the Amelia customerId
          const packageApiUrl = `https://k-studio.co.il/wp-json/wn/v1/package-purchases/${ameliaResponse.customerId}`;
          return this.http.get(packageApiUrl);
      }),
      switchMap((packageResponse: any) => {
          // Skip for administrators
          if (packageResponse.skipAmelia) {
              return of(packageResponse);
          }
  
          console.log("package response:", packageResponse);
          // Extract the packageCustomerId and store it in local storage
          if (packageResponse && packageResponse.data && packageResponse.data[0] && 
              packageResponse.data[0].packages[0] && 
              packageResponse.data[0].packages[0].purchases[0] && 
              packageResponse.data[0].packages[0].purchases[0].packageCustomerId) {
              const packageCustomerId = packageResponse.data[0].packages[0].purchases[0].packageCustomerId;
              console.log("packageID:", packageCustomerId);
              this.authService.storePackageCustomerID(packageCustomerId);
          }
  
          // Fetch favorite location
          const favLocationApiUrl = `https://k-studio.co.il/wp-json/custom-api/v1/get-favorite-location?user_id=${this.authService.getUserID()}`;
          return this.http.get(favLocationApiUrl);
      }),
      tap((favLocationResponse: any) => {
          // Skip for administrators
          if (favLocationResponse.skipAmelia) {
              return;
          }
  
          console.log("favlocation", favLocationResponse);
          console.log("favlocation", favLocationResponse.favorite_location);
          // Store favorite location in local storage
          if (favLocationResponse && favLocationResponse.favorite_location) {
              this.authService.storeFavLocation(favLocationResponse.favorite_location);
          }
      }),
      catchError(error => {
          console.error('Error occurred during login process:', error);
          this.authService.logout(); // Ensure we clear the token
  
          if (error.status === 401 || error.status === 403) {
              // Incorrect username/password
              this.errorMessage = 'שם משתמש או סיסמה שגויים.';
              this.presentToast(this.errorMessage, 'danger');
          } else {
              // Handle all other errors (e.g., during data fetching)
              this.errorMessage = 'אירעה שגיאה, אנא נסה שנית';
              this.presentToast(this.errorMessage, 'medium'); // Grey alert
          }
  
          // Set loading state back to false on error
          this.isLoading = false;
  
          return throwError(error); // Propagate the error to stop the success flow
      })
  ).subscribe(
        async () => {
            // Show progress bar or navigate to home page after delay
            this.showProgressBar = true;

            setTimeout(() => {
                this.router.navigate(['/home']);
                this.showProgressBar = false;
            }, 1500);

            // Set loading state back to false after success
            this.isLoading = false;
        },
        (error) => {
            // This should no longer be triggered because the catchError handles all errors
            console.error('An unexpected error occurred in subscribe:', error);

            // Set loading state back to false on unexpected error
            this.isLoading = false;
        }
    );
}



  // Toggle password visibility
  togglePasswordVisibility() {
    this.passwordType = this.passwordType === 'password' ? 'text' : 'password';
    this.passwordIcon = this.passwordIcon === 'eye-off' ? 'eye' : 'eye-off';
  }

  forgotPassword() {
    console.log('Forgot password clicked');
  }

  scrollToInput(event: any) {
    const element = event.target;
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }, 300); // Adjust the timeout if needed
  }
}
