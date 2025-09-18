import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service'; // Adjust path if needed

@Component({
  selector: 'app-profile',
  standalone: true,
  template: ` <div class="bg-white rounded-xl shadow p-6">
          <h1 class="text-2xl font-bold text-gray-900 mb-2">
            {{ currentUser?.firstName }} {{ currentUser?.lastName }}
          </h1>
          <p class="text-gray-600" *ngIf="isProfessor">Професорски панел - Преглед на вашите предмети и активности</p>
          <p class="text-gray-600" *ngIf="isStudent">Студентски панел - Преглед на вашите предмети и оценки</p>
        </div>`,
  styles: []
})
export class ProfileComponent implements OnInit {
  currentUser: any = null;
  isProfessor: boolean = false;
  isStudent: boolean = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUserData();
    this.isProfessor = this.currentUser?.role === 'professor';
    this.isStudent = this.currentUser?.role === 'student';
  }

  loadUserData() {
    this.currentUser = this.authService.getCurrentUser();
  }
}