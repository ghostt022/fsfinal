import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

interface Subject {
  code: string;
  name: string;
  professor: string;
  credits: number;
  semester: number;
  elective?: boolean;
}

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatChipsModule],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <mat-card *ngFor="let subject of subjects" class="shadow-lg">
        <mat-card-header>
          <mat-card-title class="flex justify-between items-center">
            <span>{{ subject.name }}</span>
            <mat-chip-listbox *ngIf="subject.elective">
              <mat-chip color="accent" selected>Elective</mat-chip>
            </mat-chip-listbox>
          </mat-card-title>
          <mat-card-subtitle>{{ subject.professor }}</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <p><strong>Code:</strong> {{ subject.code }}</p>
          <p><strong>Credits:</strong> {{ subject.credits }}</p>
          <p><strong>Semester:</strong> {{ subject.semester }}</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    mat-chip {
      height: 24px;
      font-size: 12px;
    }
  `]
})
export class SubjectListComponent {
  @Input() subjects: Subject[] = [];
} 