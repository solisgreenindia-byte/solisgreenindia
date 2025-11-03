// Petrol Expense Tracking System
class PetrolTracker {
    static async logPetrolExpense(formData) {
        try {
            const petrolExpense = {
                id: 'PET' + Date.now(),
                employeeId: Auth.getCurrentUser().id,
                date: formData.get('petrolDate') || new Date().toISOString().split('T')[0],
                vehicleNumber: formData.get('vehicleNumber') || '',
                amount: parseFloat(formData.get('petrolAmount') || 0),
                distance: formData.get('distance') ? parseFloat(formData.get('distance')) : null,
                purpose: formData.get('purpose') || '',
                status: 'logged',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            // Validate petrol expense
            const validation = this.validatePetrolExpense(petrolExpense);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // Calculate fuel efficiency if distance is provided
            if (petrolExpense.distance) {
                petrolExpense.fuelEfficiency = this.calculateFuelEfficiency(petrolExpense.amount, petrolExpense.distance);
            }
            
            // Save petrol expense
            const petrolExpenses = JSON.parse(localStorage.getItem('petrolExpenses') || '[]');
            petrolExpenses.push(petrolExpense);
            localStorage.setItem('petrolExpenses', JSON.stringify(petrolExpenses));
            
            // Show success message
            Dashboard.showNotification('Petrol expense logged successfully!', 'success');
            
            // Reload petrol expenses list
            this.loadPetrolExpenses();
            
            return petrolExpense;
            
        } catch (error) {
            Dashboard.showNotification('Error logging petrol expense: ' + error.message, 'error');
            throw error;
        }
    }
    
    static validatePetrolExpense(petrolExpense) {
        const errors = [];
        
        if (!petrolExpense.amount || petrolExpense.amount <= 0) errors.push('Valid amount is required');
        if (!petrolExpense.date) errors.push('Date is required');
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    static calculateFuelEfficiency(amount, distance) {
        // Assuming average fuel price of ₹100 per liter for calculation
        const fuelPrice = 100;
        const fuelLiters = amount / fuelPrice;
        return distance / fuelLiters;
    }
    
    static loadPetrolExpenses() {
        const petrolExpenses = JSON.parse(localStorage.getItem('petrolExpenses') || '[]');
        const userPetrolExpenses = petrolExpenses.filter(p => p.employeeId === Auth.getCurrentUser().id);
        const recentPetrolExpenses = userPetrolExpenses.slice(-10).reverse();
        
        this.displayPetrolExpenses(recentPetrolExpenses);
    }
    
    static displayPetrolExpenses(petrolExpenses) {
        const container = document.getElementById('petrolList');
        if (!container) return;
        
        if (petrolExpenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-gas-pump"></i>
                    <p>No petrol expenses recorded</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = petrolExpenses.map(expense => `
            <div class="petrol-item">
                <div class="item-header">
                    <div class="item-info">
                        <div class="item-title">
                            ${expense.purpose || 'Petrol Expense'}
                            ${expense.vehicleNumber ? ` - ${expense.vehicleNumber}` : ''}
                        </div>
                        <div class="item-meta">
                            <span class="item-date">${Utils.formatDate(expense.date)}</span>
                            ${expense.distance ? `<span class="item-distance">${expense.distance} km</span>` : ''}
                            ${expense.fuelEfficiency ? `<span class="item-efficiency">${expense.fuelEfficiency.toFixed(1)} km/L</span>` : ''}
                        </div>
                    </div>
                    <div class="item-amount">${Utils.formatCurrency(expense.amount)}</div>
                </div>
                <div class="item-actions">
                    <button class="btn-sm btn-edit" onclick="PetrolTracker.editPetrolExpense('${expense.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-sm btn-delete" onclick="PetrolTracker.deletePetrolExpense('${expense.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    static editPetrolExpense(expenseId) {
        const petrolExpenses = JSON.parse(localStorage.getItem('petrolExpenses') || '[]');
        const expense = petrolExpenses.find(p => p.id === expenseId);
        
        if (expense) {
            // Populate form with petrol expense data
            document.getElementById('petrolDate').value = expense.date;
            document.getElementById('vehicleNumber').value = expense.vehicleNumber || '';
            document.getElementById('petrolAmount').value = expense.amount;
            document.getElementById('distance').value = expense.distance || '';
            document.getElementById('purpose').value = expense.purpose || '';
            
            // Change form submit to update
            const form = document.getElementById('petrolForm');
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.updatePetrolExpense(expenseId, new FormData(e.target));
                form.onsubmit = (e) => Dashboard.handlePetrolSubmit(e);
            };
            
            Dashboard.showNotification('Edit petrol expense details', 'info');
        }
    }
    
    static async updatePetrolExpense(expenseId, formData) {
        try {
            const petrolExpenses = JSON.parse(localStorage.getItem('petrolExpenses') || '[]');
            const index = petrolExpenses.findIndex(p => p.id === expenseId);
            
            if (index !== -1) {
                const updatedExpense = {
                    ...petrolExpenses[index],
                    date: formData.get('petrolDate'),
                    vehicleNumber: formData.get('vehicleNumber'),
                    amount: parseFloat(formData.get('petrolAmount') || 0),
                    distance: formData.get('distance') ? parseFloat(formData.get('distance')) : null,
                    purpose: formData.get('purpose'),
                    updatedAt: new Date().toISOString()
                };
                
                // Recalculate fuel efficiency
                if (updatedExpense.distance) {
                    updatedExpense.fuelEfficiency = this.calculateFuelEfficiency(
                        updatedExpense.amount, 
                        updatedExpense.distance
                    );
                }
                
                petrolExpenses[index] = updatedExpense;
                localStorage.setItem('petrolExpenses', JSON.stringify(petrolExpenses));
                
                Dashboard.showNotification('Petrol expense updated successfully!', 'success');
                this.loadPetrolExpenses();
                
                // Reset form handler
                const form = document.getElementById('petrolForm');
                form.onsubmit = (e) => Dashboard.handlePetrolSubmit(e);
                form.reset();
                Dashboard.setDefaultDates();
            }
        } catch (error) {
            Dashboard.showNotification('Error updating petrol expense: ' + error.message, 'error');
        }
    }
    
    static async deletePetrolExpense(expenseId) {
        if (!confirm('Are you sure you want to delete this petrol expense?')) {
            return;
        }
        
        try {
            const petrolExpenses = JSON.parse(localStorage.getItem('petrolExpenses') || '[]');
            const filteredExpenses = petrolExpenses.filter(p => p.id !== expenseId);
            localStorage.setItem('petrolExpenses', JSON.stringify(filteredExpenses));
            
            Dashboard.showNotification('Petrol expense deleted successfully!', 'success');
            this.loadPetrolExpenses();
            Dashboard.updateStats();
        } catch (error) {
            Dashboard.showNotification('Error deleting petrol expense: ' + error.message, 'error');
        }
    }
    
    static getEmployeePetrolExpenses(employeeId, startDate, endDate) {
        const petrolExpenses = JSON.parse(localStorage.getItem('petrolExpenses') || '[]');
        return petrolExpenses.filter(expense => {
            if (employeeId && expense.employeeId !== employeeId) return false;
            if (startDate && expense.date < startDate) return false;
            if (endDate && expense.date > endDate) return false;
            return true;
        });
    }
    
    static getPetrolSummary(employeeId, period = 'month') {
        const expenses = this.getEmployeePetrolExpenses(employeeId);
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
        const totalDistance = filteredExpenses.reduce((sum, e) => sum + (e.distance || 0), 0);
        const vehicleStats = filteredExpenses.reduce((acc, e) => {
            const vehicle = e.vehicleNumber || 'Unknown';
            if (!acc[vehicle]) {
                acc[vehicle] = { amount: 0, distance: 0, count: 0 };
            }
            acc[vehicle].amount += e.amount;
            acc[vehicle].distance += (e.distance || 0);
            acc[vehicle].count += 1;
            return acc;
        }, {});
        
        return {
            totalExpenses: filteredExpenses.length,
            totalAmount: totalAmount,
            totalDistance: totalDistance,
            vehicleStats: vehicleStats
        };
    }
    
    static getFuelEfficiencyTrend(employeeId, months = 6) {
        const expenses = this.getEmployeePetrolExpenses(employeeId);
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
        
        const monthlyData = {};
        for (let i = 0; i < months; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = date.toISOString().substring(0, 7);
            monthlyData[monthKey] = { amount: 0, distance: 0, count: 0 };
        }
        
        expenses.forEach(expense => {
            const monthKey = expense.date.substring(0, 7);
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].amount += expense.amount;
                monthlyData[monthKey].distance += (expense.distance || 0);
                monthlyData[monthKey].count += 1;
            }
        });
        
        return monthlyData;
    }
}
