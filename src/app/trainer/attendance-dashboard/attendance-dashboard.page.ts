import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http'; // Import HttpParams
import { ModalController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AttendanceMarkerComponent } from '../attendance-marker/attendance-marker.component';
import { AuthService } from '../../services/auth.service'; // Import AuthService

@Component({
  selector: 'app-attendance-dashboard',
  templateUrl: './attendance-dashboard.page.html',
  styleUrls: ['./attendance-dashboard.page.scss'],
})
export class AttendanceDashboardPage implements OnInit {
  
  isLoading = true;
  pastTrainings: any[] = [];

  constructor(
    private http: HttpClient,
    private modalCtrl: ModalController,
    private authService: AuthService // Inject AuthService
  ) {}

  ngOnInit() {
    this.loadTrainings();
  }

  async loadTrainings(event?: any) {
    this.isLoading = true;
    const url = `https://k-studio.co.il/wp-json/custom-api/v1/past-trainings`;
    let params = new HttpParams();

    // Get user role and email from your AuthService
    const userRole = this.authService.getUserRole(); // Assuming this method exists
    const userEmail = this.authService.getUserEmail(); // Assuming this method exists

    // If the user's role is 'team', add their email to the request parameters
    if (userRole === 'team' && userEmail) {
      params = params.set('trainer_email', userEmail);
    }

    try {
      // Pass the params object in the http.get request
      this.pastTrainings = await firstValueFrom(this.http.get<any[]>(url, { params }));
    } catch (error) {
      console.error("Error loading past trainings", error);
    } finally {
      this.isLoading = false;
      if (event) {
        event.target.complete();
      }
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
      this.loadTrainings();
    }
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}