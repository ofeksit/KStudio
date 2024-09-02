import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  username: string = '';
  password: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (!this.username || !this.password) {
      console.error('Username and password are required');
      return;
    }

    this.authService.login(this.username, this.password)
      .subscribe(
        response => {
          if (response.status === 'success') {
            console.log('Login successful');
            // You can store the user's session token, ID, etc. in local storage or a service
            // Redirect to the dashboard or home page
            this.router.navigate(['/dashboard']); // Replace with your desired route
          } else {
            console.error('Login failed', response.message);
          }
        },
        error => {
          console.error('Login error', error);
        }
      );
  }
}
