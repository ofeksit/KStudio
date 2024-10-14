export interface Booking {
    title?:string;
    bookingEnd: string;
    bookingStart: string;
    googleCalendarEventId: string;
    serviceId: number;
    userBookingStatus: string;
}
