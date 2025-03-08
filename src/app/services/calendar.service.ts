import { Injectable } from '@angular/core';
import { Calendar } from '@awesome-cordova-plugins/calendar/ngx';
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  constructor(private platform: Platform, private calendar: Calendar) {}

  async addEventToCalendar(title: string, location: any, notes: string, startDate: Date, endDate: Date) {
    if (this.platform.is('capacitor')) {
      try {
        const hasPermission = await this.calendar.hasReadWritePermission();
        if (!hasPermission) {
          await this.calendar.requestReadWritePermission();
        }

        await this.calendar.createEvent(title, location, notes, startDate, endDate);
        console.log("Event added to calendar succesfully!");
      } catch (error) {
        console.error("Error adding event to calendar: ", error);
      }
    } else {
      console.warn("Calendar Plugin only works on mobile devices!")
    }
  }
}