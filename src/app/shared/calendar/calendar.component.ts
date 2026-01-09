import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { DayAvailability } from '../../models/day-availability.model';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnChanges {

  @Input() availability: DayAvailability[] = [];
  @Output() daySelected = new EventEmitter<string>();

  daysInMonth: {
    date: string;
    dayNumber: number;
    status: 'available' | 'pending' | 'booked';
  }[] = [];

  currentYear!: number;
  currentMonth!: number;
  selectedDate: string | null = null;

  ngOnChanges() {
    this.generateCalendar(new Date());
  }

  generateCalendar(date: Date) {
    this.daysInMonth = [];

    this.currentYear = date.getFullYear();
    this.currentMonth = date.getMonth();

    const daysCount = new Date(
      this.currentYear,
      this.currentMonth + 1,
      0
    ).getDate();

    for (let day = 1; day <= daysCount; day++) {
      const isoDate = new Date(
        this.currentYear,
        this.currentMonth,
        day
      ).toISOString().split('T')[0];

      const backendDay = this.availability.find(d => d.date === isoDate);

      this.daysInMonth.push({
        date: isoDate,
        dayNumber: day,
        status: backendDay?.status || 'available'
      });
    }
  }

  selectDay(day: any) {
    if (day.status !== 'available') return;
    this.daySelected.emit(day.date);
  }

  isSelected(day: DayAvailability): boolean {
    return this.selectedDate === day.date;
  }
}
