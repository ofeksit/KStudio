import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { GestureController, ModalController, ActionSheetController } from '@ionic/angular';
import { Training } from '../Models/training';

@Component({
  selector: 'app-profile-popup',
  templateUrl: './profile-popup.component.html',
  styleUrls: ['./profile-popup.component.scss'],
})
export class ProfilePopupComponent implements AfterViewInit {
  @ViewChild('popup') popup!: ElementRef;

  userName: string = 'John Doe';  // Placeholder for user display name
  userPhoto: string = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';  // Placeholder for avatar image
  userRole: string = 'Premium Member';  // Placeholder for user role
  selectedTab: string = 'trainings';  // Default selected tab


  // Array of trainings with type `Training`
  trainings: Training[] = [
    { title: 'יוגה', date: '2024-09-10', time: '10:00 AM', available: 10, capacity: 20, favorite: true, status: 'approved' },
    { title: 'פילאטיס', date: '2024-09-01', time: '08:00 AM', available: 5, capacity: 10, favorite: false, status: 'pending' },
    { title: 'אימון כוח', date: '2024-08-25', time: '06:00 PM', available: 0, capacity: 25, favorite: false, status: 'cancelled' },
    { title: 'אימון ידיים', date: '2024-08-30', time: '05:00 PM', available: 20, capacity: 25, favorite: true, status: 'approved' }
  ];

  userPurchases = [
    { item: 'Gym Membership', date: '01/08/2024' },
    { item: 'Protein Shake', date: '05/08/2024' },
  ];

  constructor(private gestureCtrl: GestureController, private modalCtrl: ModalController, private actionSheetCtrl: ActionSheetController) {}

  ngAfterViewInit() {
    const gesture = this.gestureCtrl.create({
      el: this.popup.nativeElement,
      gestureName: 'swipe-to-close',
      onMove: (ev) => {
        if (ev.deltaY > 100) {
          this.modalCtrl.dismiss();
        }
      },
    });
    gesture.enable(true);
  }

  closePopup() {
    this.modalCtrl.dismiss();
  }

  // Mock Google Profile Fetch (This would be replaced with OAuth2 logic)
  loadGoogleProfile() {
    // For now, we're using placeholders
    this.userName = 'Deryl Banks';
    this.userPhoto = 'assets/img/avatar.png';  // Replace with Google profile picture URL
    this.userRole = 'Member';  // Set the role dynamically based on user data
  }

    // Sort trainings by date
  sortedTrainings() {
    return this.trainings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

   // Show Action Sheet on clicking a training
   async showActions(training: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'פעולות',
      buttons: [
        {
          text: 'בטל אימון',
          role: 'destructive',
          icon: 'close-circle-outline',
          handler: () => {
            console.log('Cancel training:', training);
          }
        },
        {
          text: 'שנה זמן',
          icon: 'time-outline',
          handler: () => {
            console.log('Reschedule training:', training);
          }
        },
        {
          text: 'סגור',
          icon: 'close',
          role: 'cancel',
        }
      ]
    });
    await actionSheet.present();
  }

    // Get the correct status icon based on training status
  getStatusIcon(status: string): string {
    switch (status) {
      case 'approved':
        return 'checkmark-circle-outline';  // Approved
      case 'cancelled':
        return 'close-circle-outline';  // Cancelled
      case 'pending':
        return 'time-outline';  // Pending
      default:
        return 'alert-circle-outline';  // Fallback in case of unknown status
    }
  }

    // Get the color based on status
  getStatusColor(status: string): string {
    switch (status) {
      case 'approved':
        return 'success';  // Green for approved
      case 'cancelled':
        return 'danger';  // Red for cancelled
      case 'pending':
        return 'warning';  // Yellow for pending
      default:
        return 'medium';  // Fallback color
    }
  }

}
