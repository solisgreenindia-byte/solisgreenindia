// Quotation Management System
class QuotationManager {
    static async createQuotation(formData) {
        try {
            const quotation = {
                id: 'QTN' + Date.now(),
                employeeId: Auth.getCurrentUser().id,
                quotationNumber: this.generateQuotationNumber(),
                date: new Date().toISOString().split('T')[0],
                customerName: formData.get('customerName'),
                customerPhone: formData.get('customerPhone'),
                customerEmail: formData.get('customerEmail') || '',
                projectLocation: formData.get('projectLocation'),
                systemType: formData.get('systemType'),
                systemSize: parseFloat(formData.get('systemSize') || 0),
                amount: parseFloat(formData.get('quotationAmount') || 0),
                status: 'created',
                notes: '',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            // Validate quotation
            const validation = this.validateQuotation(quotation);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // Calculate additional fields
            quotation.subsidyAmount = this.calculateSubsidy(quotation.systemSize, quotation.systemType);
            quotation.netAmount = quotation.amount - quotation.subsidyAmount;
            quotation.roi = this.calculateROI(quotation.amount, quotation.systemSize);
            
            // Save quotation
            const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
            quotations.push(quotation);
            localStorage.setItem('quotations', JSON.stringify(quotations));
            
            // Show success message
            Dashboard.showNotification('Quotation created successfully!', 'success');
            
            // Reload quotations list
            this.loadQuotations();
            
            return quotation;
            
        } catch (error) {
            Dashboard.showNotification('Error creating quotation: ' + error.message, 'error');
            throw error;
        }
    }
    
    static generateQuotationNumber() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `QTN-${year}${month}${day}-${random}`;
    }
    
    static validateQuotation(quotation) {
        const errors = [];
        
        if (!quotation.customerName) errors.push('Customer name is required');
        if (!quotation.customerPhone) errors.push('Customer phone is required');
        if (!quotation.projectLocation) errors.push('Project location is required');
        if (!quotation.systemType) errors.push('System type is required');
        if (!quotation.systemSize || quotation.systemSize <= 0) errors.push('Valid system size is required');
        if (!quotation.amount || quotation.amount <= 0) errors.push('Valid amount is required');
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    static calculateSubsity(systemSize, systemType) {
        // Basic subsidy calculation (simplified)
        let subsidyPerKW = 0;
        
        switch (systemType) {
            case 'residential':
                subsidyPerKW = 20000; // ₹20,000 per kW
                break;
            case 'commercial':
                subsidyPerKW = 15000; // ₹15,000 per kW
                break;
            case 'industrial':
                subsidyPerKW = 10000; // ₹10,000 per kW
                break;
            default:
                subsidyPerKW = 0;
        }
        
        return systemSize * subsidyPerKW;
    }
    
    static calculateROI(totalAmount, systemSize) {
        // Simplified ROI calculation
        const annualSavings = systemSize * 1500 * 365; // Assuming 1500 units per kW per year
        const roiYears = totalAmount / annualSavings;
        return roiYears;
    }
    
    static loadQuotations() {
        const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
        const userQuotations = quotations.filter(q => q.employeeId === Auth.getCurrentUser().id);
        const recentQuotations = userQuotations.slice(-10).reverse();
        
        this.displayQuotations(recentQuotations);
    }
    
    static displayQuotations(quotations) {
        const container = document.getElementById('quotationsList');
        if (!container) return;
        
        if (quotations.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice"></i>
                    <p>No quotations created</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = quotations.map(quotation => `
            <div class="quotation-item">
                <div class="item-header">
                    <div class="item-info">
                        <div class="item-title">${quotation.customerName}</div>
                        <div class="item-meta">
                            <span class="quotation-number">${quotation.quotationNumber}</span>
                            <span class="system-type">${this.getSystemTypeLabel(quotation.systemType)}</span>
                            <span class="system-size">${quotation.systemSize} kW</span>
                            <span class="item-location">${quotation.projectLocation}</span>
                        </div>
                    </div>
                    <div class="item-amount">${Utils.formatCurrency(quotation.amount)}</div>
                </div>
                <div class="item-details">
                    <div class="detail-row">
                        <span class="detail-label">Phone:</span>
                        <span class="detail-value">${quotation.customerPhone}</span>
                    </div>
                    ${quotation.customerEmail ? `
                        <div class="detail-row">
                            <span class="detail-label">Email:</span>
                            <span class="detail-value">${quotation.customerEmail}</span>
                        </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Subsidy:</span>
                        <span class="detail-value">${Utils.formatCurrency(quotation.subsidyAmount || 0)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Net Amount:</span>
                        <span class="detail-value">${Utils.formatCurrency(quotation.netAmount || quotation.amount)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value status-${quotation.status}">${this.getStatusLabel(quotation.status)}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn-sm btn-edit" onclick="QuotationManager.editQuotation('${quotation.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-sm btn-view" onclick="QuotationManager.viewQuotation('${quotation.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn-sm btn-delete" onclick="QuotationManager.deleteQuotation('${quotation.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    static getSystemTypeLabel(type) {
        const types = {
            'residential': 'Residential',
            'commercial': 'Commercial',
            'industrial': 'Industrial'
        };
        return types[type] || type;
    }
    
    static getStatusLabel(status) {
        const statuses = {
            'created': 'Created',
            'sent': 'Sent',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'converted': 'Converted'
        };
        return statuses[status] || status;
    }
    
    static editQuotation(quotationId) {
        const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
        const quotation = quotations.find(q => q.id === quotationId);
        
        if (quotation) {
            // Populate form with quotation data
            document.getElementById('customerName').value = quotation.customerName;
            document.getElementById('customerPhone').value = quotation.customerPhone;
            document.getElementById('customerEmail').value = quotation.customerEmail || '';
            document.getElementById('projectLocation').value = quotation.projectLocation;
            document.getElementById('systemType').value = quotation.systemType;
            document.getElementById('systemSize').value = quotation.systemSize;
            document.getElementById('quotationAmount').value = quotation.amount;
            
            // Change form submit to update
            const form = document.getElementById('quotationForm');
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.updateQuotation(quotationId, new FormData(e.target));
                form.onsubmit = (e) => Dashboard.handleQuotationSubmit(e);
            };
            
            Dashboard.showNotification('Edit quotation details', 'info');
        }
    }
    
    static async updateQuotation(quotationId, formData) {
        try {
            const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
            const index = quotations.findIndex(q => q.id === quotationId);
            
            if (index !== -1) {
                const updatedQuotation = {
                    ...quotations[index],
                    customerName: formData.get('customerName'),
                    customerPhone: formData.get('customerPhone'),
                    customerEmail: formData.get('customerEmail'),
                    projectLocation: formData.get('projectLocation'),
                    systemType: formData.get('systemType'),
                    systemSize: parseFloat(formData.get('systemSize') || 0),
                    amount: parseFloat(formData.get('quotationAmount') || 0),
                    updatedAt: new Date().toISOString()
                };
                
                // Recalculate fields
                updatedQuotation.subsidyAmount = this.calculateSubsidy(
                    updatedQuotation.systemSize, 
                    updatedQuotation.systemType
                );
                updatedQuotation.netAmount = updatedQuotation.amount - updatedQuotation.subsidyAmount;
                updatedQuotation.roi = this.calculateROI(updatedQuotation.amount, updatedQuotation.systemSize);
                
                quotations[index] = updatedQuotation;
                localStorage.setItem('quotations', JSON.stringify(quotations));
                
                Dashboard.showNotification('Quotation updated successfully!', 'success');
                this.loadQuotations();
                
                // Reset form handler
                const form = document.getElementById('quotationForm');
                form.onsubmit = (e) => Dashboard.handleQuotationSubmit(e);
                form.reset();
            }
        } catch (error) {
            Dashboard.showNotification('Error updating quotation: ' + error.message, 'error');
        }
    }
    
    static viewQuotation(quotationId) {
        const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
        const quotation = quotations.find(q => q.id === quotationId);
        
        if (quotation) {
            // Create and show quotation preview
            const preview = this.generateQuotationPreview(quotation);
            const newWindow = window.open('', '_blank');
            newWindow.document.write(preview);
            newWindow.document.close();
        }
    }
    
    static generateQuotationPreview(quotation) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Quotation ${quotation.quotationNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .company-info { margin-bottom: 20px; }
                    .customer-info { margin-bottom: 20px; }
                    .quotation-details { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    .quotation-details th, .quotation-details td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                    .quotation-details th { background: #f5f5f5; }
                    .total-row { font-weight: bold; background: #f9f9f9; }
                    .footer { margin-top: 40px; text-align: center; color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Solis Green India</h1>
                    <h2>Quotation</h2>
                    <p>Quotation Number: ${quotation.quotationNumber}</p>
                    <p>Date: ${Utils.formatDate(quotation.date)}</p>
                </div>
                
                <div class="company-info">
                    <strong>Solis Green India</strong><br>
                    Kerala, India<br>
                    Phone: 8301849474<br>
                    Email: solisgreenindia@gmail.com
                </div>
                
                <div class="customer-info">
                    <strong>Customer Details:</strong><br>
                    ${quotation.customerName}<br>
                    Phone: ${quotation.customerPhone}<br>
                    ${quotation.customerEmail ? `Email: ${quotation.customerEmail}<br>` : ''}
                    Location: ${quotation.projectLocation}
                </div>
                
                <table class="quotation-details">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>System Size</th>
                            <th>System Type</th>
                            <th>Amount (₹)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Solar Power System Installation</td>
                            <td>${quotation.systemSize} kW</td>
                            <td>${this.getSystemTypeLabel(quotation.systemType)}</td>
                            <td>${Utils.formatCurrency(quotation.amount)}</td>
                        </tr>
                        <tr>
                            <td colspan="3">Government Subsidy</td>
                            <td>- ${Utils.formatCurrency(quotation.subsidyAmount || 0)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3">Net Amount</td>
                            <td>${Utils.formatCurrency(quotation.netAmount || quotation.amount)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Thank you for considering Solis Green India for your solar energy needs.</p>
                    <p>This quotation is valid for 30 days from the date of issue.</p>
                </div>
            </body>
            </html>
        `;
    }
    
    static async deleteQuotation(quotationId) {
        if (!confirm('Are you sure you want to delete this quotation?')) {
            return;
        }
        
        try {
            const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
            const filteredQuotations = quotations.filter(q => q.id !== quotationId);
            localStorage.setItem('quotations', JSON.stringify(filteredQuotations));
            
            Dashboard.showNotification('Quotation deleted successfully!', 'success');
            this.loadQuotations();
            Dashboard.updateStats();
        } catch (error) {
            Dashboard.showNotification('Error deleting quotation: ' + error.message, 'error');
        }
    }
    
    static getEmployeeQuotations(employeeId, startDate, endDate) {
        const quotations = JSON.parse(localStorage.getItem('quotations') || '[]');
        return quotations.filter(quotation => {
            if (employeeId && quotation.employeeId !== employeeId) return false;
            if (startDate && quotation.date < startDate) return false;
            if (endDate && quotation.date > endDate) return false;
            return true;
        });
    }
    
    static getQuotationSummary(employeeId, period = 'month') {
        const quotations = this.getEmployeeQuotations(employeeId);
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
        
        const filteredQuotations = startDate ? 
            quotations.filter(q => q.date >= startDate) : quotations;
        
        const totalAmount = filteredQuotations.reduce((sum, q) => sum + q.amount, 0);
        const byStatus = filteredQuotations.reduce((acc, q) => {
            acc[q.status] = (acc[q.status] || 0) + 1;
            return acc;
        }, {});
        
        const byType = filteredQuotations.reduce((acc, q) => {
            acc[q.systemType] = (acc[q.systemType] || 0) + 1;
            return acc;
        }, {});
        
        return {
            totalQuotations: filteredQuotations.length,
            totalAmount: totalAmount,
            byStatus: byStatus,
            byType: byType
        };
    }
}
