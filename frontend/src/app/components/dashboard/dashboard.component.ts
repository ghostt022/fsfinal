import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../services/auth.service';
import { NotificationManagerService } from '../../services/notification-manager.service';
import { NotificationPopupComponent } from '../notifications/notification-popup.component';
import { Notification } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDialogModule,
    MatBadgeModule
  ],
  template: `
    <mat-sidenav-container class="h-screen">
      <mat-sidenav #sidenav mode="side" opened class="w-64 bg-white border-r border-gray-200 flex flex-col">
        <!-- Logo Section -->
        <div class="p-4 border-b border-gray-200 flex items-center">
          <mat-icon class="text-primary-600" style="font-size: 36px; width: 36px; height: 36px;">account_balance</mat-icon>
          <div class="ml-3">
            <h1 class="text-lg font-bold text-gray-800">Faculty System</h1>
          </div>
        </div>

        <!-- User Info Section -->
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-md font-semibold text-gray-800 truncate">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</h2>
          <p class="text-sm text-gray-500 capitalize">{{ roleLabel }}</p>
        </div>

        <mat-nav-list class="p-4 flex-grow">
          <a mat-list-item routerLink="/dashboard/overview" routerLinkActive="bg-primary-50 text-primary-700 rounded-lg">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Overview</span>
          </a>
          <a mat-list-item routerLink="/dashboard/grades" routerLinkActive="bg-primary-50 text-primary-700 rounded-lg"
             *ngIf="authService.isStudent()">
            <mat-icon matListItemIcon>grade</mat-icon>
            <span matListItemTitle>Grades</span>
            <span matBadge="{{ notificationCount }}" matBadgeColor="warn" 
                  *ngIf="notificationCount > 0" matBadgeSize="small"></span>
          </a>
          <a mat-list-item routerLink="/dashboard/professors" routerLinkActive="bg-primary-50 text-primary-700 rounded-lg"
             *ngIf="authService.isAdmin() || authService.isProfessor()">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Professors</span>
          </a>
        </mat-nav-list>

        <!-- Profile & Logout Section -->
        <div class="p-4 mt-auto border-t border-gray-200">
            <a mat-stroked-button class="w-full mb-2" routerLink="/dashboard/profile">
              <mat-icon>account_circle</mat-icon>
              <span>Profile</span>
            </a>
            <button mat-stroked-button color="warn" class="w-full" (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
        </div>
      </mat-sidenav>

      <mat-sidenav-content class="bg-gray-50">
        <mat-toolbar class="bg-white border-b border-gray-200 shadow-sm">
          <button mat-icon-button (click)="sidenav.toggle()" class="mr-4">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="flex-1"></span>
          <span class="text-gray-600 text-sm">Welcome back, {{ currentUser?.firstName }}!</span>
        </mat-toolbar>

        <main class="p-6">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: []
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser = this.authService.getCurrentUser();
  notificationCount = 0;
  private notificationSubscription: any;

  constructor(
    public authService: AuthService,
    private notificationManager: NotificationManagerService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Check for notifications if user is a student
    if (this.authService.isStudent()) {
      this.checkForNotifications();
      this.subscribeToNotifications();
    }
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  private async checkForNotifications(): Promise<void> {
    await this.notificationManager.checkForNotifications();
    this.showNextNotification();
  }

  private subscribeToNotifications(): void {
    this.notificationSubscription =
      this.notificationManager.pendingNotifications$.subscribe(
        (notifications) => {
          this.notificationCount = notifications.length;
          if (notifications.length > 0) {
            this.showNextNotification();
          }
        }
      );
  }

  private showNextNotification(): void {
    const notification = this.notificationManager.getNextNotification();
    if (notification) {
      this.showNotificationPopup(notification);
    }
  }

  private showNotificationPopup(notification: Notification): void {
    const dialogRef = this.dialog.open(NotificationPopupComponent, {
      data: { notification },
      disableClose: true,
      panelClass: 'notification-dialog'
    });

    dialogRef.componentInstance.markAsRead.subscribe(
      async (notificationId: string) => {
        await this.notificationManager.markAsRead(notificationId);
      }
    );

    dialogRef.afterClosed().subscribe(() => {
      // Only show next notification if there are any left
      if (this.notificationManager.hasPendingNotifications()) {
        setTimeout(() => {
          this.showNextNotification();
        }, 1000);
      }
    });
  }

  get roleLabel(): string {
    const role = this.currentUser?.role;
    if (role === 'professor') return 'Profesor';
    if (role === 'student') return 'Student';
    return role || '';
  }

  logout(): void {
    this.authService.logout();
    // Navigate to login page
    window.location.href = '/login';
  }
} 