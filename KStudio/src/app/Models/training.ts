export interface Training {
  title: string;
  date: string;  // Should be a date string in ISO format (or you can use Date type)
  time: string;  
  available: number;  // Available slots for the training
  capacity: number;   // Maximum capacity of the training
  favorite: boolean;  // Whether it's a favorite training
  status: 'approved' | 'cancelled' | 'pending';  // Status of the training
}