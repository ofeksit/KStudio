import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Import HttpParams
import { ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AttendanceMarkerComponent } from '../attendance-marker/attendance-marker.component';
import { AuthService } from '../../services/auth.service'; // Import AuthService
import { AttendanceBadgeService } from 'src/app/services/attendance-badge.service';
import { AssignTrainerModalComponent } from '../../trainer/assign-trainer-modal/assign-trainer-modal.component';


@Component({
  selector: 'app-attendance-dashboard',
  templateUrl: './attendance-dashboard.page.html',
  styleUrls: ['./attendance-dashboard.page.scss'],
})
export class AttendanceDashboardPage implements OnInit {
  
  isLoading = true;
  pastTrainings: any[] = [];
  userRole: string | null = '';
  currentSegment: 'past' | 'upcoming' = 'past';
  isLoadingUpcoming = true;
  upcomingTrainings: any[] = [];
  pastTrainingsPage = 1;
  allPastTrainingsLoaded = false;

  constructor(
    private http: HttpClient,
    private modalCtrl: ModalController,
    private authService: AuthService,
    private attendanceBadgeService: AttendanceBadgeService
  ) {
    // THIS IS THE FIX: Get the role as soon as the component is created.
    this.userRole = this.authService.getUserRole();
  }

  ngOnInit() {
    this.loadInitialData();
    console.log("pastTrainings:", this.pastTrainings);
  }

    
  async openTrainerAssignmentModal(training: any) {
    const modal = await this.modalCtrl.create({
      component: AssignTrainerModalComponent,
      componentProps: {
        training: training
      },
      // ADD THIS CLASS AND REMOVE THE BREAKPOINTS
      cssClass: 'centered-assign-modal' 
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.assigned) {
      this.loadUpcomingTrainingsForAssignment();
    }
  }

    // --- NEW Method to load upcoming trainings ---
  // NOTE: This assumes you have a new API endpoint for this purpose.
  async loadUpcomingTrainingsForAssignment() {
    this.isLoadingUpcoming = true;
    const url = `https://k-studio.co.il/wp-json/custom-api/v1/upcoming-for-assignment`;
    try {
      this.upcomingTrainings = await firstValueFrom(this.http.get<any[]>(url));
    } catch (error) {
      console.error("Error loading upcoming trainings for assignment", error);
    } finally {
      this.isLoadingUpcoming = false;
    }
  }

    // --- NEW Method to handle segment changes ---
  segmentChanged(event: any) {
    this.currentSegment = event.detail.value;
  }

  async loadTrainings(event?: any) {
    // For the very first load, show the skeleton loader
    if (this.pastTrainingsPage === 1) {
      this.isLoading = true;
    }

    const url = `https://k-studio.co.il/wp-json/custom-api/v1/past-trainings`;
    let params = new HttpParams().set('page', this.pastTrainingsPage.toString());

    // ... your existing logic to set trainer_email param ...
    const userEmail = this.authService.getUserEmail();
    if (this.userRole === 'team' && userEmail) {
      params = params.set('trainer_email', userEmail);
    }

    try {
      const newTrainings = await firstValueFrom(this.http.get<any[]>(url, { params }));

      // Append new data instead of replacing it
      this.pastTrainings.push(...newTrainings);
      this.attendanceBadgeService.updateCountFromLoadedData(this.pastTrainings);

      // Check if all data has been loaded
      if (newTrainings.length < 15) { // 15 is the limit we set in the backend
        this.allPastTrainingsLoaded = true;
      }

      // Complete the infinite scroll event
      event?.target.complete();

    } catch (error) {
      console.error("Error loading past trainings", error);
    } finally {
      this.isLoading = false;
    }
  }

    // Add this new function to handle the infinite scroll event
  loadMorePastTrainings(event: any) {
    this.pastTrainingsPage++; // Increment the page number
    this.loadTrainings(event); // Load the next page
  }

  loadInitialData() {
    this.pastTrainings = []; // Reset array on initial load
    this.pastTrainingsPage = 1;
    this.allPastTrainingsLoaded = false;
    this.loadTrainings(); // Load first page

    if (this.userRole === 'administrator') {
      this.loadUpcomingTrainingsForAssignment();
    }
  }

  async openAttendanceMarker(training: any) {
    const modal = await this.modalCtrl.create({
      component: AttendanceMarkerComponent,
      componentProps: {
        training: { id: training.id, name: training.training_name, start_time: training.start_time }
      },
      cssClass: 'attendance-marker-modal',
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.saved) {
      // Instead of guessing the status, fetch the single, updated training object from the server.
      try {
        const url = `https://k-studio.co.il/wp-json/custom-api/v1/past-training/${training.id}`;
        const freshTrainingData: any = await firstValueFrom(this.http.get(url));

        // Find the index of the old training object in the array.
        const index = this.pastTrainings.findIndex(t => t.id === training.id);

        if (index !== -1) {
          // Replace the old, stale object with the fresh one. Angular will update the UI.
          this.pastTrainings[index] = freshTrainingData;

          // Now, update the badge count with the fully updated list.
          this.attendanceBadgeService.updateCountFromLoadedData(this.pastTrainings);
        }
      } catch (error) {
        console.error("Failed to refresh training data, reloading list as a fallback.", error);
        // If the single fetch fails, reload the whole list.
        this.loadInitialData();
      }
    }
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}