import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Training } from '../Models/training';

@Component({
  selector: 'app-trainings',
  templateUrl: './trainings.page.html',
  styleUrls: ['./trainings.page.scss'],
})
export class TrainingsPage implements OnInit {
  selectedFilter: string = 'all';  // Default to "All" tab
  selectedDay: string = '31/08/2024';  // Default selected day

  days = [
    { day: 'שבת', date: '31.8' },
    { day: 'ראשון', date: '1.9' },
    { day: 'שני', date: '2.9' },
    { day: 'שלישי', date: '3.9' },
    // Add more days as needed
  ];

  trainings = [
    { title: 'פלאטיס', trainer: 'אורפד שקד', date: '31/08/2024', time: '10:00 AM', location: 'סטודיו 1', available: 27, capacity: 70, favorite: false },
    { title: 'יוגה', trainer: 'מיכל כהן', date: '31/08/2024', time: '11:00 AM', location: 'סטודיו 2', available: 14, capacity: 30, favorite: true },
    { title: 'אימון כוח', trainer: 'יואב לב', date: '31/08/2024', time: '12:00 PM', location: 'אולם ספורט', available: 20, capacity: 25, favorite: false }
  ];

  constructor() {}

  ngOnInit() {
      this.selectedDay = this.days[0].date;  // Ensure first tab is selected by default
  }

  // Toggle favorite status
  toggleFavorite(training: any) {
    training.favorite = !training.favorite;
  }

  // Filter trainings based on the selected filter
  filteredTrainings() {
    if (this.selectedFilter === 'favorites') {
      return this.trainings.filter(t => t.favorite);
    }
    return this.trainings;  // Show all by default
  }

  enroll(training: any) {
    console.log('Enrolling in training:', training);
    // You can implement further logic here for enrollment
  }
}



