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
  private weeklyMain:   Record<string, {time: string; title: string}[]> = {};
  private weeklySecond: Record<string, {time: string; title: string}[]> = {};

  // Provider ID to Name mapping - customize these as needed
  private providerNames: Record<number, string> = {
    169: 'בן יהודה',
    172: 'בן יהודה',
    643: 'הירקון',
    644: 'הירקון'
    // Add more provider mappings as needed
  };

  getProviderClass(providerName: string): string {
  switch (providerName) {
    case 'בן יהודה':
      return 'provider-ben-yehuda';
    case 'הירקון':
      return 'provider-hayarkon';
    case 'דיזנגוף':
      return 'provider-dizengoff';
    case 'רוטשילד':
      return 'provider-rothschild';
    case 'אלנבי':
      return 'provider-allenby';
    case 'כרמל':
      return 'provider-carmel';
    default:
      return '';
  }
}

  constructor(
    private http: HttpClient,
    private modalCtrl: ModalController,    
    private authService: AuthService,
    private attendanceBadgeService: AttendanceBadgeService
  ) {
    this.userRole = this.authService.getUserRole();
  }

  // Method to get provider name by ID
  getProviderName(providerId: number): string {
    return this.providerNames[providerId] || `ספק ${providerId}`;
  }

  private pullWeeklyFromStorage() {
    try {
      this.weeklyMain   = JSON.parse(localStorage.getItem('weeklyTrainings_main')   ?? '{}');
      this.weeklySecond = JSON.parse(localStorage.getItem('weeklyTrainings_second') ?? '{}');
    } catch { /* no schedule yet – leave objects empty */ }
  }

  ngOnInit() {
    this.pullWeeklyFromStorage();
    console.log("weekly main:", this.weeklyMain);
    console.log("weekly second:", this.weeklySecond);
    this.loadInitialData();
  }

  scheduleForProvider(id?: number) {
    console.log("ID is:", id);
    // Check which schedule actually contains the data for this provider
    if (id === 169) return this.weeklySecond;  // Based on your debug output
    if (id === 172) return this.weeklySecond;    // Adjust as needed
    return this.weeklyMain; // default
  }

async enrichTraining(t: any): Promise<void> {
    // 1️⃣  Provider already present – no need to hit the API again
    if (t.providerId) {
      t.providerName = this.getProviderName(t.providerId);
      const title = this.lookupTitle(t.start_time, t.providerId);
      if (title) t.training_name = title;
      return;
    }

    // 2️⃣  Fallback – older objects that came without providerId
    try {
      const details: any = await firstValueFrom(
        this.http.get(`https://k-studio.co.il/wp-json/custom-api/v1/appointment/${t.id}`)
      );
      t.providerId   = details?.providerId ?? null;
      t.providerName = this.getProviderName(t.providerId);
      const title    = this.lookupTitle(t.start_time, t.providerId);
      if (title) t.training_name = title;
    } catch (err) {
      console.warn('enrichTraining failed', t.id, err);
    }
  }

  lookupTitle(startIso: string, providerId?: number): string | null {
    console.log('lookupTitle called with:', { startIso, providerId });
    const dn = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const d = new Date(startIso);
    const day = dn[d.getDay()];   
    const hhmm = d.toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'});
    const schedule = this.scheduleForProvider(providerId);
    const slot = schedule[day]?.find(s => s.time === hhmm);    
    return slot ? slot.title : null;
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
    const params = new HttpParams().set('days', '7');
    this.isLoadingUpcoming = true;
    try {
    const raw = await firstValueFrom(
      this.http.get<any[]>(
        'https://k-studio.co.il/wp-json/custom-api/v1/upcoming-trainings',
        { params }              // <-- added
      )
    );

      await Promise.all(raw.map(t => this.enrichTraining(t)));
      this.upcomingTrainings = raw;
      console.log("upcomingTrainings:", this.upcomingTrainings)
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
    console.log("pastTrainings:", this.pastTrainings)
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
        training: { id: training.id, name: training.training_name, start_time: training.start_time, trainer_name: training.trainer_name }
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
        console.log("freshTraining:", freshTrainingData)
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