import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError} from 'rxjs';
import { catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://new.k-studio.co.il';  // Base URL for your backend

  constructor(private http: HttpClient) { }

  // User Authentication
  login(username: string, password: string): Observable<any> {
    const payload = { username, password };
    return this.http.post(`${this.apiUrl}/login.php`, payload);
  }

  // Fetch User Profile
  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getUserProfile.php`);
  }

  // Fetch User's Enrolled Trainings
  getEnrolledTrainings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getEnrolledTrainings.php`);
  }

  // Logout User
  logout(): void {
    this.http.get(`${this.apiUrl}/logout.php`)
      .subscribe(() => {
        console.log('User logged out successfully');
        // Optionally, navigate the user to the login page or clear local storage
      }, error => {
        console.error('Logout failed', error);
      });
  }

  // Fetch All Trainings (for Admin)
  getTrainings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getTrainings.php`);
  }

  // Add New Training (for Admin)
  addTraining(trainingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addTraining.php`, trainingData);
  }

  // Edit Existing Training (for Admin)
  editTraining(trainingId: number, trainingData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/editTraining.php`, { trainingId, ...trainingData });
  }

  // Delete Training (for Admin)
  deleteTraining(trainingId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/deleteTraining.php`, { trainingId });
  }

  // Fetch All Enrollments (for Admin)
  getEnrollments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getEnrollments.php`);
  }

  // Cancel User Enrollment (for Admin)
  cancelEnrollment(enrollmentId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cancelEnrollment.php`, { enrollmentId });
  }

  // Send Notifications (for Admin)
  sendNotification(message: string): Observable<any> {
    const payload = { message };
    return this.http.post(`${this.apiUrl}/sendNotification.php`, payload);
  }


  // Register a new user
  register(username: string, email: string, password: string): Observable<any> {
    const payload = { username, email, password };
    return this.http.post(`${this.apiUrl}/register.php`, payload);
  }

  // Fetch all users
  getUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/getUsers.php`)
      .pipe(
        catchError(error => {
          console.error('Error fetching users:', error);
          return throwError(error);
        })
      );
  }

  // Add a new user
  addUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/addUser.php`, userData);
  }

  // Edit an existing user
  editUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/editUser.php`, userData);
  }

  // Delete a user
  deleteUser(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/deleteUser.php`, { userId });
  }
}
