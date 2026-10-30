const fs = require('fs');
const path = require('path');

const jobPages = [
    { file: 'bcs.html', title: 'বিসিএস (BCS) প্রস্তুতি', icon: '🏛️', desc: 'দেশের সর্বোচ্চ সম্মানজনক চাকরির জন্য শরীফ একাডেমীর বিশেষ গাইডলাইন। প্রিলি থেকে ভাইভা - সম্পূর্ণ প্রস্তুতি।' },
    { file: 'bank.html', title: 'ব্যাংক জব প্রস্তুতি', icon: '🏦', desc: 'সরকারি ও বেসরকারি ব্যাংকে ক্যারিয়ার গড়তে এক্সক্লুসিভ ম্যাথ ও ইংলিশ স্পেশাল ব্যাচ।' },
    { file: 'ntrca.html', title: 'এনটিআরসিএ (NTRCA) প্রস্তুতি', icon: '👨‍🏫', desc: 'শিক্ষক নিবন্ধন পরীক্ষায় নিশ্চিত সাফল্যের জন্য আমাদের স্পেশাল কোর্স।' },
    { file: 'primary.html', title: 'প্রাথমিক শিক্ষক নিয়োগ', icon: '🏫', desc: 'প্রাইমারি শিক্ষক নিয়োগ পরীক্ষায় সর্বোচ্চ নম্বরের নিশ্চয়তা নিয়ে আমাদের আয়োজন।' },
    { file: 'grade9-20.html', title: '৯ম-২০তম গ্রেড প্রস্তুতি', icon: '🏢', desc: 'মন্ত্রণালয় ও বিভিন্ন সরকারি দপ্তরে জব প্রস্তুতির জন্য মাস্টার কোর্স।' }
];

const template = (title, icon, desc) => `<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | শরীফ একাডেমী</title>
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
        .icon-large { font-size: 4rem; margin-bottom: 20px; display: block; }
        .premium-placeholder h2 { color: var(--primary-color); margin-bottom: 15px; }
        .premium-placeholder p { color: var(--gray-text); margin-bottom: 30px; font-size: 1.1rem; }
        
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
            <h1>${icon} ${title}</h1>
            <p>${desc}</p>
        </div>
    </div>

    <div class="container">
        <div class="premium-placeholder">
            <span class="coming-soon-badge">শীঘ্রই আসছে</span>
            <h2>কোর্সটি আপডেট করা হচ্ছে...</h2>
            <p>আমরা এই কোর্সের জন্য সেরা ম্যাটেরিয়ালস এবং লেকচার প্ল্যান তৈরি করছি। খুব শীঘ্রই এখানে আপনি কোর্সের বিস্তারিত রুটিন, সিলেবাস এবং লাইভ ক্লাসের লিংক পেয়ে যাবেন।</p>
            
            <a href="../dashboard.html" class="back-btn"><i class="fas fa-arrow-left"></i> ড্যাশবোর্ডে ফিরে যান</a>
        </div>
    </div>
</body>
</html>`;

const outDir = path.join(__dirname, 'public', 'job');

jobPages.forEach(page => {
    fs.writeFileSync(path.join(outDir, page.file), template(page.title, page.icon, page.desc));
});

console.log('Created 5 job pages successfully!');
