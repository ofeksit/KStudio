import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { GestureController, ModalController, ActionSheetController } from '@ionic/angular';
import { Training } from '../Models/training';
import { HttpClient } from '@angular/common/http';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-popup',
  templateUrl: './profile-popup.component.html',
  styleUrls: ['./profile-popup.component.scss'],
})
export class ProfilePopupComponent implements AfterViewInit {
  @ViewChild('popup') popup!: ElementRef;

  userName: string = 'יוחנן דו';  // Placeholder for user display name
  userPhoto: string = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_640.png';  // Placeholder for avatar image
  userRole: string = 'חבר פרימיום';  // Placeholder for user role
  selectedTab: string = 'trainings';  // Default selected tab
  
  
  selectedFilter: string = 'all';  // Default to "All" tab
  selectedDay: string = '31/08/2024';  // Default selected day
  selectedTypes: { [key: string]: boolean } = {};
  availabilityFilter: string = 'all';  // Default: show all
  showDropdown: boolean = false;  // Controls the visibility of the filter dropdown
  availableTypes: string[] = [];  // Array of available training types
  
  showCancelAlert = false;
  selectedTraining: any;
  
  cancelTraining(training: any) {
    // Call the Amelia REST API to cancel the booking
    const url = `your_amellia_api_endpoint/bookings/${training.id}/cancel`;
    this.http.post(url, {}).subscribe(
      (response) => {
        console.log('Booking canceled:', response);
        // Optionally refresh the trainings list
      },
      (error) => {
        console.error('Error canceling booking:', error);
      }
    );
  }


  trainings: Training[] = [
    { title: 'פלאטיס', time: '10:00 | 31/08/2024', available: 0, capacity: 70, favorite: false, status: "approved" },
    { title: 'יוגה', time: '11:00 | 02/09/2024 ', available: 14, capacity: 30, favorite: true, status: "approved" },
    { title: 'אימון כוח', time: '12:00 | 03/09/2024',available: 20, capacity: 25, favorite: false, status: "approved" },
    { title: 'אימון כוח', time: '12:00 | 09/09/2024',available: 20, capacity: 25, favorite: false, status: "approved" }
  ];

  userPurchases = [
    { orderNumber: 'ORD123', products: [{ name: 'מוצר א' }, { name: 'מוצר ב' }], date: new Date() },
    { orderNumber: 'ORD124', products: [{ name: 'מוצר ג' }], date: new Date() }
  ];

  constructor(private gestureCtrl: GestureController, private modalCtrl: ModalController, private actionSheetCtrl: ActionSheetController, private http: HttpClient, private alertCtrl: AlertController, private router: Router) {}

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

  ngOnInit() {
    this.extractAvailableTypes();  // Extract available training types on page load
  }

  closePopup() {
    this.modalCtrl.dismiss();
  }

  // Extract unique training types from the training list
  extractAvailableTypes() {
    const typesSet = new Set(this.trainings.map(training => training.title));
    this.availableTypes = Array.from(typesSet);  // Convert Set to Array for the dropdown
  }

  // Toggle dropdown visibility
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  // Clear the type filter
  clearTypeFilter() {
    this.selectedTypes = {};
  }

  // Determine if any filter is active
  isFilterActive() {
    return Object.values(this.selectedTypes).some(isSelected => isSelected);
  }

  // Filtered trainings based on selected types and other filters
  filteredTrainings() {
    const hasSelectedTypes = this.isFilterActive();

    return this.trainings.filter(training => {
      const matchesFavorites = this.selectedFilter === 'favorites' ? training.favorite : true;
      const matchesType = hasSelectedTypes ? Object.keys(this.selectedTypes).some(type => this.selectedTypes[type] && training.title === type) : true;
      const matchesAvailability = this.availabilityFilter === 'upcoming' ? this.isUpcoming(training.time) : true;

      return matchesFavorites && matchesType && matchesAvailability;
    });
  }
  
  // Helper function to extract the date and check if the training is upcoming
  isUpcoming(timeString: string): boolean {
    const [time, date] = timeString.split(' | ');
    const [day, month, year] = date.split('/').map(Number); // Extract day, month, and year from the date
    const trainingDate = new Date(year, month - 1, day); // Create a Date object (month is zero-based in JS)
    
    const today = new Date(); // Get today's date
  
    // Compare the training date with today's date
    return trainingDate >= today;
  }


  // Sort trainings by date
  sortedTrainings() {
    return this.trainings.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }

  async showActions(training: any) {
    this.selectedTraining = training;
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'פעולות',
      buttons: [
        {
          text: 'בטל אימון',
          role: 'destructive',
          icon: 'close-circle-outline',
          handler: () => {
            this.showCancelAlert = true; // Trigger the alert
          }
        },
        {
          text: 'שנה זמן',
          icon: 'time-outline',
          handler: () => {
            this.navigateToReschedule(training); // Redirect to reschedule functionality
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

  canReschedule(trainingTime: string): boolean {
    const currentTime = new Date().getTime();
    const trainingDateTime = new Date(trainingTime).getTime();
    const hoursDifference = (trainingDateTime - currentTime) / (1000 * 60 * 60); // Milliseconds to hours
    return hoursDifference > 8;
  }
  
  navigateToReschedule(training: any) {
    if (!this.canReschedule(training.time)) {
      // Show error alert
      const alert = this.alertCtrl.create({
        header: 'לא ניתן לשנות את האימון',
        message: 'לא ניתן לשנות את מועד האימון פחות מ-8 שעות לפני תחילתו',
        buttons: ['אישור']
      });
      alert.then(alertEl => alertEl.present());
    } else {
      // Navigate to the trainings list to reschedule
      this.router.navigate(['/trainings'], { state: { trainingToReschedule: training } });
    }
  }
  
  rescheduleTraining(oldTraining: any, newTraining: any) {
    const url = `your_amellia_api_endpoint/bookings/${oldTraining.id}/reschedule`;
    const payload = {
      newTrainingId: newTraining.id
    };
    this.http.post(url, payload).subscribe(
      (response) => {
        console.log('Booking rescheduled:', response);
        // Refresh the list or notify user
      },
      (error) => {
        console.error('Error rescheduling booking:', error);
      }
    );
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

