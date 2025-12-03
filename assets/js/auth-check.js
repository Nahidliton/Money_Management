// Authentication Check for Protected Pages
class AuthChecker {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthentication();
        this.loadUserData();
        this.setupLogoutHandler();
    }

    checkAuthentication() {
        const session = localStorage.getItem('currentSession');
        
        if (!session) {
            this.redirectToLogin();
            return;
        }

        try {
            const sessionData = JSON.parse(session);
            const now = new Date().getTime();
            
            // Check if session is still valid (24 hours)
            if (now - sessionData.timestamp > 24 * 60 * 60 * 1000) {
                this.expireSession();
                return;
            }

            this.currentUser = sessionData.user;
            this.updateUI();
            
        } catch (error) {
            console.error('Invalid session data:', error);
            this.redirectToLogin();
        }
    }

    loadUserData() {
        if (!this.currentUser) return;

        // Update user info in sidebar
        const usernameElement = document.getElementById('username');
        const studentIdElement = document.getElementById('studentId');
        
        if (usernameElement) {
            usernameElement.textContent = this.currentUser.name;
        }
        
        if (studentIdElement) {
            studentIdElement.textContent = `#${this.currentUser.studentId}`;
        }

        // Load user-specific data
        this.loadUserFinancialData();
    }

    loadUserFinancialData() {
        const userId = this.currentUser.id;
        
        // Load user's transactions, budget, etc.
        const userTransactions = Utils.loadFromLocalStorage(`transactions_${userId}`, []);
        const userBudget = Utils.loadFromLocalStorage(`budget_${userId}`, {});
        const userBanks = Utils.loadFromLocalStorage(`banks_${userId}`, [
            {
                id: 'main',
                name: 'Main Account',
                type: 'savings',
                balance: 0,
                color: '#4f46e5'
            }
        ]);
        const userRecurring = Utils.loadFromLocalStorage(`recurring_${userId}`, []);
        const userReceipts = Utils.loadFromLocalStorage(`receipts_${userId}`, []);

        // Store in global app state
        window.appData = {
            userId,
            transactions: userTransactions,
            budget: userBudget,
            banks: userBanks,
            recurringItems: userRecurring,
            receipts: userReceipts,
            settings: this.currentUser.settings || {}
        };

        // Process any pending recurring transactions
        this.processRecurringTransactions();
    }

    processRecurringTransactions() {
        if (!window.appData.recurringItems.length) return;

        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        let hasNewTransactions = false;

        window.appData.recurringItems.forEach(item => {
            if (!item.active) return;

            const lastProcessed = item.lastProcessed ? new Date(item.lastProcessed) : null;
            const shouldProcess = !lastProcessed || 
                (item.frequency === 'monthly' && 
                 (lastProcessed.getMonth() !== currentMonth || lastProcessed.getFullYear() !== currentYear) &&
                 currentDay >= item.day);

            if (shouldProcess) {
                const transaction = {
                    id: Utils.generateId(),
                    type: item.type,
                    amount: item.amount,
                    description: item.description + ' (Auto)',
                    category: item.category,
                    bank: item.bank || 'main',
                    date: today.toISOString().split('T')[0],
                    notes: 'Automatically added from recurring transaction',
                    timestamp: new Date().toISOString()
                };

                window.appData.transactions.unshift(transaction);
                this.updateBankBalance(item.bank || 'main', item.type === 'income' ? item.amount : -item.amount);
                item.lastProcessed = today.toISOString();
                hasNewTransactions = true;
            }
        });

        if (hasNewTransactions) {
            this.saveUserData();
            Utils.showNotification('New recurring transactions have been added automatically', 'info');
        }
    }

    updateBankBalance(bankId, amount) {
        const bank = window.appData.banks.find(b => b.id === bankId);
        if (bank) {
            bank.balance += amount;
        }
    }

    saveUserData() {
        const userId = this.currentUser.id;
        
        Utils.saveToLocalStorage(`transactions_${userId}`, window.appData.transactions);
        Utils.saveToLocalStorage(`budget_${userId}`, window.appData.budget);
        Utils.saveToLocalStorage(`banks_${userId}`, window.appData.banks);
        Utils.saveToLocalStorage(`recurring_${userId}`, window.appData.recurringItems);
        Utils.saveToLocalStorage(`receipts_${userId}`, window.appData.receipts);
    }

    updateUI() {
        // Update any UI elements that depend on authentication
        document.body.classList.add('authenticated');
        
        // Hide loading states
        const loadingElements = document.querySelectorAll('.loading-placeholder');
        loadingElements.forEach(el => el.classList.remove('loading-placeholder'));
    }

    setupLogoutHandler() {
        // Add logout functionality to logout links
        const logoutLinks = document.querySelectorAll('[data-action="logout"]');
        logoutLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            // Save any pending data
            this.saveUserData();
            
            // Clear session
            localStorage.removeItem('currentSession');
            
            // Show logout message
            Utils.showNotification('Logged out successfully', 'success');
            
            // Redirect to login
            setTimeout(() => {
                this.redirectToLogin();
            }, 1000);
        }
    }

    expireSession() {
        localStorage.removeItem('currentSession');
        Utils.showNotification('Your session has expired. Please login again.', 'warning');
        setTimeout(() => {
            this.redirectToLogin();
        }, 2000);
    }

    redirectToLogin() {
        window.location.href = 'index.html';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserId() {
        return this.currentUser?.id;
    }

    getUserName() {
        return this.currentUser?.name;
    }

    getUserSettings() {
        return this.currentUser?.settings || {};
    }

    updateUserSettings(newSettings) {
        if (this.currentUser) {
            this.currentUser.settings = { ...this.currentUser.settings, ...newSettings };
            
            // Update session storage
            const session = JSON.parse(localStorage.getItem('currentSession'));
            session.user.settings = this.currentUser.settings;
            localStorage.setItem('currentSession', JSON.stringify(session));
            
            // Update users database
            const users = Utils.loadFromLocalStorage('users', []);
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].settings = this.currentUser.settings;
                Utils.saveToLocalStorage('users', users);
            }
        }
    }

    // Method to refresh session timestamp (keep user logged in during activity)
    refreshSession() {
        const session = localStorage.getItem('currentSession');
        if (session) {
            const sessionData = JSON.parse(session);
            sessionData.timestamp = new Date().getTime();
            localStorage.setItem('currentSession', JSON.stringify(sessionData));
        }
    }

    // Method to check if user has specific permissions (for future use)
    hasPermission(permission) {
        if (!this.currentUser) return false;
        
        // For now, all authenticated users have all permissions
        // This can be extended for role-based access control
        return true;
    }

    // Method to get user's preferred currency
    getCurrency() {
        return this.getUserSettings().currency || 'BDT';
    }

    // Method to get user's notification preferences
    getNotificationSettings() {
        return this.getUserSettings().notifications || {
            budgetLimit: true,
            monthlyReport: true,
            recurring: true
        };
    }
}

// Global logout function
function logout() {
    if (window.authChecker) {
        window.authChecker.logout();
    }
}

// Initialize auth checker when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authChecker = new AuthChecker();
    
    // Set up periodic session refresh (every 5 minutes)
    setInterval(() => {
        if (window.authChecker.currentUser) {
            window.authChecker.refreshSession();
        }
    }, 5 * 60 * 1000);
    
    // Refresh session on user activity
    let activityTimer;
    const resetActivityTimer = () => {
        clearTimeout(activityTimer);
        activityTimer = setTimeout(() => {
            if (window.authChecker.currentUser) {
                window.authChecker.refreshSession();
            }
        }, 1000);
    };
    
    // Listen for user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetActivityTimer, true);
    });
});

// Export for other modules
window.AuthChecker = AuthChecker;