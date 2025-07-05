import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { AttendanceService } from '../../services/attendance.service';
import { AuthService } from '../../services/auth.service';

interface CustomerAttendance {
  name: string;
  status: 'attended' | 'absent' | 'pending';
}

@Component({
  selector: 'app-attendance-marker',
  templateUrl: './attendance-marker.page.html',
  styleUrls: ['./attendance-marker.page.scss'],
})
export class AttendanceMarkerPage implements OnInit {
  
  training: any;
  attendanceList: CustomerAttendance[] = [];
  isSubmitting = false;

  constructor(
    private router: Router,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private toastController: ToastController,
    private navCtrl: NavController
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state?.['training']) {
      this.training = navigation.extras.state['training'];
    }
  }

  ngOnInit() {
    if (this.training && this.training.current_participants) {
      this.attendanceList = this.training.current_participants.map((name: string) => ({
        name: name,
        status: 'pending'
      }));
    }
  }

  markStatus(customer: CustomerAttendance, status: 'attended' | 'absent') {
    customer.status = status;
  }

  isReadyToSubmit(): boolean {
    return this.attendanceList.every(c => c.status !== 'pending');
  }

  async submitAttendance() {
    this.isSubmitting = true;
    const trainerId = this.authService.getProviderId();

    if (!trainerId) {
      console.error("Cannot submit, trainer ID is missing.");
      this.isSubmitting = false;
      return;
    }
    
    const dataToSubmit = this.attendanceList.map(c => ({ name: c.name, status: c.status }));

    this.attendanceService.saveAttendance(this.training.id, trainerId, dataToSubmit).subscribe({
      next: async (res) => {
        await this.presentToast('Attendance submitted successfully!', 'success');
        this.navCtrl.back(); // Go back to the previous page
      },
      error: async (err) => {
        console.error("Submission failed", err);
        await this.presentToast('Submission failed. Please try again.', 'danger');
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color
    });
    toast.present();
  }
}