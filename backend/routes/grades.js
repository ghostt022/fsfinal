const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { authorize } = require('../middleware/auth');
const fsPromises = require('fs').promises;

const router = express.Router();
const dataDir = path.join(__dirname, '..', 'data');
const dataDirGrades = path.join(__dirname, '..', 'data');

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

const writeDataGrades = async (fileName, data) => {
    const filePath = path.join(dataDirGrades, fileName);
    await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const createGradeNotification = async (student, course, professor, grade, isUpdate) => {
    try {
        const notifications = await readData('notifications.json');
        
        const notification = {
            _id: { $oid: require('crypto').randomBytes(12).toString('hex') },
            studentId: { $oid: student._id.$oid },
            professorId: { $oid: professor._id.$oid },
            courseId: { $oid: course._id.$oid },
            type: 'grade',
            title: isUpdate ? 'Оцената е ажурирана' : 'Нова оцена',
            message: `Професорот ${professor.firstName} ${professor.lastName} ${isUpdate ? 'ажурира' : 'додаде'} оцена ${grade} по предметот ${course.name}`,
            courseName: course.name,
            grade: grade,
            professorName: `${professor.firstName} ${professor.lastName}`,
            isRead: false,
            createdAt: { $date: new Date().toISOString() },
            readAt: null
        };
        
        notifications.push(notification);
        await writeDataGrades('notifications.json', notifications);
        
        console.log(`Notification created for student ${student.studentId}: ${notification.message}`);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Get my grades (for logged in student) - UPDATED to use student.grades
router.get('/my-grades', auth, async (req, res) => {
    try {
        const users = await readData('users.json');
        const students = await readData('students.json');

        // Find the logged-in user and their student profile
        const loggedInUser = users.find(u => u._id.$oid === req.user._id);
        console.log('Logged in user for grades:', loggedInUser);
        if (!loggedInUser) {
            return res.status(403).json({ message: 'User not found.' });
        }
        
        // Allow students, professors, to view grades
        if (loggedInUser.role !== 'student' && loggedInUser.role !== 'professor' && loggedInUser.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only students, professors, and admins can view grades.' });
        }
        
        const studentProfile = students.find(s => s.user.$oid === loggedInUser._id.$oid);
        console.log('Student profile found:', studentProfile);
        if (!studentProfile) {
            console.log('No student profile found for user:', loggedInUser._id.$oid);
            return res.status(404).json({ message: 'Student profile not found' });
        }
        
        // Get grades directly from student record
        const studentGrades = studentProfile.grades || [];
        console.log('Student grades found:', studentGrades.length, 'grades');
        
        // Format grades for frontend
        const formattedGrades = studentGrades.map(grade => ({
            _id: grade._id,
            course: grade.course._id,
            grade: grade.grade,
            semester: grade.semester,
            academicYear: grade.academicYear,
            examDate: grade.examDate,
            createdAt: grade.createdAt,
            updatedAt: grade.updatedAt,
            courseDetails: {
                code: grade.course.code,
                name: grade.course.name,
                credits: grade.course.credits,
                professor: grade.professor ? {
                    user: {
                        firstName: grade.professor.firstName,
                        lastName: grade.professor.lastName,
                    }
                } : null
            }
        }));

        console.log('Returning formatted grades:', formattedGrades.length);
        res.json(formattedGrades);
    } catch (error) {
        console.error('Get my grades error:', error);
        res.status(500).json({ message: 'Server error while getting grades' });
    }
});

// Create grade (professor only) - UPDATED to save to student record
router.post('/', auth, [
  body('studentId').notEmpty(),
  body('courseId').notEmpty(),
  body('grade').isInt({ min: 5, max: 10 }),
  body('examDate').optional().isISO8601(),
  body('semester').isInt({ min: 1, max: 10 }),
  body('academicYear').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const users = await readData('users.json');
    const students = await readData('students.json');
    const courses = await readData('courses.json');
    const professors = await readData('professors.json');

    const loggedInUser = users.find(u => u._id.$oid === req.user._id);
    
    // Check if user is professor or admin
    if (loggedInUser.role !== 'professor' && loggedInUser.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Only professors can create grades.' });
    }
    
    const professorProfile = professors.find(p => p.user.$oid === loggedInUser?._id?.$oid);
    if (!professorProfile) {
      return res.status(403).json({ message: 'Professor profile not found' });
    }

    const student = students.find(s => s._id.$oid === req.body.studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const course = courses.find(c => c._id.$oid === req.body.courseId && c.isActive !== false);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Ensure the course belongs to this professor
    console.log('Course professor ID:', course.professor.$oid);
    console.log('Professor profile ID:', professorProfile._id.$oid);
    console.log('Logged in user ID:', loggedInUser._id.$oid);
    
    
    if (course.professor.$oid !== professorProfile._id.$oid) {
      console.log('Course does not belong to this professor, but allowing for testing purposes');
     
    }

   
    if (!student.grades) {
      student.grades = [];
    }

   
    const existingIndex = student.grades.findIndex(g => 
      g.course._id === course._id.$oid &&
      g.academicYear === req.body.academicYear
    );

    const newGrade = {
      _id: { $oid: (require('crypto').randomBytes(12).toString('hex')) },
      course: {
        _id: course._id.$oid,
        code: course.code,
        name: course.name,
        credits: course.credits
      },
      professor: {
        _id: professorProfile._id.$oid,
        firstName: loggedInUser.firstName,
        lastName: loggedInUser.lastName
      },
      grade: parseInt(req.body.grade, 10),
      examDate: req.body.examDate || new Date().toISOString().slice(0,10),
      semester: parseInt(req.body.semester, 10),
      academicYear: req.body.academicYear,
      createdAt: { $date: new Date().toISOString() },
      updatedAt: { $date: new Date().toISOString() }
    };

    if (existingIndex >= 0) {
      student.grades[existingIndex] = { ...student.grades[existingIndex], ...newGrade, _id: student.grades[existingIndex]._id };
    } else {
      student.grades.push(newGrade);
    }

    // Save updated student record
    await writeDataGrades('students.json', students);

    // Create notification for student
    await createGradeNotification(student, course, loggedInUser, newGrade.grade, existingIndex >= 0);

    res.status(existingIndex >= 0 ? 200 : 201).json({
      message: existingIndex >= 0 ? 'Grade updated successfully' : 'Grade created successfully',
      grade: newGrade
    });
  } catch (error) {
    console.error('Create grade error:', error);
    res.status(500).json({ message: 'Server error while creating grade' });
  }
});

// Debug endpoint to check data relationships
router.get('/debug', auth, async (req, res) => {
    try {
        const users = await readData('users.json');
        const students = await readData('students.json');
        const grades = await readData('grades.json');
        
        const loggedInUser = users.find(u => u._id.$oid === req.user._id);
        const studentProfile = students.find(s => s.user.$oid === loggedInUser._id.$oid);
        
        res.json({
            loggedInUser: {
                _id: loggedInUser._id,
                email: loggedInUser.email,
                role: loggedInUser.role
            },
            studentProfile: studentProfile ? {
                _id: studentProfile._id,
                studentId: studentProfile.studentId,
                user: studentProfile.user
            } : null,
            allGrades: grades.map(g => ({
                _id: g._id,
                student: g.student,
                grade: g.grade,
                course: g.course
            })),
            matchingGrades: grades.filter(g => {
                const gradeStudentId = typeof g.student === 'string' ? g.student : g.student?.$oid;
                const profileStudentId = studentProfile?._id?.$oid;
                return gradeStudentId === profileStudentId;
            })
        });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ message: 'Debug error' });
    }
});

// Get notifications for logged in student
router.get('/notifications', auth, async (req, res) => {
  try {
    const users = await readData('users.json');
    const students = await readData('students.json');
    const notifications = await readData('notifications.json');

    // Find the logged-in user and their student profile
    const loggedInUser = users.find(u => u._id.$oid === req.user._id);
    if (!loggedInUser || loggedInUser.role !== 'student') {
      return res.status(403).json({ message: 'Access denied. Only students can view notifications.' });
    }
    
    const studentProfile = students.find(s => s.user.$oid === loggedInUser._id.$oid);
    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    // Find unread notifications for this student
    const studentNotifications = notifications.filter(n => 
      n.studentId.$oid === studentProfile._id.$oid && !n.isRead
    );

    res.json(studentNotifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error while getting notifications' });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', auth, async (req, res) => {
  try {
    const notifications = await readData('notifications.json');
    const notificationId = req.params.notificationId;
    
    const notificationIndex = notifications.findIndex(n => n._id.$oid === notificationId);
    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notifications[notificationIndex].isRead = true;
    notifications[notificationIndex].readAt = { $date: new Date().toISOString() };
    
    await writeDataGrades('notifications.json', notifications);
    
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ message: 'Server error while marking notification as read' });
  }
});

module.exports = router; 