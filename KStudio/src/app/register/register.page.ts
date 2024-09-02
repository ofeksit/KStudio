import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
})
export class RegisterPage {
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    if (this.password !== this.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }

    this.authService.register(this.username, this.email, this.password)
      .subscribe(
        response => {
          if (response.status === 'success') {
            console.log('Registration successful');
            this.router.navigate(['/login']); // Navigate to login page after registration
          } else {
            console.error('Registration failed', response.message);
          }
        },
        error => {
          console.error('Registration error', error);
        }
      );
  }
}
