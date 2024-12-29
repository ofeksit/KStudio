import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as moment from 'moment';
import { DayTrainings } from '../Models/day-trainings';

interface BranchTrainings {
  [key: string]: DayTrainings[];
}

type BranchType = 'main' | 'second';

interface ApiResponse {
  branch: string;
  day: string;
  events: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AmeliaService {
  private readonly DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  private readonly API_URL = 'https://k-studio.co.il/wp-json/custom-api/v1/get-appointment-title';

  trainingsByBranch: Record<BranchType, BranchTrainings> = {
    main: this.initializeEmptyDays(),
    second: this.initializeEmptyDays()
  };

  constructor(private http: HttpClient) {}

  private initializeEmptyDays(): BranchTrainings {
    return this.DAYS.reduce((acc, day) => ({ ...acc, [day]: [] }), {});
  }

  async fetchTitleTrainings(branch: BranchType = 'main'): Promise<void> {
    console.log("branchaaa:", branch);
    const trainingsData: BranchTrainings = this.initializeEmptyDays();

    for (const day of this.DAYS) {
      const targetDate = moment().day(day).format('DD/MM/YYYY');
      try {
        const response = await this.http
          .get<ApiResponse>(`${this.API_URL}/?date=${targetDate}&branch=${branch}`)
          .toPromise();

        if (response && response.events && response.events.length > 0) {
          trainingsData[day] = response.events.map((event) => {
            const [time, title] = event.split(' - ').map(part => part.trim());
            return { time, title };
          });
        }
      } catch (error) {
        console.error(`Error fetching trainings for ${day} (${branch}):`, error);
        trainingsData[day] = [];
      }
    }

    this.trainingsByBranch[branch] = trainingsData;
    this.saveToLocalStorage(branch, trainingsData);
  }

  async fetchAllBranchTrainings(): Promise<void> {
    await Promise.all([
      this.fetchTitleTrainings('main'),
      this.fetchTitleTrainings('second')
    ]);
  }

  private saveToLocalStorage(branch: BranchType, data: BranchTrainings): void {
    localStorage.setItem(`weeklyTrainings_${branch}`, JSON.stringify(data));
  }

  loadTrainingsFromLocalStorage(branch: BranchType): void {
    const storedData = localStorage.getItem(`weeklyTrainings_${branch}`);
    if (storedData) {
      this.trainingsByBranch[branch] = JSON.parse(storedData);
    } else {
      this.trainingsByBranch[branch] = this.initializeEmptyDays();
    }
  }

  loadAllTrainingsFromLocalStorage(): void {
    this.loadTrainingsFromLocalStorage('main');
    this.loadTrainingsFromLocalStorage('second');
  }

  getTrainingsTitles(branch: BranchType = 'main'): BranchTrainings {
    return this.trainingsByBranch[branch];
  }

  getAllTrainingsTitles(): Record<BranchType, BranchTrainings> {
    return this.trainingsByBranch;
  }
}