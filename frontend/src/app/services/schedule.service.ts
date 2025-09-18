import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// TODO: Define a proper interface for the schedule response
export interface ScheduleResponse {
  schedule: any; // Using any for now, should be replaced with a proper interface
}

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = 'http://localhost:3000/api/schedule';

  constructor(private http: HttpClient) { }

  getMySchedule(): Observable<ScheduleResponse> {
    return this.http.get<ScheduleResponse>(`${this.apiUrl}/my-schedule`);
  }
} 