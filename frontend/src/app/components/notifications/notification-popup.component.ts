import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notification-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  template: `
    <div class="notification-popup-overlay" (click)="onOverlayClick($event)">
      <div class="notification-popup" (click)="$event.stopPropagation()">
        <div class="notification-header">
          <div class="notification-icon">
            <mat-icon>grade</mat-icon>
          </div>
          <div class="notification-title">
            <h3>{{ notification?.title }}</h3>
            <p class="notification-time">
              {{ formatDate(notification?.createdAt?.$date || "") }}
            </p>
          </div>
          <button mat-icon-button (click)="close()" class="close-button">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="notification-content">
          <div class="notification-message">
            {{ notification?.message }}
          </div>

          <div class="notification-details" *ngIf="notification">
            <div class="detail-item">
              <mat-icon>school</mat-icon>
              <span>{{ notification.courseName }}</span>
            </div>
            <div class="detail-item">
              <mat-icon>person</mat-icon>
              <span>{{ notification.professorName }}</span>
            </div>
            <div class="detail-item grade-item">
              <mat-icon>star</mat-icon>
              <span class="grade-value">{{ notification.grade }}</span>
            </div>
          </div>
        </div>

        <div class="notification-actions">
          <button
            mat-raised-button
            color="primary"
            (click)="markAsReadAndClose()"
          >
            <mat-icon>check</mat-icon>
            Разбери
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .notification-popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
      }

      .notification-popup {
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow: hidden;
        animation: slideIn 0.3s ease-out;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .notification-header {
        display: flex;
        align-items: center;
        padding: 20px;
        background: linear-gradient(135deg, #4caf50, #45a049);
        color: white;
      }

      .notification-icon {
        margin-right: 16px;
      }

      .notification-icon mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
      }

      .notification-title {
        flex: 1;
      }

      .notification-title h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
      }

      .notification-time {
        margin: 4px 0 0 0;
        font-size: 14px;
        opacity: 0.9;
      }

      .close-button {
        color: white;
      }

      .notification-content {
        padding: 24px;
      }

      .notification-message {
        font-size: 16px;
        line-height: 1.5;
        color: #333;
        margin-bottom: 20px;
      }

      .notification-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .detail-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        background-color: #f5f5f5;
        border-radius: 8px;
      }

      .detail-item mat-icon {
        color: #666;
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .grade-item {
        background-color: #e8f5e8;
      }

      .grade-item mat-icon {
        color: #4caf50;
      }

      .grade-value {
        font-weight: bold;
        font-size: 18px;
        color: #4caf50;
      }

      .notification-actions {
        padding: 20px;
        border-top: 1px solid #eee;
        text-align: center;
      }

      .notification-actions button {
        min-width: 120px;
      }

      @media (max-width: 600px) {
        .notification-popup {
          width: 95%;
          margin: 20px;
        }

        .notification-header {
          padding: 16px;
        }

        .notification-content {
          padding: 20px;
        }

        .notification-actions {
          padding: 16px;
        }
      }
    `,
  ],
})
export class NotificationPopupComponent implements OnInit, OnDestroy {
  @Input() notification: Notification | null = null;
  @Output() closed = new EventEmitter<void>();
  @Output() markAsRead = new EventEmitter<string>();

  private autoCloseTimer: any;

  constructor(
    public dialogRef: MatDialogRef<NotificationPopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { notification: Notification }
  ) {
    if (data && data.notification) {
      this.notification = data.notification;
    }
  }

  ngOnInit() {
    // Auto-close after 10 seconds if user doesn"t interact
    this.autoCloseTimer = setTimeout(() => {
      this.close();
    }, 10000);
  }

  ngOnDestroy() {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
    }
  }

  onOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  close() {
    this.dialogRef.close();
    this.closed.emit();
  }

  markAsReadAndClose() {
    if (this.notification) {
      this.markAsRead.emit(this.notification._id.$oid);
    }
    this.close();
  }

  formatDate(dateString: string): string {
    if (!dateString || dateString.trim() === "") return "";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";

      const now = new Date();
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );

      if (diffInMinutes < 1) {
        return "сега";
      } else if (diffInMinutes < 60) {
        return `пред ${diffInMinutes} мин`;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return `пред ${hours} ${hours === 1 ? "час" : "часа"}`;
      } else {
        return date.toLocaleDateString("mk-MK", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
    } catch (error) {
      return "";
    }
  }
}
