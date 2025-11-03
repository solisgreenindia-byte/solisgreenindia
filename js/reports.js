// Reporting System
class Reports {
    static async generateReport() {
        try {
            const month = document.getElementById('reportMonth').value;
            const reportType = document.getElementById('reportType').value;
            
            if (!month) {
                Dashboard.showNotification('Please select a month', 'error');
                return;
            }
            
            const [year, monthNum] = month.split('-');
            const startDate = `${year}-${monthNum}-01`;
            const endDate = `${year}-${monthNum}-${new Date(year, monthNum, 0).getDate()}`;
            
            const user = Auth.getCurrentUser();
            let reportData;
            
            switch (reportType) {
                case 'summary':
                    reportData = await this.generateSummaryReport(user.id, startDate, endDate);
                    break;
                case 'detailed':
                    reportData = await this.generateDetailedReport(user.id, startDate, endDate);
                    break;
                case 'expenses':
                    reportData = await this.generateExpenseReport(user.id, startDate, endDate);
                    break;
                case 'activities':
                    reportData = await this.generateActivityReport(user.id, startDate, endDate);
                    break;
                default:
                    reportData = await this.generateSummaryReport(user.id, startDate, endDate);
            }
            
            this.displayReport(reportData, reportType, month);
            
        } catch (error) {
            Dashboard.showNotification('Error generating report: ' + error.message, 'error');
        }
    }
    
    static async generateSummaryReport(employeeId, startDate, endDate) {
        const activities = ActivityTracker.getEmployeeActivities(employeeId, startDate, endDate);
        const expenses = ExpenseManager.getEmployeeExpenses(employeeId, startDate, endDate);
        const petrolExpenses = PetrolTracker.getEmployeePetrolExpenses(employeeId, startDate, endDate);
        const quotations = QuotationManager.getEmployeeQuotations(employeeId, startDate, endDate);
        
        // Calculate totals
        const totalActivities = activities.length;
        const totalActivityHours = activities.reduce((sum, a) => sum + a.hours, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalPetrol = petrolExpenses.reduce((sum, p) => sum + p.amount, 0);
        const totalQuotations = quotations.length;
        const totalQuotationValue = quotations.reduce((sum, q) => sum + q.amount, 0);
        
        // Activity by type
        const activitiesByType = activities.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + 1;
            return acc;
        }, {});
        
        // Expenses by category
        const expensesByCategory = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});
        
        // Quotations by status
        const quotationsByStatus = quotations.reduce((acc, q) => {
            acc[q.status] = (acc[q.status] || 0) + 1;
            return acc;
        }, {});
        
        return {
            period: { startDate, endDate },
            summary: {
                totalActivities,
                totalActivityHours,
                totalExpenses,
                totalPetrol,
                totalQuotations,
                totalQuotationValue
            },
            breakdown: {
                activitiesByType,
                expensesByCategory,
                quotationsByStatus
            },
            activities,
            expenses,
            petrolExpenses,
            quotations
        };
    }
    
    static async generateDetailedReport(employeeId, startDate, endDate) {
        const summaryReport = await this.generateSummaryReport(employeeId, startDate, endDate);
        
        // Add daily breakdown
        const dailyData = {};
        const currentDate = new Date(startDate);
        const end = new Date(endDate);
        
        while (currentDate <= end) {
            const dateStr = currentDate.toISOString().split('T')[0];
            dailyData[dateStr] = {
                activities: 0,
                activityHours: 0,
                expenses: 0,
                petrol: 0,
                quotations: 0
            };
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Populate daily data
        summaryReport.activities.forEach(activity => {
            if (dailyData[activity.date]) {
                dailyData[activity.date].activities++;
                dailyData[activity.date].activityHours += activity.hours;
            }
        });
        
        summaryReport.expenses.forEach(expense => {
            if (dailyData[expense.date]) {
                dailyData[expense.date].expenses += expense.amount;
            }
        });
        
        summaryReport.petrolExpenses.forEach(petrol => {
            if (dailyData[petrol.date]) {
                dailyData[petrol.date].petrol += petrol.amount;
            }
        });
        
        summaryReport.quotations.forEach(quotation => {
            if (dailyData[quotation.date]) {
                dailyData[quotation.date].quotations++;
            }
        });
        
        return {
            ...summaryReport,
            dailyData
        };
    }
    
    static async generateExpenseReport(employeeId, startDate, endDate) {
        const expenses = ExpenseManager.getEmployeeExpenses(employeeId, startDate, endDate);
        const petrolExpenses = PetrolTracker.getEmployeePetrolExpenses(employeeId, startDate, endDate);
        
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const totalPetrol = petrolExpenses.reduce((sum, p) => sum + p.amount, 0);
        const grandTotal = totalExpenses + totalPetrol;
        
        // Expenses by category
        const expensesByCategory = expenses.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});
        
        // Daily expense trend
        const dailyExpenses = {};
        expenses.forEach(expense => {
            if (!dailyExpenses[expense.date]) {
                dailyExpenses[expense.date] = 0;
            }
            dailyExpenses[expense.date] += expense.amount;
        });
        
        return {
            period: { startDate, endDate },
            totals: {
                regularExpenses: totalExpenses,
                petrolExpenses: totalPetrol,
                grandTotal
            },
            breakdown: {
                expensesByCategory,
                dailyExpenses
            },
            expenses,
            petrolExpenses
        };
    }
    
    static async generateActivityReport(employeeId, startDate, endDate) {
        const activities = ActivityTracker.getEmployeeActivities(employeeId, startDate, endDate);
        
        const totalActivities = activities.length;
        const totalHours = activities.reduce((sum, a) => sum + a.hours, 0);
        const avgHoursPerActivity = totalHours / totalActivities;
        
        // Activities by type
        const activitiesByType = activities.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + 1;
            return acc;
        }, {});
        
        // Hours by type
        const hoursByType = activities.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + a.hours;
            return acc;
        }, {});
        
        // Daily activity trend
        const dailyActivities = {};
        activities.forEach(activity => {
            if (!dailyActivities[activity.date]) {
                dailyActivities[activity.date] = { count: 0, hours: 0 };
            }
            dailyActivities[activity.date].count++;
            dailyActivities[activity.date].hours += activity.hours;
        });
        
        return {
            period: { startDate, endDate },
            summary: {
                totalActivities,
                totalHours,
                avgHoursPerActivity
            },
            breakdown: {
                activitiesByType,
                hoursByType,
                dailyActivities
            },
            activities
        };
    }
    
    static displayReport(reportData, reportType, month) {
        const container = document.getElementById('reportSummary');
        if (!container) return;
        
        let html = '';
        
        switch (reportType) {
            case 'summary':
                html = this.renderSummaryReport(reportData, month);
                break;
            case 'detailed':
                html = this.renderDetailedReport(reportData, month);
                break;
            case 'expenses':
                html = this.renderExpenseReport(reportData, month);
                break;
            case 'activities':
                html = this.renderActivityReport(reportData, month);
                break;
        }
        
        container.innerHTML = html;
    }
    
    static renderSummaryReport(report, month) {
        const { summary, breakdown } = report;
        
        return `
            <div class="report-header">
                <h3>Monthly Summary Report - ${month}</h3>
                <p>Period: ${Utils.formatDate(report.period.startDate)} to ${Utils.formatDate(report.period.endDate)}</p>
            </div>
            
            <div class="report-stats">
                <div class="report-stat">
                    <span class="value">${summary.totalActivities}</span>
                    <span class="label">Activities</span>
                </div>
                <div class="report-stat">
                    <span class="value">${summary.totalActivityHours}h</span>
                    <span class="label">Total Hours</span>
                </div>
                <div class="report-stat">
                    <span class="value">${Utils.formatCurrency(summary.totalExpenses)}</span>
                    <span class="label">Expenses</span>
                </div>
                <div class="report-stat">
                    <span class="value">${Utils.formatCurrency(summary.totalPetrol)}</span>
                    <span class="label">Petrol</span>
                </div>
                <div class="report-stat">
                    <span class="value">${summary.totalQuotations}</span>
                    <span class="label">Quotations</span>
                </div>
                <div class="report-stat">
                    <span class="value">${Utils.formatCurrency(summary.totalQuotationValue)}</span>
                    <span class="label">Quotation Value</span>
                </div>
            </div>
            
            <div class="report-sections">
                <div class="report-section">
                    <h4>Activities by Type</h4>
                    ${Object.entries(breakdown.activitiesByType).map(([type, count]) => `
                        <div class="breakdown-item">
                            <span>${ActivityTracker.getActivityTypeLabel(type)}</span>
                            <span>${count}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="report-section">
                    <h4>Expenses by Category</h4>
                    ${Object.entries(breakdown.expensesByCategory).map(([category, amount]) => `
                        <div class="breakdown-item">
                            <span>${ExpenseManager.getCategoryLabel(category)}</span>
                            <span>${Utils.formatCurrency(amount)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="report-section">
                    <h4>Quotations by Status</h4>
                    ${Object.entries(breakdown.quotationsByStatus).map(([status, count]) => `
                        <div class="breakdown-item">
                            <span>${QuotationManager.getStatusLabel(status)}</span>
                            <span>${count}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    static renderExpenseReport(report, month) {
        const { totals, breakdown } = report;
        
        return `
            <div class="report-header">
                <h3>Expense Report - ${month}</h3>
                <p>Total Expenses: ${Utils.formatCurrency(totals.grandTotal)}</p>
            </div>
            
            <div class="report-stats">
                <div class="report-stat">
                    <span class="value">${Utils.formatCurrency(totals.regularExpenses)}</span>
                    <span class="label">Regular Expenses</span>
                </div>
                <div class="report-stat">
                    <span class="value">${Utils.formatCurrency(totals.petrolExpenses)}</span>
                    <span class="label">Petrol Expenses</span>
                </div>
                <div class="report-stat">
                    <span class="value">${Utils.formatCurrency(totals.grandTotal)}</span>
                    <span class="label">Grand Total</span>
                </div>
            </div>
            
            <div class="report-section">
                <h4>Expense Breakdown by Category</h4>
                ${Object.entries(breakdown.expensesByCategory).map(([category, amount]) => `
                    <div class="breakdown-item">
                        <span>${ExpenseManager.getCategoryLabel(category)}</span>
                        <span>${Utils.formatCurrency(amount)}</span>
                        <span>${((amount / totals.regularExpenses) * 100).toFixed(1)}%</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="report-section">
                <h4>Top 5 Expenses</h4>
                ${report.expenses
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 5)
                    .map(expense => `
                        <div class="breakdown-item">
                            <span>${expense.description}</span>
                            <span>${Utils.formatCurrency(expense.amount)}</span>
                            <span>${Utils.formatDate(expense.date)}</span>
                        </div>
                    `).join('')}
            </div>
        `;
    }
    
    static async exportData() {
        try {
            const data = {
                activities: JSON.parse(localStorage.getItem('activities') || '[]'),
                expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
                petrolExpenses: JSON.parse(localStorage.getItem('petrolExpenses') || '[]'),
                quotations: JSON.parse(localStorage.getItem('quotations') || '[]'),
                employees: JSON.parse(localStorage.getItem('employees') || '[]'),
                exportDate: new Date().toISOString(),
                exportedBy: Auth.getCurrentUser().name
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `solis-green-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            Dashboard.showNotification('Data exported successfully!', 'success');
            
        } catch (error) {
            Dashboard.showNotification('Error exporting data: ' + error.message, 'error');
        }
    }
    
    static loadReportData() {
        // Set current month as default
        const now = new Date();
        const currentMonth = now.toISOString().substring(0, 7);
        document.getElementById('reportMonth').value = currentMonth;
    }
}

// Add CSS for reports
const reportStyles = document.createElement('style');
reportStyles.textContent = `
    .report-header {
        background: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
    }
    
    .report-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin-bottom: 30px;
    }
    
    .report-stat {
        background: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .report-stat .value {
        display: block;
        font-size: 1.8rem;
        font-weight: bold;
        color: #28a745;
        margin-bottom: 5px;
    }
    
    .report-stat .label {
        color: #666;
        font-size: 0.9rem;
    }
    
    .report-sections {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
    }
    
    .report-section {
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    
    .report-section h4 {
        margin-bottom: 15px;
        color: #2c3e50;
        border-bottom: 2px solid #28a745;
        padding-bottom: 8px;
    }
    
    .breakdown-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
    }
    
    .breakdown-item:last-child {
        border-bottom: none;
    }
    
    .status-created { color: #ffc107; }
    .status-sent { color: #17a2b8; }
    .status-approved { color: #28a745; }
    .status-rejected { color: #dc3545; }
    .status-converted { color: #007bff; }
`;

document.head.appendChild(reportStyles);
