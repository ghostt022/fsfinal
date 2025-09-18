import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExamRegistrationService, ExamRegistration } from '../../services/exam-registration.service';

@Component({
  selector: 'app-my-exam-registrations',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="exam-registrations-container">
      <div class="header-section">
        <h2 class="page-title">
          <mat-icon class="title-icon">assignment</mat-icon>
          Мои пријави за испити
        </h2>
        <p class="page-subtitle">Погледни ги сите твои пријави за испити и нивниот статус</p>
      </div>

      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Се вчитуваат пријавите...</p>
      </div>

      <div *ngIf="!isLoading && error" class="error-container">
        <mat-icon class="error-icon">error</mat-icon>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="loadRegistrations()">
          <mat-icon>refresh</mat-icon>
          Обиди се повторно
        </button>
      </div>

      <div *ngIf="!isLoading && !error">
        <div *ngIf="registrations.length === 0" class="empty-state">
          <mat-icon class="empty-icon">assignment_turned_in</mat-icon>
          <h3>Нема пријавени испити</h3>
          <p>Сеуште не сте пријавени за ниту еден испит.</p>
          <button mat-raised-button color="primary" routerLink="/dashboard">
            <mat-icon>add</mat-icon>
            Пријави испит
          </button>
        </div>

        <div *ngIf="registrations.length > 0" class="registrations-content">
          <div class="stats-cards">
            <div class="stat-card pending">
              <mat-icon>schedule</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ getPendingCount() }}</span>
                <span class="stat-label">Чекаат одобрување</span>
              </div>
            </div>
            <div class="stat-card approved">
              <mat-icon>check_circle</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ getApprovedCount() }}</span>
                <span class="stat-label">Одобрени</span>
              </div>
            </div>
            <div class="stat-card rejected">
              <mat-icon>cancel</mat-icon>
              <div class="stat-info">
                <span class="stat-number">{{ getRejectedCount() }}</span>
                <span class="stat-label">Одбиени</span>
              </div>
            </div>
          </div>

          <mat-card class="registrations-table-card">
            <mat-card-header>
              <mat-card-title>Сите пријави</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="table-responsive">
                <table mat-table [dataSource]="registrations" class="registrations-table">
                  <ng-container matColumnDef="course">
                    <th mat-header-cell *matHeaderCellDef>Предмет</th>
                    <td mat-cell *matCellDef="let element">
                      <div class="course-info">
                        <span class="course-code">{{ element.courseCode }}</span>
                        <span class="course-name">{{ element.courseName }}</span>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="professor">
                    <th mat-header-cell *matHeaderCellDef>Професор</th>
                    <td mat-cell *matCellDef="let element">{{ element.professorName }}</td>
                  </ng-container>

                  <ng-container matColumnDef="semester">
                    <th mat-header-cell *matHeaderCellDef>Семестар</th>
                    <td mat-cell *matCellDef="let element">
                      <mat-chip [class]="getSemesterChipClass(element.semester)">
                        {{ getSemesterLabel(element.semester) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="examDate">
                    <th mat-header-cell *matHeaderCellDef>Датум на испит</th>
                    <td mat-cell *matCellDef="let element">
                      {{ element.examDate | date:'dd.MM.yyyy' }}
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Статус</th>
                    <td mat-cell *matCellDef="let element">
                      <mat-chip [class]="getStatusChipClass(element.status)">
                        {{ getStatusLabel(element.status) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Акции</th>
                    <td mat-cell *matCellDef="let element">
                      <button mat-icon-button 
                              color="warn" 
                              (click)="cancelRegistration(element)"
                              [disabled]="element.status !== 'pending'"
                              matTooltip="Откажи пријава">
                        <mat-icon>cancel</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .exam-registrations-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-section {
      margin-bottom: 32px;
    }

    .page-title {
      display: flex;
      align-items: center;
      font-size: 28px;
      font-weight: 600;
      color: #1976d2;
      margin-bottom: 8px;
    }

    .title-icon {
      font-size: 32px;
      margin-right: 12px;
    }

    .page-subtitle {
      color: #666;
      font-size: 16px;
      margin: 0;
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      text-align: center;
    }

    .error-icon {
      font-size: 48px;
      color: #f44336;
      margin-bottom: 16px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      color: #ccc;
      margin-bottom: 24px;
    }

    .stats-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      border-radius: 12px;
      color: white;
    }

    .stat-card.pending {
      background: linear-gradient(135deg, #ff9800, #f57c00);
    }

    .stat-card.approved {
      background: linear-gradient(135deg, #4caf50, #388e3c);
    }

    .stat-card.rejected {
      background: linear-gradient(135deg, #f44336, #d32f2f);
    }

    .stat-card mat-icon {
      font-size: 32px;
      margin-right: 16px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-number {
      font-size: 24px;
      font-weight: bold;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.9;
    }

    .registrations-table-card {
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .table-responsive {
      overflow-x: auto;
    }

    .registrations-table {
      width: 100%;
    }

    .course-info {
      display: flex;
      flex-direction: column;
    }

    .course-code {
      font-weight: 600;
      color: #1976d2;
    }

    .course-name {
      font-size: 14px;
      color: #666;
    }

    mat-chip {
      font-weight: 500;
    }

    .winter-chip {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .summer-chip {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .pending-chip {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .approved-chip {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .rejected-chip {
      background-color: #ffebee;
      color: #c62828;
    }
  `]
})
export class MyExamRegistrationsComponent implements OnInit {
  displayedColumns: string[] = ['course', 'professor', 'semester', 'examDate', 'status', 'actions'];
  registrations: ExamRegistration[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(
    private examService: ExamRegistrationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadRegistrations();
  }

  loadRegistrations(): void {
    this.isLoading = true;
    this.error = null;

    this.examService.getMyExamRegistrations().subscribe({
      next: (registrations) => {
        this.registrations = registrations;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Грешка при вчитување на пријавите за испити';
        this.isLoading = false;
        console.error('Error loading exam registrations:', error);
      }
    });
  }

  getPendingCount(): number {
    return this.registrations.filter(r => r.status === 'pending').length;
  }

  getApprovedCount(): number {
    return this.registrations.filter(r => r.status === 'approved').length;
  }

  getRejectedCount(): number {
    return this.registrations.filter(r => r.status === 'rejected').length;
  }

  getSemesterLabel(semester: string): string {
    return semester === 'winter' ? 'Зимски' : 'Летен';
  }

  getSemesterChipClass(semester: string): string {
    return semester === 'winter' ? 'winter-chip' : 'summer-chip';
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Чека одобрување';
      case 'approved': return 'Одобрена';
      case 'rejected': return 'Одбиена';
      default: return status;
    }
  }

  getStatusChipClass(status: string): string {
    switch (status) {
      case 'pending': return 'pending-chip';
      case 'approved': return 'approved-chip';
      case 'rejected': return 'rejected-chip';
      default: return '';
    }
  }

  cancelRegistration(registration: ExamRegistration): void {
    if (registration._id) {
      const id = typeof registration._id === 'string' ? registration._id : registration._id.$oid;
      this.examService.cancelExamRegistration(id).subscribe({
        next: () => {
          this.snackBar.open('Пријавата е успешно откажана', 'Затвори', { duration: 3000 });
          this.loadRegistrations(); // Refresh the list
        },
        error: (error) => {
          console.error('Error cancelling registration:', error);
          this.snackBar.open('Грешка при откажување на пријавата', 'Затвори', { duration: 3000 });
        }
      });
    }
  }
}
