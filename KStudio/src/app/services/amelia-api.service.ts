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
