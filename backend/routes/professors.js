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

// Get all professors
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, department, status } = req.query;

        const users = await readData('users.json');
        let professors = await readData('professors.json');

        // Filter
        if (department) {
            professors = professors.filter(p => p.department === department);
        }
        if (status) {
            professors = professors.filter(p => p.status === status);
        }
        
        const total = professors.length;

        // Paginate
        const paginatedProfessors = professors.slice((page - 1) * limit, page * limit);

        // Populate user data
        const populatedProfessors = paginatedProfessors.map(professor => {
            const user = users.find(u => u._id.$oid === professor.user.$oid);
            return {
                ...professor,
                user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null
            };
        });

        res.json({
            professors: populatedProfessors,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (error) {
        console.error('Get professors error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get professor by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const users = await readData('users.json');
        const professors = await readData('professors.json');
        
        const professor = professors.find(p => p._id.$oid === req.params.id);

        if (!professor) {
            return res.status(404).json({ message: 'Professor not found' });
        }

        const user = users.find(u => u._id.$oid === professor.user.$oid);
        const populatedProfessor = {
            ...professor,
            user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null
        };

        res.json(populatedProfessor);
    } catch (error) {
        console.error('Get professor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new professor (admin only)
router.post('/', auth, authorize('admin'), [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('professorId').notEmpty(),
    body('department').notEmpty(),
    body('title').isIn(['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer']),
    body('specialization').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, firstName, lastName, professorId, department, title, specialization } = req.body;

        const users = await readData('users.json');
        const professors = await readData('professors.json');

        // Check if user already exists
        if (users.some(u => u.email === email)) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if professor ID already exists
        if (professors.some(p => p.professorId === professorId)) {
            return res.status(400).json({ message: 'Professor ID already exists' });
        }

        // Create user
        const newUserId = generateId();
        const newUser = {
            _id: { $oid: newUserId },
            email,
            password, 
            firstName,
            lastName,
            role: 'professor',
            createdAt: { $date: new Date().toISOString() },
            updatedAt: { $date: new Date().toISOString() },
        };
        users.push(newUser);
        
      
        const newProfessorId = generateId();
        const newProfessor = {
            _id: { $oid: newProfessorId },
            user: { $oid: newUserId },
            professorId,
            department,
            title,
            specialization,
            status: 'active',
            createdAt: { $date: new Date().toISOString() },
            updatedAt: { $date: new Date().toISOString() },
        };
        professors.push(newProfessor);
        
        await writeData('users.json', users);
        await writeData('professors.json', professors);
        
        res.status(201).json({
            message: 'Professor created successfully',
            professor: { ...newProfessor, user: { firstName, lastName, email } }
        });
    } catch (error) {
        console.error('Create professor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


router.put('/:id', auth, [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('department').optional().notEmpty(),
    body('title').optional().isIn(['Assistant Professor', 'Associate Professor', 'Professor', 'Lecturer']),
    body('specialization').optional().notEmpty(),
    body('status').optional().isIn(['active', 'inactive', 'retired'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const users = await readData('users.json');
        const professors = await readData('professors.json');

        const professorIndex = professors.findIndex(p => p._id.$oid === req.params.id);
        if (professorIndex === -1) {
            return res.status(404).json({ message: 'Professor not found' });
        }
        
        const professor = professors[professorIndex];
        
        
        const updateFields = ['department', 'title', 'specialization', 'status'];
        updateFields.forEach(field => {
            if (req.body[field] !== undefined) {
                professor[field] = req.body[field];
            }
        });
        professor.updatedAt = { $date: new Date().toISOString() };
        professors[professorIndex] = professor;

        const userIndex = users.findIndex(u => u._id.$oid === professor.user.$oid);
        let user;
        if (userIndex !== -1) {
            user = users[userIndex];
            if (req.body.firstName) user.firstName = req.body.firstName;
            if (req.body.lastName) user.lastName = req.body.lastName;
            user.updatedAt = { $date: new Date().toISOString() };
            users[userIndex] = user;
        }
        
        await writeData('professors.json', professors);
        await writeData('users.json', users);
        
        const updatedProfessor = {
            ...professor,
            user: user ? { firstName: user.firstName, lastName: user.lastName, email: user.email } : null
        };

        res.json({
            message: 'Professor updated successfully',
            professor: updatedProfessor
        });
    } catch (error) {
        console.error('Update professor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete professor (admin only)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
    try {
        let users = await readData('users.json');
        let professors = await readData('professors.json');

        const professorToDelete = professors.find(p => p._id.$oid === req.params.id);
        if (!professorToDelete) {
            return res.status(404).json({ message: 'Professor not found' });
        }

        // Filter out the professor and their user account
        const updatedProfessors = professors.filter(p => p._id.$oid !== req.params.id);
        const updatedUsers = users.filter(u => u._id.$oid !== professorToDelete.user.$oid);

        await writeData('professors.json', updatedProfessors);
        await writeData('users.json', updatedUsers);

        res.json({ message: 'Professor deleted successfully' });
    } catch (error) {
        console.error('Delete professor error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 