export interface UpcomingAppointment {
    appointmentId: number;
    bookingId: string;
    date: string;
    status: string;
    serviceName: string;
    startTime: string;
    fadeOut?: any;
    providerID: string;
  }