import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common'; // 

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule], // add Common module here
  template: `
    <div class="p-8">
      <h2 class="text-center">Сите студенти</h2>
      <div *ngIf="students.length === 0" class="text-gray-500 text-center mt-4">Нема студенти за прикажување.</div>
      <ul *ngIf="students.length > 0" class="mt-6 space-y-2">
        <li *ngFor="let s of students" class="border p-2 rounded">
          <strong>{{ s.studentId }}</strong> - {{ s.user?.firstName }} {{ s.user?.lastName }} ({{ s.user?.email }})
          <span class="ml-2 text-xs text-gray-600">Год: {{ s.year }}, Сем: {{ s.semester }}, {{ s.department }}</span>
        </li>
      </ul>
    </div>
  `,
  styles: []
})
export class StudentsComponent implements OnInit {
  private http = inject(HttpClient);
  students: any[] = [];

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    this.http.get<any>('http://localhost:3000/api/students', { headers }).subscribe({
      next: (resp) => {
        console.log('API response:', resp);
        this.students = resp.students || [];
      },
      error: (err) => {
        console.error('Error loading students:', err);
        this.students = [];
      }
    });
  }
}