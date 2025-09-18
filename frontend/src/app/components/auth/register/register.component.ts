import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AuthService } from '../../../services/auth.service';

// Custom Validator function
function ukloEmailValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value as string;
  if (email && !email.toLowerCase().endsWith('@uklo.edu.mk')) {
    return { invalidDomain: true };
  }
  return null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  providers: [provideNativeDateAdapter()], // Needed for MatDatepicker
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatDatepickerModule
  ],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div class="w-full max-w-2xl">
        <mat-card class="p-8">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">Create an Account</h1>
            <p class="text-gray-600">Join the Faculty Management System</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" placeholder="Enter your first name">
                <mat-error *ngIf="registerForm.get('firstName')?.hasError('required')">
                  First name is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" placeholder="Enter your last name">
                <mat-error *ngIf="registerForm.get('lastName')?.hasError('required')">
                  Last name is required
                </mat-error>
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="e.g., your.name@uklo.edu.mk">
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
              <mat-error *ngIf="registerForm.get('email')?.hasError('invalidDomain')">
                Користете uklo.edu.mk адреса
              </mat-error>
            </mat-form-field>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password" placeholder="Create a password">
                <mat-icon matSuffix>lock</mat-icon>
                <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                  Password is required
                </mat-error>
                <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                  Password must be at least 6 characters
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Confirm Password</mat-label>
                <input matInput type="password" formControlName="confirmPassword" placeholder="Confirm your password">
                <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
                  Please confirm your password
                </mat-error>
                <mat-error *ngIf="registerForm.hasError('mismatch')">
                  Passwords do not match
                </mat-error>
              </mat-form-field>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Date of Birth</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="dateOfBirth" placeholder="Choose a date">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option value="student">Student</mat-option>
                  <mat-option value="professor">Professor</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div *ngIf="isStudent" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>Student ID</mat-label>
                  <input matInput formControlName="studentId" placeholder="e.g., ST12345">
                  <mat-error *ngIf="registerForm.get('studentId')?.hasError('required')">
                    Student ID is required
                  </mat-error>
                </mat-form-field>
                <span></span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>Year</mat-label>
                  <input matInput type="number" formControlName="year" placeholder="e.g., 1">
                  <mat-error *ngIf="registerForm.get('year')?.hasError('required')">
                    Year is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Semester</mat-label>
                  <input matInput type="number" formControlName="semester" placeholder="e.g., 1">
                  <mat-error *ngIf="registerForm.get('semester')?.hasError('required')">
                    Semester is required
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <div *ngIf="isProfessor" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>Professor ID</mat-label>
                  <input matInput formControlName="professorId" placeholder="e.g., P001">
                  <mat-error *ngIf="registerForm.get('professorId')?.hasError('required')">
                    Professor ID is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Title</mat-label>
                  <input matInput formControlName="title" placeholder="e.g., Associate Professor">
                  <mat-error *ngIf="registerForm.get('title')?.hasError('required')">
                    Title is required
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>Specialization</mat-label>
                  <input matInput formControlName="specialization" placeholder="e.g., Artificial Intelligence">
                </mat-form-field>
              </div>
            </div>

            <button mat-raised-button color="primary" type="submit" class="w-full py-3" [disabled]="registerForm.invalid || isLoading">
              <mat-icon *ngIf="isLoading" class="animate-spin mr-2">refresh</mat-icon>
              {{ isLoading ? 'Creating account...' : 'Sign Up' }}
            </button>
          </form>

          <div class="mt-6 text-center">
            <p class="text-gray-600">
              Already have an account?
              <a routerLink="/login" class="text-primary-600 hover:text-primary-700 font-medium">
                Sign in here
              </a>
            </p>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email, ukloEmailValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      role: ['student', Validators.required],
      dateOfBirth: [null],
      // Shared/role-specific fields
      year: [null],
      semester: [null],
      title: [''],
      specialization: [''],
      studentId: [''],
      professorId: ['']
    }, { validators: this.passwordMatchValidator });

    this.onRoleChange();
  }

  onRoleChange(): void {
    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      // Clear all validators first
      const clear = (name: string) => this.registerForm.get(name)?.clearValidators();
      const require = (name: string) => this.registerForm.get(name)?.setValidators([Validators.required]);

      // Reset
      ['year','semester','title','specialization','studentId','professorId'].forEach(n => clear(n));

      if (role === 'student') {
        require('studentId');
        require('year');
        require('semester');
      } else { // professor
        require('professorId');
        require('title');
        // specialization optional
        // НЕ require('department');
      }

      ['year','semester','title','specialization','studentId','professorId'].forEach(n => 
        this.registerForm.get(n)?.updateValueAndValidity()
      );
    });
  }

  get isStudent(): boolean {
    return this.registerForm.get('role')?.value === 'student';
  }

  get isProfessor(): boolean {
    return this.registerForm.get('role')?.value === 'professor';
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.get('email')?.hasError('invalidDomain')) {
      this.snackBar.open('Користете uklo.edu.mk адреса', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    if (this.registerForm.invalid) {
      this.snackBar.open('Please fill all required fields correctly.', 'Close', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      return;
    }

    this.isLoading = true;

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.snackBar.open('Registration successful! Redirecting to dashboard...', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open(err.error?.message || 'Registration failed. Please try again.', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }
}