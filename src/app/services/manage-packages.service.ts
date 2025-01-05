import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ManagePackagesService {
  private customApiURL = "https://k-studio.co.il/wp-json/custom-api/v1";
  
  constructor(private http: HttpClient) { }

  //Users Functions

  getAllUsers(): Observable<any> {
    const url = `${this.customApiURL}/users`;    
    return this.http.get(url);
  }


  //Packages Functions

  getAllPackages():Observable<any> {
    const url = `${this.customApiURL}/users-packages`;
    return this.http.get(url);
  }

  getUserPackages(customerId: string): Observable<any> {
    const url = `https://k-studio.co.il/wp-json/wn/v1/package-purchases/${customerId}`;
    return this.http.get(url);
  }

  getFilteredAppointments(startDate: string, endDate: string, packageCustomerId: number): Observable<any> {
    console.log("start date:", startDate)
    const url = `${this.customApiURL}/appointments?startDate=${startDate}&endDate=${endDate}&packageCustomerId=${packageCustomerId}`;
    console.log("url", url)
    return this.http.get(url);
  }

  cancelAppointment(bookingId: string): Observable<any> {
    const url = `https://k-studio.co.il/wp-json/wn/v1/cancel-booking/${bookingId}`;
    return this.http.post(url, {});
  }

  getAppointments(packageCustomerId: number, purchased: string): Observable<any> {
    const startDate = purchased.split(' ')[0]; // Extract date from purchased timestamp
    const endDate = this.calculateEndDate(startDate); // Define a method to calculate endDate (e.g., +30 days)
    const url = `${this.customApiURL}/appointments?startDate=${startDate}&endDate=${endDate}&packageCustomerId=${packageCustomerId}`;
    return this.http.get(url);
  }
  
  // Helper method to calculate the end date
  calculateEndDate(startDate: string): string {
    const date = new Date(startDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0]; // Return only the date part
  }



  //Subscription Functions

  getSubscriptionDetails(userId: string): Observable<any> {
    const url = `${this.customApiURL}/subscription?user_id=${userId}`;
    return this.http.get(url);
  }

  getSubscriptionDetailsBySubscriptionID(subscriptionId: string): Observable<any> {
    const url = `${this.customApiURL}/subscriptionById/${subscriptionId}`;
    return this.http.get(url);
  }

  updateSubscriptionStatus(subscriptionID: string, action: string): Observable<any> {
    const url = `${this.customApiURL}/subscription-action?subscription_id=${subscriptionID}&action=${action}`;
    return this.http.get(url); // Sending an empty body since parameters are in the URL
  }

  updateRenewalDate(subscriptionId: string, nextRenewal: string): Observable<any> {
    const url = `${this.customApiURL}/subscription/${subscriptionId}/renewal/${nextRenewal}`;
    return this.http.post(url, {}); // No body needed as data is passed in the URL
  }

}
