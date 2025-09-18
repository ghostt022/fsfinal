const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { auth, authorize } = require('../middleware/auth');
const bcrypt = require('bcrypt');

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

const generateId = () => crypto.randomBytes(12).toString('hex');


// Get all students (admin/professor only)
router.get('/', auth, async (req, res) => {
    // Check if user is admin or professor
    if (req.user.role !== 'admin' && req.user.role !== 'professor') {
        return res.status(403).json({ message: 'Access denied. Only admins and professors can view students.' });
    }
    try {
        const { page = 1, limit = 10, department, year, status } = req.query;

        const users = await readData('users.json');
        let students = await readData('students.json');

        // Filter
        if (department) students = students.filter(s => s.department === department);
        if (year) students = students.filter(s => s.year == year);
        if (status) students = students.filter(s => s.status === status);

        const total = students.length;

        // Paginate
        const paginatedStudents = students.slice((page - 1) * limit, page * limit);

        // Populate user data
        const populatedStudents = paginatedStudents.map(student => {
            const user = users.find(u => u._id.$oid === student.user.$oid);
            return {
                ...student,
                user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null
            };
        });

        res.json({
            students: populatedStudents,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const users = await readData('users.json');
        const students = await readData('students.json');
        const student = students.find(s => s._id.$oid === req.params.id);

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        
        // Authorization check
        if (req.user.role === 'student' && req.user._id !== student.user.$oid) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const user = users.find(u => u._id.$oid === student.user.$oid);
        const populatedStudent = {
            ...student,
            user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null
        };

        res.json(populatedStudent);
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new student (admin only)
router.post('/', auth, authorize('admin'), [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('studentId').notEmpty(),
    body('year').isInt({ min: 1, max: 5 }),
    body('semester').isInt({ min: 1, max: 10 }),
    body('department').notEmpty(),
    body('major').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName, studentId, year, semester, department, major } = req.body;

        const users = await readData('users.json');
        const students = await readData('students.json');

        if (users.some(u => u.email === email)) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        if (students.some(s => s.studentId === studentId)) {
            return res.status(400).json({ message: 'Student ID already exists' });
        }

        // Create user
        const newUserId = generateId();
        const newUser = {
            _id: { $oid: newUserId },
            email,
            password, // Hash in real app
            firstName,
            lastName,
            role: 'student',
            createdAt: { $date: new Date().toISOString() },
            updatedAt: { $date: new Date().toISOString() },
        };
        users.push(newUser);

        // Create student
        const newStudentId = generateId();
        const newStudent = {
            _id: { $oid: newStudentId },
            user: { $oid: newUserId },
            studentId,
            year,
            semester,
            department,
            major,
            status: 'active',
            createdAt: { $date: new Date().toISOString() },
            updatedAt: { $date: new Date().toISOString() },
        };
        students.push(newStudent);

        await writeData('users.json', users);
        await writeData('students.json', students);

        res.status(201).json({
            message: 'Student created successfully',
            student: { ...newStudent, user: { firstName, lastName, email } }
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update student
router.put('/:id', auth, [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('year').optional().isInt({ min: 1, max: 5 }),
    body('semester').optional().isInt({ min: 1, max: 10 }),
    body('department').optional().notEmpty(),
    body('major').optional().notEmpty(),
    body('status').optional().isIn(['active', 'inactive', 'graduated', 'suspended'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const users = await readData('users.json');
        const students = await readData('students.json');

        const studentIndex = students.findIndex(s => s._id.$oid === req.params.id);
        if (studentIndex === -1) {
            return res.status(404).json({ message: 'Student not found' });
        }
        const student = students[studentIndex];

        // Authorization
        if (req.user.role === 'student' && req.user._id !== student.user.$oid) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update student fields
        const updateFields = ['year', 'semester', 'department', 'major', 'status'];
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) student[field] = req.body[field];
        });
        student.updatedAt = { $date: new Date().toISOString() };
        students[studentIndex] = student;
        
        // Update user fields
        let user;
        const userIndex = users.findIndex(u => u._id.$oid === student.user.$oid);
        if(userIndex !== -1) {
            user = users[userIndex];
            if (req.body.firstName) user.firstName = req.body.firstName;
            if (req.body.lastName) user.lastName = req.body.lastName;
            user.updatedAt = { $date: new Date().toISOString() };
            users[userIndex] = user;
        }

        await writeData('students.json', students);
        await writeData('users.json', users);

        const populatedStudent = {
            ...student,
            user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null
        };

        res.json({ message: 'Student updated successfully', student: populatedStudent });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete student (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        let users = await readData('users.json');
        let students = await readData('students.json');

        const studentToDelete = students.find(s => s._id.$oid === req.params.id);
        if (!studentToDelete) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const updatedStudents = students.filter(s => s._id.$oid !== req.params.id);
        const updatedUsers = users.filter(u => u._id.$oid !== studentToDelete.user.$oid);

        await writeData('students.json', updatedStudents);
        await writeData('users.json', updatedUsers);

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get student statistics
router.get('/stats/overview', auth, authorize('admin', 'professor'), async (req, res) => {
    try {
        const students = await readData('students.json');

        const totalStudents = students.length;
        const activeStudents = students.filter(s => s.status === 'active').length;
        const graduatedStudents = students.filter(s => s.status === 'graduated').length;
        
        const departmentStats = students.reduce((acc, student) => {
            acc[student.department] = (acc[student.department] || 0) + 1;
            return acc;
        }, {});

        const yearStats = students.reduce((acc, student) => {
            acc[student.year] = (acc[student.year] || 0) + 1;
            return acc;
        }, {});
        
        res.json({
            totalStudents,
            activeStudents,
            graduatedStudents,
            departmentStats: Object.entries(departmentStats).map(([name, count]) => ({ _id: name, count })),
            yearStats: Object.entries(yearStats).map(([year, count]) => ({ _id: year, count })).sort((a,b) => a._id - b._id),
        });
    } catch (error) {
        console.error('Student stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Import students from RandomUser API (professor only)
router.post('/import', auth, authorize('professor'), async (req, res) => {
    try {
        const count = Math.min(Math.max(parseInt(req.query.count || '10', 10), 1), 100);
        const resp = await fetch(`https://randomuser.me/api/?results=${count}&nat=us,gb,au,ca`);
        if (!resp.ok) {
            return res.status(502).json({ message: 'Failed to fetch external data' });
        }
        const data = await resp.json();
        const results = Array.isArray(data.results) ? data.results : [];

        const users = await readData('users.json');
        const students = await readData('students.json');

        let imported = 0;
        const now = new Date().toISOString();
        const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

        for (const r of results) {
            const email = r.email;
            const firstName = r.name?.first || 'Student';
            const lastName = r.name?.last || 'Imported';
            const studentId = r.login?.uuid || generateId();
            const department = r.location?.state || 'КИТ';
            const major = r.login?.username || 'Software Engineering';
            const year = Math.max(1, Math.min(4, Math.floor(Math.random() * 4) + 1));
            const semester = Math.max(1, Math.min(8, Math.floor(Math.random() * 8) + 1));

            if (users.some(u => u.email === email) || students.some(s => s.studentId === studentId)) {
                continue; // skip duplicates
            }

            const newUserId = generateId();
            const newUser = {
                _id: { $oid: newUserId },
                email,
                password: defaultPasswordHash,
                firstName,
                lastName,
                role: 'student',
                createdAt: { $date: now },
                updatedAt: { $date: now }
            };
            users.push(newUser);

            const newStudentId = generateId();
            const newStudent = {
                _id: { $oid: newStudentId },
                user: { $oid: newUserId },
                studentId,
                year,
                semester,
                department,
                major,
                status: 'active',
                createdAt: { $date: now },
                updatedAt: { $date: now }
            };
            students.push(newStudent);
            imported += 1;
        }

        await writeData('users.json', users);
        await writeData('students.json', students);

        res.json({ message: 'Import completed', imported });
    } catch (error) {
        console.error('Import students error:', error);
        res.status(500).json({ message: 'Server error during import' });
    }
});

module.exports = router; 