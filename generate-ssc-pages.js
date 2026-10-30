const fs = require('fs');
const path = require('path');

const sscPages = [
    { file: 'science.html', title: 'বিজ্ঞান (Science)', icon: '🔬', desc: 'SSC বিজ্ঞান বিভাগের জন্য এক্সক্লুসিভ গাইডলাইন ও রুটিন।', subjects: [] },
    { file: 'commerce.html', title: 'ব্যবসায় শিক্ষা (Commerce)', icon: '💼', desc: 'SSC ব্যবসায় শিক্ষা বিভাগের জন্য এক্সক্লুসিভ গাইডলাইন ও রুটিন।', subjects: [] },
    { file: 'arts.html', title: 'মানবিক (Arts)', icon: '🌍', desc: 'SSC মানবিক বিভাগের জন্য এক্সক্লুসিভ গাইডলাইন ও রুটিন।', subjects: [] },
    { file: 'common.html', title: 'ঐচ্ছিক বিষয়', icon: '📚', desc: 'SSC সকল বিভাগের জন্য সাধারণ বিষয়সমূহ।', subjects: [
        { name: 'বাংলা ১ম', icon: '📖' },
        { name: 'বাংলা ২য়', icon: '📝' },
        { name: 'ইংরেজি ১ম', icon: '🅰️' },
        { name: 'ইংরেজি ২য়', icon: '🅱️', link: 'english2.html' },
        { name: 'গণিত', icon: '➗' },
        { name: 'ICT', icon: '💻' }
    ]},
    { file: 'english2.html', title: 'ইংরেজি ২য়', icon: '🅱️', desc: 'SSC ইংরেজি ২য় পত্রের পূর্ণাঙ্গ প্রস্তুতি।', subjects: [
        { name: 'বোর্ড প্রশ্ন', icon: '📝' },
        { name: 'মডেল টেস্ট', icon: '💯' },
        { name: 'সাজেশন', icon: '🎯' }
    ]}
];

const template = (page) => `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.title} | শরীফ একাডেমী</title>
    <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="../css/style.css">
    <link rel="stylesheet" href="../css/modern.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { background-color: var(--light-bg); }
        .course-header {
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
            padding: 80px 0 60px;
            color: white;
            text-align: center;
        }
        .course-header h1 { color: white; font-size: 2.5rem; margin-bottom: 15px; }
        .course-header p { font-size: 1.2rem; opacity: 0.9; max-width: 600px; margin: 0 auto; }
        
        .premium-placeholder {
            max-width: 800px;
            margin: -30px auto 50px;
            background: white;
            border-radius: 16px;
            padding: 50px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            position: relative;
            z-index: 10;
        }
        .coming-soon-badge {
            display: inline-block;
            background: rgba(255, 215, 0, 0.2);
            color: #b8860b;
            padding: 8px 20px;
            border-radius: 30px;
            font-weight: 700;
            border: 1px solid #ffd700;
            margin-bottom: 25px;
        }
        .back-btn {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 600;
            margin-top: 30px;
            transition: all 0.3s;
        }
        .back-btn:hover { color: var(--accent-color); }

        .subjects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
            margin-bottom: 20px;
        }
        .subject-card {
            background: var(--light-bg);
            padding: 25px 20px;
            border-radius: 12px;
            border: 1px solid var(--border-color);
            text-decoration: none;
            color: var(--dark-text);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        .subject-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(0,0,0,0.08);
            border-color: var(--primary-color);
        }
        .subject-card .icon { font-size: 2.5rem; }
        .subject-card .title { font-size: 1.2rem; font-weight: 700; color: var(--primary-color); }
    </style>
</head>
<body>
    <nav class="navbar modern-navbar" style="position: relative;">
        <div class="container flex-between">
            <div class="logo">
                <a href="../index.html"><img src="../images/logo.jpg" alt="Sharif Academy Logo" class="nav-logo-img"></a>
            </div>
            <ul class="nav-links">
                <li><a href="../dashboard.html">ড্যাশবোর্ড</a></li>
            </ul>
        </div>
    </nav>

    <div class="course-header">
        <div class="container">
            <h1>${page.icon} ${page.title}</h1>
            <p>${page.desc}</p>
        </div>
    </div>

    <div class="container">
        <div class="premium-placeholder">
            ${page.subjects.length > 0 ? `
                <h2 style="color: var(--primary-color); margin-bottom: 10px;">নির্বাচন করুন</h2>
                <div class="subjects-grid">
                    ${page.subjects.map(sub => `
                        <a href="${sub.link || '#'}" class="subject-card">
                            <span class="icon">${sub.icon}</span>
                            <span class="title">${sub.name}</span>
                        </a>
                    `).join('')}
                </div>
            ` : `
                <span class="coming-soon-badge">শীঘ্রই আসছে</span>
                <h2 style="color: var(--primary-color); margin-bottom: 15px;">কোর্সটি আপডেট করা হচ্ছে...</h2>
                <p style="color: var(--gray-text); font-size: 1.1rem;">আমরা এই গ্রুপের জন্য সেরা ম্যাটেরিয়ালস তৈরি করছি। খুব শীঘ্রই এখানে বিস্তারিত রুটিন পেয়ে যাবেন।</p>
            `}
            
            <a href="../dashboard.html" class="back-btn"><i class="fas fa-arrow-left"></i> ড্যাশবোর্ডে ফিরে যান</a>
        </div>
    </div>
</body>
</html>`;

const outDir = path.join(__dirname, 'public', 'ssc');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

sscPages.forEach(page => {
    fs.writeFileSync(path.join(outDir, page.file), template(page));
});

console.log('Created 4 SSC pages successfully!');
