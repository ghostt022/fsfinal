const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const professorRoutes = require('./routes/professors');
const courseRoutes = require('./routes/courses');
const gradeRoutes = require('./routes/grades');
const scheduleRoutes = require('./routes/schedule');
const statsRoutes = require('./routes/stats');
const examRegistrationRoutes = require('./routes/exam-registrations');

const app = express();
const PORT = process.env.PORT || 3000;


const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const initializeDataFiles = () => {
  const files = ['users.json', 'students.json', 'professors.json', 'courses.json', 'grades.json', 'exam-registrations.json', 'notifications.json'];
  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    }
  });
};

initializeDataFiles();


app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/professors', professorRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/exam-registrations', examRegistrationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Faculty API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 