const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, JPEG, PNG, WEBP are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const weakPasswords = ['password', '12345678', 'abcdefgh', 'qwerty123', 'password123', '11111111', 'abcd1234'];

router.post('/register', upload.single('photo'), async (req, res) => {
    try {
        const { name, mobile, aim, institution, address, guardian_number, gender, password } = req.body;
        
        if (!name || name.trim().length < 3 || !/[a-zA-Z]/.test(name)) {
            return res.status(400).json({ error: 'Invalid name. Must be at least 3 characters and contain at least one letter.' });
        }
        
        const bdMobileRegex = /^01[3-9]\d{8}$/;
        if (!mobile || !bdMobileRegex.test(mobile) || /^(\d)\1+$/.test(mobile)) {
            return res.status(400).json({ error: 'Invalid mobile number.' });
        }
        
        if (!aim || !['SSC', 'HSC', 'JOB'].includes(aim)) {
            return res.status(400).json({ error: 'Invalid aim. Must be SSC, HSC, or JOB.' });
        }
        
        if (!institution || institution.trim().length < 3) {
            return res.status(400).json({ error: 'Institution name must be at least 3 characters.' });
        }
        
        if (!address || address.trim().length < 5) {
            return res.status(400).json({ error: 'Address must be at least 5 characters.' });
        }
        
        if (!guardian_number || !bdMobileRegex.test(guardian_number) || guardian_number === mobile) {
            return res.status(400).json({ error: 'Invalid guardian number. Must be a valid BD mobile number different from student mobile.' });
        }
        
        if (!gender || !['Male', 'Female', 'Other'].includes(gender)) {
            return res.status(400).json({ error: 'Invalid gender.' });
        }
        
        if (!password || password.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(password) || weakPasswords.includes(password.toLowerCase())) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long, include uppercase, lowercase, digit, and special character. Common weak passwords are not allowed.' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'Photo is required.' });
        }
        
        const checkMobile = db.prepare('SELECT id FROM students WHERE mobile = ?').get(mobile);
        if (checkMobile) {
            return res.status(400).json({ error: 'Mobile number already registered.' });
        }
        
        const passwordHash = await bcrypt.hash(password, 10);
        
        const insert = db.prepare(`
            INSERT INTO students (name, mobile, aim, institution, address, guardian_number, gender, photo_path, password_hash, raw_password)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        const info = insert.run(name.trim(), mobile, aim, institution.trim(), address.trim(), guardian_number, gender, req.file.path, passwordHash, password);
        
        res.status(201).json({ success: true, studentId: info.lastInsertRowid });
        
    } catch (error) {
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;
        if (!identifier || !password) {
            return res.status(400).json({ error: 'Identifier and password required' });
        }
        
        let student = db.prepare('SELECT * FROM students WHERE mobile = ?').get(identifier);
        
        if (!student) {
            student = db.prepare('SELECT * FROM students WHERE LOWER(name) = ?').get(identifier.toLowerCase());
        }
        
        if (!student) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const match = await bcrypt.compare(password, student.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        req.session.studentId = student.id;
        req.session.studentName = student.name;
        req.session.isStudent = true;
        
        res.json({ success: true, student: { id: student.id, name: student.name, aim: student.aim } });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ error: 'Logout failed' });
        res.json({ success: true });
    });
});

router.get('/profile', (req, res) => {
    if (!req.session.studentId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const student = db.prepare('SELECT id, name, mobile, aim, institution, address, guardian_number, gender, photo_path, created_at FROM students WHERE id = ?').get(req.session.studentId);
    
    if (!student) {
        return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ success: true, student });
});

router.post('/forgot-password', async (req, res) => {
    try {
        const { mobile, guardian_number } = req.body;
        if (!mobile || !guardian_number) {
            return res.status(400).json({ error: 'Mobile and guardian number required' });
        }
        
        const student = db.prepare('SELECT id, guardian_number FROM students WHERE mobile = ?').get(mobile);
        
        if (!student || student.guardian_number !== guardian_number) {
            return res.status(404).json({ error: 'No matching record found' });
        }
        
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let tempPassword = '';
        for (let i = 0; i < 10; i++) {
            tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        const hash = await bcrypt.hash(tempPassword, 10);
        db.prepare('UPDATE students SET password_hash = ? WHERE id = ?').run(hash, student.id);
        
        res.json({ success: true, tempPassword: tempPassword, message: 'Password reset successfully. Please login with your new temporary password.' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
