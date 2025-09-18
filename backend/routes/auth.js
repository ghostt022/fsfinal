const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Data file paths
const dataDir = path.join(__dirname, '..', 'data');
const usersFile = path.join(dataDir, 'users.json');
const studentsFile = path.join(dataDir, 'students.json');
const professorsFile = path.join(dataDir, 'professors.json');


const readJsonFile = async (filePath) => {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

const writeJsonFile = (filePath, data) => {
  return fs.writeFile(filePath, JSON.stringify(data, null, 2));
};
const generateId = () => {
    // A simplified version of MongoDB's ObjectId.
    const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
    return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
        return (Math.random() * 16 | 0).toString(16);
    }).toLowerCase();
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign({ userId: user._id.$oid, role: user.role }, process.env.JWT_SECRET || 'your_default_secret', { expiresIn: '24h' });
};

// Register new user
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('role').isIn(['student', 'professor']),
    // Student specific
    body('studentId').if(body('role').equals('student')).notEmpty(),
    // body('department').if(body('role').equals('student')).notEmpty(), // REMOVE
    // body('major').if(body('role').equals('student')).notEmpty(),      // REMOVE
    // Professor specific
    body('professorId').if(body('role').equals('professor')).notEmpty(),
    body('title').if(body('role').equals('professor')).notEmpty(),

], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const users = await readJsonFile(usersFile);
        const { email, password, firstName, lastName, role } = req.body;

        if (users.some(user => user.email === email)) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserId = generateId();

        const newUser = {
            _id: { $oid: newUserId },
            email,
            password: hashedPassword,
            firstName,
            lastName,
            role,
            isActive: true, // Activate on registration
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: null
        };
        users.push(newUser);

        if (role === 'student') {
            const students = await readJsonFile(studentsFile);
            const { studentId, department, major, year, semester } = req.body;
            const newStudent = {
                _id: { $oid: generateId() },
                user: { $oid: newUserId },
                studentId,
                department,
                major,
                year: year || 1,
                semester: semester || 1,
                status: 'active',
            };
            students.push(newStudent);
            await writeJsonFile(studentsFile, students);
        } else if (role === 'professor') {
            const professors = await readJsonFile(professorsFile);
            const { professorId, department, title, specialization } = req.body;
            const newProfessor = {
                 _id: { $oid: generateId() },
                user: { $oid: newUserId },
                professorId,
                department,
                title,
                specialization: specialization || 'Not specified',
                status: 'active',
            };
            professors.push(newProfessor);
            await writeJsonFile(professorsFile, professors);
        }

        await writeJsonFile(usersFile, users);
        
        const token = generateToken(newUser);
        res.status(201).json({ 
            message: 'User registered successfully',
            token,
            user: { 
                id: newUser._id.$oid, 
                email: newUser.email, 
                role: newUser.role,
                firstName: newUser.firstName,
                lastName: newUser.lastName
            }
        });

    } catch (error) {
        console.error('[REGISTER] Critical error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const users = await readJsonFile(usersFile);
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    user.lastLogin = new Date().toISOString();
    await writeJsonFile(usersFile, users);

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.$oid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('[LOGIN] Critical error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile
router.get('/profile', (req, res) => {
  res.status(501).json({ message: 'Profile endpoint is not implemented.' });
});

// Change password
router.put('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

  
    res.json({ message: 'Password change endpoint - implement JWT verification' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;