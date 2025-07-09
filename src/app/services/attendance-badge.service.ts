import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AttendanceBadgeService {
  // A BehaviorSubject holds the current value of the badge count (initially 0).
  private badgeCount = new BehaviorSubject<number>(0);

  // Expose the badge count as a public observable for components to subscribe to.
  public badgeCount$: Observable<number> = this.badgeCount.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Fetches past trainings from the API and updates the badge count.
   * This should be called when the app/main tabs page loads.
   */
  async fetchAndSetBadgeCount() {
    const url = `https://k-studio.co.il/wp-json/custom-api/v1/past-trainings`;
    let params = new HttpParams();
    const userRole = this.authService.getUserRole();
    const userEmail = this.authService.getUserEmail();

    if (userRole === 'team' && userEmail) {
      params = params.set('trainer_email', userEmail);
    }

    try {
      const trainings = await firstValueFrom(this.http.get<any[]>(url, { params }));
      const unsubmittedCount = trainings.filter(t => !t.hasBeenSubmitted).length;
      
      // Push the new count to all subscribers.
      this.badgeCount.next(unsubmittedCount);
    } catch (error) {
      console.error('Error fetching data for badge count', error);
      this.badgeCount.next(0); // Reset on error
    }
  }

  /**
   * Manually updates the count from a list that is already loaded.
   * @param trainings The array of past trainings.
   */
  updateCountFromLoadedData(trainings: any[]) {
    const unsubmittedCount = trainings.filter(t => !t.hasBeenSubmitted).length;
    this.badgeCount.next(unsubmittedCount);
  }
}