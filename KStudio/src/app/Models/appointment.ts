export interface Appointment {
    training_name: string;
    bookings: string[];
    start_time: string;  
    end_time: string;
    isFull: boolean;  // Available slots for the training
    capacity: number;   // Maximum capacity of the training
    favorite: boolean;  // Whether it's a favorite training
  }
  
  
  