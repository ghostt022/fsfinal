const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

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

const writeData = async (fileName, data) => {
    const filePath = path.join(dataDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

// Get available courses for exam registration
router.get('/available-courses', auth, async (req, res) => {
    try {
        const courses = await readData('courses.json');
        const activeCourses = courses.filter(course => course.isActive !== false);
        
        // Normalize course IDs to ensure consistent format
        const normalizedCourses = activeCourses.map(course => ({
            ...course,
            _id: course._id?.$oid || course._id || crypto.randomBytes(12).toString('hex')
        }));
        
        console.log('Available courses:', normalizedCourses.length);
        res.json(normalizedCourses);
    } catch (error) {
        console.error('Error getting available courses:', error);
        res.status(500).json({ message: 'Server error while getting courses' });
    }
});

// Get all professors
router.get('/professors', auth, async (req, res) => {
    try {
        const professors = await readData('professors.json');
        const users = await readData('users.json');
        
        const professorsWithDetails = professors.map(professor => {
            const user = users.find(u => u._id.$oid === professor.user.$oid);
            return {
                _id: professor._id.$oid,
                firstName: user?.firstName || 'Unknown',
                lastName: user?.lastName || 'Unknown',
                email: user?.email || '',
                department: professor.department || 'Unknown'
            };
        });
        
        res.json(professorsWithDetails);
    } catch (error) {
        console.error('Error getting professors:', error);
        res.status(500).json({ message: 'Server error while getting professors' });
    }
});

// Register for an exam
router.post('/', auth, [
    body('professorName').notEmpty(),
    body('courseId').notEmpty(),
    body('semester').isIn(['winter', 'summer']),
    body('examDate').isISO8601(),
    body('notes').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const users = await readData('users.json');
        const students = await readData('students.json');
        const courses = await readData('courses.json');
        const examRegistrations = await readData('exam-registrations.json');

        // Find the logged-in user and their student profile
        const loggedInUser = users.find(u => u._id.$oid === req.user._id);
        if (!loggedInUser || loggedInUser.role !== 'student') {
            return res.status(403).json({ message: 'Access denied. Only students can register for exams.' });
        }

        const studentProfile = students.find(s => s.user.$oid === loggedInUser._id.$oid);
        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        // Find the course
        const course = courses.find(c => c._id.$oid === req.body.courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if student already registered for this exam in the same semester
        const existingRegistration = examRegistrations.find(reg => 
            reg.studentId === studentProfile._id.$oid &&
            reg.courseId === req.body.courseId &&
            reg.semester === req.body.semester &&
            reg.status === 'pending'
        );

        if (existingRegistration) {
            return res.status(400).json({ message: 'Веќе сте пријавени за овој испит во овој семестар.' });
        }

        // Create new exam registration
        const newRegistration = {
            _id: { $oid: crypto.randomBytes(12).toString('hex') },
            studentId: studentProfile._id.$oid,
            studentName: `${loggedInUser.firstName} ${loggedInUser.lastName}`,
            studentIndex: studentProfile.studentId,
            professorName: req.body.professorName,
            courseId: req.body.courseId,
            courseName: course.name,
            courseCode: course.code,
            semester: req.body.semester,
            examDate: req.body.examDate,
            notes: req.body.notes || '',
            status: 'pending',
            createdAt: { $date: new Date().toISOString() },
            updatedAt: { $date: new Date().toISOString() }
        };

        examRegistrations.push(newRegistration);
        await writeData('exam-registrations.json', examRegistrations);

        // Create notification for professor
        await createExamRegistrationNotification(newRegistration, course);

        res.status(201).json({
            message: 'Успешно пријавен за испит!',
            registration: newRegistration
        });

    } catch (error) {
        console.error('Error registering for exam:', error);
        res.status(500).json({ message: 'Server error while registering for exam' });
    }
});

// Get student's exam registrations
router.get('/my-registrations', auth, async (req, res) => {
    try {
        const users = await readData('users.json');
        const students = await readData('students.json');
        const examRegistrations = await readData('exam-registrations.json');

        // Find the logged-in user and their student profile
        const loggedInUser = users.find(u => u._id.$oid === req.user._id);
        if (!loggedInUser || loggedInUser.role !== 'student') {
            return res.status(403).json({ message: 'Access denied. Only students can view their registrations.' });
        }

        const studentProfile = students.find(s => s.user.$oid === loggedInUser._id.$oid);
        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        // Get student's exam registrations
        const studentRegistrations = examRegistrations.filter(reg => 
            reg.studentId === studentProfile._id.$oid
        );

        res.json(studentRegistrations);

    } catch (error) {
        console.error('Error getting exam registrations:', error);
        res.status(500).json({ message: 'Server error while getting registrations' });
    }
});

// Cancel exam registration
router.delete('/:id', auth, async (req, res) => {
    try {
        const examRegistrations = await readData('exam-registrations.json');
        const users = await readData('users.json');
        const students = await readData('students.json');

        // Find the logged-in user and their student profile
        const loggedInUser = users.find(u => u._id.$oid === req.user._id);
        if (!loggedInUser || loggedInUser.role !== 'student') {
            return res.status(403).json({ message: 'Access denied. Only students can cancel their registrations.' });
        }

        const studentProfile = students.find(s => s.user.$oid === loggedInUser._id.$oid);
        if (!studentProfile) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        // Find the registration
        const registrationIndex = examRegistrations.findIndex(reg => 
            reg._id.$oid === req.params.id && 
            reg.studentId === studentProfile._id.$oid
        );

        if (registrationIndex === -1) {
            return res.status(404).json({ message: 'Exam registration not found' });
        }

        // Check if registration can be cancelled (only pending registrations)
        if (examRegistrations[registrationIndex].status !== 'pending') {
            return res.status(400).json({ message: 'Можете да откажете само пријави со статус "чека одобрување".' });
        }

        // Remove the registration
        examRegistrations.splice(registrationIndex, 1);
        await writeData('exam-registrations.json', examRegistrations);

        res.json({ message: 'Пријавата за испит е откажана.' });

    } catch (error) {
        console.error('Error cancelling exam registration:', error);
        res.status(500).json({ message: 'Server error while cancelling registration' });
    }
});

// Create notification for professor about exam registration
const createExamRegistrationNotification = async (registration, course) => {
    try {
        const notifications = await readData('notifications.json');
        const professors = await readData('professors.json');
        const users = await readData('users.json');
        
        // Find professor by course
        const professor = professors.find(p => p._id.$oid === course.professor.$oid);
        if (!professor) return;

        const professorUser = users.find(u => u._id.$oid === professor.user.$oid);
        if (!professorUser) return;

        const notification = {
            _id: { $oid: crypto.randomBytes(12).toString('hex') },
            professorId: { $oid: professor._id.$oid },
            studentId: { $oid: registration.studentId },
            type: 'exam_registration',
            title: 'Нова пријава за испит',
            message: `Студентот ${registration.studentName} (${registration.studentIndex}) се пријави за испит по предметот ${course.name} (${course.code})`,
            courseName: course.name,
            studentName: registration.studentName,
            studentIndex: registration.studentIndex,
            semester: registration.semester === 'winter' ? 'Зимски' : 'Летен',
            examDate: registration.examDate,
            isRead: false,
            createdAt: { $date: new Date().toISOString() },
            readAt: null
        };
        
        notifications.push(notification);
        await writeData('notifications.json', notifications);
        
        console.log(`Notification created for professor ${professorUser.firstName} ${professorUser.lastName}: ${notification.message}`);
    } catch (error) {
        console.error('Error creating exam registration notification:', error);
    }
};

module.exports = router;
