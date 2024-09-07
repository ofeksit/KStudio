import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GestureController, ModalController } from '@ionic/angular';
import { AmeliaApiService } from '../services/amelia-api.service';
import { Appointment } from '../Models/appointment';

@Component({
  selector: 'app-trainings',
  templateUrl: './trainings.page.html',
  styleUrls: ['./trainings.page.scss'],
})
export class TrainingsPage implements AfterViewInit {
  @ViewChild('popup') popup!: ElementRef;

  appointments: Appointment[] = [];
  groupedAppointments: any = {};
  
  selectedFilter: string = 'all';  // Default to "All" tab
  selectedDay: string = '31/08/2024';  // Default selected day
  selectedType: string = '';  // Default: no type filter
  availabilityFilter: string = 'all';  // Default: show all
  showDropdown: boolean = false;  // Controls the visibility of the filter dropdown
  availableTypes: string[] = [];  // Array of available training types

  days = [
    { day: 'שבת', date: '31.8' },
    { day: 'ראשון', date: '1.9' },
    { day: 'שני', date: '2.9' },
    { day: 'שלישי', date: '3.9' },
    { day: 'רביעי', date: '4.9' },
    { day: 'חמישי', date: '5.9' },
    { day: 'שישי', date: '6.9' },
    { day: 'שבת', date: '7.9' },
  ];

  trainings = this.ameliaApiService.getAllAppointments;

  constructor(private gestureCtrl: GestureController, private modalCtrl: ModalController, private ameliaApiService: AmeliaApiService) {}

  ngOnInit() {
    this.selectedDay = this.days[0].date;  // Ensure first tab is selected by default
    this.extractAvailableTypes();  // Extract available training types on page load
    this.loadAppointments();
  }

  loadAppointments() {
    // Fetch all appointments
    this.ameliaApiService.getAllAppointments().subscribe(appointments => {
      this.appointments = appointments;
      this.groupAppointmentsByDay();
    });
  }

  groupAppointmentsByDay() {
    this.groupedAppointments = this.appointments.reduce((group: { [key: string]: any[] }, appointment: any) => {
      const date = new Date(appointment.start_time).toDateString();
      if (!group[date]) {
        group[date] = [];
      }
      group[date].push(appointment);
      return group;
    }, {});
  }
  

    // Function to enroll in a training
  enrollInTraining(appointmentId: string) {
    const userId = 'CURRENT_USER_ID';  // Replace with actual logged-in user's ID
    this.ameliaApiService.enrollInTraining(appointmentId, userId).subscribe(response => {
      alert('Successfully enrolled in training');
    }, error => {
      alert('Enrollment failed. Please try again.');
    });
  }

  closePopup() {
    this.modalCtrl.dismiss();
  }

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

  // Extract unique training types from the training list
  extractAvailableTypes() {
    const typesSet = new Set(this.trainings.map(training => training.type));
    this.availableTypes = Array.from(typesSet);  // Convert Set to Array for the dropdown
  }

  // Toggle favorite status
  toggleFavorite(training: any) {
    training.favorite = !training.favorite;
  }

  // Toggle dropdown visibility
  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  // Clear the type filter
  clearTypeFilter() {
    this.selectedType = '';
  }

  // Filter trainings based on the selected filter (All/Favorites), training type, and availability
  filteredTrainings() {
    return this.trainings.filter(training => {
      const matchesFavorites = this.selectedFilter === 'favorites' ? training.favorite : true;
      const matchesType = this.selectedType ? training.type === this.selectedType : true;
      const matchesAvailability = this.availabilityFilter === 'available' ? training.available > 0 : true;

      return matchesFavorites && matchesType && matchesAvailability;
    });
  }

  // Function to handle enrollment
  enroll(training: any) {
    if (training.available > 0) {
      console.log('Enrolled in training:', training);
    } else {
      console.log('Added to standby list:', training);
    }
  }
}
