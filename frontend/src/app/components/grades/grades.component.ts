import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { GradesService, GradeWithDetails } from '../../services/grades.service';

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatProgressSpinnerModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.css']
})
export class GradesComponent implements OnInit {
  displayedColumns: string[] = ['code', 'name', 'professor', 'credits', 'semester', 'grade', 'date'];
  dataSource: GradeWithDetails[] = [];

  passedSubjects: GradeWithDetails[] = [];
  unpassedSubjects: any[] = [];

  displayedColumnsUnpassed: string[] = ['code', 'name', 'professor', 'credits', 'semester'];
  dataSourceUnpassed: any[] = [];

  isLoading = true;
  error: string | null = null;

  constructor(private gradesService: GradesService) {}

  ngOnInit(): void {
    this.loadGrades();
  }

  loadGrades(): void {
    this.isLoading = true;
    this.error = null;
    console.log('Starting to load grades...');

    this.gradesService.getMyGrades().subscribe({
      next: (grades) => {
        console.log('Loaded grades successfully:', grades);
        
        // Show all grades, not just limited selection
        this.passedSubjects = grades.filter(g => g.grade >= 6);
        this.unpassedSubjects = grades.filter(g => g.grade < 6 || g.grade === undefined);
        
        console.log('Passed subjects:', this.passedSubjects);
        console.log('Unpassed subjects:', this.unpassedSubjects);
        
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Грешка при вчитување на оценките. Обидете се повторно.';
        this.isLoading = false;
        console.error('Error loading grades:', err);
        console.error('Error details:', err.status, err.message);
      }
    });
  }

  calculateUnpassedSubjects(): void {
    // This would need to be implemented based on the courses the student is enrolled in
    // For now, we'll show a message that this feature needs backend support
    this.dataSourceUnpassed = [];
  }

  getProfessorName(grade: GradeWithDetails): string {
    if (grade.courseDetails?.professor?.user) {
      return `${grade.courseDetails.professor.user.firstName} ${grade.courseDetails.professor.user.lastName}`;
    }
    return 'Непознат професор';
  }

  getCourseCode(grade: GradeWithDetails): string {
    return grade.courseDetails?.code || 'Непозната шифра';
  }

  getCourseName(grade: GradeWithDetails): string {
    return grade.courseDetails?.name || 'Непознат предмет';
  }

  getCourseCredits(grade: GradeWithDetails): number {
    return grade.courseDetails?.credits || 0;
  }

  getSemester(grade: GradeWithDetails): number {
    return grade.semester;
  }

  debugGrades(): void {
    console.log('Debugging grades...');
    this.gradesService.debugGrades().subscribe({
      next: (debugData) => {
        console.log('Debug data:', debugData);
        alert(`Debug info logged to console. Found ${debugData.matchingGrades?.length || 0} matching grades.`);
      },
      error: (err) => {
        console.error('Debug error:', err);
        alert('Debug failed - check console for details');
      }
    });
  }
} 