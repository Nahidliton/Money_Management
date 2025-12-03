// Utility Functions for Money Tracker App

// Financial Categories and Icons
const CATEGORIES = {
    income: {
        scholarship: { name: 'Scholarship', icon: '🎓' },
        allowance: { name: 'Family Allowance', icon: '👨‍👩‍👧‍👦' },
        'part-time': { name: 'Part-time Job', icon: '💼' },
        'other-income': { name: 'Other Income', icon: '💰' }
    },
    expense: {
        food: { name: 'Food & Dining', icon: '🍔' },
        transport: { name: 'Transportation', icon: '🚌' },
        books: { name: 'Books & Supplies', icon: '📚' },
        rent: { name: 'Rent & Utilities', icon: '🏠' },
        entertainment: { name: 'Entertainment', icon: '🎬' },
        clothing: { name: 'Clothing', icon: '👕' },
        health: { name: 'Healthcare', icon: '🏥' },
        other: { name: 'Others', icon: '📦' }
    }
};

// Financial Tips Database
const FINANCIAL_TIPS = [
    "Save first, spend later: Always set aside your savings goal amount as soon as you receive income.",
    "Track every expense: Small purchases add up quickly over time.",
    "Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
    "Avoid taking loans with interest rates above 10% if possible.",
    "Cook at home more often to save money on food expenses.",
    "Compare prices before making purchases, especially for textbooks.",
    "Take advantage of student discounts whenever available.",
    "Build an emergency fund covering at least 3 months of expenses.",
    "Review your spending weekly to stay on track with your budget.",
    "Consider part-time work that doesn't interfere with your studies.",
    "Use budgeting apps to automate your financial tracking.",
    "Set up automatic transfers to your savings account.",
    "Avoid impulse purchases by waiting 24 hours before buying.",
    "Buy used textbooks or rent them to save money.",
    "Use public transportation or walk when possible.",
    "Look for free entertainment options like campus events.",
    "Share streaming subscriptions with friends to split costs.",
    "Start investing small amounts early to build wealth.",
    "Keep receipts and track tax-deductible education expenses.",
    "Create specific savings goals with deadlines to stay motivated."
];

// Utility Classes
class Utils {
    // Date and Time Functions
    static formatDate(dateString, format = 'short') {
        const date = new Date(dateString);
        const options = {
            short: { month: 'short', day: 'numeric', year: 'numeric' },
            long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            relative: null // Will be handled separately
        };

        if (format === 'relative') {
            return this.getRelativeDate(date);
        }

        return date.toLocaleDateString('en-US', options[format] || options.short);
    }

    static getRelativeDate(date) {
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
        return `${Math.ceil(diffDays / 365)} years ago`;
    }

    static getCurrentMonth() {
        const now = new Date();
        return {
            year: now.getFullYear(),
            month: now.getMonth(),
            firstDay: new Date(now.getFullYear(), now.getMonth(), 1),
            lastDay: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
    }

    static getDateRange(days) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        return { start, end };
    }

    // Currency and Number Formatting
    static formatCurrency(amount, currency = 'BDT') {
        const symbols = {
            BDT: '৳',
            USD: '$',
            EUR: '€',
            GBP: '£'
        };

        const symbol = symbols[currency] || currency;
        return `${symbol}${Math.abs(amount).toLocaleString('en-US', { 
            minimumFractionDigits: 0,
            maximumFractionDigits: 2 
        })}`;
    }

    static formatNumber(number, decimals = 2) {
        return number.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    static parseAmount(amountString) {
        // Remove currency symbols and parse
        const cleaned = amountString.replace(/[৳$€£,]/g, '');
        return parseFloat(cleaned) || 0;
    }

    // Category Functions
    static getCategoryInfo(categoryKey) {
        // Search in both income and expense categories
        for (const type in CATEGORIES) {
            if (CATEGORIES[type][categoryKey]) {
                return {
                    ...CATEGORIES[type][categoryKey],
                    type
                };
            }
        }
        return { name: 'Unknown', icon: '❓', type: 'unknown' };
    }

    static getCategoryIcon(categoryKey) {
        const info = this.getCategoryInfo(categoryKey);
        return info.icon;
    }

    static getCategoryName(categoryKey) {
        const info = this.getCategoryInfo(categoryKey);
        return info.name;
    }

    static getAllCategories(type = null) {
        if (type) {
            return CATEGORIES[type] || {};
        }
        return CATEGORIES;
    }

    // Transaction Functions
    static filterTransactionsByDateRange(transactions, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= start && transactionDate <= end;
        });
    }

    static filterTransactionsByMonth(transactions, year, month) {
        return transactions.filter(transaction => {
            const date = new Date(transaction.date);
            return date.getFullYear() === year && date.getMonth() === month;
        });
    }

    static getCurrentMonthTransactions(transactions) {
        const { year, month } = this.getCurrentMonth();
        return this.filterTransactionsByMonth(transactions, year, month);
    }

    static groupTransactionsByCategory(transactions) {
        const grouped = {};
        
        transactions.forEach(transaction => {
            const category = transaction.category;
            if (!grouped[category]) {
                grouped[category] = {
                    transactions: [],
                    total: 0,
                    count: 0
                };
            }
            
            grouped[category].transactions.push(transaction);
            grouped[category].total += transaction.amount;
            grouped[category].count++;
        });
        
        return grouped;
    }

    static calculateTotalsByType(transactions) {
        const totals = {
            income: 0,
            expense: 0,
            net: 0
        };
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totals.income += transaction.amount;
            } else if (transaction.type === 'expense') {
                totals.expense += transaction.amount;
            }
        });
        
        totals.net = totals.income - totals.expense;
        return totals;
    }

    // Storage Functions
    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    static loadFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }

    static clearLocalStorage(keys = []) {
        if (keys.length === 0) {
            localStorage.clear();
        } else {
            keys.forEach(key => localStorage.removeItem(key));
        }
    }

    // Validation Functions
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validateStudentId(studentId) {
        // Basic validation - adjust based on your institution's format
        return studentId && studentId.length >= 3;
    }

    static validatePassword(password) {
        const errors = [];
        
        if (password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }
        
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        
        return {
            isValid: errors.length === 0,
            errors,
            strength: this.calculatePasswordStrength(password)
        };
    }

    static calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score < 3) return 'weak';
        if (score < 5) return 'medium';
        return 'strong';
    }

    static validateTransactionData(data) {
        const errors = [];
        
        if (!data.amount || data.amount <= 0) {
            errors.push('Amount must be greater than 0');
        }
        
        if (!data.description || data.description.trim().length === 0) {
            errors.push('Description is required');
        }
        
        if (!data.category) {
            errors.push('Category is required');
        }
        
        if (!data.date) {
            errors.push('Date is required');
        }
        
        if (!['income', 'expense'].includes(data.type)) {
            errors.push('Type must be either income or expense');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // UI Helper Functions
    static showNotification(message, type = 'info', duration = 3000) {
        // Remove existing notification
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Random utility functions
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    static getDailyTip() {
        const today = new Date().getDate();
        const tipIndex = today % FINANCIAL_TIPS.length;
        return FINANCIAL_TIPS[tipIndex];
    }

    static calculateSavingsRate(income, expenses) {
        if (income <= 0) return 0;
        return ((income - expenses) / income) * 100;
    }

    static getFinancialStatus(income, expenses, budgetGoals = {}) {
        if (income === 0) {
            return {
                status: 'getting-started',
                message: 'Add your first income and expense transactions to see your financial status.',
                color: 'caution'
            };
        }

        const expenseRatio = expenses / income;
        const savingsRate = this.calculateSavingsRate(income, expenses);

        if (expenses > income) {
            return {
                status: 'overspending',
                message: 'Your expenses exceed your income this month. Review your spending and consider budget adjustments.',
                color: 'alert'
            };
        }

        if (expenseRatio > 0.8) {
            return {
                status: 'high-spending',
                message: "You're spending a high percentage of your income. Try to increase your savings rate.",
                color: 'caution'
            };
        }

        return {
            status: 'balanced',
            message: "Great job! Your spending is under control and you're saving consistently.",
            color: 'balanced'
        };
    }

    static formatPercentage(value, decimals = 1) {
        return `${value.toFixed(decimals)}%`;
    }

    static isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }

    static getLastNMonths(n) {
        const months = [];
        const now = new Date();
        
        for (let i = n - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                year: date.getFullYear(),
                month: date.getMonth(),
                name: date.toLocaleString('en-US', { month: 'short' }),
                fullName: date.toLocaleString('en-US', { month: 'long', year: 'numeric' })
            });
        }
        
        return months;
    }

    static createChartColors(count) {
        const colors = [
            '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
            '#8b5cf6', '#f97316', '#84cc16', '#ec4899', '#6366f1'
        ];
        
        const result = [];
        for (let i = 0; i < count; i++) {
            result.push(colors[i % colors.length]);
        }
        
        return result;
    }

    static sortTransactionsByDate(transactions, ascending = false) {
        return [...transactions].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return ascending ? dateA - dateB : dateB - dateA;
        });
    }

    static searchTransactions(transactions, searchTerm) {
        const term = searchTerm.toLowerCase();
        return transactions.filter(transaction => 
            transaction.description.toLowerCase().includes(term) ||
            transaction.category.toLowerCase().includes(term) ||
            this.getCategoryName(transaction.category).toLowerCase().includes(term) ||
            transaction.notes?.toLowerCase().includes(term)
        );
    }

    static getBudgetProgress(spent, budgeted) {
        if (budgeted <= 0) return 0;
        return Math.min((spent / budgeted) * 100, 100);
    }

    static getBudgetStatus(spent, budgeted) {
        const progress = this.getBudgetProgress(spent, budgeted);
        
        if (progress >= 100) return 'over-budget';
        if (progress >= 90) return 'near-limit';
        if (progress >= 75) return 'warning';
        return 'on-track';
    }

    static formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return this.formatDate(date);
    }

    // Animation helpers
    static animateValue(element, start, end, duration = 1000, suffix = '') {
        const range = end - start;
        const minTimer = 50;
        let stepTime = Math.abs(Math.floor(duration / range));
        
        stepTime = Math.max(stepTime, minTimer);
        
        const startTime = new Date().getTime();
        const endTime = startTime + duration;
        
        function run() {
            const now = new Date().getTime();
            const remaining = Math.max((endTime - now) / duration, 0);
            const value = Math.round(end - (remaining * range));
            
            element.textContent = value + suffix;
            
            if (value !== end) {
                requestAnimationFrame(run);
            }
        }
        
        run();
    }

    static slideIn(element, direction = 'left', duration = 300) {
        const directions = {
            left: 'translateX(-100%)',
            right: 'translateX(100%)',
            up: 'translateY(-100%)',
            down: 'translateY(100%)'
        };
        
        element.style.transform = directions[direction];
        element.style.opacity = '0';
        element.style.transition = `all ${duration}ms ease-out`;
        
        setTimeout(() => {
            element.style.transform = 'translate(0)';
            element.style.opacity = '1';
        }, 10);
    }

    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease-in-out`;
        
        setTimeout(() => {
            element.style.opacity = '1';
        }, 10);
    }

    // Device detection
    static isMobile() {
        return window.innerWidth <= 768;
    }

    static isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    static isDesktop() {
        return window.innerWidth > 1024;
    }

    // Color utilities
    static getRandomColor() {
        const colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    static hexToRgba(hex, alpha = 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Performance helpers
    static measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }

    static lazy(fn, delay = 100) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }
}

// Global utility functions for backward compatibility
window.formatCurrency = Utils.formatCurrency.bind(Utils);
window.formatDate = Utils.formatDate.bind(Utils);
window.getCategoryIcon = Utils.getCategoryIcon.bind(Utils);
window.getCategoryName = Utils.getCategoryName.bind(Utils);
window.showNotification = Utils.showNotification.bind(Utils);
window.openModal = Utils.openModal.bind(Utils);
window.closeModal = Utils.closeModal.bind(Utils);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

// Make Utils available globally
window.Utils = Utils;

// Initialize utilities when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape key closes modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                openModal.classList.remove('show');
                document.body.style.overflow = '';
            }
        }
    });

    // Add click outside to close modals
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    // Performance monitoring
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.duration > 100) {
                    console.warn(`Slow operation: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                }
            });
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation'] });
    }
});

// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Hide notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    static showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '<div class="spinner"></div>';
        }
    }

    static hideLoading(elementId, content = '') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = content;
        }
    }

    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Export/Import Functions
    static exportToCSV(data, filename = 'data.csv') {
        const csvContent = this.convertToCSV(data);
        this.downloadFile(csvContent, filename, 'text/csv');
    }

    static exportToJSON(data, filename = 'data.json') {
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, filename, 'application/json');
    }

    static convertToCSV(data) {
        if (!Array.isArray(data) || data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvHeaders = headers.join(',');
        
        const csvRows = data.map(row => 
            headers.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes if contains comma
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        );
        
        return [csvHeaders, ...csvRows].join('\n');
    }

    static downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body