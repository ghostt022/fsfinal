import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Notification {
  _id: { $oid: string };
  studentId: { $oid: string };
  professorId: { $oid: string };
  courseId: { $oid: string };
  type: string;
  title: string;
  message: string;
  courseName: string;
  grade: number;
  professorName: string;
  isRead: boolean;
  createdAt: { $date: string };
  readAt: { $date: string } | null;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/grades';
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) { }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/notifications`).pipe(
      tap(notifications => this.notificationsSubject.next(notifications))
    );
  }

  markAsRead(notificationId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${notificationId}/read`, {}).pipe(
      tap(() => {
        // Remove the notification from the local state
        const currentNotifications = this.notificationsSubject.value;
        const updatedNotifications = currentNotifications.filter(n => n._id.$oid !== notificationId);
        this.notificationsSubject.next(updatedNotifications);
      })
    );
  }

  getUnreadCount(): number {
    return this.notificationsSubject.value.length;
  }

  hasUnreadNotifications(): boolean {
    return this.getUnreadCount() > 0;
  }
}
