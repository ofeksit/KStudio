import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-trainings',
  templateUrl: './trainings.page.html',
  styleUrls: ['./trainings.page.scss'],
})
export class TrainingsPage implements OnInit {
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

  trainings = [
    { title: 'פלאטיס', type: 'פילאטיס', trainer: 'אורפד שקד', date: '31/08/2024', time: '10:00 AM', location: 'סטודיו 1', available: 0, capacity: 70, favorite: false },
    { title: 'יוגה', type: 'יוגה', trainer: 'מיכל כהן', date: '31/08/2024', time: '11:00 AM', location: 'סטודיו 2', available: 14, capacity: 30, favorite: true },
    { title: 'אימון כוח', type: 'אימון כוח', trainer: 'יואב לב', date: '31/08/2024', time: '12:00 PM', location: 'אולם ספורט', available: 20, capacity: 25, favorite: false }
  ];

  constructor() {}

  ngOnInit() {
    this.selectedDay = this.days[0].date;  // Ensure first tab is selected by default
    this.extractAvailableTypes();  // Extract available training types on page load
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
