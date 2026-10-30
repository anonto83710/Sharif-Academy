const db = require('./db/database');

db.exec(`
  CREATE TABLE IF NOT EXISTS dgp_exam_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    bangla_score INTEGER DEFAULT 0,
    english_score INTEGER DEFAULT 0,
    math_score INTEGER DEFAULT 0,
    gk_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    exam_title TEXT DEFAULT 'মুদ্রণ ও প্রকাশনা অধিদপ্তর-30/10/2026',
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('dgp_exam_results table initialized successfully');
