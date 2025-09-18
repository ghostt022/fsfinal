import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { AuthService } from '../../services/auth.service';
import { Observable, map, startWith } from 'rxjs';

@Component({
  selector: 'app-professors',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatSnackBarModule,
    MatAutocompleteModule
  ],
  template: `
  <div class="h-screen flex flex-col">
    <!-- Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-4">
      <h1 class="text-2xl font-bold text-gray-800">Професорски панел</h1>
      <p class="text-gray-600">Управување со оценки и распоред</p>
    </div>

    <!-- Main Content - Fixed Height -->
    <div class="flex-1 overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full p-6">
        <!-- Left: Grade Form -->
        <mat-card class="lg:col-span-1 flex flex-col">
          <mat-card-title class="flex items-center">
            <mat-icon class="mr-2">grade</mat-icon>
            Додади/Ажурирај оцена
          </mat-card-title>
          <mat-card-content class="flex-1 overflow-y-auto">
            <form [formGroup]="gradeForm" (ngSubmit)="submitGrade()" class="space-y-4">
              <mat-form-field class="w-full">
                <mat-label>Индекс на студент</mat-label>
                <input matInput 
                       placeholder="Внесете индекс (напр. ST12345)" 
                       formControlName="studentIndex"
                       [matAutocomplete]="auto"
                       (input)="onStudentIndexChange($event)" />
                <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayStudent" (optionSelected)="onStudentSelected($event)">
                  <mat-option *ngFor="let student of filteredStudents$ | async" [value]="student">
                    {{ student.studentId }} - {{ student.user.firstName }} {{ student.user.lastName }}
                  </mat-option>
                </mat-autocomplete>
              </mat-form-field>

              <mat-form-field class="w-full">
                <mat-label>Предмет</mat-label>
                <mat-select formControlName="courseId">
                  <mat-option *ngFor="let c of myCourses" [value]="c._id?.$oid || c._id">{{ c.code }} - {{ c.name }}</mat-option>
                </mat-select>
                <div *ngIf="myCourses.length === 0" class="text-sm text-gray-500 mt-2">
                  Нема достапни предмети. Вкупно: {{ myCourses.length }}
                </div>
              </mat-form-field>

              <div class="grid grid-cols-2 gap-4">
                <mat-form-field>
                  <mat-label>Оцена</mat-label>
                  <input matInput type="number" min="5" max="10" formControlName="grade" />
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Семестар</mat-label>
                  <input matInput type="number" min="1" max="10" formControlName="semester" />
                </mat-form-field>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <mat-form-field>
                  <mat-label>Академска година</mat-label>
                  <input matInput placeholder="2024/2025" formControlName="academicYear" />
                </mat-form-field>
                <mat-form-field>
                  <mat-label>Датум на испит</mat-label>
                  <input matInput type="date" formControlName="examDate" />
                </mat-form-field>
              </div>

              <button mat-raised-button color="primary" class="w-full" [disabled]="gradeForm.invalid || loading">
                <mat-icon>save</mat-icon>
                <span class="ml-2">Зачувај</span>
              </button>
              <div class="text-sm text-red-600 mt-2" *ngIf="error">{{ error }}</div>
              <div class="text-sm text-green-700 mt-2" *ngIf="success">{{ success }}</div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Middle: My Courses -->
        <mat-card class="lg:col-span-1 flex flex-col">
          <mat-card-title class="flex items-center">
            <mat-icon class="mr-2">book</mat-icon>
            Мои предмети
          </mat-card-title>
          <mat-card-content class="flex-1 overflow-y-auto">
            <mat-list>
              <mat-list-item *ngFor="let c of myCourses">
                <div matListItemTitle>{{ c.code }} - {{ c.name }}</div>
                <div matListItemLine>{{ c.department }} • Год: {{ c.year }} • Сем: {{ c.semester }}</div>
                <div matListItemLine>Соба: {{ c.schedule?.room }} • Ден: {{ c.schedule?.day }} • {{ c.schedule?.startTime }}-{{ c.schedule?.endTime }}</div>
              </mat-list-item>
            </mat-list>
          </mat-card-content>
        </mat-card>

        <!-- Right: Weekly Schedule -->
        <mat-card class="lg:col-span-1 flex flex-col">
          <mat-card-title class="flex items-center">
            <mat-icon class="mr-2">schedule</mat-icon>
            Неделен распоред
          </mat-card-title>
          <mat-card-content class="flex-1 overflow-y-auto">
            <div *ngIf="!schedule" class="text-center py-8">
              <mat-icon class="text-gray-400 text-4xl mb-2">schedule</mat-icon>
              <p class="text-gray-500">Се вчитува распоредот...</p>
            </div>
            
            <div *ngIf="schedule" class="space-y-3">
              <div *ngFor="let day of daysOrder" class="border border-gray-200 rounded-lg overflow-hidden">
                <div class="bg-primary-50 px-3 py-2 border-b border-gray-200">
                  <h3 class="font-semibold text-primary-700 text-sm">{{ getDayName(day) }}</h3>
                </div>
                <div class="p-2">
                  <div *ngIf="schedule[day] && schedule[day].length > 0; else noLectures" class="space-y-2">
                    <div *ngFor="let lecture of schedule[day]" class="bg-white border border-gray-100 rounded p-2 shadow-sm">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <h4 class="font-medium text-gray-800 text-xs">{{ lecture.code }}</h4>
                          <p class="text-xs text-gray-600 mt-1 truncate">{{ lecture.name }}</p>
                        </div>
                        <div class="text-right ml-2">
                          <div class="text-xs font-medium text-primary-600">{{ lecture.schedule?.startTime }} - {{ lecture.schedule?.endTime }}</div>
                          <div class="text-xs text-gray-500">{{ lecture.schedule?.room }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ng-template #noLectures>
                    <div class="text-center py-3">
                      <mat-icon class="text-gray-300 text-xl mb-1">event_busy</mat-icon>
                      <p class="text-xs text-gray-400">Нема предавања</p>
                    </div>
                  </ng-template>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .success-snackbar {
      background-color: #4caf50 !important;
      color: white !important;
    }
  `]
})
export class ProfessorsComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  readonly API = 'http://localhost:3000/api';

  myCourses: any[] = [];
  allStudents: any[] = [];
  filteredStudents$!: Observable<any[]>;
  selectedStudent: any = null;
  schedule: Record<string, any[]> | null = null;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  daysOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

  gradeForm: FormGroup = this.fb.group({
    studentIndex: ['', Validators.required],
    courseId: ['', Validators.required],
    grade: [6, [Validators.required, Validators.min(5), Validators.max(10)]],
    semester: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
    academicYear: ['2024/2025', Validators.required],
    examDate: ['']
  });

  ngOnInit(): void {
    this.loadMyCourses();
    this.loadSchedule();
    
    // Only load students if user is professor or admin
    if (this.authService.isProfessor() || this.authService.isAdmin()) {
      this.loadStudents();
    }
  }

  setupStudentFilter(): void {
    this.filteredStudents$ = this.gradeForm.get('studentIndex')!.valueChanges.pipe(
      startWith(''),
      map(value => {
        const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
        return this.allStudents.filter(student => 
          student.studentId.toLowerCase().includes(filterValue) ||
          `${student.user.firstName} ${student.user.lastName}`.toLowerCase().includes(filterValue)
        );
      })
    );
  }

  displayStudent(student: any): string {
    return student ? `${student.studentId} - ${student.user.firstName} ${student.user.lastName}` : '';
  }

  onStudentIndexChange(event: any): void {
    const value = event.target.value;
    if (typeof value === 'string') {
      // If it's a string, try to find the student by the input value
      const foundStudent = this.allStudents.find(student => 
        student.studentId.toLowerCase().includes(value.toLowerCase()) ||
        `${student.user.firstName} ${student.user.lastName}`.toLowerCase().includes(value.toLowerCase())
      );
      this.selectedStudent = foundStudent || null;
    } else {
      this.selectedStudent = value;
    }
  }

  onStudentSelected(event: any): void {
    this.selectedStudent = event.option.value;
    console.log('Student selected:', this.selectedStudent);
  }

  loadStudents(): void {
  if (!this.authService.isProfessor() && !this.authService.isAdmin()) {
    console.log('User is not authorized to load students');
    return;
  }

  this.http.get<any>(`${this.API}/students`).subscribe({
    next: (response) => {
      this.allStudents = response.students || [];
      console.log('Students loaded:', this.allStudents.length);
      this.setupStudentFilter(); // <-- Move this here!
    },
    error: (err) => {
      console.error('Error loading students:', err);
      this.snackBar.open('Грешка при вчитување на студентите', 'Затвори', { duration: 3000 });
    }
  });
}


  loadMyCourses(): void {
    this.http.get<any>(`${this.API}/courses`, { params: { page: 1, limit: 100 } })
      .subscribe({
        next: (resp) => {
          console.log('All courses loaded:', resp.courses);
          // For now, let's show all courses - in a real app, you'd filter by professor
          this.myCourses = resp.courses || [];
          console.log('My courses set to:', this.myCourses);
        },
        error: (err) => {
          console.error('Error loading courses:', err);
          this.snackBar.open('Грешка при вчитување на предметите', 'Затвори', { duration: 3000 });
        }
      });
  }

  loadSchedule(): void {
    this.http.get<any>(`${this.API}/schedule/my-schedule`).subscribe({
      next: (data) => { 
        console.log('Schedule data:', data);
        this.schedule = data.schedule || this.getMockSchedule(); 
      },
      error: (err) => {
        console.error('Error loading schedule:', err);
        // Use mock data if API fails
        this.schedule = this.getMockSchedule();
        this.snackBar.open('Користени се примерни податоци за распоредот', 'Затвори', { duration: 3000 });
      }
    });
  }

  getMockSchedule(): Record<string, any[]> {
    return {
      'Monday': [
        { code: 'CS001', name: 'Вовед во програмирање', schedule: { startTime: '08:00', endTime: '09:30', room: 'A1' } },
        { code: 'CS002', name: 'Структури на податоци', schedule: { startTime: '10:00', endTime: '11:30', room: 'A2' } }
      ],
      'Tuesday': [
        { code: 'CS003', name: 'Алгоритми', schedule: { startTime: '08:00', endTime: '09:30', room: 'B1' } },
        { code: 'CS004', name: 'Архитектура на компјутери', schedule: { startTime: '10:00', endTime: '11:30', room: 'B2' } }
      ],
      'Wednesday': [
        { code: 'CS005', name: 'Оперативни системи', schedule: { startTime: '08:00', endTime: '09:30', room: 'C1' } },
        { code: 'CS006', name: 'Бази на податоци', schedule: { startTime: '10:00', endTime: '11:30', room: 'C2' } }
      ],
      'Thursday': [
        { code: 'CS007', name: 'Мрежи и телекомуникации', schedule: { startTime: '08:00', endTime: '09:30', room: 'D1' } },
        { code: 'CS008', name: 'Објектно-ориентирано програмирање', schedule: { startTime: '10:00', endTime: '11:30', room: 'D2' } }
      ],
      'Friday': [
        { code: 'CS009', name: 'Веб технологии', schedule: { startTime: '08:00', endTime: '09:30', room: 'E1' } },
        { code: 'CS010', name: 'Информациски системи', schedule: { startTime: '10:00', endTime: '11:30', room: 'E2' } }
      ]
    };
  }

  getDayName(day: string): string {
    const dayNames: Record<string, string> = {
      'Monday': 'Понеделник',
      'Tuesday': 'Вторник', 
      'Wednesday': 'Среда',
      'Thursday': 'Четврток',
      'Friday': 'Петок',
      'Saturday': 'Сабота',
      'Sunday': 'Недела'
    };
    return dayNames[day] || day;
  }

  submitGrade(): void {
    console.log('Form valid:', this.gradeForm.valid);
    console.log('Selected student:', this.selectedStudent);
    console.log('Form value:', this.gradeForm.value);

    if (this.gradeForm.invalid) {
      this.snackBar.open('Ве молиме пополнете ги сите полиња', 'Затвори', { duration: 3000 });
      return;
    }

    if (!this.selectedStudent) {
      this.snackBar.open('Ве молиме изберете студент од листата', 'Затвори', { duration: 3000 });
      return;
    }

    this.loading = true;
    this.error = null;
    this.success = null;

    const formValue = this.gradeForm.value;
    const selectedCourse = this.myCourses.find(c => (c._id?.$oid || c._id) === formValue.courseId);
    
    const payload = {
      studentId: this.selectedStudent._id.$oid,
      courseId: formValue.courseId,
      grade: formValue.grade,
      semester: formValue.semester,
      academicYear: formValue.academicYear,
      examDate: formValue.examDate
    };

    this.http.post<any>(`${this.API}/grades`, payload).subscribe({
      next: (res) => {
        this.success = res.message || 'Успешно зачувана оцена';
        this.loading = false;
        
        // Show success notification to professor
        this.snackBar.open(
          `Оцената е успешно внесена за ${this.selectedStudent.user.firstName} ${this.selectedStudent.user.lastName}`,
          'Затвори',
          { duration: 5000, panelClass: ['success-snackbar'] }
        );

        // Send notification to student
        this.sendNotificationToStudent(selectedCourse, formValue.grade);

        // Reset form
        this.gradeForm.reset();
        this.selectedStudent = null;
        this.gradeForm.patchValue({
          grade: 6,
          semester: 1,
          academicYear: '2024/2025'
        });
      },
      error: (err) => {
        this.error = err?.error?.message || 'Грешка при зачувување';
        this.loading = false;
        this.snackBar.open('Грешка при зачувување на оценката', 'Затвори', { duration: 3000 });
      }
    });
  }

  sendNotificationToStudent(course: any, grade: number): void {
    // The notification is now handled by the backend automatically
    // when a grade is created or updated
    console.log(`Grade ${grade} entered for course ${course?.name} - notification will be sent automatically by backend`);
  }
} 