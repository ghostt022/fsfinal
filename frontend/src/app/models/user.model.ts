export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'professor' | 'admin';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  _id: string;
  user: User;
  studentId: string;
  year: number;
  semester: number;
  department: string;
  major: string;
  enrollmentDate: Date;
  gpa: number;
  totalCredits: number;
  status: 'active' | 'inactive' | 'graduated' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface Professor {
  _id: string;
  user: User;
  professorId: string;
  department: string;
  title: 'Assistant Professor' | 'Associate Professor' | 'Professor' | 'Lecturer';
  specialization: string;
  hireDate: Date;
  office?: string;
  phone?: string;
  status: 'active' | 'inactive' | 'retired';
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  _id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  year: number;
  semester: number;
  professor: Professor;
  prerequisites?: Course[];
  maxStudents: number;
  enrolledStudents: number;
  isActive: boolean;
  schedule: {
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
    startTime: string;
    endTime: string;
    room: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Grade {
  _id: string;
  student: Student;
  course: Course;
  professor: Professor;
  grade: number;
  semester: number;
  academicYear: string;
  examDate: Date;
  notes?: string;
  isFinal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'professor';
  year?: number;
  semester?: number;
  department?: string;
  major?: string;
  title?: string;
  specialization?: string;
} 