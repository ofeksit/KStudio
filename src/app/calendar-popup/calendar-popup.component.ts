import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { DayTrainings } from '../Models/day-trainings';
import { AmeliaService } from '../services/amelia-api.service';
import * as moment from 'moment';

@Component({
  selector: 'app-calendar-popup',
  templateUrl: './calendar-popup.component.html',
  styleUrls: ['./calendar-popup.component.scss'],
})
export class CalendarPopupComponent implements OnInit {
  @Input() weeklyData?: any[]; // Weekly training data
  
  days: { name: string; date: string; trainings: DayTrainings[] }[] = [];
  // Explicitly define the type for hebrewDaysMap
  hebrewDaysMap: { [key in 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday']: string } = {
    Sunday: 'ראשון',
    Monday: 'שני',
    Tuesday: 'שלישי',
    Wednesday: 'רביעי',
    Thursday: 'חמישי',
    Friday: 'שישי',
    Saturday: 'שבת',
  };


  constructor(private modalCtrl: ModalController, private ameliaService: AmeliaService) {}

  ngOnInit(): void {
    this.loadWeeklyTrainings();
  }
  
  loadWeeklyTrainings(): void {
    // Load data from local storage (set by the training component)
    this.ameliaService.loadTrainingsFromLocalStorage();

    const daysOfWeekEnglish = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.days = []; // Clear any previous data

    for (let i = 0; i < daysOfWeekEnglish.length; i++) {
      const dayNameEnglish = daysOfWeekEnglish[i];
      const targetDate = moment().day(i + 1).format('DD/MM/YYYY'); // Adjust `moment` index for Sunday start
      const trainings = this.ameliaService.trainingsByDay[dayNameEnglish] || [];

      this.days.push({
        name: dayNameEnglish, // English day name for logic
        date: targetDate,
        trainings,
      });
    }
  }

  getDayInHebrew(englishDay: string): string {
    return this.hebrewDaysMap[englishDay as keyof typeof this.hebrewDaysMap] || englishDay;
  }

  getMaxTrainingsLength(): number {
    return Math.max(...this.days.map(day => day.trainings.length), 0);
  }

  getRange(length: number): number[] {
    return Array.from({ length }, (_, i) => i); // Create a range [0, 1, 2, ..., length-1]
  }

  getDayName(index: number): string {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return dayNames[index % 7];
  }

  getDateByOffset(offset: number): string {
    const today = new Date();
    const targetDate = new Date(today.setDate(today.getDate() + offset));
    return targetDate.toLocaleDateString('en-GB'); // Format: DD.MM.YYYY
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}