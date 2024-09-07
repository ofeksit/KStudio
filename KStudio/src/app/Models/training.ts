export interface Training {
  title: string;
  time: string;  
  available: number;  // Available slots for the training
  capacity: number;   // Maximum capacity of the training
  favorite: boolean;  // Whether it's a favorite training
  status: 'approved' | 'cancelled' | 'pending';  // Status of the training
}


