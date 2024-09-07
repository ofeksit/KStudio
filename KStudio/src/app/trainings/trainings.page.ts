import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GestureController, ModalController } from '@ionic/angular';
import { AmeliaService } from '../services/amelia-api.service';
import { Appointment } from '../Models/appointment';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';

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

  availableTimeslots = [];
  bookedAppointments = [];
  combinedList = [];
  days = [];
  selectedDay: string;  // Default selected day

  constructor(private gestureCtrl: GestureController, private modalCtrl: ModalController, private http: HttpClient) {}

  ngOnInit() {
    this.fetchAvailableTimeslots();
    this.fetchBookedAppointments();
  }

  // Fetch available timeslots
  fetchAvailableTimeslots() {
    const serviceId = 1; // Example serviceId
    const url = '/api/timeslots'; // Update the URL accordingly
    this.http.get(url, { headers: { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk'} }).subscribe((response: any) => {
      this.availableTimeslots = response.data;
      this.combineTimeslotsAndAppointments();
    });
  }

  // Fetch booked appointments
  fetchBookedAppointments() {
    const url = '/api/appointments'; // Update the URL accordingly
    this.http.get(url, { headers: { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk'} }).subscribe((response: any) => {
      this.bookedAppointments = response.data;
      this.combineTimeslotsAndAppointments();
    });
  }

  // Combine available timeslots and booked appointments
  combineTimeslotsAndAppointments() {
    if (this.availableTimeslots.length && this.bookedAppointments.length) {
      this.combinedList = [
        ...this.availableTimeslots.map(slot => ({ ...slot, type: 'timeslot' })),
        ...this.bookedAppointments.map(appointment => ({ ...appointment, type: 'appointment' }))
      ];

      // Extract unique dates
      this.extractAvailableDays();

      // Sort by start time
      this.combinedList.sort((a, b) => {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });
    }
  }

  // Extract unique available days
  extractAvailableDays() {
    const allDates = this.combinedList.map(item => moment(item.start_time).format('YYYY-MM-DD'));
    this.days = Array.from(new Set(allDates)).map(date => ({
      date,
      day: moment(date).format('dddd')
    }));
    this.selectedDay = this.days.length > 0 ? this.days[0].date : ''; // Default to the first available day
  }


  // Filter the combined list by the selected day
  getAppointmentsForSelectedDay() {
    return this.combinedList.filter(item => {
      return moment(item.start_time).format('YYYY-MM-DD') === this.selectedDay;
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


}
