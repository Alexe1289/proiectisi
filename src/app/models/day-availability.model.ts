export interface DayAvailability {
  date: string; // ISO date: "2025-01-15"
  status: 'available' | 'pending' | 'booked';
}
