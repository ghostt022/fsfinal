import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type MongoId = string | { $oid: string };
export interface ExamRegistration {
  _id?: MongoId;
  studentId: string;
  professorName: string;
  courseId: string;
  courseName?: string;
  semester: 'winter' | 'summer';
  examDate: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Professor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
}

export interface Course {
  _id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  professor: {
    $oid: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ExamRegistrationService {
  private apiUrl = '/api/exam-registrations';

  constructor(private http: HttpClient) { }

  // Get available courses for exam registration
  getAvailableCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/available-courses`);
  }

  // Get all professors
  getProfessors(): Observable<Professor[]> {
    return this.http.get<Professor[]>(`${this.apiUrl}/professors`);
  }

  // Register for an exam
  registerForExam(registration: Partial<ExamRegistration>): Observable<ExamRegistration> {
    return this.http.post<ExamRegistration>(`${this.apiUrl}`, registration);
  }

  // Get student's exam registrations
  getMyExamRegistrations(): Observable<ExamRegistration[]> {
    return this.http.get<ExamRegistration[]>(`${this.apiUrl}/my-registrations`);
  }

  // Cancel exam registration
  cancelExamRegistration(registrationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${registrationId}`);
  }

  // Update exam registration
  updateExamRegistration(registrationId: string, updates: Partial<ExamRegistration>): Observable<ExamRegistration> {
    return this.http.put<ExamRegistration>(`${this.apiUrl}/${registrationId}`, updates);
  }
}
