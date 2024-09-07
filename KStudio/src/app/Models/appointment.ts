export interface Appointment {
  type: 'appointment' | 'timeslot';
  service?: { name: string }; // Only for appointments
  start_time: string;  // Common for both timeslots and appointments
  end_time: string;    // Common for both
  booked?: number;     // Only for appointments
  capacity?: number;   // Only for appointments
}
