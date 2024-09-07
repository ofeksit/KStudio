import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GestureController, ModalController } from '@ionic/angular';
import { AmeliaService } from '../services/amelia-api.service';
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


  constructor(private gestureCtrl: GestureController, private modalCtrl: ModalController, private AmeliaService: AmeliaService) {}

  ngOnInit() {
    this.selectedDay = this.days[0].date;  // Ensure first tab is selected by default
    ///this.extractAvailableTypes();  // Extract available training types on page load
    console.log(this.AmeliaService.getMonthlyAppointments());
  }


  /*loadAppointments() {
    // Get all appointments
    this.AmeliaService.getData().subscribe(appointments => {
      console.log(appointments);
    }, error => {
      console.error('Failed to load appointments', error);
    });
  }*/
  

  // Group appointments by day (e.g., 2024-09-07)
  groupAppointmentsByDay() {
    this.groupedAppointments = this.appointments.reduce((group: { [key: string]: any[] }, appointment: any) => {
      const appointmentDate = new Date(appointment.start_time).toLocaleDateString();  // Format to readable date
      if (!group[appointmentDate]) {
        group[appointmentDate] = [];
      }
      group[appointmentDate].push(appointment);
      return group;
    }, {});
  }

    // Create the list of days based on the appointments
    setupDays() {
      const uniqueDays = Object.keys(this.groupedAppointments);
      this.days = uniqueDays.map(date => ({
        day: new Date(date).toLocaleString('he-IL', { weekday: 'long' }),  // Convert to day of week in Hebrew
        date: date,
      }));
  
      if (this.days.length > 0) {
        this.selectedDay = this.days[0].date;  // Default to the first day
      }
    }

      // Filtered list of appointments for the selected day
  getAppointmentsForSelectedDay() {
    return this.groupedAppointments[this.selectedDay] || [];
  }


  closePopup() {
    this.modalCtrl.dismiss();
  }

  ngAfterViewInit() {
    setTimeout(() => {
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
    });
  }

  /* Extract unique training types from the training list
  extractAvailableTypes() {
    const typesSet = new Set(this.trainings.map(training => training.type));
    this.availableTypes = Array.from(typesSet);  // Convert Set to Array for the dropdown
  }*/

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


  /*
  filteredTrainings() {
    return this.appointments.filter(training => {
      const matchesFavorites = this.selectedFilter === 'favorites' ? training.favorite : true;
      const matchesType = this.selectedType ? training.type === this.selectedType : true;
      const matchesAvailability = this.availabilityFilter === 'available' ? training.available > 0 : true;
      
      return matchesFavorites && matchesType && matchesAvailability;
    });
  }*/

}
