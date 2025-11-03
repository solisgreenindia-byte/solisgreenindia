// Activity Tracking System
class ActivityTracker {
    static async logActivity(formData) {
        try {
            const activity = {
                id: 'ACT' + Date.now(),
                employeeId: Auth.getCurrentUser().id,
                date: formData.get('activityDate') || new Date().toISOString().split('T')[0],
                type: formData.get('activityType'),
                description: formData.get('activityDescription'),
                hours: parseFloat(formData.get('activityHours') || 0),
                location: formData.get('activityLocation') || '',
                status: 'completed',
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            
            // Validate activity
            const validation = this.validateActivity(activity);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // Save activity
            const activities = JSON.parse(localStorage.getItem('activities') || '[]');
            activities.push(activity);
            localStorage.setItem('activities', JSON.stringify(activities));
            
            // Show success message
            Dashboard.showNotification('Activity logged successfully!', 'success');
            
            // Reload activities list
            this.loadActivities();
            
            return activity;
            
        } catch (error) {
            Dashboard.showNotification('Error logging activity: ' + error.message, 'error');
            throw error;
        }
    }
    
    static validateActivity(activity) {
        const errors = [];
        
        if (!activity.type) errors.push('Activity type is required');
        if (!activity.description) errors.push('Description is required');
        if (!activity.hours || activity.hours <= 0) errors.push('Valid hours are required');
        if (!activity.date) errors.push('Date is required');
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    static loadActivities() {
        const today = new Date().toISOString().split('T')[0];
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        const userActivities = activities.filter(a => a.employeeId === Auth.getCurrentUser().id);
        const todayActivities = userActivities.filter(a => a.date === today);
        
        this.displayActivities(todayActivities.reverse());
    }
    
    static displayActivities(activities) {
        const container = document.getElementById('activitiesList');
        if (!container) return;
        
        if (activities.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No activities logged today</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="item-header">
                    <div class="item-info">
                        <div class="item-title">${activity.description}</div>
                        <div class="item-meta">
                            <span class="item-type">${this.getActivityTypeLabel(activity.type)}</span>
                            <span class="item-hours">${activity.hours} hours</span>
                            ${activity.location ? `<span class="item-location">${activity.location}</span>` : ''}
                        </div>
                    </div>
                    <div class="item-amount">${activity.hours}h</div>
                </div>
                <div class="item-actions">
                    <button class="btn-sm btn-edit" onclick="ActivityTracker.editActivity('${activity.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-sm btn-delete" onclick="ActivityTracker.deleteActivity('${activity.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    static getActivityTypeLabel(type) {
        const types = {
            'site_visit': 'Site Visit',
            'installation': 'Installation',
            'maintenance': 'Maintenance',
            'meeting': 'Client Meeting',
            'office': 'Office Work',
            'travel': 'Travel'
        };
        return types[type] || type;
    }
    
    static editActivity(activityId) {
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        const activity = activities.find(a => a.id === activityId);
        
        if (activity) {
            // Populate form with activity data
            document.getElementById('activityDate').value = activity.date;
            document.getElementById('activityType').value = activity.type;
            document.getElementById('activityDescription').value = activity.description;
            document.getElementById('activityHours').value = activity.hours;
            document.getElementById('activityLocation').value = activity.location || '';
            
            // Change form submit to update
            const form = document.getElementById('activityForm');
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.updateActivity(activityId, new FormData(e.target));
                form.onsubmit = (e) => Dashboard.handleActivitySubmit(e);
            };
            
            Dashboard.showNotification('Edit activity details', 'info');
        }
    }
    
    static async updateActivity(activityId, formData) {
        try {
            const activities = JSON.parse(localStorage.getItem('activities') || '[]');
            const index = activities.findIndex(a => a.id === activityId);
            
            if (index !== -1) {
                activities[index] = {
                    ...activities[index],
                    date: formData.get('activityDate'),
                    type: formData.get('activityType'),
                    description: formData.get('activityDescription'),
                    hours: parseFloat(formData.get('activityHours') || 0),
                    location: formData.get('activityLocation') || '',
                    updatedAt: new Date().toISOString()
                };
                
                localStorage.setItem('activities', JSON.stringify(activities));
                Dashboard.showNotification('Activity updated successfully!', 'success');
                this.loadActivities();
                
                // Reset form handler
                const form = document.getElementById('activityForm');
                form.onsubmit = (e) => Dashboard.handleActivitySubmit(e);
                form.reset();
                Dashboard.setDefaultDates();
            }
        } catch (error) {
            Dashboard.showNotification('Error updating activity: ' + error.message, 'error');
        }
    }
    
    static async deleteActivity(activityId) {
        if (!confirm('Are you sure you want to delete this activity?')) {
            return;
        }
        
        try {
            const activities = JSON.parse(localStorage.getItem('activities') || '[]');
            const filteredActivities = activities.filter(a => a.id !== activityId);
            localStorage.setItem('activities', JSON.stringify(filteredActivities));
            
            Dashboard.showNotification('Activity deleted successfully!', 'success');
            this.loadActivities();
            Dashboard.updateStats();
        } catch (error) {
            Dashboard.showNotification('Error deleting activity: ' + error.message, 'error');
        }
    }
    
    static getEmployeeActivities(employeeId, startDate, endDate) {
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        return activities.filter(activity => {
            if (employeeId && activity.employeeId !== employeeId) return false;
            if (startDate && activity.date < startDate) return false;
            if (endDate && activity.date > endDate) return false;
            return true;
        });
    }
    
    static getActivitySummary(employeeId, period = 'month') {
        const activities = this.getEmployeeActivities(employeeId);
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
        
        const filteredActivities = startDate ? 
            activities.filter(a => a.date >= startDate) : activities;
        
        const totalHours = filteredActivities.reduce((sum, a) => sum + a.hours, 0);
        const byType = filteredActivities.reduce((acc, a) => {
            acc[a.type] = (acc[a.type] || 0) + a.hours;
            return acc;
        }, {});
        
        return {
            totalActivities: filteredActivities.length,
            totalHours: totalHours,
            byType: byType
        };
    }
}
