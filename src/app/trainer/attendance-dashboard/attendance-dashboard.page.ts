import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Import HttpParams
import { ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AttendanceMarkerComponent } from '../attendance-marker/attendance-marker.component';
import { AuthService } from '../../services/auth.service'; // Import AuthService
import { AttendanceBadgeService } from 'src/app/services/attendance-badge.service';
import { AssignTrainerModalComponent } from '../../trainer/assign-trainer-modal/assign-trainer-modal.component';
import { logOverlays } from '../../overlay-debug';   // adjust the path if needed



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
  AMELIA_API_KEY = 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk';
  private weeklyMain:   Record<string, {time: string; title: string}[]> = {};
  private weeklySecond: Record<string, {time: string; title: string}[]> = {};



  constructor(
    private http: HttpClient,
    private modalCtrl: ModalController,    
    private authService: AuthService,
    private attendanceBadgeService: AttendanceBadgeService
  ) {
    // THIS IS THE FIX: Get the role as soon as the component is created.
    this.userRole = this.authService.getUserRole();
  }

  private pullWeeklyFromStorage() {
    try {
      this.weeklyMain   = JSON.parse(localStorage.getItem('weeklyTrainings_main')   ?? '{}');
      this.weeklySecond = JSON.parse(localStorage.getItem('weeklyTrainings_second') ?? '{}');
    } catch { /* no schedule yet – leave objects empty */ }
  }

  ngOnInit() {
    this.pullWeeklyFromStorage()
    this.loadInitialData();
    console.log("pastTrainings:", this.pastTrainings);
  }

  scheduleForProvider(id?: number) {
    return [169, 172].includes(id ?? -1) ? this.weeklyMain : this.weeklySecond;
  }

  async enrichTraining(t: any): Promise<void> {
  try {
    const details: any = await firstValueFrom(
      this.http.get(
        `https://k-studio.co.il/wp-json/custom-api/v1/appointment/${t.id}`
      )
    );

    const pid = details?.data?.appointment?.providerId;
    t.providerId = pid;

    /* NEW – overwrite the name if we have one in the weekly schedule */
    const title = this.lookupTitle(t.start_time, pid);
    if (title) { t.training_name = title; }

  } catch (err) {
    console.warn('enrichTraining failed', t.id, err);
  }
}

  lookupTitle(startIso: string, providerId?: number): string | null {
    const dn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const d  = new Date(startIso.replace(' ', 'T'));        // ISO-safe parse
    const day = dn[d.getDay()];                             // e.g. "Sunday"
    const hhmm = d.toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'}); // "07:30"

    const slot = this.scheduleForProvider(providerId)[day]?.find(s => s.time === hhmm);
    return slot ? slot.title : null;
  }

  branchFromProvider(id: number): 'main' | 'second' {
  return [169, 172].includes(id) ? 'main' : 'second';
  }

  // attendance-dashboard.page.ts
  async openTrainerAssignmentModal(training: any) {
    (document.activeElement as HTMLElement)?.blur();

    const modal = await this.modalCtrl.create({
      component: AssignTrainerModalComponent,
      componentProps: { training },
      cssClass: 'popup-modal',
      breakpoints: [0, 0.95, 1],
      initialBreakpoint: 0.95,
      handle: true,
      backdropDismiss: false
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.assigned) {
      this.loadUpcomingTrainingsForAssignment();
    }
  }

  
  async loadUpcomingTrainingsForAssignment() {
    this.isLoadingUpcoming = true;
    try {
      const raw = await firstValueFrom(
        this.http.get<any[]>('https://k-studio.co.il/wp-json/custom-api/v1/upcoming-trainings')
      );

      await Promise.all(raw.map(t => this.enrichTraining(t)));   // <-- NEW
      this.upcomingTrainings = raw;
    } catch (err) {
      console.error('Error loading upcoming trainings', err);
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

      await Promise.all(newTrainings.map(t => this.enrichTraining(t))); // <-- NEW

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
      breakpoints: [0, 1],
      initialBreakpoint: 1
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.saved) {
      // Instead of guessing the status, fetch the single, updated training object from the server.
      try {
        const url = `https://k-studio.co.il/wp-json/custom-api/v1/past-training/${training.id}`;
        const freshTrainingData: any = await firstValueFrom(this.http.get(url));
        await this.enrichTraining(freshTrainingData);   // <-- add


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