// Main Website JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mainNav = document.getElementById('mainNav');
    
    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('show');
            this.innerHTML = mainNav.classList.contains('show') ? 
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });
    }

    // Floating CTA
    const ctaMainBtn = document.getElementById('ctaMainBtn');
    const ctaOptions = document.querySelector('.cta-options');
    
    if (ctaMainBtn && ctaOptions) {
        ctaMainBtn.addEventListener('click', function() {
            ctaOptions.classList.toggle('show');
        });
        
        // Close CTA when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.floating-cta')) {
                ctaOptions.classList.remove('show');
            }
        });
    }

    // Quick Quote Modal
    const quickFormBtn = document.getElementById('quickFormBtn');
    const quickQuoteModal = document.getElementById('quickQuoteModal');
    const closeModal = document.querySelector('.close-modal');
    
    if (quickFormBtn && quickQuoteModal) {
        quickFormBtn.addEventListener('click', function(e) {
            e.preventDefault();
            quickQuoteModal.classList.add('show');
        });
        
        if (closeModal) {
            closeModal.addEventListener('click', function() {
                quickQuoteModal.classList.remove('show');
            });
        }
        
        // Close modal when clicking outside
        quickQuoteModal.addEventListener('click', function(e) {
            if (e.target === quickQuoteModal) {
                quickQuoteModal.classList.remove('show');
            }
        });
    }

    // Form Submissions
    const quickQuoteForm = document.querySelector('.quick-quote-form');
    const inquiryForm = document.querySelector('.inquiry-form');
    
    if (quickQuoteForm) {
        quickQuoteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Add your form submission logic here
            alert('Thank you! We will contact you shortly with your solar quote.');
            this.reset();
            quickQuoteModal.classList.remove('show');
        });
    }
    
    if (inquiryForm) {
        inquiryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Add your form submission logic here
            alert('Thank you for your inquiry! We will contact you soon.');
            this.reset();
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Header scroll effect
    let lastScrollTop = 0;
    const header = document.querySelector('header');
    
    if (header) {
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.backdropFilter = 'blur(10px)';
            } else {
                header.style.background = '#fff';
                header.style.backdropFilter = 'none';
            }
            
            lastScrollTop = scrollTop;
        });
    }

    // Add loading animation to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            if (this.type === 'submit' || this.getAttribute('type') === 'submit') {
                const originalText = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                this.disabled = true;
                
                // Reset button after 3 seconds (for demo)
                setTimeout(() => {
                    this.innerHTML = originalText;
                    this.disabled = false;
                }, 3000);
            }
        });
    });

    // Service card animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe service cards and project cards
    document.querySelectorAll('.service-card, .project-card, .feature-item').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Current year for copyright
    const yearElement = document.querySelector('.copyright p');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.innerHTML = yearElement.innerHTML.replace('2024', currentYear);
    }

    // Add hover effects to cards
    document.querySelectorAll('.service-card, .project-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // Phone number formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 10) {
                value = value.slice(0, 10);
            }
            
            if (value.length >= 6) {
                value = value.replace(/(\d{5})(\d{5})/, '$1 $2');
            } else if (value.length >= 3) {
                value = value.replace(/(\d{3})(\d{0,5})/, '$1 $2');
            }
            
            e.target.value = value.trim();
        });
    });

    // Lazy loading for images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // Add toast notifications
    window.showToast = function(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    };

    // Add toast styles
    const toastStyles = document.createElement('style');
    toastStyles.textContent = `
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            transform: translateX(400px);
            transition: transform 0.3s ease;
            z-index: 10000;
            border-left: 4px solid #28a745;
        }
        
        .toast-error {
            border-left-color: #dc3545;
        }
        
        .toast.show {
            transform: translateX(0);
        }
        
        .toast-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .toast i {
            color: #28a745;
        }
        
        .toast-error i {
            color: #dc3545;
        }
    `;
    document.head.appendChild(toastStyles);
});

// Utility functions
const Utils = {
    // Format currency
    formatCurrency: (amount) => {
        return '₹' + parseFloat(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },
    
    // Format date
    formatDate: (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    },
    
    // Validate email
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Validate phone
    validatePhone: (phone) => {
        const re = /^[6-9]\d{9}$/;
        return re.test(phone.replace(/\D/g, ''));
    },
    
    // Debounce function
    debounce: (func, wait) => {
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
};
