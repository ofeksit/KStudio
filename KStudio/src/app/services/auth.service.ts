import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://k-studio.co.il/wp-json/jwt-auth/v1/token';
  private apiUrlExtended = 'https://k-studio.co.il/wp-json/wp/v2/users/me'
  private getAmeliaUserIDURL = '/api/users/customers&page=1&search=';
  
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, {
      username,
      password
    });
  }

  storeToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  storeCustomerID(customerID: string): void {
    localStorage.setItem('customer_id', customerID);
  }
  storeUserID(userID: string): void {
    localStorage.setItem('user_id', userID);
  }

  storeUserEmail(userEmail: string): void {
    localStorage.setItem('user_email', userEmail);
  }

  storeUserRole (userRole: string) {
    localStorage.setItem('user_role', userRole);
  }

  storeUserFullName (userFullname: string) {
    localStorage.setItem('user_fullname', userFullname);
  }

  storeUserGamiPts(userGamiPts: string){
    localStorage.setItem('user_gami', userGamiPts);
  }


  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUserID(): string | null {
    return localStorage.getItem('user_id');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('user_email');
  }

  getUserRole(): string | null{
    return localStorage.getItem('user_role');
  }

  getUserFullName(): string | null {
    return localStorage.getItem('user_fullname');
  }

  getUserGamiPts(): string | null {
    return localStorage.getItem('user_gami');
  }

  getCustomerID(): string | null {
    return localStorage.getItem('customer_id');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token;  // Check if token exists and return true/false
  }
  

}
