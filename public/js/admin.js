// --- API Helper ---
async function api(endpoint, options = {}) {
    options.headers = options.headers || {};
    if (options.body && typeof options.body === 'object') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    const res = await fetch(endpoint, options);
    // If unauthorized, redirect to login
    if (res.status === 401 && endpoint !== '/api/admin/login') {
        window.location.href = 'login.html';
    }
    return res;
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    // Nav switching
    document.querySelectorAll('#adminNav a[data-view]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('#adminNav a').forEach(a => a.classList.remove('active'));
            e.target.classList.add('active');
            
            const viewId = e.target.getAttribute('data-view');
            document.querySelectorAll('.view-section').forEach(v => v.style.display = 'none');
            document.getElementById(`view-${viewId}`).style.display = 'block';
            document.getElementById('viewTitle').textContent = e.target.textContent;

            // Trigger specific view loads
            if (viewId === 'dashboard') loadStats();
            if (viewId === 'students') loadStudents();
            if (viewId === 'exam-results') loadExamResults();
            if (viewId === 'messages') loadMessages();
            
            // Close sidebar on mobile
            const sidebar = document.getElementById('sidebar');
            if(sidebar) sidebar.classList.remove('active');
        });
    });

    // Logout
    const logoutBtn = document.getElementById('adminLogout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await api('/api/admin/logout', { method: 'POST' });
            window.location.href = 'login.html';
        });
    }

    // Filters
    const filterAim = document.getElementById('filterAim');
    const searchStudent = document.getElementById('searchStudent');
    if (filterAim) filterAim.addEventListener('change', loadStudents);
    if (searchStudent) searchStudent.addEventListener('input', debounce(loadStudents, 500));
    
    // Initial load: check auth via stats endpoint if we are on dashboard
    if (document.getElementById('view-dashboard')) {
        try {
            const res = await api('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    updateStatsUI(data.stats);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }
});

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// --- Functions ---
function showToast(msg, type='success') {
    const container = document.getElementById('toastContainer');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

async function loadStats() {
    try {
        const res = await api('/api/admin/stats');
        if(res.ok) {
            const data = await res.json();
            if (data.success) {
                updateStatsUI(data.stats);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function updateStatsUI(stats) {
    const counters = document.querySelectorAll('.counter');
    if (counters.length >= 4) {
        counters[0].setAttribute('data-target', stats.totalStudents);
        counters[1].setAttribute('data-target', stats.aim.SSC);
        counters[2].setAttribute('data-target', stats.aim.HSC);
        counters[3].setAttribute('data-target', stats.aim.JOB);
        animateCounters();
    }
}

function animateCounters() {
    document.querySelectorAll('.counter').forEach(el => {
        const target = parseInt(el.getAttribute('data-target')) || 0;
        if (target === 0) {
            el.textContent = '0';
            return;
        }
        let current = 0;
        const inc = Math.max(1, target / 30);
        const timer = setInterval(() => {
            current += inc;
            if (current >= target) {
                el.textContent = target;
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current);
            }
        }, 30);
    });
}

let allStudents = [];

async function loadStudents() {
    const aimFilter = document.getElementById('filterAim').value;
    const search = document.getElementById('searchStudent').value.trim();
    
    let url = '/api/admin/students?';
    if (aimFilter && aimFilter !== 'All') url += `aim=${aimFilter}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;
    
    try {
        const res = await api(url);
        if(res.ok) {
            const data = await res.json();
            if (data.success) {
                allStudents = data.students;
                renderStudentsTable(allStudents);
            }
        }
    } catch (e) {
        console.error(e);
    }
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('studentTableBody');
    if(!tbody) return;
    tbody.innerHTML = '';
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">কোনো শিক্ষার্থী পাওয়া যায়নি</td></tr>';
        return;
    }
    students.forEach(s => {
        const tr = document.createElement('tr');
        const photoUrl = '/' + (s.photo_path || '').replace(/\\/g, '/');
        const passText = s.raw_password ? `<code style="background: #eef2f7; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: #d63384;">${s.raw_password}</code>` : '<span style="color: #999; font-size: 0.85rem;">(পুরোনো একাউন্ট)</span>';
        tr.innerHTML = `
            <td><img src="${photoUrl}" class="avatar-sm" onerror="this.src='https://via.placeholder.com/40'"></td>
            <td>${s.name}</td>
            <td><span class="active-badge"><span class="active-dot"></span> Active</span></td>
            <td>${s.mobile}</td>
            <td>${passText}</td>
            <td><span class="badge">${s.aim}</span></td>
            <td>${s.institution}</td>
            <td>
                <button class="btn btn-outline" style="padding: 5px 10px; font-size: 0.8rem;" onclick="viewStudent(${s.id})">View</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.viewStudent = async function(id) {
    try {
        const res = await api(`/api/admin/students/${id}`);
        if(res.ok) {
            const data = await res.json();
            if (data.success) {
                const s = data.student;
                const photoUrl = '/' + (s.photo_path || '').replace(/\\/g, '/');
                document.getElementById('studentDetails').innerHTML = `
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="${photoUrl}" style="border-radius: 50%; max-width: 100px; max-height: 100px; object-fit:cover;" onerror="this.src='https://via.placeholder.com/100'">
                        <h4 style="margin-top: 10px;">${s.name}</h4>
                        <span class="badge">${s.aim}</span>
                    </div>
                    <table style="width: 100%;">
                        <tr><td><strong>মোবাইল:</strong></td><td>${s.mobile}</td></tr>
                        <tr><td><strong>পাসওয়ার্ড:</strong></td><td><code style="background: #eef2f7; padding: 2px 6px; border-radius: 4px; font-weight: 600; color: #d63384;">${s.raw_password || '(পুরোনো একাউন্ট - এনক্রিপ্টেড)'}</code></td></tr>
                        <tr><td><strong>প্রতিষ্ঠান:</strong></td><td>${s.institution}</td></tr>
                        <tr><td><strong>ঠিকানা:</strong></td><td>${s.address}</td></tr>
                        <tr><td><strong>অভিভাবক:</strong></td><td>${s.guardian_number}</td></tr>
                        <tr><td><strong>লিঙ্গ:</strong></td><td>${s.gender}</td></tr>
                        <tr><td><strong>ভর্তির তারিখ:</strong></td><td>${new Date(s.created_at).toLocaleString()}</td></tr>
                    </table>
                `;
                document.getElementById('studentModal').classList.add('active');
            }
        }
    } catch (e) {
        console.error(e);
    }
}

window.closeModal = function(id) {
    document.getElementById(id).classList.remove('active');
}

async function loadMessages() {
    try {
        const res = await api('/api/admin/messages');
        if(res.ok) {
            const data = await res.json();
            if (data.success) {
                const tbody = document.getElementById('msgHistoryBody');
                if(!tbody) return;
                tbody.innerHTML = '';
                if (data.messages.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" class="text-center">কোনো মেসেজ নেই</td></tr>';
                    return;
                }
                data.messages.forEach(m => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td><strong>${m.student_name}</strong><br><small>${m.student_mobile}</small></td>
                        <td>${m.message}</td>
                        <td>${new Date(m.sent_at).toLocaleString()}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
    } catch (e) {
        console.error(e);
    }
}

window.sendAdminMessage = async function() {
    const target = document.getElementById('msgTarget').value; 
    const content = document.getElementById('msgContent').value;
    
    if (!content.trim()) {
        showToast('মেসেজ খালি রাখা যাবে না!', 'error');
        return;
    }

    try {
        let targetStudents = [];
        if (target === 'all') {
            const res = await api('/api/admin/students');
            const data = await res.json();
            if (data.success) targetStudents = data.students;
        } else {
            const res = await api(`/api/admin/students?aim=${target}`);
            const data = await res.json();
            if (data.success) targetStudents = data.students;
        }

        if (targetStudents.length === 0) {
            showToast('কোনো প্রাপক পাওয়া যায়নি!', 'error');
            return;
        }

        const studentIds = targetStudents.map(s => s.id);
        
        const res = await api('/api/admin/message', {
            method: 'POST',
            body: { student_ids: studentIds, message: content }
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
            document.getElementById('msgContent').value = '';
            showToast(`${data.count} মেসেজ সফলভাবে পাঠানো হয়েছে!`);
            loadMessages();
        } else {
            showToast(data.error || 'মেসেজ পাঠানো ব্যর্থ হয়েছে', 'error');
        }
    } catch (e) {
        showToast('সার্ভার এরর!', 'error');
        console.error(e);
    }
}

// Load and render DGP exam results
window.loadExamResults = async function() {
    const tbody = document.getElementById('examResultTableBody');
    if (!tbody) return;
    try {
        const res = await api('/api/exam/dgp/results');
        const data = await res.json();
        if (data.success) {
            if (data.results.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="padding: 20px; color: #888;">এখনো কোনো শিক্ষার্থী পরীক্ষা জমা দেয়নি</td></tr>';
                return;
            }
            tbody.innerHTML = data.results.map((r, idx) => {
                const dateStr = new Date(r.submitted_at).toLocaleString('bn-BD');
                return `
                    <tr>
                        <td><strong>${idx + 1}</strong></td>
                        <td><strong>${r.student_name}</strong></td>
                        <td>${r.mobile}</td>
                        <td><span class="badge" style="background:#eaf0ff; color:#13224a;">${r.bangla_score}</span></td>
                        <td><span class="badge" style="background:#eaf0ff; color:#13224a;">${r.english_score}</span></td>
                        <td><span class="badge" style="background:#eaf0ff; color:#13224a;">${r.math_score}</span></td>
                        <td><span class="badge" style="background:#eaf0ff; color:#13224a;">${r.gk_score}</span></td>
                        <td><span class="badge" style="background:#28a745; color:#fff; font-size:1rem; font-weight:700;">${r.total_score}</span></td>
                        <td style="font-size:0.85rem; color:#666;">${dateStr}</td>
                    </tr>
                `;
            }).join('');
        }
    } catch(err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="9" class="text-center" style="color:red;">ফলাফল আনতে সমস্যা হয়েছে</td></tr>';
    }
};
