import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        loadComponent: () => import('./components/dashboard/overview/overview.component').then(m => m.OverviewComponent)
      },
      {
        path: 'subjects',
        loadComponent: () => import('./components/subjects/subjects.component').then(m => m.SubjectsComponent)
      },
      {
        path: 'grades',
        loadComponent: () => import('./components/grades/grades.component').then(m => m.GradesComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./components/students/students.component').then(m => m.StudentsComponent)
      },
      {
        path: 'professors',
        loadComponent: () => import('./components/professors/professors.component').then(m => m.ProfessorsComponent)
      },
      {
        path: 'schedule',
        loadComponent: () => import('./components/schedule/schedule.component').then(m => m.ScheduleComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./components/subjects/subjects.component').then(m => m.SubjectsComponent)
      },
      {
        path: 'contact',
        loadComponent: () => import('./components/dashboard/contact-form.component').then(m => m.ContactFormComponent)
      },
      {
        path: 'my-exam-registrations',
        loadComponent: () => import('./components/my-exam-registrations/my-exam-registrations.component').then(m => m.MyExamRegistrationsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
]; 