import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

interface TeamMember {
  email: string;
  name: string;
}

@Component({
  selector: 'app-assign-trainer-modal',
  templateUrl: './assign-trainer-modal.component.html',
  styleUrls: ['./assign-trainer-modal.component.scss'],
})
export class AssignTrainerModalComponent implements OnInit {
  @Input() training: any;
  

  teamMembers: TeamMember[] = [];
  selectedTrainerEmail: string = '';
  isLoading = true;
  isSaving = false;

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadTeamMembers();
  }

  async loadTeamMembers() {
    this.isLoading = true;
    const url = `https://k-studio.co.il/wp-json/custom-api/v1/team-members`;
    try {
      const response = await firstValueFrom(this.http.get<any[]>(url));
      this.teamMembers = response.map(member => ({
        email: member.email,
        name: member.name
      }));
      console.log('Team members loaded:', this.teamMembers);
    } catch (error) {
      console.error("Error loading team members", error);
      this.presentToast('Failed to load trainers.', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  trackByEmail(index: number, member: TeamMember): string {
    return member.email;
  }

  async saveAssignment() {
    if (!this.selectedTrainerEmail) {
      await this.modalCtrl.dismiss({ assigned: true });  // close first
      this.presentToast('Please select a trainer.', 'warning');
      return;
    }

    this.isSaving = true;
    const url = `https://k-studio.co.il/wp-json/custom-api/v1/assign-trainer`;
    const payload = {
      appointmentId: this.training.id,
      trainerEmail: this.selectedTrainerEmail,
    };

    try {
      await firstValueFrom(this.http.post(url, payload));
      this.presentToast('Trainer assigned successfully!', 'success');
      this.modalCtrl.dismiss({ assigned: true });
    } catch (error) {
      console.error('Error assigning trainer', error);
      this.presentToast('Error assigning trainer.', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'top',
    });
    toast.present();
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}