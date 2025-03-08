import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  constructor(private platform: Platform) {}

  /**
   * Adds an event to the device's calendar
   * First tries to use the native calendar through the Calendar plugin
   * Falls back to Google Calendar URL if native calendar fails
   */
  async addEventToCalendar(
    title: string,
    location: string,
    description: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        // Try using the native calendar first
        await CapacitorCalendar.createEvent({
          title,
          location,
          startDate: 20251112,
          endDate: 20241121,
        });
        return true;
      } catch (error) {
        console.log('Native calendar failed, trying Google Calendar URL', error);
        // Fall back to Google Calendar URL
        return this.openGoogleCalendarUrl(title, location, description, startTime, endTime);
      }
    } else {
      // For web platform, use Google Calendar URL
      return this.openGoogleCalendarUrl(title, location, description, startTime, endTime);
    }
  }

  /**
   * Opens Google Calendar with pre-filled event details
   */
  private async openGoogleCalendarUrl(
    title: string,
    location: string,
    description: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
        title
      )}&dates=${this.formatDateForGoogleCalendar(startTime)}/${this.formatDateForGoogleCalendar(
        endTime
      )}&details=${encodeURIComponent(description)}&location=${encodeURIComponent(
        location
      )}&sf=true&output=xml`;

      await Browser.open({ url: googleCalendarUrl });
      return true;
    } catch (error) {
      console.error('Error opening Google Calendar URL:', error);
      return false;
    }
  }

  /**
   * Formats date in the format required by Google Calendar URL
   * Example: 20220101T120000Z
   */
  private formatDateForGoogleCalendar(date: Date): string {
    return (
      date.getUTCFullYear() +
      ('0' + (date.getUTCMonth() + 1)).slice(-2) +
      ('0' + date.getUTCDate()).slice(-2) +
      'T' +
      ('0' + date.getUTCHours()).slice(-2) +
      ('0' + date.getUTCMinutes()).slice(-2) +
      '00Z'
    );
  }
}