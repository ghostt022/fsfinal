import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Grade {
  _id?: string;
  student: string;
  course: string;
  grade: number;
  date: Date;
  semester: number;
  academicYear: string;
}

export interface GradeWithDetails extends Grade {
  courseDetails?: {
    code: string;
    name: string;
    credits: number;
    professor?: {
      user?: {
        firstName: string;
        lastName: string;
      }
    }
  };
}

@Injectable({
  providedIn: 'root'
})
export class GradesService {
  private apiUrl = '/api/grades';

  constructor(private http: HttpClient) { }

  getMyGrades(): Observable<GradeWithDetails[]> {
    return this.http.get<GradeWithDetails[]>(`${this.apiUrl}/my-grades`);
  }

  getStudentGrades(studentId: string): Observable<GradeWithDetails[]> {
    return this.http.get<GradeWithDetails[]>(`${this.apiUrl}/student/${studentId}`);
  }

  addGrade(grade: Partial<Grade>): Observable<Grade> {
    return this.http.post<Grade>(`${this.apiUrl}`, grade);
  }

  updateGrade(gradeId: string, grade: Partial<Grade>): Observable<Grade> {
    return this.http.put<Grade>(`${this.apiUrl}/${gradeId}`, grade);
  }

  deleteGrade(gradeId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${gradeId}`);
  }

  // Debug method to check data relationships
  debugGrades(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/debug`);
  }
} 