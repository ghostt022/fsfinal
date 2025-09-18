import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <mat-card class="w-full max-w-lg p-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-6 text-center">Контакт форма</h1>
        <form [formGroup]="contactForm" (ngSubmit)="onSubmit()" class="space-y-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Име и презиме</mat-label>
            <input matInput formControlName="name" placeholder="Вашето име и презиме">
            <mat-error *ngIf="contactForm.get('name')?.hasError('required')">Името е задолжително</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" placeholder="your@email.com">
            <mat-error *ngIf="contactForm.get('email')?.hasError('required')">Email е задолжителен</mat-error>
            <mat-error *ngIf="contactForm.get('email')?.hasError('email')">Внесете валиден email</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Наслов</mat-label>
            <input matInput formControlName="subject" placeholder="Наслов на прашањето">
            <mat-error *ngIf="contactForm.get('subject')?.hasError('required')">Насловот е задолжителен</mat-error>
          </mat-form-field>
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Порака</mat-label>
            <textarea matInput rows="5" formControlName="message" placeholder="Внесете ја вашата порака"></textarea>
            <mat-error *ngIf="contactForm.get('message')?.hasError('required')">Пораката е задолжителна</mat-error>
          </mat-form-field>
          <button mat-raised-button color="primary" class="w-full py-3" type="submit" [disabled]="contactForm.invalid">Испрати</button>
        </form>
      </mat-card>
    </div>
  `,
  styles: []
})
export class ContactFormComponent {
  contactForm: FormGroup;

  constructor(private fb: FormBuilder, private snackBar: MatSnackBar) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      subject: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.contactForm.valid) {
      this.snackBar.open('Вашето прашање е успешно испратено!', 'Затвори', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.contactForm.reset();
    }
  }
} 