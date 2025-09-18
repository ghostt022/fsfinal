import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ScheduleService } from '../../services/schedule.service';
import { KeyValue } from '@angular/common';

// Define interfaces for better type safety
export interface Course {
  _id: string;
  code: string;
  name: string;
  schedule: {
    day: string;
    startTime: string;
    endTime: string;
    room: string;
  };
  professor?: {
    user?: {
      firstName: string;
      lastName: string;
    }
  }
}

export interface Schedule {
  [day: string]: Course[];
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
})
export class ScheduleComponent implements OnInit {
  
  schedule: Schedule | null = null;
  isLoading = true;
  error: string | null = null;
  
  displayedColumns: string[] = ['time', 'course', 'code', 'room'];
  dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  dayTranslations: { [key: string]: string } = {
    'Monday': 'Понеделник',
    'Tuesday': 'Вторник',
    'Wednesday': 'Среда',
    'Thursday': 'Четврток',
    'Friday': 'Петок',
    'Saturday': 'Сабота',
    'Sunday': 'Недела'
  };

  constructor(private scheduleService: ScheduleService) {}

  ngOnInit(): void {
    // Example JSON courses for demonstration
    const exampleSchedule: Schedule = {
      Monday: [
        {
          _id: '1',
          code: 'INKI101',
          name: 'Calculus 1',
          schedule: {
            day: 'Monday',
            startTime: '08:00',
            endTime: '09:30',
            room: 'A101'
          },
          professor: {
            user: {
              firstName: 'John',
              lastName: 'Doe'
            }
          }
        },
        {
          _id: '2',
          code: 'INKI102',
          name: 'Introduction to Programming',
          schedule: {
            day: 'Monday',
            startTime: '10:00',
            endTime: '11:30',
            room: 'B202'
          },
          professor: {
            user: {
              firstName: 'Jane',
              lastName: 'Smith'
            }
          }
        }
      ],
      Wednesday: [
        {
          _id: '3',
          code: 'INKI201',
          name: 'Data Structures',
          schedule: {
            day: 'Wednesday',
            startTime: '12:00',
            endTime: '13:30',
            room: 'C303'
          },
          professor: {
            user: {
              firstName: 'Robert',
              lastName: 'Brown'
            }
          }
        }
      ],
      Friday: [
        {
          _id: '4',
          code: 'INKI301',
          name: 'Digital Logic',
          schedule: {
            day: 'Friday',
            startTime: '14:00',
            endTime: '15:30',
            room: 'D404'
          },
          professor: {
            user: {
              firstName: 'Chris',
              lastName: 'Davis'
            }
          }
        }
      ]
    };

    // For demo purposes, comment out the service call and use exampleSchedule
    // this.scheduleService.getMySchedule().subscribe({
    //   next: (response) => {
    //     this.schedule = response.schedule;
    //     this.isLoading = false;
    //   },
    //   error: (err) => {
    //     this.error = 'Failed to load schedule. Please try again later.';
    //     this.isLoading = false;
    //     console.error(err);
    //   },
    // });

    this.schedule = exampleSchedule;
    this.isLoading = false;
  }

  // Preserve original order of days
  originalOrder = (a: KeyValue<string,Course[]>, b: KeyValue<string,Course[]>): number => {
    return this.dayOrder.indexOf(a.key) - this.dayOrder.indexOf(b.key);
  }

  // Check if there are any scheduled courses
  hasSchedule(): boolean {
    if (!this.schedule) return false;
    return Object.values(this.schedule).some(day => day.length > 0);
  }
}