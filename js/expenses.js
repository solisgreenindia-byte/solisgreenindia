// Expense Management System
class ExpenseManager {
    static async addExpense(formData) {
        try {
            const expense = {
                id: 'EXP' + Date.now(),
                employeeId: Auth.getCurrentUser().id,
                date: formData.get('expenseDate') || new Date().toISOString().split('T')[0],
                category: formData.get('expenseCategory'),
                description: formData.get('expenseDescription'),
                amount: parseFloat(formData.get('expenseAmount') || 0),
                receipt: formData.get('expenseReceipt') ? await this.handleFileUpload(formData.get('expenseReceipt')) : null,
                status: 'pending',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            // Validate expense
            const validation = this.validateExpense(expense);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // Save expense
            const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
            expenses.push(expense);
            localStorage.setItem('expenses', JSON.stringify(expenses));
            
            // Show success message
            Dashboard.showNotification('Expense added successfully!', 'success');
            
            // Reload expenses list
            this.loadExpenses();
            
            return expense;
            
        } catch (error) {
            Dashboard.showNotification('Error adding expense: ' + error.message, 'error');
            throw error;
        }
    }
    
    static validateExpense(expense) {
        const errors = [];
        
        if (!expense.category) errors.push('Category is required');
        if (!expense.description) errors.push('Description is required');
        if (!expense.amount || expense.amount <= 0) errors.push('Valid amount is required');
        if (!expense.date) errors.push('Date is required');
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    static async handleFileUpload(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve(null);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const receipt = {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result,
                    uploadedAt: new Date().toISOString()
                };
                resolve(receipt);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }
    
    static loadExpenses() {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        const userExpenses = expenses.filter(e => e.employeeId === Auth.getCurrentUser().id);
        const recentExpenses = userExpenses.slice(-10).reverse();
        
        this.displayExpenses(recentExpenses);
    }
    
    static displayExpenses(expenses) {
        const container = document.getElementById('expensesList');
        if (!container) return;
        
        if (expenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No expenses recorded</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = expenses.map(expense => `
            <div class="expense-item">
                <div class="item-header">
                    <div class="item-info">
                        <div class="item-title">${expense.description}</div>
                        <div class="item-meta">
                            <span class="item-category">${this.getCategoryLabel(expense.category)}</span>
                            <span class="item-date">${Utils.formatDate(expense.date)}</span>
                            <span class="item-status ${expense.status}">${expense.status}</span>
                        </div>
                    </div>
                    <div class="item-amount">${Utils.formatCurrency(expense.amount)}</div>
                </div>
                ${expense.receipt ? `
                    <div class="item-receipt">
                        <a href="${expense.receipt.data}" download="${expense.receipt.name}" class="receipt-link">
                            <i class="fas fa-paperclip"></i> ${expense.receipt.name}
                        </a>
                    </div>
                ` : ''}
                <div class="item-actions">
                    <button class="btn-sm btn-edit" onclick="ExpenseManager.editExpense('${expense.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-sm btn-delete" onclick="ExpenseManager.deleteExpense('${expense.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    static getCategoryLabel(category) {
        const categories = {
            'travel': 'Travel',
            'food': 'Food',
            'accommodation': 'Accommodation',
            'materials': 'Materials',
            'other': 'Other'
        };
        return categories[category] || category;
    }
    
    static editExpense(expenseId) {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        const expense = expenses.find(e => e.id === expenseId);
        
        if (expense) {
            // Populate form with expense data
            document.getElementById('expenseDate').value = expense.date;
            document.getElementById('expenseCategory').value = expense.category;
            document.getElementById('expenseDescription').value = expense.description;
            document.getElementById('expenseAmount').value = expense.amount;
            
            // Change form submit to update
            const form = document.getElementById('expenseForm');
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.updateExpense(expenseId, new FormData(e.target));
                form.onsubmit = (e) => Dashboard.handleExpenseSubmit(e);
            };
            
            Dashboard.showNotification('Edit expense details', 'info');
        }
    }
    
    static async updateExpense(expenseId, formData) {
        try {
            const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
            const index = expenses.findIndex(e => e.id === expenseId);
            
            if (index !== -1) {
                expenses[index] = {
                    ...expenses[index],
                    date: formData.get('expenseDate'),
                    category: formData.get('expenseCategory'),
                    description: formData.get('expenseDescription'),
                    amount: parseFloat(formData.get('expenseAmount') || 0),
                    updatedAt: new Date().toISOString()
                };
                
                localStorage.setItem('expenses', JSON.stringify(expenses));
                Dashboard.showNotification('Expense updated successfully!', 'success');
                this.loadExpenses();
                
                // Reset form handler
                const form = document.getElementById('expenseForm');
                form.onsubmit = (e) => Dashboard.handleExpenseSubmit(e);
                form.reset();
                Dashboard.setDefaultDates();
            }
        } catch (error) {
            Dashboard.showNotification('Error updating expense: ' + error.message, 'error');
        }
    }
    
    static async deleteExpense(expenseId) {
        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }
        
        try {
            const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
            const filteredExpenses = expenses.filter(e => e.id !== expenseId);
            localStorage.setItem('expenses', JSON.stringify(filteredExpenses));
            
            Dashboard.showNotification('Expense deleted successfully!', 'success');
            this.loadExpenses();
            Dashboard.updateStats();
        } catch (error) {
            Dashboard.showNotification('Error deleting expense: ' + error.message, 'error');
        }
    }
    
    static getEmployeeExpenses(employeeId, startDate, endDate) {
        const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
        return expenses.filter(expense => {
            if (employeeId && expense.employeeId !== employeeId) return false;
            if (startDate && expense.date < startDate) return false;
            if (endDate && expense.date > endDate) return false;
            return true;
        });
    }
    
    static getExpenseSummary(employeeId, period = 'month') {
        const expenses = this.getEmployeeExpenses(employeeId);
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                break;
            default:
                startDate = null;
        }
        
        const filteredExpenses = startDate ? 
            expenses.filter(e => e.date >= startDate) : expenses;
        
        const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const byCategory = filteredExpenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});
        
        return {
            totalExpenses: filteredExpenses.length,
            totalAmount: totalAmount,
            byCategory: byCategory
        };
    }
    
    static getTopExpenses(employeeId, limit = 5) {
        const expenses = this.getEmployeeExpenses(employeeId);
        return expenses
            .sort((a, b) => b.amount - a.amount)
            .slice(0, limit);
    }
}
