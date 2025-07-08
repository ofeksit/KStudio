import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../services/auth.service';

interface Attendee {
  id: number;
  name: string;
  status: 'attended' | 'absent' | 'not_marked';
}

@Component({
  selector: 'app-attendance-marker',
  templateUrl: './attendance-marker.component.html',
  styleUrls: ['./attendance-marker.component.scss'],
})
export class AttendanceMarkerComponent implements OnInit {

  @Input() training: any;
  
  isLoading = true;
  isSaving = false;
  hasChanges = false;
  
  attendees: Attendee[] = [];
  initialStatuses = new Map<number, string>();

  presentCount = 0;
  absentCount = 0;
  notMarkedCount = 0;

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    private authService: AuthService,
    private toastCtrl: ToastController
  ) { }

  ngOnInit() {
    this.loadAttendees();
  }

  async loadAttendees() {
    this.isLoading = true;
    const url = `https://k-studio.co.il/wp-json/custom-api/v1/training-attendees/${this.training.id}`;
    try {
      const result = await firstValueFrom(this.http.get<Attendee[]>(url));
      this.attendees = result;
      this.attendees.forEach(att => this.initialStatuses.set(att.id, att.status));
      this.updateSummary();
    } catch (error) {
      console.error("Error loading attendees", error);
      this.presentToast('Failed to load attendees.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }
  
  markStatus(customer: Attendee, status: 'attended' | 'absent') {
    // If the status is already set, clicking again will set it to 'not_marked'
    if (customer.status === status) {
        customer.status = 'not_marked';
    } else {
        customer.status = status;
    }
    this.checkForChanges();
    this.updateSummary();
  }

  checkForChanges() {
    this.hasChanges = false;
    for (const attendee of this.attendees) {
        if (attendee.status !== this.initialStatuses.get(attendee.id)) {
            this.hasChanges = true;
            return;
        }
    }
  }

  updateSummary() {
    this.presentCount = this.attendees.filter(a => a.status === 'attended').length;
    this.absentCount = this.attendees.filter(a => a.status === 'absent').length;
    this.notMarkedCount = this.attendees.filter(a => a.status === 'not_marked').length;
  }
  
  async saveAttendance() {
    this.isSaving = true;
    const url = `https://k-studio.co.il/wp-json/custom-api/v1/save-attendance`;
    const payload = {
        appointmentId: this.training.id,
        trainerEmail: this.authService.getUserEmail(),
        attendance: this.attendees.filter(a => a.status !== 'not_marked') // Only send marked attendees
    };

    try {
        await firstValueFrom(this.http.post(url, payload));
        this.presentToast('הנוכחות נשמרה בהצלחה!', 'success');
        this.modalCtrl.dismiss({ saved: true }); // Pass data back to indicate success
    } catch (error) {
        console.error('Error saving attendance', error);
        this.presentToast('שגיאה בשמירת הנוכחות.', 'danger');
    } finally {
        this.isSaving = false;
    }
  }

  // --- UI Helper Methods ---
  
  getStatusText(status: string): string {
    switch (status) {
      case 'attended': return 'נוכח/ת';
      case 'absent': return 'נעדר/ת';
      default: return 'לא סומן';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'attended': return 'success';
      case 'absent': return 'danger';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'attended': return 'checkmark-circle-outline';
      case 'absent': return 'close-circle-outline';
      default: return 'ellipse-outline';
    }
  }
  
  trackById(index: number, item: Attendee): number {
    return item.id;
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'top'
    });
    toast.present();
  }

  closeModal() {
    this.modalCtrl.dismiss({ saved: false });
  }
}