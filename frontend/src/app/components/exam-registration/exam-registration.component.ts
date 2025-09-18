import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ExamRegistrationService } from '../../services/exam-registration.service';

export interface ExamRegistrationData {
  professorName: string;
  courseName: string;
  semester: 'winter' | 'summer';
  examDate?: string;
  notes?: string;
}

@Component({
  selector: 'app-exam-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatAutocompleteModule
  ],
  template: `
    <div class="exam-registration-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon class="title-icon">assignment</mat-icon>
        Пријави испит
      </h2>
      
      <mat-dialog-content class="dialog-content">
        <form [formGroup]="examForm" class="exam-form">
          <div class="form-row">
            <mat-form-field class="full-width">
              <mat-label>Име на професор</mat-label>
              <input matInput 
                     formControlName="professorName" 
                     placeholder="Внесете име на професор"
                     [matAutocomplete]="auto">
              <mat-autocomplete #auto="matAutocomplete" [displayWith]="displayProfessor" (optionSelected)="onProfessorSelected($event)">
                <mat-option *ngFor="let professor of filteredProfessors$ | async" [value]="professor">
                  {{ professor.firstName }} {{ professor.lastName }}
                </mat-option>
              </mat-autocomplete>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field class="full-width">
              <mat-label>Предмет</mat-label>
              <mat-select formControlName="courseId">
                <mat-option *ngFor="let course of availableCourses" [value]="course._id">
                  {{ course.code }} - {{ course.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field class="half-width">
              <mat-label>Семестар</mat-label>
              <mat-select formControlName="semester">
                <mat-option value="winter">Зимски семестар</mat-option>
                <mat-option value="summer">Летен семестар</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field class="half-width">
              <mat-label>Датум на испит</mat-label>
              <input matInput 
                     type="date" 
                     formControlName="examDate"
                     [min]="minDate">
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field class="full-width">
              <mat-label>Забелешки (опционално)</mat-label>
              <textarea matInput 
                        formControlName="notes" 
                        placeholder="Додадете забелешки за испитот..."
                        rows="3"></textarea>
            </mat-form-field>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()" [disabled]="loading">
          Откажи
        </button>
        <button mat-raised-button 
                color="primary" 
                (click)="onSubmit()" 
                [disabled]="examForm.invalid || loading">
          <mat-icon *ngIf="!loading">send</mat-icon>
          <mat-icon *ngIf="loading" class="spinning">refresh</mat-icon>
          {{ loading ? 'Пријавувам...' : 'Пријави испит' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .exam-registration-dialog {
      min-width: 500px;
      max-width: 600px;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      color: #1976d2;
      margin-bottom: 20px;
    }

    .title-icon {
      margin-right: 10px;
      font-size: 28px;
    }

    .dialog-content {
      padding: 20px 0;
    }

    .exam-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      flex: 1;
    }

    .dialog-actions {
      justify-content: flex-end;
      padding: 20px 0 0 0;
      gap: 12px;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    mat-form-field {
      width: 100%;
    }

    textarea {
      resize: vertical;
      min-height: 80px;
    }
  `]
})
export class ExamRegistrationComponent implements OnInit {
  examForm: FormGroup;
  loading = false;
  minDate: string;
  availableCourses: any[] = [];
  filteredProfessors$: any;

  private examService = inject(ExamRegistrationService);
  private snackBar = inject(MatSnackBar);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ExamRegistrationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.minDate = new Date().toISOString().split('T')[0];
    
    this.examForm = this.fb.group({
      professorName: ['', Validators.required],
      courseId: ['', Validators.required],
      semester: ['winter', Validators.required],
      examDate: ['', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadAvailableCourses();
    this.loadProfessors();
  }

  loadAvailableCourses(): void {
    this.examService.getAvailableCourses().subscribe({
      next: (courses) => {
        console.log('Loaded courses:', courses);
        this.availableCourses = courses;
        if (courses.length === 0) {
          this.snackBar.open('Нема достапни предмети за пријавување', 'Затвори', { duration: 3000 });
        }
      },
      error: (error: any) => {
        console.error('Error loading courses:', error);
        this.snackBar.open('Грешка при вчитување на предметите', 'Затвори', { duration: 3000 });
      }
    });
  }

  loadProfessors(): void {
    this.examService.getProfessors().subscribe({
      next: (professors) => {
        this.filteredProfessors$ = professors;
      },
      error: (error: any) => {
        console.error('Error loading professors:', error);
      }
    });
  }

  displayProfessor(professor: any): string {
    return professor ? `${professor.firstName} ${professor.lastName}` : '';
  }

  onProfessorSelected(event: any): void {
    const professor = event.option.value;
    // You can add logic here to filter courses by professor if needed
  }

  onSubmit(): void {
    if (this.examForm.valid) {
      this.loading = true;
      const formData = this.examForm.value;

      const examRegistration = {
        professorName: formData.professorName,
        courseId: formData.courseId,
        semester: formData.semester,
        examDate: formData.examDate,
        notes: formData.notes,
        status: 'pending' as 'pending' | 'approved' | 'rejected'
      };

      this.examService.registerForExam(examRegistration).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.snackBar.open('Успешно пријавен за испит!', 'Затвори', { 
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(response);
        },
        error: (error: any) => {
          this.loading = false;
          console.error('Error registering for exam:', error);
          this.snackBar.open('Грешка при пријавување за испит', 'Затвори', { duration: 3000 });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
