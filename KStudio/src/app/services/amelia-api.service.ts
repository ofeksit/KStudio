import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AmeliaApiService {

  private apiUrl = 'https://k-studio.co.il/wp-admin/admin-ajax.php?action=wpamelia_api&call=/api/v1'; // Adjust to your API endpoint
  private apiKey = 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk'; // Add your Amelia API key here if required

  constructor(private http: HttpClient) { }

  // Get all appointments (for all users)
  getAllAppointments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/appointments`, {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });
  }

  // Enroll a user in a training
  enrollInTraining(appointmentId: string, userId: string): Observable<any> {
    const body = { appointment: appointmentId, user: userId };
    return this.http.post(`${this.apiUrl}/appointments/enroll`, body, {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    });
  }

}
