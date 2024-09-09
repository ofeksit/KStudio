export interface Appointment {
  id?: number;
  type: string;
  title: { name: string }; // Optional for timeslots
  serviceID?: number;
  start_time: string;
  end_time: string;
  booked: number;
  capacity?: number;
  favorite?: boolean;
  current_participants?: string[]; // Optional for timeslots
  total_participants: number;     // Optional for timeslots
  googleCalendarEventId?: string; // Add Google Calendar ID
  isFull?: boolean;
}
