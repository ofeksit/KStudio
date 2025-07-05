import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service'; // Adjust path if needed
import { AttendanceService } from '../../services/attendance.service'; // Adjust path if needed

@Component({
  selector: 'app-attendance-dashboard',
  templateUrl: './attendance-dashboard.page.html',
  styleUrls: ['./attendance-dashboard.page.scss'],
})
export class AttendanceDashboardPage implements OnInit {
  
  isLoading = true;
  filterSegment = 'past';
  allTrainings: any[] = [];
  filteredTrainings: any[] = [];
  trainerProviderId: number | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private attendanceService: AttendanceService,
    private router: Router
  ) {}

  ngOnInit() {
    this.trainerProviderId = this.authService.getProviderId(); // Assuming this method exists
    this.loadTrainings();
  }

  async loadTrainings() {
    if (!this.trainerProviderId) {
      console.error("Trainer Provider ID not found.");
      this.isLoading = false;
      return;
    }
    
    this.isLoading = true;
    const userId = this.authService.getUserID();
    const location = encodeURIComponent(this.authService.getUserFavLocation() || 'בן יהודה');
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Fetch upcoming 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Fetch past 30 days

    const url = `https://k-studio.co.il/wp-json/custom-api/v1/get-trainings?startDate=${this.formatDate(startDate)}&endDate=${this.formatDate(endDate)}&userID=${userId}&location=${location}`;

    try {
      const allData = await firstValueFrom(this.http.get<any[]>(url));
      this.allTrainings = allData.filter(t => t.providerId === this.trainerProviderId && t.type === 'appointment');
      
      for (const training of this.allTrainings) {
        const attendance = await firstValueFrom(this.attendanceService.getAttendance(training.id));
        training.hasBeenSubmitted = attendance && attendance.length > 0;
      }

      this.segmentChanged(); // Apply initial filter
    } catch (error) {
      console.error("Error loading trainings", error);
    } finally {
      this.isLoading = false;
    }
  }

  segmentChanged() {
    const now = new Date();
    if (this.filterSegment === 'past') {
      this.filteredTrainings = this.allTrainings
        .filter(t => new Date(t.start_time) < now)
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
    } else { // Upcoming
      this.filteredTrainings = this.allTrainings
        .filter(t => new Date(t.start_time) >= now)
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    }
  }

  isPast(dateString: string): boolean {
    return new Date(dateString) < new Date();
  }

  openAttendanceMarker(training: any) {
    if (this.isPast(training.start_time) && !training.hasBeenSubmitted) {
      // Navigate to the marker page, passing the training data
      this.router.navigate(['/trainer/attendance-marker'], {
        state: { training: training }
      });
    }
  }
  
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}