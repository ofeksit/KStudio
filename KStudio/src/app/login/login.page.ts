import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, switchMap, switchMapTo } from 'rxjs/operators';
import { throwError } from 'rxjs';
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

  // Variables for toggling password visibility
  passwordType: string = 'password';  // default password type
  passwordIcon: string = 'eye-off';   // default icon

  constructor(private authService: AuthService, private router: Router, private http: HttpClient, private toastController: ToastController) {
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
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }

  login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'אנא מלא את שם המשתמש והסיסמה';
      this.presentToast(this.errorMessage, 'danger');
      return;
    }
  
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
          'Authorization': `Bearer ${this.authService.getToken()}` // Get token from local storage
        });
  
        // Second request: Get user role
        return this.http.get(`https://k-studio.co.il/wp-json/custom-api/v1/user-role/${userDetails.id}`, { headers });
      }),
      switchMap((userRoleResponse: any) => {
        // Store user role in local storage
        this.authService.storeUserRole(userRoleResponse.roles[0]);
  
        // Now fetch customer ID from WordPress custom API using the stored email
        const userEmail = this.authService.getUserEmail();
  
        // Custom WordPress endpoint to fetch customer ID from Amelia
        const customEndpoint = `https://k-studio.co.il/wp-json/custom-api/v1/get-customer-id?email=${userEmail}`;
        
        return this.http.get(customEndpoint); // Call the custom WordPress API endpoint
      }),
      switchMap((customerData: any) => {
        // Store the customer ID in local storage
        if (customerData && customerData.customerId) {
          this.authService.storeCustomerID(customerData.customerId);
        }
        return []; // Return empty array to finish
      }),
      catchError(error => {
        this.errorMessage = 'ההתחברות נכשלה';
        this.presentToast(this.errorMessage, 'danger');
        return throwError(error);
      })
    ).subscribe(
      () => {
        this.toastMessage = 'התחברת בהצלחה! הנך מועבר לדף הראשי';
        this.toastColor = 'success';
        this.showProgressBar = true;
        this.presentToast(this.toastMessage, this.toastColor);
  
        // Navigate to the home page after a delay
        setTimeout(() => {
          this.router.navigate(['/home']);
          this.showProgressBar = false;
        }, 3000);
      },
      (error) => {
        this.errorMessage = 'שם משתמש או סיסמה שגויים.';
        this.presentToast(this.errorMessage, 'danger');
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
