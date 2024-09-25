import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as moment from 'moment';
import { DayTrainings } from '../Models/day-trainings';

@Injectable({
  providedIn: 'root'
})
export class AmeliaService {
  trainingsByDay: { [key: string]: DayTrainings[] } = {
    Sunday: [],
    Monday: [], 
    Tuesday: [], 
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: []
  };

  constructor(private http: HttpClient) { }

  getMonthlyAppoindtments() {
    this.http.get('/api/appointments', { headers: { 'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk'} })
    .subscribe(response => {
      console.log(response);
    });
  }

  // Get all 30 days appointments for trainings page
  getMonthlyAppointments() {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    
      // Format the dates as 'YYYY-MM-DD'
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const todayFormatted = formatDate(today);
    const futureDateFormatted = formatDate(futureDate);

    console.log(todayFormatted);
    console.log(futureDateFormatted);
    let apiURL = '/api/appointments&dates='+ todayFormatted + ','+futureDateFormatted+'&page=1&skipServices=1&skipProviders=1';
    console.log(apiURL);
    this.http.get(apiURL, {
      headers: {
        'Amelia': 'C7YZnwLJ90FF42GOCkEFT9z856v6r5SQ2QWpdhGBexQk'
      }
    })
    .subscribe(response => {
      console.log(response);
    });
  }

  getAvailableTimeSlots() {
    let serviceId: number = 12;
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);
  
    this.http.get(`/api/events?serviceId=${serviceId}&startDate=${new Date().toISOString().split('T')[0]}&endDate=${next30Days.toISOString().split('T')[0]}`)
      .subscribe((slots: any) => {
        console.log('Available slots:', slots);
        // Handle available slots (including fully booked or empty)
      });
  }

  // Function to fetch trainings for all days and store them in list
  async fetchTitleTrainings(): Promise<void> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
    for (const day of days) {
      const targetDate = moment().day(day).format('DD/MM/YYYY');
      try {
        // Ensure response is always treated as string[] or fallback to an empty array
        const response: string[] = (await this.http
          .get<string[]>(`https://k-studio.co.il/wp-json/custom-api/v1/appointment-title/?date=${targetDate}`)
          .toPromise()) || [];
  
        if (response.length > 0) {
          this.trainingsByDay[day] = response.map((event) => {
            const [time, title] = event.split(' - ').map((part) => part.trim()); // Split time and title
            return { time, title }; // Return as a DayTrainings object
          });
        }
      } catch (error) {
        console.error(`Error fetching trainings for ${day}:`, error);
      }
    }
  }
  
  getTrainingsTitles(): any {
    return this.trainingsByDay;
  }
}
