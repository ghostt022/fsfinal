const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { auth } = require('../middleware/auth');

const router = express.Router();
const dataDir = path.join(__dirname, '..', 'data');

const readData = async (fileName) => {
  const filePath = path.join(dataDir, fileName);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
};

// Get dashboard statistics
router.get('/dashboard', auth, async (req, res) => {
  try {
    const students = await readData('students.json');
    const professors = await readData('professors.json');
    const courses = await readData('courses.json');
    const grades = await readData('grades.json');

    const totalStudents = students.filter(s => s.status === 'active').length;
    const totalProfessors = professors.filter(p => p.status === 'active').length;
    const activeCourses = courses.filter(c => c.isActive !== false).length; // 

    let averageGpa = 0;
    if (grades.length > 0) {
      const totalGrade = grades.reduce((sum, grade) => sum + grade.grade, 0);
      averageGpa = totalGrade / grades.length;
    }

   
    const recentActivities = [
      { id: '1', type: 'student_registered', message: 'Нов студент се регистрира', timestamp: new Date(Date.now() - 2 * 60 * 1000) },
      { id: '2', type: 'course_created', message: 'Предмет е ажуриран', timestamp: new Date(Date.now() - 15 * 60 * 1000) },
      { id: '3', type: 'grade_submitted', message: 'Оценки се поднесени', timestamp: new Date(Date.now() - 60 * 60 * 1000) }
    ];

    res.json({
      totalStudents,
      totalProfessors,
      activeCourses,
      averageGpa,
      totalGrades: grades.length,
      recentActivities
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error while reading stats' });
  }
});


router.get('/activities', auth, async (req, res) => {
  try {
 
    const activities = [
        { id: '1', type: 'student_registered', message: 'Нов студент се регистрира', timestamp: new Date(Date.now() - 2 * 60 * 1000) },
        { id: '2', type: 'course_created', message: 'Предмет е ажуриран', timestamp: new Date(Date.now() - 15 * 60 * 1000) },
        { id: '3', type: 'grade_submitted', message: 'Оценки се поднесени', timestamp: new Date(Date.now() - 60 * 60 * 1000) }
      ];
    res.json(activities);
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 