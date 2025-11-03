// Dashboard Controller
class Dashboard {
    static currentTab = 'activity';
    
    // Initialize dashboard
    static init() {
        this.checkAuth();
        this.setupEventListeners();
        this.loadDashboardData();
        this.setDefaultDates();
    }
    
    // Check authentication
    static checkAuth() {
        if (!Auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        
        // Update user info
        const user = Auth.getCurrentUser();
        if (user && document.getElementById('userName')) {
            document.getElementById('userName').textContent = user.name;
        }
    }
    
    // Setup event listeners
    static setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e));
        });
        
        // Form submissions
        const activityForm = document.getElementById('activityForm');
        const expenseForm = document.getElementById('expenseForm');
        const petrolForm = document.getElementById('petrolForm');
        const quotationForm = document.getElementById('quotationForm');
        
        if (activityForm) activityForm.addEventListener('submit', (e) => this.handleActivitySubmit(e));
        if (expenseForm) expenseForm.addEventListener('submit', (e) => this.handleExpenseSubmit(e));
        if (petrolForm) petrolForm.addEventListener('submit', (e) => this.handlePetrolSubmit(e));
        if (quotationForm) quotationForm.addEventListener('submit', (e) => this.handleQuotationSubmit(e));
        
        // Real-time updates
        setInterval(() => this.updateStats(), 30000); // Update every 30 seconds
    }
    
    // Switch tabs
    static switchTab(e) {
        const tabName = e.currentTarget.getAttribute('data-tab');
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        this.currentTab = tabName;
        
        // Load tab-specific data
        this.loadTabData(tabName);
    }
    
    // Open specific tab
    static openTab(tabName) {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
        if (tabBtn) {
            tabBtn.click();
        }
    }
    
    // Load dashboard data
    static loadDashboardData() {
        this.updateStats();
        this.loadTabData(this.currentTab);
    }
    
    // Load tab-specific data
    static loadTabData(tabName) {
        switch (tabName) {
            case 'activity':
                ActivityTracker.loadActivities();
                break;
            case 'expense':
                ExpenseManager.loadExpenses();
                break;
            case 'petrol':
                PetrolTracker.loadPetrolExpenses();
                break;
            case 'quotation':
                QuotationManager.loadQuotations();
                break;
            case 'reports':
                Reports.loadReportData();
                break;
        }
    }
    
    // Update dashboard statistics
    static updateStats() {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        // Today's activities
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        const todayActivities = activities.filter(a => a.date === today);
        document.getElementById('todayActivities').textContent = todayActivities.length;
        
        // Monthly expenses
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        const monthlyExpenses = expenses
            .filter(e => {
                const expenseDate = new Date(e.date);
                return expenseDate.getMonth() === currentMonth && 
                       expenseDate.getFullYear() === currentYear;
            })
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
        document.getElementById('monthlyExpenses').textContent = monthlyExpenses.toFixed(2);
        
        // Petrol expenses
        const petrolExpenses = JSON.parse(localStorage.getItem('petrolExpenses') || '[]');
        const monthlyPetrol = petrolExpenses
            .filter(p => {
                const petrolDate = new Date(p.date);
                return petrolDate.getMonth() === currentMonth && 
                       petrolDate.getFullYear() === currentYear;
            })
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        document.getElementById('petrolExpenses').textContent = monthlyPetrol.toFixed(2);
        
        // Total quotations
        const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
        document.getElementById('totalQuotations').textContent = quotations.length;
    }
    
    // Set default dates to today
    static setDefaultDates() {
        const today = new Date().toISOString().split('T')[0];
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                input.value = today;
            }
        });
    }
    
    // Handle activity form submission
    static async handleActivitySubmit(e) {
        e.preventDefault();
        await ActivityTracker.logActivity(new FormData(e.target));
        e.target.reset();
        this.setDefaultDates();
        this.updateStats();
    }
    
    // Handle expense form submission
    static async handleExpenseSubmit(e) {
        e.preventDefault();
        await ExpenseManager.addExpense(new FormData(e.target));
        e.target.reset();
        this.setDefaultDates();
        this.updateStats();
    }
    
    // Handle petrol form submission
    static async handlePetrolSubmit(e) {
        e.preventDefault();
        await PetrolTracker.logPetrolExpense(new FormData(e.target));
        e.target.reset();
        this.setDefaultDates();
        this.updateStats();
    }
    
    // Handle quotation form submission
    static async handleQuotationSubmit(e) {
        e.preventDefault();
        await QuotationManager.createQuotation(new FormData(e.target));
        e.target.reset();
        this.updateStats();
    }
    
    // Export dashboard data
    static exportData() {
        Reports.exportData();
    }
    
    // Show notification
    static showNotification(message, type = 'success') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Dashboard.init();
});
