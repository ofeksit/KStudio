import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = 'https://k-studio.co.il/wp-json/custom-api/v1'; // Your WordPress API URL

  constructor(private http: HttpClient) { }

  /**
   * Saves the attendance data for a specific appointment.
   * @param appointmentId The ID of the training/appointment.
   * @param trainerEmail The email of the trainer submitting.
   * @param attendance The list of customers and their status.
   */
  saveAttendance(appointmentId: number, trainerEmail: string, attendance: { name: string, status: string }[]): Observable<any> {
    const payload = {
      appointment_id: appointmentId,
      // Note: We send trainer_email but the backend handler will get the ID from it if needed.
      // For our current setup, the email is stored.
      trainer_email: trainerEmail, 
      attendance: attendance
    };
    // This endpoint must match the one you created in api-endpoints.php
    return this.http.post(`${this.apiUrl}/attendance`, payload);
  }

  /**
   * Gets the previously submitted attendance for a training.
   * @param appointmentId The ID of the training/appointment.
   */
  getAttendance(appointmentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/attendance/${appointmentId}`);
  }
}