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
      if (error.code === 'ENOENT') return [];
      throw error;
    }
};

// Get schedule for current user
router.get('/my-schedule', auth, async (req, res) => {
    try {
        const users = await readData('users.json');
        const students = await readData('students.json');
        const courses = await readData('courses.json');
        const professors = await readData('professors.json');
        
        const loggedInUser = users.find(u => u._id.$oid === req.user._id);
        if (!loggedInUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        let userScheduleCourses = [];

        if (loggedInUser.role === 'student') {
            const studentProfile = students.find(s => s.user.$oid === loggedInUser._id.$oid);
            if (studentProfile) {
                userScheduleCourses = courses.filter(c => 
                    c.year === studentProfile.year &&
                    c.semester === studentProfile.semester &&
                    c.department === studentProfile.department
                );
            }
        } else if (loggedInUser.role === 'professor') {
            const professorProfile = professors.find(p => p.user.$oid === loggedInUser._id.$oid);
            if (professorProfile) {
                userScheduleCourses = courses.filter(c => c.professor.$oid === professorProfile._id.$oid);
            }
        }

        const scheduleByDay = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: []
        };

        userScheduleCourses.forEach(course => {
            if (course.schedule && course.schedule.day) {
                scheduleByDay[course.schedule.day].push(course);
            }
        });

        res.json({
            schedule: scheduleByDay,
            rawSchedule: userScheduleCourses
        });
    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({ message: 'Server error while getting schedule' });
    }
});

// Get schedule for specific student (admin/professor only)
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const students = await readData('students.json');
    const courses = await readData('courses.json');

    const student = students.find(s => s._id.$oid === req.params.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const schedule = courses.filter(course => 
        course.year === student.year &&
        course.semester === student.semester &&
        course.department === student.department &&
        course.isActive !== false
    );

    // Group by day
    const scheduleByDay = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    schedule.forEach(course => {
      if (course.schedule && course.schedule.day) {
        scheduleByDay[course.schedule.day].push(course);
      }
    });

    res.json({
      student,
      schedule: scheduleByDay,
      rawSchedule: schedule
    });
  } catch (error) {
    console.error('Get student schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get schedule for specific professor
router.get('/professor/:professorId', auth, async (req, res) => {
  try {
    const professors = await readData('professors.json');
    const courses = await readData('courses.json');

    const professor = professors.find(p => p._id.$oid === req.params.professorId);
    if(!professor) {
        return res.status(404).json({ message: 'Professor not found' });
    }

    const schedule = courses.filter(course =>
        course.professor.$oid === req.params.professorId &&
        course.isActive !== false
    );
    
    // Group by day
    const scheduleByDay = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    schedule.forEach(course => {
      if (course.schedule && course.schedule.day) {
        scheduleByDay[course.schedule.day].push(course);
      }
    });

    res.json({
      schedule: scheduleByDay,
      rawSchedule: schedule
    });
  } catch (error) {
    console.error('Get professor schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get department schedule
router.get('/department/:department', auth, async (req, res) => {
  try {
    const { year, semester } = req.query;
    const courses = await readData('courses.json');
    
    const schedule = courses.filter(course => {
        let matches = true;
        if(course.department !== req.params.department) matches = false;
        if(course.isActive === false) matches = false;
        if (year && course.year !== parseInt(year)) matches = false;
        if (semester && course.semester !== parseInt(semester)) matches = false;
        return matches;
    });

    // Group by day
    const scheduleByDay = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    schedule.forEach(course => {
      if (course.schedule && course.schedule.day) {
        scheduleByDay[course.schedule.day].push(course);
      }
    });

    res.json({
      department: req.params.department,
      year,
      semester,
      schedule: scheduleByDay,
      rawSchedule: schedule
    });
  } catch (error) {
    console.error('Get department schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get room availability
router.get('/room/:room', auth, async (req, res) => {
  try {
    const courses = await readData('courses.json');

    const coursesInRoom = courses.filter(course =>
        course.schedule &&
        course.schedule.room === req.params.room &&
        course.isActive !== false
    );

    // Group by day
    const scheduleByDay = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    coursesInRoom.forEach(course => {
      if (course.schedule && course.schedule.day) {
        scheduleByDay[course.schedule.day].push(course);
      }
    });

    res.json({
      room: req.params.room,
      schedule: scheduleByDay,
      rawSchedule: coursesInRoom
    });
  } catch (error) {
    console.error('Get room schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 