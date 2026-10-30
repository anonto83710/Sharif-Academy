const db = require('./db/database');

const exams = db.prepare("SELECT id, title FROM exams").all();
console.log('Current exams:', exams);

for (const ex of exams) {
    if (ex.title.includes('মডেল টেস্ট ০১') || ex.title.includes('Model Test 01')) {
        db.prepare('DELETE FROM questions WHERE exam_id = ?').run(ex.id);
        db.prepare('DELETE FROM exam_submissions WHERE exam_id = ?').run(ex.id);
        db.prepare('DELETE FROM exams WHERE id = ?').run(ex.id);
        console.log('Successfully deleted exam:', ex);
    }
}
