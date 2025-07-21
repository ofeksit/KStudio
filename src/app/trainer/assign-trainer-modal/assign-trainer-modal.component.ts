import { HttpClient } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
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
  @ViewChild('modalContent', { static: false }) modalContent!: ElementRef;
  
  teamMembers: TeamMember[] = [];
  selectedTrainerEmail: string = '';
  isLoading = true;
  isSaving = false;
  currentAssignedTrainer: TeamMember | null = null;
  isModalFullyExpanded = false;
  modalHeight = 0;

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

  ngAfterViewInit() {
    this.setupModalHeightObserver();
  }

  setupModalHeightObserver() {
    if (this.modalContent) {
      // Use ResizeObserver to detect modal height changes
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          this.modalHeight = entry.contentRect.height;
          this.isModalFullyExpanded = this.modalHeight > window.innerHeight * 0.7;
          console.log('Modal height:', this.modalHeight, 'Fully expanded:', this.isModalFullyExpanded);
        }
      });

      resizeObserver.observe(this.modalContent.nativeElement);
    }

    // Alternative: Listen to scroll events to detect modal state
    setTimeout(() => {
      this.detectModalState();
    }, 500);
  }

  detectModalState() {
    // Check if modal is at different breakpoints
    const modalElement = document.querySelector('ion-modal');
    if (modalElement) {
      const modalRect = modalElement.getBoundingClientRect();
      const screenHeight = window.innerHeight;
      
      // If modal takes up more than 70% of screen, consider it fully expanded
      this.isModalFullyExpanded = modalRect.height > screenHeight * 0.7;
      
      console.log('Modal state - Height:', modalRect.height, 'Screen:', screenHeight, 'Fully expanded:', this.isModalFullyExpanded);
    }
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
      this.presentToast('שגיאה', 'danger');
    } finally {
      this.isLoading = false;
      // Detect modal state after loading
      setTimeout(() => this.detectModalState(), 100);
    }
  }

  trackByEmail(index: number, member: TeamMember): string {
    return member.email;
  }

  // Method to handle trainer selection
  selectTrainer(email: string) {
    this.selectedTrainerEmail = email;
    // Re-detect modal state when trainer is selected
    setTimeout(() => this.detectModalState(), 100);
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
      this.presentToast('מחיקה בוצעה בהצלחה', 'success');
      this.modalCtrl.dismiss({ assigned: false, removed: true });
    } catch (error) {
      console.error('שגיאה', error);
      this.presentToast('שגיאה', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  async saveAssignment() {
    if (!this.selectedTrainerEmail) {
      this.presentToast('אנא בחר מאמן', 'warning');
      return;
    }

    // Check if the selected trainer is already assigned
    if (this.currentAssignedTrainer?.email === this.selectedTrainerEmail) {
      this.presentToast('המאמן כבר שובץ לאימון זה', 'warning');
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
      const actionType = this.currentAssignedTrainer ? 'שובץ' : 'שובץ';
      this.presentToast(`המאמן ${actionType} בהצלחה!`, 'success');
      this.modalCtrl.dismiss({ assigned: true, reassigned: !!this.currentAssignedTrainer });
    } catch (error) {
      console.error('שגיאה', error);
      this.presentToast('שגיאה', 'danger');
    } finally {
      this.isSaving = false;
    }
  }

  async presentToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
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