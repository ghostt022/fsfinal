import { Injectable } from '@angular/core';
import { NotificationService, Notification } from './notification.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationManagerService {
  private pendingNotifications = new BehaviorSubject<Notification[]>([]);
  public pendingNotifications$ = this.pendingNotifications.asObservable();

  constructor(private notificationService: NotificationService) {}

  async checkForNotifications(): Promise<void> {
    try {
      const notifications = await this.notificationService.getNotifications().toPromise();
      if (notifications && notifications.length > 0) {
        this.pendingNotifications.next(notifications);
      }
    } catch (error) {
      console.error('Error checking for notifications:', error);
    }
  }

  getNextNotification(): Notification | null {
    const notifications = this.pendingNotifications.value;
    return notifications.length > 0 ? notifications[0] : null;
  }

  removeNotification(notificationId: string): void {
    const notifications = this.pendingNotifications.value;
    const updatedNotifications = notifications.filter(n => n._id.$oid !== notificationId);
    this.pendingNotifications.next(updatedNotifications);
  }

  hasPendingNotifications(): boolean {
    return this.pendingNotifications.value.length > 0;
  }

  getPendingCount(): number {
    return this.pendingNotifications.value.length;
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.notificationService.markAsRead(notificationId).toPromise();
      this.removeNotification(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }
}
