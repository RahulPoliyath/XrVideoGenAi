// TextVideo AI Pro - Main JavaScript Application
class TextVideoApp {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.setupFormValidation();
        this.initializeCharacterCounter();
    }

    initializeElements() {
        // Form elements
        this.textInput = document.getElementById('textInput');
        this.categorySelect = document.getElementById('categorySelect');
        this.lengthSelect = document.getElementById('lengthSelect');
        this.styleSelect = document.getElementById('styleSelect');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.generateBtn = document.getElementById('generateBtn');
        this.charCount = document.getElementById('charCount');

        // Modal elements
        this.videoModal = document.getElementById('videoModal');
        this.processingModal = document.getElementById('processingModal');
        this.closeModalBtn = document.getElementById('closeModal');
        this.progressFill = document.getElementById('progressFill');
        this.processingText = document.getElementById('processingText');

        // Modal content elements
        this.modalStyle = document.getElementById('modalStyle');
        this.modalLength = document.getElementById('modalLength');
        this.modalVoice = document.getElementById('modalVoice');
        this.modalCategory = document.getElementById('modalCategory');

        // Navigation elements
        this.startGeneratingBtn = document.getElementById('startGeneratingBtn');

        // Processing states
        this.isGenerating = false;
        this.processingSteps = [
            'Analyzing your text...',
            'Selecting visual elements...',
            'Generating AI voiceover...',
            'Assembling video components...',
            'Applying style and effects...',
            'Finalizing your video...'
        ];
    }

    bindEvents() {
        // Generate button
        this.generateBtn.addEventListener('click', (e) => this.handleGenerate(e));

        // Start generating button in hero
        this.startGeneratingBtn.addEventListener('click', () => {
            document.getElementById('generator').scrollIntoView({ behavior: 'smooth' });
        });

        // Modal events
        this.closeModalBtn.addEventListener('click', () => this.hideModal(this.videoModal));
        
        // Close modal when clicking overlay
        this.videoModal.addEventListener('click', (e) => {
            if (e.target === this.videoModal || e.target.classList.contains('modal__overlay')) {
                this.hideModal(this.videoModal);
            }
        });

        this.processingModal.addEventListener('click', (e) => {
            if (e.target === this.processingModal || e.target.classList.contains('modal__overlay')) {
                // Don't allow closing processing modal by clicking outside
                return;
            }
        });

        // Navigation smooth scrolling
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const target = document.getElementById(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Example video play buttons
        document.querySelectorAll('.play-button').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.showVideoPreview();
            });
        });

        // Form input events for validation
        [this.textInput, this.categorySelect, this.lengthSelect, this.styleSelect, this.voiceSelect].forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });

        // Regenerate button
        document.addEventListener('click', (e) => {
            if (e.target.textContent === 'Regenerate') {
                this.hideModal(this.videoModal);
                this.handleGenerate(e);
            }
        });

        // Download button
        document.addEventListener('click', (e) => {
            if (e.target.textContent === 'Download MP4') {
                this.handleDownload();
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal(this.videoModal);
            }
        });
    }

    initializeCharacterCounter() {
        this.textInput.addEventListener('input', () => {
            const count = this.textInput.value.length;
            this.charCount.textContent = count;
            
            // Change color based on character count
            if (count > 1800) {
                this.charCount.style.color = 'var(--color-warning)';
            } else if (count > 1950) {
                this.charCount.style.color = 'var(--color-error)';
            } else {
                this.charCount.style.color = 'var(--color-text-secondary)';
            }
        });
    }

    setupFormValidation() {
        this.validationRules = {
            textInput: {
                required: true,
                minLength: 10,
                maxLength: 2000,
                message: 'Please enter a text description (10-2000 characters)'
            },
            categorySelect: {
                required: true,
                message: 'Please select a category'
            },
            lengthSelect: {
                required: true,
                message: 'Please select video length'
            },
            styleSelect: {
                required: true,
                message: 'Please select a video style'
            },
            voiceSelect: {
                required: true,
                message: 'Please select a voice'
            }
        };
    }

    validateField(field) {
        const rules = this.validationRules[field.id];
        if (!rules) return true;

        const value = field.value.trim();
        let isValid = true;
        let message = '';

        // Required validation
        if (rules.required && !value) {
            isValid = false;
            message = rules.message;
        }

        // Length validation for text input
        if (field.id === 'textInput' && value) {
            if (value.length < rules.minLength || value.length > rules.maxLength) {
                isValid = false;
                message = rules.message;
            }
        }

        if (!isValid) {
            this.showFieldError(field, message);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.classList.add('error');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        field.classList.remove('error');
        const errorMessage = field.parentNode.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    }

    validateForm() {
        const fields = [this.textInput, this.categorySelect, this.lengthSelect, this.styleSelect, this.voiceSelect];
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        return isValid;
    }

    async handleGenerate(e) {
        e.preventDefault();

        if (this.isGenerating) return;

        // Validate form
        if (!this.validateForm()) {
            // Scroll to first error
            const firstError = document.querySelector('.form-control.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstError.focus();
            }
            return;
        }

        this.isGenerating = true;
        this.generateBtn.classList.add('loading');
        this.generateBtn.disabled = true;

        // Show processing modal
        this.showProcessingModal();

        try {
            await this.simulateVideoGeneration();
            this.showVideoResult();
        } catch (error) {
            console.error('Video generation failed:', error);
            this.showError('Failed to generate video. Please try again.');
        } finally {
            this.isGenerating = false;
            this.generateBtn.classList.remove('loading');
            this.generateBtn.disabled = false;
        }
    }

    async simulateVideoGeneration() {
        const totalSteps = this.processingSteps.length;
        const stepDuration = 2000; // 2 seconds per step

        for (let i = 0; i < totalSteps; i++) {
            const progress = ((i + 1) / totalSteps) * 100;
            
            // Update progress bar
            this.progressFill.style.width = `${progress}%`;
            
            // Update processing text
            this.processingText.textContent = this.processingSteps[i];
            
            // Wait for step duration
            await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
    }

    showProcessingModal() {
        this.processingModal.classList.remove('hidden');
        this.progressFill.style.width = '0%';
        this.processingText.textContent = this.processingSteps[0];
        document.body.style.overflow = 'hidden';
    }

    hideProcessingModal() {
        this.processingModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    showVideoResult() {
        this.hideProcessingModal();
        
        // Populate modal with user selections
        this.modalCategory.textContent = this.categorySelect.value || 'General';
        this.modalLength.textContent = this.lengthSelect.value || '30 seconds';
        this.modalStyle.textContent = this.styleSelect.value || 'Modern';
        this.modalVoice.textContent = this.voiceSelect.value || 'Sarah (Female, US)';
        
        this.showModal(this.videoModal);
    }

    showModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }

    hideModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }

    showVideoPreview() {
        // Simulate showing a video preview with sample data
        this.modalCategory.textContent = 'Technology';
        this.modalLength.textContent = '45 seconds';
        this.modalStyle.textContent = 'Cinematic';
        this.modalVoice.textContent = 'James (Male, UK)';
        
        this.showModal(this.videoModal);
    }

    handleDownload() {
        // Simulate download process
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,Sample Video File - Generated by TextVideo AI Pro';
        link.download = 'textvideo-ai-generated.mp4';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Show success message
        this.showNotification('Video download started!', 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification__close">&times;</button>
        `;
        
        // Add styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: 'var(--space-12) var(--space-16)',
            borderRadius: 'var(--radius-base)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: '1001',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-12)',
            maxWidth: '300px',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)'
        });

        // Type-specific styling
        switch (type) {
            case 'success':
                notification.style.backgroundColor = `rgba(var(--color-success-rgb), 0.9)`;
                notification.style.color = 'var(--color-btn-primary-text)';
                break;
            case 'error':
                notification.style.backgroundColor = `rgba(var(--color-error-rgb), 0.9)`;
                notification.style.color = 'var(--color-btn-primary-text)';
                break;
            default:
                notification.style.backgroundColor = 'var(--color-surface)';
                notification.style.color = 'var(--color-text)';
                notification.style.border = '1px solid var(--color-border)';
        }

        // Close button styling
        const closeBtn = notification.querySelector('.notification__close');
        Object.assign(closeBtn.style, {
            background: 'none',
            border: 'none',
            fontSize: 'var(--font-size-lg)',
            cursor: 'pointer',
            padding: '0',
            color: 'inherit',
            opacity: '0.7'
        });

        closeBtn.addEventListener('click', () => {
            notification.remove();
        });

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    showError(message) {
        this.hideProcessingModal();
        this.showNotification(message, 'error');
    }

    // Utility method to scroll to element
    scrollToElement(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Reset form
    resetForm() {
        this.textInput.value = '';
        this.categorySelect.value = '';
        this.lengthSelect.value = '';
        this.styleSelect.value = '';
        this.voiceSelect.value = '';
        this.charCount.textContent = '0';
        
        // Clear any validation errors
        [this.textInput, this.categorySelect, this.lengthSelect, this.styleSelect, this.voiceSelect].forEach(field => {
            this.clearFieldError(field);
        });
    }
}

// Additional utility functions
function debounce(func, wait) {
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

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('TextVideo AI Pro - Application Starting...');
    
    // Initialize main application
    const app = new TextVideoApp();
    
    // Make app globally accessible for debugging
    window.TextVideoApp = app;
    
    console.log('TextVideo AI Pro - Application Ready!');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden - pausing any ongoing processes');
    } else {
        console.log('Page visible - resuming processes');
    }
});

// Service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Note: Service worker would need to be implemented separately
        console.log('Service Worker support detected');
    });
}

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Application is online');
});

window.addEventListener('offline', () => {
    console.log('Application is offline');
});

// Export for module systems if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextVideoApp };
}
