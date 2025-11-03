// Authentication System
class Auth {
    static currentUser = null;
    
    // Initialize authentication system
    static init() {
        this.checkAuthState();
        this.setupEventListeners();
    }
    
    // Check if user is authenticated
    static checkAuthState() {
        const userData = localStorage.getItem('currentUser');
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        
        if (isLoggedIn === 'true' && userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUI();
        } else if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
    }
    
    // Setup event listeners for login form
    static setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }
    
    // Handle login form submission
    static async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        submitBtn.disabled = true;
        
        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const user = await this.authenticate(username, password);
            
            if (user) {
                this.currentUser = user;
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Show success message
                this.showMessage('Login successful! Redirecting...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }
    
    // Authenticate user
    static async authenticate(username, password) {
        // Get employees from localStorage or use default
        const employees = JSON.parse(localStorage.getItem('employees') || '[]');
        
        // Add default admin user if no employees exist
        if (employees.length === 0) {
            const defaultEmployees = [
                {
                    id: 'EMP001',
                    username: 'admin',
                    password: 'admin123',
                    name: 'Administrator',
                    email: 'admin@solisgreen.com',
                    role: 'admin',
                    phone: '+918301849474',
                    joinDate: '2024-01-01',
                    department: 'Management'
                },
                {
                    id: 'EMP002',
                    username: 'john',
                    password: 'john123',
                    name: 'John Mathew',
                    email: 'john@solisgreen.com',
                    role: 'field_engineer',
                    phone: '+919876543210',
                    joinDate: '2024-01-15',
                    department: 'Technical'
                }
            ];
            
            localStorage.setItem('employees', JSON.stringify(defaultEmployees));
            employees.push(...defaultEmployees);
        }
        
        // Find user
        const user = employees.find(emp => 
            emp.username === username && emp.password === password
        );
        
        if (!user) {
            throw new Error('Invalid employee ID or password');
        }
        
        // Don't return password in user object
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    
    // Logout user
    static logout() {
        this.currentUser = null;
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        
        this.showMessage('Logged out successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
    
    // Check if user is logged in
    static isAuthenticated() {
        return localStorage.getItem('isLoggedIn') === 'true';
    }
    
    // Get current user
    static getCurrentUser() {
        if (!this.currentUser) {
            const userData = localStorage.getItem('currentUser');
            this.currentUser = userData ? JSON.parse(userData) : null;
        }
        return this.currentUser;
    }
    
    // Update UI based on auth state
    static updateUI() {
        const user = this.getCurrentUser();
        if (user && document.getElementById('userName')) {
            document.getElementById('userName').textContent = user.name;
        }
    }
    
    // Show message
    static showMessage(message, type = 'info') {
        // Use existing toast system or create one
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    }
    
    // Password strength checker
    static checkPasswordStrength(password) {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;
        const mediumRegex = /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})/;
        
        if (strongRegex.test(password)) {
            return 'strong';
        } else if (mediumRegex.test(password)) {
            return 'medium';
        } else {
            return 'weak';
        }
    }
    
    // Generate employee ID
    static generateEmployeeId() {
        const employees = JSON.parse(localStorage.getItem('employees') || '[]');
        const lastId = employees.length > 0 ? 
            parseInt(employees[employees.length - 1].id.replace('EMP', '')) : 0;
        return `EMP${String(lastId + 1).padStart(3, '0')}`;
    }
}

// Initialize auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    Auth.init();
});
