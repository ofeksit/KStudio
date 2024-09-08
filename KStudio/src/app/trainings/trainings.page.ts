import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GestureController, ModalController } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { Appointment } from '../Models/appointment';
import { formatDate } from '@angular/common';

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
  selectedType: string = '';  // Default: no type filter
  availabilityFilter: string = 'all';  // Default: show all
  showDropdown: boolean = false;  // Controls the visibility of the filter dropdown
  availableTypes: string[] = [];  // Array of available training types

  availableTimeslots: Appointment[] = [];
  bookedAppointments: Appointment[] = [];
  combinedList: Appointment[] = [];
  days: { date: string; day: string }[] = [];
  selectedDay: string | undefined;  // Default selected day

  // Add new variables for modal
  showingParticipants = false;
  selectedParticipants: string[] | undefined;
  isPopupVisible = false;
  activeAppointment: Appointment | null = null; // Track the active appointment for popup


  constructor(private gestureCtrl: GestureController, private modalCtrl: ModalController, private http: HttpClient) {}

  ngOnInit() {
    this.fetchAvailableTimeslots();
    this.fetchBookedAppointments();
  }



      // Method to show the popup
  showPopup(appointment: Appointment) {
    this.activeAppointment = appointment;
    this.isPopupVisible = true;
  }

  // Method to hide the popup
  hidePopup() {
    this.activeAppointment = null;
    this.isPopupVisible = false;
  }


  fetchAvailableTimeslots() {
    const url = '/api/slots&serviceId=12&page=booking&startDateTime=2024-09-08'; // Update the URL accordingly
    this.http.get<{ data: { slots: any } }>(url, { headers: { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk' } }).subscribe((response) => {
      const timeslotsData = response.data.slots;
  
      this.availableTimeslots = Object.keys(timeslotsData).flatMap(date => 
        Object.keys(timeslotsData[date]).map(time => ({
          start_time: new Date(`${date}T${time}`).toISOString(),
          end_time: new Date(`${date}T${time}`).toISOString(), // Adjust the end time if necessary
          type: 'timeslot',
          service: { name: 'אימון קבוצתי' }, // Set the default name to "אימון קבוצתי"
          favorite: false, // Default favorite value for timeslots
          current_participants: [], // Timeslots don't have participants yet
          total_participants: 8, // Default value for timeslots
          booked: 0, // Default booked status for timeslots
        }))
      );
    });
  }
  
    
  fetchBookedAppointments() {
    const url = '/api/appointments&dates=2024-09-08,2024-09-10&page=1&skipServices=1&skipProviders=1'; // Update the URL accordingly
    this.http.get<{ data: { appointments: any } }>(url, { headers: { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk' } }).subscribe((response) => {
      const appointmentData = response.data.appointments;
  
      const now = new Date();
      this.bookedAppointments = Object.values(appointmentData).flatMap((appointment: any) => 
        appointment.appointments.filter((app: any) => 
          app.status === 'approved' && app.past === false && new Date(app.bookingStart) > now
        ).map((app: any) => ({
          start_time: app.bookingStart,
          end_time: app.bookingEnd,
          type: 'appointment',
          service: { name: app.service?.name || 'אימון קבוצתי' }, // Use "אימון קבוצתי" if name is not available
          favorite: false, // Set default favorite status
          current_participants: app.bookings.filter((booking: any) => booking.status === 'approved')
            .map((booking: any) => `${booking.customer.firstName} ${booking.customer.lastName}`), // Store only participant names as strings
          total_participants: 8, // Set the total number of participants (fixed at 8)
          booked: app.bookings.filter((booking: any) => booking.status === 'approved').length, // Calculate the number of approved bookings
        }))
      );
  
      this.combineTimeslotsAndAppointments();
    });
  }

  
  // Merge timeslots and appointments
  combineTimeslotsAndAppointments() {
    this.combinedList = [...this.availableTimeslots, ...this.bookedAppointments];

    // Log and filter invalid dates
    this.combinedList = this.combinedList.filter(item => {
      const startDate = new Date(item.start_time);
      const endDate = new Date(item.end_time);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.warn('Invalid date detected', item);
        return false; // Exclude items with invalid dates
      }
      return true;
    });
  
    // Extract available days after merging
    this.extractAvailableDays();
  
    // Sort the combined list by start time, ensuring valid dates
    this.combinedList.sort((a, b) => {
      const dateA = new Date(a.start_time);
      const dateB = new Date(b.start_time);
      return dateA.getTime() - dateB.getTime();
    });
  }

  // Extract available days from appointments
  extractAvailableDays() {
    const allDates = this.combinedList
      .filter(item => {
        const date = new Date(item.start_time);
        return !isNaN(date.getTime()); // Ensure the date is valid
      })
      .map(item => new Date(item.start_time).toISOString().split('T')[0]);
  
    // Translate days to Hebrew
    this.days = Array.from(new Set(allDates)).map(date => ({
      date,
      day: new Date(date).toLocaleDateString('he-IL', { weekday: 'long' }) // Hebrew day translation
    }));
  
    this.selectedDay = this.days.length > 0 ? this.days[0].date : ''; // Default to the first available day
  }

  // Filter the combined list by selected day
  getAppointmentsForSelectedDay() {
    return this.combinedList.filter(item => {
      const date = moment(item.start_time);
      return (
        date.isValid() && // Ensure valid date
        date.format('YYYY-MM-DD') === this.selectedDay
      );
    });
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

  calculateProgress(appointment: any): number {
    return (appointment.current_participants / appointment.total_participants) * 100;
  }
  
  isFull(appointment: any): boolean {
    return appointment.current_participants >= appointment.total_participants;
  }
}
