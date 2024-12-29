import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { DayTrainings } from '../Models/day-trainings';
import { AmeliaService } from '../services/amelia-api.service';
import * as moment from 'moment';

interface DayInfo {
  name: string;
  date: string;
  trainings: DayTrainings[];
}

@Component({
  selector: 'app-calendar-popup',
  templateUrl: './calendar-popup.component.html',
  styleUrls: ['./calendar-popup.component.scss'],
})
export class CalendarPopupComponent implements OnInit {
  @Input() weeklyData?: any[];
  @Input() branch: 'main' | 'second' = 'main'; // Add branch input

  days: DayInfo[] = [];

  readonly hebrewDaysMap: { [key in 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday']: string } = {
    Sunday: 'ראשון',
    Monday: 'שני',
    Tuesday: 'שלישי',
    Wednesday: 'רביעי',
    Thursday: 'חמישי',
    Friday: 'שישי',
    Saturday: 'שבת',
  };

  readonly daysOfWeekEnglish = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  constructor(
    private modalCtrl: ModalController, 
    private ameliaService: AmeliaService
  ) {}

  ngOnInit(): void {
    this.loadWeeklyTrainings();
  }
  
  loadWeeklyTrainings(): void {
    // Load branch-specific data from local storage
    // this.ameliaService.loadTrainingsFromLocalStorage(this.branch);
    const branchTrainings = this.ameliaService.getTrainingsTitles(this.branch);

    this.days = this.daysOfWeekEnglish.map((dayNameEnglish, index) => {
      const targetDate = moment().day(index).format('DD/MM/YYYY');
      const trainings = branchTrainings[dayNameEnglish] || [];

      return {
        name: dayNameEnglish,
        date: targetDate,
        trainings,
      };
    });
  }

  async refreshTrainings(): Promise<void> {
    try {
      await this.ameliaService.fetchTitleTrainings("main");
      this.loadWeeklyTrainings();
    } catch (error) {
      console.error('Error refreshing trainings:', error);
      // Here you might want to show a toast or alert to the user
    }
    try {
      await this.ameliaService.fetchTitleTrainings("second");
      this.loadWeeklyTrainings();
    } catch (error) {
      console.error('Error refreshing trainings:', error);
      // Here you might want to show a toast or alert to the user
    }
  }

  getDayInHebrew(englishDay: string): string {
    return this.hebrewDaysMap[englishDay as keyof typeof this.hebrewDaysMap] || englishDay;
  }

  getMaxTrainingsLength(): number {
    return Math.max(...this.days.map(day => day.trainings.length), 0);
  }

  getRange(length: number): number[] {
    return Array.from({ length }, (_, i) => i);
  }

  getDayName(index: number): string {
    return this.daysOfWeekEnglish[index % 7];
  }

  getDateByOffset(offset: number): string {
    return moment().add(offset, 'days').format('DD/MM/YYYY');
  }

  getBranchTitle(): string {
    return this.branch === 'main' ? 'סניף ראשי' : 'סניף משני';
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}