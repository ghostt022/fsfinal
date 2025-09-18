const express = require('express');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { auth, authorize } = require('../middleware/auth');

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

// Get all courses
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, department, year, semester, professor } = req.query;
        
        const professors = await readData('professors.json');
        const users = await readData('users.json');
        let courses = await readData('courses.json');

        // Filter
        courses = courses.filter(c => c.isActive !== false);
        if (department) courses = courses.filter(c => c.department === department);
        if (year) courses = courses.filter(c => c.year == year);
        if (semester) courses = courses.filter(c => c.semester == semester);
        if (professor) courses = courses.filter(c => c.professor.$oid === professor);

        const total = courses.length;

        // Paginate
        const paginatedCourses = courses.slice((page - 1) * limit, page * limit);

        // Populate
        const populatedCourses = paginatedCourses.map(course => {
            const prof = professors.find(p => p._id.$oid === course.professor.$oid);
            const user = prof ? users.find(u => u._id.$oid === prof.user.$oid) : null;
            return {
                ...course,
                professor: prof ? {
                    _id: prof._id,
                    professorId: prof.professorId,
                    user: user ? { firstName: user.firstName, lastName: user.lastName } : null
                } : null
            };
        });

        res.json({
            courses: populatedCourses,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get course by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const courses = await readData('courses.json');
        const professors = await readData('professors.json');
        const users = await readData('users.json');

        const course = courses.find(c => c._id.$oid === req.params.id);

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        // Populate professor and prerequisites
        const prof = professors.find(p => p._id.$oid === course.professor.$oid);
        const user = prof ? users.find(u => u._id.$oid === prof.user.$oid) : null;
        
        const prerequisites = (course.prerequisites || []).map(prereqId => {
            const prereqCourse = courses.find(c => c._id.$oid === prereqId.$oid);
            return prereqCourse ? { _id: prereqCourse._id, code: prereqCourse.code, name: prereqCourse.name } : null;
        }).filter(Boolean);

        const populatedCourse = {
            ...course,
            professor: prof ? {
                _id: prof._id,
                professorId: prof.professorId,
                user: user ? { firstName: user.firstName, lastName: user.lastName } : null
            } : null,
            prerequisites
        };

        res.json(populatedCourse);
    } catch (error) {
        console.error('Get course error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new course (admin/professor only)
router.post('/', auth, authorize('admin', 'professor'), [
    body('code').notEmpty().isUppercase(),
    body('name').notEmpty(),
    body('description').notEmpty(),
    body('credits').isInt({ min: 1, max: 10 }),
    body('department').notEmpty(),
    body('year').isInt({ min: 1, max: 5 }),
    body('semester').isInt({ min: 1, max: 10 }),
    body('professor').notEmpty(), 
    body('maxStudents').optional().isInt({ min: 1 }),
    body('schedule.day').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
    body('schedule.startTime').notEmpty(),
    body('schedule.endTime').notEmpty(),
    body('schedule.room').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { code, name, description, credits, department, year, semester, professor, maxStudents, schedule } = req.body;

        const courses = await readData('courses.json');

        if (courses.some(c => c.code === code)) {
            return res.status(400).json({ message: 'Course code already exists' });
        }

        const newCourseId = generateId();
        const newCourse = {
            _id: { $oid: newCourseId },
            code,
            name,
            description,
            credits,
            department,
            year,
            semester,
            professor: { $oid: professor },
            maxStudents: maxStudents || 50,
            schedule,
            isActive: true,
            createdAt: { $date: new Date().toISOString() },
            updatedAt: { $date: new Date().toISOString() },
        };

        courses.push(newCourse);
        await writeData('courses.json', courses);

        res.status(201).json({
            message: 'Course created successfully',
            course: newCourse
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update course
router.put('/:id', auth, authorize('admin', 'professor'), [
    body('name').optional().notEmpty(),
    body('description').optional().notEmpty(),
    body('credits').optional().isInt({ min: 1, max: 10 }),
    body('maxStudents').optional().isInt({ min: 1 }),
    body('isActive').optional().isBoolean(),
    body('schedule.day').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
    body('schedule.startTime').optional().notEmpty(),
    body('schedule.endTime').optional().notEmpty(),
    body('schedule.room').optional().notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const courses = await readData('courses.json');
        const courseIndex = courses.findIndex(c => c._id.$oid === req.params.id);

        if (courseIndex === -1) {
            return res.status(404).json({ message: 'Course not found' });
        }

        let course = courses[courseIndex];

        const updateFields = ['name', 'description', 'credits', 'maxStudents', 'isActive'];
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                course[field] = req.body[field];
            }
        });

        if (req.body.schedule) {
            course.schedule = { ...(course.schedule || {}), ...req.body.schedule };
        }
        
        course.updatedAt = { $date: new Date().toISOString() };
        courses[courseIndex] = course;

        await writeData('courses.json', courses);

        res.json({
            message: 'Course updated successfully',
            course
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete course (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        let courses = await readData('courses.json');
        const initialLength = courses.length;
        
        courses = courses.filter(c => c._id.$oid !== req.params.id);

        if (courses.length === initialLength) {
            return res.status(404).json({ message: 'Course not found' });
        }
        
        await writeData('courses.json', courses);

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get courses by professor
router.get('/professor/:professorId', auth, async (req, res) => {
    try {
        const courses = await readData('courses.json');
        const professors = await readData('professors.json');
        const users = await readData('users.json');

        let professorCourses = courses.filter(c => 
            c.professor.$oid === req.params.professorId &&
            c.isActive !== false
        );
        
        const populatedCourses = professorCourses.map(course => {
             const prof = professors.find(p => p._id.$oid === course.professor.$oid);
             const user = prof ? users.find(u => u._id.$oid === prof.user.$oid) : null;
             return {
                 ...course,
                 professor: prof ? {
                     _id: prof._id,
                     professorId: prof.professorId,
                     user: user ? { firstName: user.firstName, lastName: user.lastName } : null
                 } : null
             };
        });

        res.json(populatedCourses);
    } catch (error) {
        console.error('Get professor courses error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 