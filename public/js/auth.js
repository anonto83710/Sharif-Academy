// --- UI Helpers ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3500);
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function setFieldStatus(input, isValid, errorMsg = '') {
    const group = input.closest('.form-group');
    const errorSpan = group.querySelector('.error-message');
    
    if (isValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        if (errorSpan) errorSpan.textContent = '';
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        if (errorSpan) errorSpan.textContent = errorMsg;
    }
}

// Simulated API Call Helper
async function api(endpoint, options = {}) {
    options.headers = options.headers || {};
    if (!(options.body instanceof FormData) && typeof options.body === 'object') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    
    // In production, endpoints should match the Express routes
    const response = await fetch(endpoint, options);
    return response;
}

// --- Login Page Logic ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;

        try {
            const res = await api('/api/login', {
                method: 'POST',
                body: { identifier, password }
            });
            const data = await res.json();
            
            if (res.ok && data.success) {
                showToast('লগইন সফল হয়েছে!', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showToast(data.error || 'লগইন ব্যর্থ হয়েছে', 'error');
            }
        } catch (err) {
            showToast('সার্ভার এরর!', 'error');
        }
    });

    // Forgot password logic
    const forgotBtn = document.getElementById('forgotBtn');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('forgotModal');
        });
    }

    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const res = await api('/api/forgot-password', {
                method: 'POST',
                body: {
                    mobile: document.getElementById('f_mobile').value,
                    guardian_number: document.getElementById('f_guardian').value
                }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const resDiv = document.getElementById('forgotResult');
                resDiv.style.display = 'block';
                resDiv.innerHTML = `<div style="padding: 10px; background: #e8f5e9; border: 1px solid #c8e6c9; border-radius: 4px;">আপনার নতুন পাসওয়ার্ড: <strong>${data.tempPassword}</strong><br>লগইন করে পাসওয়ার্ড পরিবর্তন করুন।</div>`;
            } else {
                showToast(data.error || 'তথ্য মেলেনি', 'error');
            }
        });
    }
}

// --- Registration Page Logic ---
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    const aimRadios = document.querySelectorAll('input[name="aim"]');
    const instLabel = document.getElementById('instLabel');
    
    // Aim Selection
    aimRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.aim-tab').forEach(tab => tab.classList.remove('active'));
            e.target.closest('.aim-tab').classList.add('active');
            
            const val = e.target.value;
            if (val === 'SSC') instLabel.textContent = 'স্কুলের নাম';
            else if (val === 'HSC') instLabel.textContent = 'কলেজের নাম';
            else if (val === 'JOB') instLabel.textContent = 'এসএসসি ব্যাচ / সর্বশেষ প্রতিষ্ঠান';
        });
    });

    // Photo Preview
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photoPreview');
    const photoText = document.getElementById('photoText');
    
    if (photoInput) {
        photoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    photoPreview.src = e.target.result;
                    photoPreview.style.display = 'block';
                    photoText.style.display = 'none';
                }
                reader.readAsDataURL(file);
                setFieldStatus(this, true);
            }
        });
    }

    // Password Strength
    const passInput = document.getElementById('reg_password');
    const strengthBar = document.getElementById('strengthBar');
    const strengthText = document.getElementById('strengthText');
    
    if (passInput) {
        passInput.addEventListener('input', () => {
            const val = passInput.value;
            let strength = 0;
            if (val.length >= 8) strength++;
            if (/[A-Z]/.test(val) && /[a-z]/.test(val)) strength++;
            if (/[0-9]/.test(val)) strength++;
            if (/[^A-Za-z0-9]/.test(val)) strength++;

            strengthBar.className = 'strength-bar';
            if (val.length === 0) {
                strengthBar.style.width = '0';
                strengthText.textContent = '';
            } else if (strength === 1 || val.length < 8) {
                strengthBar.classList.add('strength-weak');
                strengthText.textContent = 'Weak';
                strengthText.style.color = 'var(--error-color)';
            } else if (strength === 2) {
                strengthBar.classList.add('strength-medium');
                strengthText.textContent = 'Medium';
                strengthText.style.color = 'var(--warning-color)';
            } else if (strength === 3) {
                strengthBar.classList.add('strength-strong');
                strengthText.textContent = 'Strong';
                strengthText.style.color = '#afb42b';
            } else if (strength >= 4) {
                strengthBar.classList.add('strength-very-strong');
                strengthText.textContent = 'Very Strong';
                strengthText.style.color = 'var(--success-color)';
            }
        });
    }

    // Validation Rules
    const rules = {
        name: val => val.length >= 3 || 'নাম অন্তত ৩ অক্ষরের হতে হবে',
        mobile: val => /^01[3-9]\d{8}$/.test(val) || 'সঠিক মোবাইল নম্বর দিন (যেমন: 01712345678)',
        institution: val => val.length >= 3 || 'সঠিক নাম দিন',
        address: val => val.length >= 5 || 'বিস্তারিত ঠিকানা দিন',
        guardian_number: (val, all) => {
            if (!/^01[3-9]\d{8}$/.test(val)) return 'সঠিক নম্বর দিন';
            if (val === all.mobile) return 'অভিভাবক ও শিক্ষার্থীর নম্বর আলাদা হতে হবে';
            return true;
        },
        reg_password: val => val.length >= 8 || 'পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে',
        confirm_password: (val, all) => val === all.reg_password || 'পাসওয়ার্ড মিলছে না'
    };

    // Form Submit
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loader = document.getElementById('loader');
        
        // Gather values
        const vals = {
            name: document.getElementById('name').value,
            mobile: document.getElementById('mobile').value,
            institution: document.getElementById('institution').value,
            address: document.getElementById('address').value,
            guardian_number: document.getElementById('guardian_number').value,
            reg_password: document.getElementById('reg_password').value,
            confirm_password: document.getElementById('confirm_password').value,
        };

        // Validate all
        let isValid = true;
        for (const [key, ruleFn] of Object.entries(rules)) {
            const input = document.getElementById(key);
            const res = ruleFn(vals[key], vals);
            if (res !== true) {
                setFieldStatus(input, false, res);
                isValid = false;
            } else {
                setFieldStatus(input, true);
            }
        }

        if (!photoInput.files.length) {
            document.getElementById('photoError').textContent = 'ছবি সিলেক্ট করুন';
            isValid = false;
        }

        if (!isValid) {
            showToast('অনুগ্রহ করে সঠিক তথ্য প্রদান করুন', 'error');
            return;
        }

        // Submit (Mock)
        loader.style.display = 'flex';
        try {
            // Using FormData for photo upload
            const formData = new FormData(registerForm);
            const res = await api('/api/register', { method: 'POST', body: formData });
            const data = await res.json();
            
            loader.style.display = 'none';
            if (res.ok && data.success) {
                showToast('রেজিস্ট্রেশন সফল হয়েছে! লগইন করুন।', 'success');
                setTimeout(() => window.location.href = 'login.html', 1500);
            } else {
                showToast(data.error || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে', 'error');
            }
        } catch (err) {
            loader.style.display = 'none';
            showToast('এরর হয়েছে', 'error');
        }
    });
}
