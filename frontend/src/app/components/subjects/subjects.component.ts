import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { SubjectListComponent } from './subject-list.component';

interface Subject {
  code: string;
  name: string;
  professor: string;
  credits: number;
  semester: number;
  elective?: boolean;
}

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatTabsModule,
    SubjectListComponent
  ],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-6">Subjects</h1>
      <mat-tab-group>
        <mat-tab label="First Semester">
          <div class="p-4">
            <app-subject-list [subjects]="semester1Subjects"></app-subject-list>
          </div>
        </mat-tab>
        <mat-tab label="Second Semester">
          <div class="p-4">
            <app-subject-list [subjects]="semester2Subjects"></app-subject-list>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: []
})
export class SubjectsComponent implements OnInit {
  semester1Subjects: Subject[] = [];
  semester2Subjects: Subject[] = [];

  constructor() { }

  ngOnInit(): void {
    this.semester1Subjects = [
      { code: 'INKI101', name: 'Calculus 1', professor: 'Professor John Doe', credits: 6, semester: 1 },
      { code: 'INKI102', name: 'Introduction to Programming', professor: 'Professor Jane Smith', credits: 6, semester: 1 },
      { code: 'INKI103', name: 'Physics 1', professor: 'Professor Robert Brown', credits: 6, semester: 1 },
      { code: 'INKI104', name: 'Academic Writing', professor: 'Professor Michael Green', credits: 6, semester: 1 },
      { code: 'INKI105', name: 'English 1', professor: 'Professor Olivia Clark', credits: 6, semester: 1, elective: true },
    ];

    this.semester2Subjects = [
      { code: 'INKI201', name: 'Calculus 2', professor: 'Professor John Doe', credits: 6, semester: 2 },
      { code: 'INKI202', name: 'Data Structures', professor: 'Professor Jane Smith', credits: 6, semester: 2 },
      { code: 'INKI203', name: 'Physics 2', professor: 'Professor Robert Brown', credits: 6, semester: 2 },
      { code: 'INKI204', name: 'Digital Logic', professor: 'Professor Chris Davis', credits: 6, semester: 2 },
      { code: 'INKI205', name: 'English 2', professor: 'Professor Sophia Miller', credits: 6, semester: 2, elective: true },
    ];
  }
} 