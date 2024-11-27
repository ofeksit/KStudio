import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as moment from 'moment';
import { DayTrainings } from '../Models/day-trainings';

@Injectable({
  providedIn: 'root'
})
export class AmeliaService {
  private apiURL = 'https://k-studio.co.il/wp-json/gym/v1/trainings';
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

  fetchCombinedTrainings(): Observable<any> {
    return this.http.get<any>(this.apiURL);
  }

  async fetchTitleTrainings(): Promise<void> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const trainingsData: { [key: string]: any[] } = {}; // Temporary object to store fetched data

    for (const day of days) {
      const targetDate = moment().day(day).format('DD/MM/YYYY');
      try {
        const response: string[] = (await this.http
          .get<string[]>(`https://k-studio.co.il/wp-json/custom-api/v1/appointment-title/?date=${targetDate}`)
          .toPromise()) || [];

        if (response.length > 0) {
          trainingsData[day] = response.map((event) => {
            const [time, title] = event.split(' - ').map((part) => part.trim());
            return { time, title }; // Return as a DayTrainings object
          });
        }
      } catch (error) {
        console.error(`Error fetching trainings for ${day}:`, error);
      }
    }

    this.trainingsByDay = trainingsData; // Update service data
    localStorage.setItem('weeklyTrainings', JSON.stringify(trainingsData)); // Save to local storage
  }

  loadTrainingsFromLocalStorage(): void {
    const storedData = localStorage.getItem('weeklyTrainings');
    if (storedData) {
      this.trainingsByDay = JSON.parse(storedData);
    }
  }
  
  
  getTrainingsTitles(): any {
    return this.trainingsByDay;
  }
}
