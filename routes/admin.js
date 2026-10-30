const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');

const isAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin === true) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized. Admin access required.' });
    }
};

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
        
        const admin = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
        if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
        
        const match = await bcrypt.compare(password, admin.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });
        
        req.session.isAdmin = true;
        req.session.adminId = admin.id;
        
        res.json({ success: true, message: 'Admin logged in successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/students', isAdmin, (req, res) => {
    try {
        const { aim, gender, search } = req.query;
        let query = 'SELECT id, name, mobile, aim, institution, address, guardian_number, gender, photo_path, raw_password, created_at FROM students WHERE 1=1';
        const params = [];
        
        if (aim) {
            query += ' AND aim = ?';
            params.push(aim);
        }
        
        if (gender) {
            query += ' AND gender = ?';
            params.push(gender);
        }
        
        if (search) {
            query += ' AND (name LIKE ? OR mobile LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const students = db.prepare(query).all(...params);
        res.json({ success: true, students });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/students/:id', isAdmin, (req, res) => {
    try {
        const student = db.prepare('SELECT id, name, mobile, aim, institution, address, guardian_number, gender, photo_path, raw_password, created_at FROM students WHERE id = ?').get(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json({ success: true, student });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/message', isAdmin, (req, res) => {
    try {
        const { student_ids, message } = req.body;
        if (!Array.isArray(student_ids) || student_ids.length === 0 || !message) {
            return res.status(400).json({ error: 'Invalid input. Provide student_ids array and message.' });
        }
        
        const insert = db.prepare('INSERT INTO messages (student_id, message) VALUES (?, ?)');
        db.exec('BEGIN');
        let count = 0;
        try {
            for (const id of student_ids) {
                insert.run(id, message);
                count++;
            }
            db.exec('COMMIT');
        } catch(e) {
            db.exec('ROLLBACK');
            throw e;
        }
        
        res.json({ success: true, count, message: `${count} messages sent successfully` });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/messages', isAdmin, (req, res) => {
    try {
        const messages = db.prepare(`
            SELECT m.id, m.message, m.sent_at, s.name as student_name, s.mobile as student_mobile 
            FROM messages m
            JOIN students s ON m.student_id = s.id
            ORDER BY m.sent_at DESC
        `).all();
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/stats', isAdmin, (req, res) => {
    try {
        const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
        const sscCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE aim = "SSC"').get().count;
        const hscCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE aim = "HSC"').get().count;
        const jobCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE aim = "JOB"').get().count;
        
        const maleCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE gender = "Male"').get().count;
        const femaleCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE gender = "Female"').get().count;
        const otherCount = db.prepare('SELECT COUNT(*) as count FROM students WHERE gender = "Other"').get().count;
        
        const recentCount = db.prepare(`
            SELECT COUNT(*) as count FROM students 
            WHERE created_at >= date('now', '-7 days')
        `).get().count;
        
        res.json({
            success: true,
            stats: {
                totalStudents,
                aim: { SSC: sscCount, HSC: hscCount, JOB: jobCount },
                gender: { Male: maleCount, Female: femaleCount, Other: otherCount },
                recentRegistrations: recentCount
            }
        });
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

module.exports = router;
