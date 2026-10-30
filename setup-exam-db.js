const db = require('./db/database');

db.exec(`
  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'JOB',
    duration_minutes INTEGER DEFAULT 15,
    total_marks INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    explanation TEXT
  );

  CREATE TABLE IF NOT EXISTS exam_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER REFERENCES exams(id),
    student_id INTEGER REFERENCES students(id),
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add a sample Real Job Test if none exists
const checkExam = db.prepare('SELECT id FROM exams WHERE category = ?').get('JOB');
if (!checkExam) {
  const insertExam = db.prepare(`
    INSERT INTO exams (title, description, category, duration_minutes, total_marks)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    'Real Job Test - মডেল টেস্ট ০১',
    'বিসিএস, ব্যাংক ও সরকারি চাকরি পরীক্ষার উপযোগী পূর্ণাঙ্গ মডেল টেস্ট। সময় সচেতন হয়ে পরীক্ষা দিন।',
    'JOB',
    10,
    5
  );

  const examId = insertExam.lastInsertRowid;
  const insertQ = db.prepare(`
    INSERT INTO questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleQuestions = [
    {
      q: 'বাংলাদেশের সংবিধান কত তারিখে কার্যকর হয়?',
      a: '১৬ ডিসেম্বর ১৯৭২',
      b: '৪ নভেম্বর ১৯৭২',
      c: '২৬ মার্চ ১৯৭১',
      d: '১০ জানুয়ারি ১৯৭২',
      ans: 'a',
      exp: '১৯৭২ সালের ১৬ ডিসেম্বর বাংলাদেশের সংবিধান কার্যকর হয়।'
    },
    {
      q: '‘স্বাধীনতা হীনতায় কে বাঁচিতে চায়’ চরণটি কার রচনা?',
      a: 'রঙ্গলাল বন্দ্যোপাধ্যায়',
      b: 'মাইকেল মধুসূদন দত্ত',
      c: 'ঈশ্বরচন্দ্র বিদ্যাসাগর',
      d: 'হেমচন্দ্র বন্দ্যোপাধ্যায়',
      ans: 'a',
      exp: 'রঙ্গলাল বন্দ্যোপাধ্যায়ের রচিত ‘পদ্মিনী উপাখ্যান’ কাব্যের চরণ।'
    },
    {
      q: 'Choose the correct spelling:',
      a: 'Liaison',
      b: 'Liason',
      c: 'Liasion',
      d: 'Laision',
      ans: 'a',
      exp: 'সঠিক বানান Liaison (যোগাযোগ বা মৈত্রী)।'
    },
    {
      q: 'কোনো সংখ্যার ৬০% থেকে ৬০ বিয়োগ করলে ফলাফল ৬০ হলে, সংখ্যাটি কত?',
      a: '২০০',
      b: '১০০',
      c: '১৫০',
      d: '২৫০',
      ans: 'a',
      exp: 'ধরি সংখ্যাটি x। 0.6x - 60 = 60 => 0.6x = 120 => x = 200।'
    },
    {
      q: 'কম্পিউটারের স্থায়ী মেমোরি কোনটি?',
      a: 'ROM',
      b: 'RAM',
      c: 'CPU',
      d: 'ALU',
      ans: 'a',
      exp: 'ROM (Read Only Memory) হলো কম্পিউটারের নন-ভোলাটাইল বা স্থায়ী স্মৃতি।'
    }
  ];

  for (const item of sampleQuestions) {
    insertQ.run(examId, item.q, item.a, item.b, item.c, item.d, item.ans, item.exp);
  }
}

console.log('Exam setup completed!');
