export interface Appointment {
  id: number;
  type: string;
  title: { name: string }; // Optional for timeslots
  serviceId?: number;
  start_time: string;
  booked: number;
  capacity?: number;
  favorite?: boolean;
  current_participants?: string[]; // Optional for timeslots
  total_participants: number;     // Optional for timeslots
  googleCalendarEventId?: string; // Add Google Calendar ID
  isFull?: boolean;
  providerId?: number;
  locationId?: number;
  isLoading?: boolean; //Enrolling Animation
  isSuccess?: boolean; //Enrolling Animation
  isError?: boolean; //Enrolling animation
  isUserBooked?: boolean;
  isStandbyEnrolled?: boolean;
  isStandbySuccess?: boolean;
  isStandbyLoading?: boolean;
  songsCount: number;
}
