const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Middleware to check logged in student
const isStudent = (req, res, next) => {
    if (req.session && req.session.studentId) {
        next();
    } else {
        res.status(401).json({ error: 'অনুগ্রহ করে লগইন করুন' });
    }
};

// Get list of exams for category
router.get('/list', (req, res) => {
    try {
        const category = req.query.category || 'JOB';
        const exams = db.prepare(`
            SELECT id, title, description, category, duration_minutes, total_marks, created_at,
                   (SELECT COUNT(*) FROM questions WHERE exam_id = exams.id) as question_count
            FROM exams
            WHERE category = ?
            ORDER BY id DESC
        `).all(category);
        res.json({ success: true, exams });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get single exam details and questions (without answers for test taking)
router.get('/:id', (req, res) => {
    try {
        const exam = db.prepare('SELECT id, title, description, category, duration_minutes, total_marks FROM exams WHERE id = ?').get(req.params.id);
        if (!exam) return res.status(404).json({ error: 'পরীক্ষাটি পাওয়া যায়নি' });

        const questions = db.prepare(`
            SELECT id, question_text, option_a, option_b, option_c, option_d 
            FROM questions 
            WHERE exam_id = ?
        `).all(req.params.id);

        res.json({ success: true, exam, questions });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Submit exam answers & calculate score
router.post('/submit/:id', isStudent, (req, res) => {
    try {
        const examId = req.params.id;
        const studentId = req.session.studentId;
        const { answers } = req.body; // { question_id: 'a', ... }

        const questions = db.prepare('SELECT id, correct_option, explanation FROM questions WHERE exam_id = ?').all(examId);
        if (!questions || questions.length === 0) {
            return res.status(400).json({ error: 'কোনো প্রশ্ন পাওয়া যায়নি' });
        }

        let score = 0;
        const review = [];

        for (const q of questions) {
            const userAns = answers ? answers[q.id] : null;
            const isCorrect = userAns && userAns.toLowerCase() === q.correct_option.toLowerCase();
            if (isCorrect) {
                score++;
            }
            review.push({
                question_id: q.id,
                user_answer: userAns,
                correct_answer: q.correct_option,
                is_correct: isCorrect,
                explanation: q.explanation
            });
        }

        db.prepare(`
            INSERT INTO exam_submissions (exam_id, student_id, score, total_questions)
            VALUES (?, ?, ?, ?)
        `).run(examId, studentId, score, questions.length);

        res.json({
            success: true,
            score,
            total: questions.length,
            percentage: Math.round((score / questions.length) * 100),
            review
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Endpoint to submit and record DGP exam results
router.post('/dgp/submit', (req, res) => {
    try {
        const { name, mobile, bangla, english, math, gk, total, exam_title } = req.body;
        if (!name || !mobile) {
            return res.status(400).json({ error: 'নাম ও মোবাইল নম্বর আবশ্যক' });
        }

        const title = exam_title || 'মুদ্রণ ও প্রকাশনা অধিদপ্তর-30/10/2026';
        
        // Upsert or insert result for this student & exam
        const existing = db.prepare('SELECT id FROM dgp_exam_results WHERE mobile = ? AND exam_title = ?').get(mobile, title);
        if (existing) {
            db.prepare(`
                UPDATE dgp_exam_results 
                SET student_name = ?, bangla_score = ?, english_score = ?, math_score = ?, gk_score = ?, total_score = ?, submitted_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `).run(name, bangla || 0, english || 0, math || 0, gk || 0, total || 0, existing.id);
        } else {
            db.prepare(`
                INSERT INTO dgp_exam_results (student_name, mobile, bangla_score, english_score, math_score, gk_score, total_score, exam_title)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(name, mobile, bangla || 0, english || 0, math || 0, gk || 0, total || 0, title);
        }

        res.json({ success: true, message: 'ফলাফল সফলভাবে সংরক্ষিত হয়েছে।' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin endpoint to get DGP results
router.get('/dgp/results', (req, res) => {
    try {
        const results = db.prepare(`
            SELECT id, student_name, mobile, bangla_score, english_score, math_score, gk_score, total_score, exam_title, submitted_at
            FROM dgp_exam_results
            ORDER BY total_score DESC, submitted_at ASC
        `).all();
        res.json({ success: true, results });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Admin endpoint to export CSV/Excel
router.get('/dgp/export-csv', (req, res) => {
    try {
        const results = db.prepare(`
            SELECT student_name, mobile, bangla_score, english_score, math_score, gk_score, total_score, exam_title, submitted_at
            FROM dgp_exam_results
            ORDER BY total_score DESC, submitted_at ASC
        `).all();

        // UTF-8 BOM so Excel opens Bengali characters properly
        let csv = '\uFEFFরোল/ক্রম,পরীক্ষার্থীর নাম,মোবাইল নম্বর,বাংলা (২০),ইংরেজি (২০),গণিত (২০),সাধারণ জ্ঞান (২০),মোট নম্বর (৮০),পরীক্ষার নাম,তারিখ ও সময়\n';
        
        results.forEach((r, idx) => {
            const dateStr = new Date(r.submitted_at).toLocaleString('bn-BD');
            csv += `"${idx + 1}","${r.student_name}","${r.mobile}","${r.bangla_score}","${r.english_score}","${r.math_score}","${r.gk_score}","${r.total_score}","${r.exam_title}","${dateStr}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="DGP_Exam_Results.csv"');
        res.send(csv);
    } catch (e) {
        res.status(500).send('Export error: ' + e.message);
    }
});

module.exports = router;
