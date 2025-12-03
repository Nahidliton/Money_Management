// Authentication System
class AuthSystem {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users') || '[]');
        this.currentUser = null;
        this.otpData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupOTPInputs();
        this.checkExistingSession();
    }

    setupEventListeners() {
        // Login Form
        const loginForm = document.getElementById('loginFormElement');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup Form
        const signupForm = document.getElementById('signupFormElement');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Forgot Password Form
        const forgotForm = document.getElementById('forgotFormElement');
        if (forgotForm) {
            forgotForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }

        // 2FA Form
        const twoFactorForm = document.getElementById('twoFactorFormElement');
        if (twoFactorForm) {
            twoFactorForm.addEventListener('submit', (e) => this.handleTwoFactor(e));
        }

        // Password strength checker
        const signupPassword = document.getElementById('signupPassword');
        if (signupPassword) {
            signupPassword.addEventListener('input', (e) => this.checkPasswordStrength(e.target.value));
        }

        // Confirm password validation
        const confirmPassword = document.getElementById('signupConfirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', (e) => this.validatePasswordMatch());
        }
    }

    setupOTPInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                if (value.length === 1) {
                    // Move to next input
                    if (index < otpInputs.length - 1) {
                        otpInputs[index + 1].focus();
                    }
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && e.target.value === '') {
                    // Move to previous input
                    if (index > 0) {
                        otpInputs[index - 1].focus();
                    }
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pastedData = e.clipboardData.getData('text');
                if (pastedData.length === 6) {
                    otpInputs.forEach((inp, idx) => {
                        inp.value = pastedData[idx] || '';
                    });
                }
            });
        });
    }

    checkExistingSession() {
        const session = localStorage.getItem('currentSession');
        if (session) {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            
            // Check if session is still valid (24 hours)
            if (now - sessionData.timestamp < 24 * 60 * 60 * 1000) {
                this.currentUser = sessionData.user;
                this.redirectToDashboard();
                return;
            } else {
                // Session expired
                localStorage.removeItem('currentSession');
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        this.showLoading('loginFormElement');

        try {
            // Simulate API delay
            await this.delay(1000);

            const user = this.users.find(u => 
                (u.email === email || u.studentId === email) && u.password === password
            );

            if (!user) {
                throw new Error('Invalid credentials');
            }

            if (user.twoFactorEnabled) {
                this.generateAndSendOTP(user);
                this.showTwoFactor();
            } else {
                this.loginSuccess(user, rememberMe);
            }

        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading('loginFormElement');
        }
    }

    async handleSignup(e) {
        e.preventDefault();

        const name = document.getElementById('signupName').value;
        const studentId = document.getElementById('signupStudentId').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        // Validation
        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (!agreeTerms) {
            this.showError('Please agree to the terms of service');
            return;
        }

        if (this.users.find(u => u.email === email)) {
            this.showError('Email already exists');
            return;
        }

        if (this.users.find(u => u.studentId === studentId)) {
            this.showError('Student ID already exists');
            return;
        }

        this.showLoading('signupFormElement');

        try {
            // Simulate API delay
            await this.delay(1500);

            const newUser = {
                id: Date.now().toString(),
                name,
                studentId,
                email,
                password, // In real app, this would be hashed
                twoFactorEnabled: false,
                createdAt: new Date().toISOString(),
                settings: {
                    currency: 'BDT',
                    notifications: {
                        budgetLimit: true,
                        monthlyReport: true,
                        recurring: true
                    }
                }
            };

            this.users.push(newUser);
            localStorage.setItem('users', JSON.stringify(this.users));

            this.showSuccess('Account created successfully! Please sign in.');
            this.showLogin();

        } catch (error) {
            this.showError('Failed to create account. Please try again.');
        } finally {
            this.hideLoading('signupFormElement');
        }
    }

    async handleForgotPassword(e) {
        e.preventDefault();

        const email = document.getElementById('forgotEmail').value;

        this.showLoading('forgotFormElement');

        try {
            // Simulate API delay
            await this.delay(1000);

            const user = this.users.find(u => u.email === email);
            
            if (!user) {
                throw new Error('Email not found');
            }

            this.showSuccess('Password reset link sent to your email!');
            
            // In real app, would send actual email
            setTimeout(() => {
                this.showLogin();
            }, 2000);

        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading('forgotFormElement');
        }
    }

    async handleTwoFactor(e) {
        e.preventDefault();

        const otpInputs = document.querySelectorAll('.otp-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');

        if (otp.length !== 6) {
            this.showError('Please enter the complete 6-digit code');
            return;
        }

        this.showLoading('twoFactorFormElement');

        try {
            // Simulate API delay
            await this.delay(1000);

            if (this.otpData && otp === this.otpData.code) {
                const now = new Date().getTime();
                if (now - this.otpData.timestamp < 5 * 60 * 1000) { // 5 minutes validity
                    this.loginSuccess(this.otpData.user, false);
                    return;
                }
            }

            throw new Error('Invalid or expired code');

        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading('twoFactorFormElement');
        }
    }

    generateAndSendOTP(user) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        this.otpData = {
            user,
            code,
            timestamp: new Date().getTime()
        };

        // In real app, would send actual OTP via email/SMS
        console.log('OTP Code:', code); // For demo purposes
        this.showSuccess(`OTP sent to ${user.email} (Check console for demo code)`);
    }

    loginSuccess(user, rememberMe) {
        this.currentUser = user;
        
        const sessionData = {
            user: {
                id: user.id,
                name: user.name,
                studentId: user.studentId,
                email: user.email,
                settings: user.settings
            },
            timestamp: new Date().getTime()
        };

        localStorage.setItem('currentSession', JSON.stringify(sessionData));
        
        if (rememberMe) {
            localStorage.setItem('rememberUser', user.email);
        }

        this.showSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
            this.redirectToDashboard();
        }, 1000);
    }

    redirectToDashboard() {
        window.location.href = 'dashboard.html';
    }

    checkPasswordStrength(password) {
        let strength = 0;
        let feedback = '';

        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        const strengthElement = document.querySelector('.password-strength');
        if (!strengthElement) {
            this.createPasswordStrengthIndicator();
        }

        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');
        
        if (strengthBar && strengthText) {
            strengthBar.className = 'strength-bar';
            
            if (strength < 3) {
                strengthBar.classList.add('strength-weak');
                feedback = 'Weak password';
                strengthText.style.color = 'var(--danger-color)';
            } else if (strength < 5) {
                strengthBar.classList.add('strength-medium');
                feedback = 'Medium strength';
                strengthText.style.color = 'var(--warning-color)';
            } else {
                strengthBar.classList.add('strength-strong');
                feedback = 'Strong password';
                strengthText.style.color = 'var(--success-color)';
            }
            
            strengthText.textContent = feedback;
        }
    }

    createPasswordStrengthIndicator() {
        const passwordInput = document.getElementById('signupPassword');
        if (passwordInput && !document.querySelector('.password-strength')) {
            const strengthHTML = `
                <div class="password-strength">
                    <div class="strength-bar">
                        <div class="strength-fill"></div>
                    </div>
                    <div class="strength-text"></div>
                </div>
            `;
            passwordInput.insertAdjacentHTML('afterend', strengthHTML);
        }
    }

    validatePasswordMatch() {
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        const confirmInput = document.getElementById('signupConfirmPassword');

        if (confirmPassword && password !== confirmPassword) {
            confirmInput.classList.add('error');
            this.showFieldError(confirmInput, 'Passwords do not match');
        } else {
            confirmInput.classList.remove('error');
            this.hideFieldError(confirmInput);
        }
    }

    showFieldError(input, message) {
        this.hideFieldError(input); // Remove existing error
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        input.parentNode.appendChild(errorDiv);
    }

    hideFieldError(input) {
        const existingError = input.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }

    showLoading(formId) {
        const form = document.getElementById(formId);
        const submitBtn = form?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }
    }

    hideLoading(formId) {
        const form = document.getElementById(formId);
        const submitBtn = form?.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Hide notification after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Form switching methods
    showLogin() {
        this.hideAllForms();
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('loginEmail').focus();
    }

    showSignup() {
        this.hideAllForms();
        document.getElementById('signupForm').classList.remove('hidden');
        document.getElementById('signupName').focus();
    }

    showForgotPassword() {
        this.hideAllForms();
        document.getElementById('forgotForm').classList.remove('hidden');
        document.getElementById('forgotEmail').focus();
    }

    showTwoFactor() {
        this.hideAllForms();
        document.getElementById('twoFactorForm').classList.remove('hidden');
        document.querySelector('.otp-input').focus();
    }

    hideAllForms() {
        const forms = ['loginForm', 'signupForm', 'forgotForm', 'twoFactorForm'];
        forms.forEach(formId => {
            document.getElementById(formId).classList.add('hidden');
        });
    }

    resendOTP() {
        if (this.otpData && this.otpData.user) {
            this.generateAndSendOTP(this.otpData.user);
            
            // Clear OTP inputs
            document.querySelectorAll('.otp-input').forEach(input => {
                input.value = '';
            });
            document.querySelector('.otp-input').focus();
        }
    }

    logout() {
        localStorage.removeItem('currentSession');
        window.location.href = 'index.html';
    }
}

// Global functions for form switching
function showLogin() {
    authSystem.showLogin();
}

function showSignup() {
    authSystem.showSignup();
}

function showForgotPassword() {
    authSystem.showForgotPassword();
}

function resendOTP() {
    authSystem.resendOTP();
}

// Initialize auth system
let authSystem;

document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
    
    // Pre-fill login if user chose to be remembered
    const rememberedUser = localStorage.getItem('rememberUser');
    if (rememberedUser) {
        const loginEmail = document.getElementById('loginEmail');
        if (loginEmail) {
            loginEmail.value = rememberedUser;
            document.getElementById('loginPassword').focus();
        }
    }
    
    // Load demo user for testing
    loadDemoUser();
});

function loadDemoUser() {
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check if demo user already exists
    if (!existingUsers.find(u => u.email === 'demo@student.edu')) {
        const demoUser = {
            id: 'demo123',
            name: 'Demo Student',
            studentId: 'DEMO001',
            email: 'demo@student.edu',
            password: 'demo123', // In real app, this would be hashed
            twoFactorEnabled: false,
            createdAt: new Date().toISOString(),
            settings: {
                currency: 'BDT',
                notifications: {
                    budgetLimit: true,
                    monthlyReport: true,
                    recurring: true
                }
            }
        };
        
        existingUsers.push(demoUser);
        localStorage.setItem('users', JSON.stringify(existingUsers));
        
        // Show demo credentials
        setTimeout(() => {
            authSystem.showNotification('Demo account created! Email: demo@student.edu, Password: demo123', 'info');
        }, 1000);
    }
}