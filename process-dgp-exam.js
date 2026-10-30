const fs = require('fs');

let content = fs.readFileSync('c:/Users/GoBoss/Downloads/Office_Assistant_Exam (2).html', 'utf8');

// Replace লিখিত with MCQ
content = content.replace(/লিখিত পরীক্ষা/g, 'MCQ পরীক্ষা');
content = content.replace(/লিখিত/g, 'MCQ');

// Add navigation button to header
content = content.replace('</header>', `  <div style="margin-left:auto;display:flex;gap:10px">
    <a href="/job/real-test.html" style="color:var(--navy);font-weight:700;text-decoration:none;padding:8px 14px;background:#eef1f8;border-radius:6px;font-size:14px">← রিয়েল টেস্ট তালিকা</a>
    <a href="/dashboard.html" style="color:var(--navy);font-weight:700;text-decoration:none;padding:8px 14px;background:#ffd700;border-radius:6px;font-size:14px">ড্যাশবোর্ড</a>
  </div>
</header>`);

// Auto-fill student info if logged in
const sessionScript = `
<script>
// Check if student is already logged in to pre-fill name and mobile
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/student');
    if (res.ok) {
      const data = await res.json();
      if (data && data.student) {
        const nInput = document.getElementById('name');
        const mInput = document.getElementById('mobile');
        if (nInput && !nInput.value) nInput.value = data.student.name || '';
        if (mInput && !mInput.value) mInput.value = data.student.mobile || '';
      }
    }
  } catch(e) {}
});

// Function to sync results to server
async function syncResultToServer() {
  if (!user || !user.mobile) return;
  const b = results['bangla'] ? results['bangla'].score : 0;
  const e = results['english'] ? results['english'].score : 0;
  const m = results['math'] ? results['math'].score : 0;
  const g = results['gk'] ? results['gk'].score : 0;
  const total = b + e + m + g;

  try {
    await fetch('/api/exam/dgp/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,
        mobile: user.mobile,
        bangla: b,
        english: e,
        math: m,
        gk: g,
        total: total,
        exam_title: 'মুদ্রণ ও প্রকাশনা অধিদপ্তর-30/10/2026'
      })
    });
  } catch(err) {
    console.error('Result sync error:', err);
  }
}
</script>
`;

content = content.replace('</body>', `${sessionScript}</body>`);

// Trigger syncResultToServer() on submitExam
content = content.replace(
  'showResult(subj);',
  'showResult(subj); if(typeof syncResultToServer === "function") syncResultToServer();'
);

fs.writeFileSync('public/job/dgp-exam.html', content);
console.log('Processed and created public/job/dgp-exam.html successfully');
