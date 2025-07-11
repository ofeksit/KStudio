import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

interface TeamMember {
  email: string;
  name: string;
}

interface TrainingWithTrainer {
  id: string;
  training_name: string;
  start_time: string;
  assigned_trainer?: {
    email: string;
    name: string;
  };
}

@Component({
  selector: 'app-assign-trainer-modal',
  templateUrl: './assign-trainer-modal.component.html',
  styleUrls: ['./assign-trainer-modal.component.scss'],
})
export class AssignTrainerModalComponent implements OnInit {
  @Input() training!: TrainingWithTrainer;
  
  teamMembers: TeamMember[] = [];
  selectedTrainerEmail: string = '';
  isLoading = true;
  isSaving = false;
  currentAssignedTrainer: TeamMember | null = null;

  constructor(
    private modalCtrl: ModalController,
    private http: HttpClient,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    console.log('Training data received:', this.training);
    this.loadTeamMembers();
    this.initializeSelectedTrainer();
  }

  initializeSelectedTrainer() {
    console.log('Current training:', this.training);
    console.log('Assigned trainer:', this.training?.assigned_trainer);
    
    if (this.training?.assigned_trainer) {
      this.selectedTrainerEmail = this.training.assigned_trainer.email;
      this.currentAssignedTrainer = {
        email: this.training.assigned_trainer.email,
        name: this.training.assigned_trainer.name
      };
      console.log('Set current assigned trainer:', this.currentAssignedTrainer);
    } else {
      console.log('No assigned trainer found');
    }
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
      console.log('Current assigned trainer:', this.currentAssignedTrainer);
      
      // Check if current assigned trainer is in the team members list
      if (this.currentAssignedTrainer) {
        const found = this.teamMembers.find(m => m.email === this.currentAssignedTrainer!.email);
        console.log('Assigned trainer found in team members:', found);
      }
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

  // Method to handle trainer selection
  selectTrainer(email: string) {
    this.selectedTrainerEmail = email;
  }

  // Method to check if trainer is selected
  isSelected(email: string): boolean {
    return this.selectedTrainerEmail === email;
  }

  // Method to check if trainer is currently assigned
  isCurrentlyAssigned(email: string): boolean {
    return this.currentAssignedTrainer?.email === email;
  }

  // Method to remove trainer assignment
  async removeAssignment() {
    this.isSaving = true;
    const url = `https://k-studio.co.il/wp-json/custom-api/v1/remove-trainer`;
    const payload = {
      appointmentId: this.training.id,
    };

    try {
      await firstValueFrom(this.http.post(url, payload));
      this.presentToast('Trainer assignment removed successfully!', 'success');
      this.modalCtrl.dismiss({ assigned: false, removed: true });
    } catch (error) {
      console.error('Error removing trainer assignment', error);
      this.presentToast('Error removing trainer assignment.', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  async saveAssignment() {
    if (!this.selectedTrainerEmail) {
      this.presentToast('Please select a trainer.', 'warning');
      return;
    }

    // Check if the selected trainer is already assigned
    if (this.currentAssignedTrainer?.email === this.selectedTrainerEmail) {
      this.presentToast('This trainer is already assigned to this training.', 'warning');
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
      const actionType = this.currentAssignedTrainer ? 'reassigned' : 'assigned';
      this.presentToast(`Trainer ${actionType} successfully!`, 'success');
      this.modalCtrl.dismiss({ assigned: true, reassigned: !!this.currentAssignedTrainer });
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

  // Check if there are any changes to save
  get hasChanges(): boolean {
    return this.selectedTrainerEmail !== (this.currentAssignedTrainer?.email || '');
  }

  // Get the display text for the save button
  get saveButtonText(): string {
    if (this.isSaving) return '';
    if (!this.selectedTrainerEmail) return 'בחר מאמן';
    if (this.currentAssignedTrainer) {
      return this.selectedTrainerEmail === this.currentAssignedTrainer.email 
        ? 'מאמן כבר משובץ' 
        : 'החלף מאמן';
    }
    return 'שמור שיבוץ';
  }
}