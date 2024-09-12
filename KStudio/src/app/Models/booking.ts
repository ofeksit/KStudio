export interface Booking {
    title?:string;
    bookingEnd: string;
    bookingStart: string;
    bookings: string[];
    googleCalendarEventId: string;
    serviceId: number;
    status: string;
}
