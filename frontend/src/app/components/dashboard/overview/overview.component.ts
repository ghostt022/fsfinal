import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ContactFormComponent } from '../contact-form.component';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormBuilder } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ExamRegistrationComponent } from '../../exam-registration/exam-registration.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    MatDialogModule,
    RouterLink,
    CommonModule,
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-6">
      <div class="max-w-6xl mx-auto space-y-8">
        <!-- Welcome Message -->
        <div class="bg-white rounded-xl shadow p-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">
            Добредојдовте, {{ currentUser?.firstName }} {{ currentUser?.lastName }}!
          </h1>
          <p class="text-gray-600" *ngIf="isProfessor">Професорски панел - Преглед на вашите предмети и активности</p>
          <p class="text-gray-600" *ngIf="isStudent">Студентски панел - Преглед на вашите предмети и оценки</p>
        </div>

        <!-- Quick Info Cards - Professor -->
        <div *ngIf="isProfessor" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white rounded-xl shadow p-6 flex items-center">
            <span class="material-icons text-blue-600 text-4xl mr-4">school</span>
            <div>
              <div class="text-gray-500 text-sm">Мои предмети</div>
              <div class="text-2xl font-bold text-gray-900">{{ professorStats.courses }}</div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow p-6 flex items-center">
            <span class="material-icons text-green-600 text-4xl mr-4">people</span>
            <div>
              <div class="text-gray-500 text-sm">Вкупно студенти</div>
              <div class="text-2xl font-bold text-gray-900">{{ professorStats.totalStudents }}</div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow p-6 flex items-center">
            <span class="material-icons text-purple-600 text-4xl mr-4">event</span>
            <div>
              <div class="text-gray-500 text-sm">Предавања оваа недела</div>
              <div class="text-2xl font-bold text-gray-900">{{ professorStats.lecturesThisWeek }}</div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow p-6 flex items-center">
            <span class="material-icons text-orange-600 text-4xl mr-4">assignment</span>
            <div>
              <div class="text-gray-500 text-sm">Непроценети задачи</div>
              <div class="text-2xl font-bold text-gray-900">{{ professorStats.pendingGrades }}</div>
            </div>
          </div>
        </div>

        <!-- Quick Info Cards - Student -->
        <div *ngIf="isStudent" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white rounded-xl shadow p-6 flex items-center">
            <span class="material-icons text-blue-600 text-4xl mr-4">collections_bookmark</span>
            <div>
              <div class="text-gray-500 text-sm">Активни предмети</div>
              <div class="text-2xl font-bold text-gray-900">6</div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow p-6 flex items-center">
            <span class="material-icons text-green-600 text-4xl mr-4">star</span>
            <div>
              <div class="text-gray-500 text-sm">Освоени кредити</div>
              <div class="text-2xl font-bold text-gray-900">36</div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow p-6 flex items-center">
            <span class="material-icons text-purple-600 text-4xl mr-4">grade</span>
            <div>
              <div class="text-gray-500 text-sm">Просечна оцена (GPA)</div>
              <div class="text-2xl font-bold text-gray-900">8.7</div>
            </div>
          </div>
          <div class="bg-white rounded-xl shadow p-6 flex items-center">
            <span class="material-icons text-orange-600 text-4xl mr-4">check_circle</span>
            <div>
              <div class="text-gray-500 text-sm">Положени/Неположени</div>
              <div class="text-2xl font-bold text-gray-900">5 / 1</div>
            </div>
          </div>
        </div>

        <!-- Professor: Today's Schedule & Upcoming Lectures -->
        <div *ngIf="isProfessor" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Today's Schedule -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons text-blue-500 mr-2">schedule</span> Денешни предавања
            </h2>
            <div *ngIf="todaysLectures.length > 0; else noLecturesToday" class="space-y-3">
              <div *ngFor="let lecture of todaysLectures" class="flex items-center p-3 bg-blue-50 rounded-lg">
                <span class="material-icons text-blue-600 mr-3">class</span>
                <div class="flex-1">
                  <div class="font-medium text-gray-900">{{ lecture.courseName }}</div>
                  <div class="text-sm text-gray-600">{{ lecture.time }} - {{ lecture.room }}</div>
                </div>
                <span class="text-sm text-gray-500">{{ lecture.studentsCount }} студенти</span>
              </div>
            </div>
            <ng-template #noLecturesToday>
              <div class="text-center py-8 text-gray-500">
                <span class="material-icons text-4xl mb-2">event_available</span>
                <p>Нема предавања за денес</p>
              </div>
            </ng-template>
          </div>

          <!-- Upcoming Lectures -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons text-green-500 mr-2">event</span> Следни предавања
            </h2>
            <div *ngIf="upcomingLectures.length > 0; else noUpcomingLectures" class="space-y-3">
              <div *ngFor="let lecture of upcomingLectures" class="flex items-center p-3 bg-green-50 rounded-lg">
                <span class="material-icons text-green-600 mr-3">schedule</span>
                <div class="flex-1">
                  <div class="font-medium text-gray-900">{{ lecture.courseName }}</div>
                  <div class="text-sm text-gray-600">{{ lecture.date }} - {{ lecture.time }}</div>
                </div>
                <span class="text-sm text-gray-500">{{ lecture.room }}</span>
              </div>
            </div>
            <ng-template #noUpcomingLectures>
              <div class="text-center py-8 text-gray-500">
                <span class="material-icons text-4xl mb-2">event_busy</span>
                <p>Нема закажани предавања</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Student: Notifications & Calendar -->
        <div *ngIf="isStudent" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Notifications -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons text-red-500 mr-2">notifications</span> Активни нотификации
            </h2>
            <div *ngIf="notifications.length > 0; else noNotifications" class="space-y-3">
              <div *ngFor="let notification of notifications" class="flex items-start p-3 bg-blue-50 rounded-lg">
                <span class="material-icons text-blue-500 mr-2 mt-1">info</span>
                <div class="flex-1">
                  <div class="text-sm text-gray-900">{{ notification.message }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ notification.date }}</div>
                </div>
              </div>
            </div>
            <ng-template #noNotifications>
              <div class="text-center py-4 text-gray-500">
                <span class="material-icons text-2xl mb-2">notifications_none</span>
                <p>Нема нови нотификации</p>
              </div>
            </ng-template>
          </div>
          <!-- Calendar -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons text-blue-500 mr-2">calendar_today</span> Календар на настани (оваа недела)
            </h2>
            <table class="w-full text-left">
              <thead>
                <tr class="text-gray-500 text-sm">
                  <th class="py-1">Ден</th>
                  <th class="py-1">Настан</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="py-1 font-medium">Понеделник</td>
                  <td class="py-1">Предавање: Математика</td>
                </tr>
                <tr>
                  <td class="py-1 font-medium">Среда</td>
                  <td class="py-1">Испит: Програмирање</td>
                </tr>
                <tr>
                  <td class="py-1 font-medium">Петок</td>
                  <td class="py-1">Консултации: Проф. Петровска</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Student: Passed Subjects -->
        <div *ngIf="isStudent" class="bg-white rounded-xl shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <span class="material-icons text-green-500 mr-2">check_circle</span> Положени предмети
          </h2>
          <div *ngIf="passedSubjects.length > 0; else noPassedSubjects" class="overflow-x-auto">
            <table class="w-full text-left">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="py-3 text-sm font-medium text-gray-500">Предмет</th>
                  <th class="py-3 text-sm font-medium text-gray-500">Кредити</th>
                  <th class="py-3 text-sm font-medium text-gray-500">Оцена</th>
                  <th class="py-3 text-sm font-medium text-gray-500">Професор</th>
                  <th class="py-3 text-sm font-medium text-gray-500">Датум</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let subject of passedSubjects" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-3">
                    <div class="font-medium text-gray-900">{{ subject.courseName }}</div>
                    <div class="text-sm text-gray-500">{{ subject.courseCode }}</div>
                  </td>
                  <td class="py-3 text-sm text-gray-600">{{ subject.credits }}</td>
                  <td class="py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          [class]="getGradeColorClass(subject.grade)">
                      {{ subject.grade }}
                    </span>
                  </td>
                  <td class="py-3 text-sm text-gray-600">{{ subject.professorName }}</td>
                  <td class="py-3 text-sm text-gray-500">{{ subject.examDate }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #noPassedSubjects>
            <div class="text-center py-8 text-gray-500">
              <span class="material-icons text-4xl mb-2">school</span>
              <p>Нема положени предмети</p>
            </div>
          </ng-template>
        </div>

        <!-- Professor: Course Statistics & Recent Activity -->
        <div *ngIf="isProfessor" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Course Statistics -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons text-purple-500 mr-2">analytics</span> Статистики по предмети
            </h2>
            <div *ngIf="courseStats.length > 0; else noCourseStats" class="space-y-3">
              <div *ngFor="let course of courseStats" class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <div class="font-medium text-gray-900">{{ course.name }}</div>
                  <div class="text-sm text-gray-600">{{ course.code }} - {{ course.studentsCount }} студенти</div>
                </div>
                <div class="text-right">
                  <div class="text-lg font-bold text-purple-600">{{ course.averageGrade }}</div>
                  <div class="text-xs text-gray-500">просек</div>
                </div>
              </div>
            </div>
            <ng-template #noCourseStats>
              <div class="text-center py-8 text-gray-500">
                <span class="material-icons text-4xl mb-2">assessment</span>
                <p>Нема податоци за предметите</p>
              </div>
            </ng-template>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons text-orange-500 mr-2">history</span> Неодамнешни активности
            </h2>
            <div *ngIf="recentActivity.length > 0; else noRecentActivity" class="space-y-3">
              <div *ngFor="let activity of recentActivity" class="flex items-start p-3 bg-orange-50 rounded-lg">
                <span class="material-icons text-orange-600 mr-3 mt-1">{{ activity.icon }}</span>
                <div class="flex-1">
                  <div class="text-sm text-gray-900">{{ activity.description }}</div>
                  <div class="text-xs text-gray-500">{{ activity.time }}</div>
                </div>
              </div>
            </div>
            <ng-template #noRecentActivity>
              <div class="text-center py-8 text-gray-500">
                <span class="material-icons text-4xl mb-2">timeline</span>
                <p>Нема неодамнешни активности</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Professor: Quick Actions & Notifications -->
        <div *ngIf="isProfessor" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Quick Actions -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons text-green-600 mr-2">flash_on</span> Брзи акции
            </h2>
            <div class="flex flex-col space-y-3">
              <a routerLink="/dashboard/professors" class="flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer">
                <span class="material-icons text-primary-600 mr-3">grading</span>
                <span class="text-primary-700 font-medium">Внеси оценки</span>
              </a>
              <a routerLink="/dashboard/students" class="flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer">
                <span class="material-icons text-primary-600 mr-3">people</span>
                <span class="text-primary-700 font-medium">Преглед на студенти</span>
              </a>
              <a routerLink="/dashboard/schedule" class="flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer">
                <span class="material-icons text-primary-600 mr-3">event_available</span>
                <span class="text-primary-700 font-medium">Управувај со распоред</span>
              </a>
            </div>
          </div>

          <!-- Notifications -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons text-red-500 mr-2">notifications</span> Нотификации
            </h2>
            <div class="space-y-3">
              <div class="flex items-start p-3 bg-red-50 rounded-lg">
                <span class="material-icons text-red-500 mr-2">warning</span>
                <div>
                  <div class="text-sm text-gray-900">Имате {{ professorStats.pendingGrades }} непроценети задачи</div>
                  <div class="text-xs text-gray-500">Рок: 3 дена</div>
                </div>
              </div>
              <div class="flex items-start p-3 bg-blue-50 rounded-lg">
                <span class="material-icons text-blue-500 mr-2">info</span>
                <div>
                  <div class="text-sm text-gray-900">Следно предавање за 2 часа</div>
                  <div class="text-xs text-gray-500">Веб Технологии - Лаб. 2</div>
                </div>
              </div>
              <div class="flex items-start p-3 bg-green-50 rounded-lg">
                <span class="material-icons text-green-500 mr-2">check_circle</span>
                <div>
                  <div class="text-sm text-gray-900">Нови студенти се регистрирани</div>
                  <div class="text-xs text-gray-500">5 нови студенти во вашите предмети</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Student: Recommended Actions & Quick Links -->
        <div *ngIf="isStudent" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Recommended Actions -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons text-green-600 mr-2">tips_and_updates</span> Препорачани акции
            </h2>
            <div class="flex flex-col space-y-3">
              <a (click)="goToGrades()" class="flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer">
                <span class="material-icons text-primary-600 mr-3">grading</span>
                <span class="text-primary-700 font-medium">Провери ги твоите оценки</span>
              </a>
              <a (click)="openExamRegistrationDialog()" class="flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer">
                <span class="material-icons text-primary-600 mr-3">assignment</span>
                <span class="text-primary-700 font-medium">Пријави испит</span>
              </a>
              <a routerLink="/dashboard/my-exam-registrations" class="flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer">
                <span class="material-icons text-primary-600 mr-3">assignment_turned_in</span>
                <span class="text-primary-700 font-medium">Мои пријави за испити</span>
              </a>
              <a routerLink="/dashboard/schedule" class="flex items-center p-3 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors cursor-pointer">
                <span class="material-icons text-primary-600 mr-3">event_available</span>
                <span class="text-primary-700 font-medium">Погледни го распоредот за утре</span>
              </a>
            </div>
          </div>
          <!-- Quick Links -->
          <div class="bg-white rounded-xl shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <span class="material-icons text-blue-600 mr-2">link</span> Брзи линкови
            </h2>
            <div class="flex flex-col space-y-3">
              <a href="https://drive.google.com/file/d/1Kcbwk0Gnk6MBP3Fhmdke1hkSpdC3ScGn/view?usp=sharing" target="_blank" class="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <span class="material-icons text-blue-600 mr-3">picture_as_pdf</span>
                <span class="text-blue-700 font-medium">PDF скрипти</span>
              </a>
              <a href="https://drive.google.com/drive/home" target="_blank" class="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <span class="material-icons text-blue-600 mr-3">folder_shared</span>
                <span class="text-blue-700 font-medium">Резултати од испити</span>
              </a>
              <a (click)="openContactDialog()" class="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer">
                <span class="material-icons text-blue-600 mr-3">contact_mail</span>
                <span class="text-blue-700 font-medium">Контакт за студентски прашања</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `.bg-red-100 {
      background-color: #fee2e2 !important;
    }`
  ]
})
export class OverviewComponent implements OnInit {
  currentUser: any = null;
  professorStats = {
    courses: 0,
    totalStudents: 0,
    lecturesThisWeek: 0,
    pendingGrades: 0
  };

  todaysLectures: any[] = [];
  upcomingLectures: any[] = [];
  courseStats: any[] = [];
  recentActivity: any[] = [];
  notifications: any[] = [];
  passedSubjects: any[] = [];

  constructor(
    private dialog: MatDialog, 
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadUserData();
    this.loadProfessorData();
    this.loadStudentData();
  }

  loadUserData() {
    this.currentUser = this.authService.getCurrentUser();
  }

  get isStudent(): boolean {
    return this.authService.isStudent();
  }

  get isProfessor(): boolean {
    return this.authService.isProfessor();
  }

  loadProfessorData() {
    // Load professor statistics and data
    this.loadProfessorStats();
    this.loadTodaysLectures();
    this.loadUpcomingLectures();
    this.loadCourseStats();
    this.loadRecentActivity();
  }

  loadProfessorStats() {
    // Mock data - replace with actual API calls
    this.professorStats = {
      courses: 4,
      totalStudents: 120,
      lecturesThisWeek: 8,
      pendingGrades: 15
    };
  }

  loadTodaysLectures() {
    // Mock data for today's lectures
    this.todaysLectures = [
      {
        courseName: 'Веб Технологии',
        time: '10:00 - 12:00',
        room: 'Лаб. 2',
        studentsCount: 25
      },
      {
        courseName: 'Бази на Податоци',
        time: '14:00 - 16:00',
        room: 'Аудиториум А',
        studentsCount: 30
      }
    ];
  }

  loadUpcomingLectures() {
    // Mock data for upcoming lectures
    this.upcomingLectures = [
      {
        courseName: 'Програмирање',
        date: 'Утре',
        time: '09:00 - 11:00',
        room: 'Лаб. 1'
      },
      {
        courseName: 'Софтверско Инженерство',
        date: 'Среда',
        time: '13:00 - 15:00',
        room: 'Аудиториум Б'
      }
    ];
  }

  loadCourseStats() {
    // Mock data for course statistics
    this.courseStats = [
      {
        name: 'Веб Технологии',
        code: 'WT-301',
        studentsCount: 25,
        averageGrade: 8.2
      },
      {
        name: 'Бази на Податоци',
        code: 'DB-302',
        studentsCount: 30,
        averageGrade: 7.8
      },
      {
        name: 'Програмирање',
        code: 'PR-201',
        studentsCount: 35,
        averageGrade: 8.5
      }
    ];
  }

  loadRecentActivity() {
    // Mock data for recent activity
    this.recentActivity = [
      {
        icon: 'grading',
        description: 'Внесени оценки за испит по Веб Технологии',
        time: '2 часа пред'
      },
      {
        icon: 'people',
        description: 'Нов студент се регистрирал за предмет Бази на Податоци',
        time: '4 часа пред'
      },
      {
        icon: 'event',
        description: 'Закажано ново предавање за среда',
        time: '1 ден пред'
      }
    ];
  }

  openContactDialog() {
    this.dialog.open(ContactFormComponent, {
      width: '500px'
    });
  }

  goToGrades() {
    this.router.navigate(['/dashboard/grades']);
  }

  loadStudentData() {
    if (this.isStudent) {
      this.loadNotifications();
      this.loadPassedSubjects();
    }
  }

  loadNotifications() {
    // Load notifications from localStorage
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      this.notifications = JSON.parse(storedNotifications);
    }
  }

  loadPassedSubjects() {
    // Mock data for passed subjects - in real app, this would come from API
    this.passedSubjects = [
      {
        courseName: 'Вовед во програмирање',
        courseCode: 'CS001',
        credits: 6,
        grade: 8,
        professorName: 'Проф. Петров',
        examDate: '15.06.2024'
      },
      {
        courseName: 'Структури на податоци',
        courseCode: 'CS002',
        credits: 6,
        grade: 9,
        professorName: 'Проф. Иванова',
        examDate: '20.06.2024'
      },
      {
        courseName: 'Алгоритми',
        courseCode: 'CS003',
        credits: 6,
        grade: 7,
        professorName: 'Проф. Стојанов',
        examDate: '25.06.2024'
      }
    ];
  }

  getGradeColorClass(grade: number): string {
    if (grade >= 9) return 'bg-green-100 text-green-800';
    if (grade >= 7) return 'bg-blue-100 text-blue-800';
    if (grade >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  openExamRegistrationDialog(): void {
    const dialogRef = this.dialog.open(ExamRegistrationComponent, {
      width: '600px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Exam registration result:', result);
        // Optionally refresh data or show success message
      }
    });
  }
} 