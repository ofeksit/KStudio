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
   * @param trainerId The Amelia Employee ID of the trainer submitting.
   * @param attendance The list of customers and their status.
   */
  saveAttendance(appointmentId: number, trainerId: number, attendance: { name: string, status: string }[]): Observable<any> {
    const payload = {
      appointment_id: appointmentId,
      trainer_id: trainerId,
      attendance: attendance
    };
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