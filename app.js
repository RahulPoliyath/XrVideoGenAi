// VidGen AI Application JavaScript

class VidGenApp {
    constructor() {
        this.currentPage = 'home';
        this.isGenerating = false;
        this.progressInterval = null;
        this.currentStage = 1;
        this.progress = 0;
        
        // Application data
        this.progressStages = [
            {id: 1, name: "Analyzing Text", description: "Processing your script and extracting key elements", duration: 15},
            {id: 2, name: "Generating Audio", description: "Converting text to speech with selected voice", duration: 25}, 
            {id: 3, name: "Creating Slideshow", description: "Building visual elements and transitions", duration: 35},
            {id: 4, name: "Finalizing Video", description: "Rendering final video and optimizing quality", duration: 25}
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.setupTheme();
        this.setupCharacterCounter();
        this.setupFAQ();
        this.loadPage('home');
    }
    
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const page = e.target.getAttribute('data-page');
                this.loadPage(page);
            });
        });
        
        // Video generation form
        const videoForm = document.getElementById('videoForm');
        if (videoForm) {
            videoForm.addEventListener('submit', (e) => this.handleVideoGeneration(e));
        }
        
        // Cancel generation
        const cancelBtn = document.getElementById('cancelGeneration');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelGeneration());
        }
        
        // New video button
        const newVideoBtn = document.querySelector('.new-video-btn');
        if (newVideoBtn) {
            newVideoBtn.addEventListener('click', () => this.resetForm());
        }
        
        // Download button
        const downloadBtn = document.querySelector('.download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadVideo());
        }
        
        // Share button
        const shareBtn = document.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareVideo());
        }
        
        // Example video play buttons
        const playButtons = document.querySelectorAll('.play-button');
        playButtons.forEach(button => {
            button.addEventListener('click', (e) => this.playExampleVideo(e));
        });
    }
    
    setupTheme() {
        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('vidgen-theme') || 'light';
        this.setTheme(savedTheme);
    }
    
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-color-scheme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
    
    setTheme(theme) {
        document.documentElement.setAttribute('data-color-scheme', theme);
        localStorage.setItem('vidgen-theme', theme);
        
        // Update theme toggle icons
        const sunIcon = document.querySelector('.sun-icon');
        const moonIcon = document.querySelector('.moon-icon');
        
        if (theme === 'dark') {
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    }
    
    loadPage(pageId) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });
        
        // Update pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            this.currentPage = pageId;
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    setupCharacterCounter() {
        const scriptText = document.getElementById('scriptText');
        const charCount = document.getElementById('charCount');
        
        if (scriptText && charCount) {
            scriptText.addEventListener('input', () => {
                const count = scriptText.value.length;
                charCount.textContent = count;
                
                // Update color based on character count
                if (count > 450) {
                    charCount.style.color = 'var(--color-warning)';
                } else if (count > 400) {
                    charCount.style.color = 'var(--color-info)';
                } else {
                    charCount.style.color = 'var(--color-text-secondary)';
                }
            });
        }
    }
    
    setupFAQ() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.closest('.faq-item');
                const isActive = faqItem.classList.contains('active');
                
                // Close all FAQ items
                document.querySelectorAll('.faq-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Open clicked item if it wasn't active
                if (!isActive) {
                    faqItem.classList.add('active');
                }
            });
        });
    }
    
    handleVideoGeneration(e) {
        e.preventDefault();
        
        if (this.isGenerating) {
            return;
        }
        
        // Validate form
        const scriptText = document.getElementById('scriptText').value.trim();
        if (!scriptText) {
            this.showError('Please enter your script text');
            return;
        }
        
        if (scriptText.length < 10) {
            this.showError('Script must be at least 10 characters long');
            return;
        }
        
        this.startVideoGeneration();
    }
    
    startVideoGeneration() {
        this.isGenerating = true;
        this.progress = 0;
        this.currentStage = 1;
        
        // Hide form and show progress
        this.showSection('progressSection');
        
        // Reset progress UI
        this.updateProgressUI();
        
        // Start progress simulation
        this.simulateProgress();
    }
    
    simulateProgress() {
        const totalDuration = this.progressStages.reduce((sum, stage) => sum + stage.duration, 0);
        let elapsed = 0;
        
        this.progressInterval = setInterval(() => {
            elapsed += 0.5; // Update every 500ms
            this.progress = Math.min((elapsed / totalDuration) * 100, 100);
            
            // Update current stage based on progress
            let stageProgress = 0;
            for (let i = 0; i < this.progressStages.length; i++) {
                const stage = this.progressStages[i];
                stageProgress += stage.duration;
                if (elapsed <= stageProgress) {
                    if (this.currentStage !== stage.id) {
                        this.currentStage = stage.id;
                        this.updateStageUI();
                    }
                    break;
                }
            }
            
            this.updateProgressUI();
            
            // Complete generation
            if (this.progress >= 100) {
                this.completeGeneration();
            }
        }, 500);
    }
    
    updateProgressUI() {
        const progressFill = document.querySelector('.progress-fill');
        const progressPercent = document.getElementById('progressPercent');
        const progressStage = document.getElementById('progressStage');
        const timeRemaining = document.getElementById('timeRemaining');
        
        if (progressFill) {
            progressFill.style.width = `${this.progress}%`;
        }
        
        if (progressPercent) {
            progressPercent.textContent = `${Math.round(this.progress)}%`;
        }
        
        if (progressStage && this.currentStage <= this.progressStages.length) {
            const stage = this.progressStages[this.currentStage - 1];
            progressStage.textContent = stage.name;
        }
        
        if (timeRemaining) {
            const remainingSeconds = Math.max(0, Math.round((100 - this.progress) * 3));
            const minutes = Math.floor(remainingSeconds / 60);
            const seconds = remainingSeconds % 60;
            
            if (minutes > 0) {
                timeRemaining.textContent = `${minutes}m ${seconds}s remaining`;
            } else {
                timeRemaining.textContent = `${seconds}s remaining`;
            }
        }
    }
    
    updateStageUI() {
        // Update stage indicators
        document.querySelectorAll('.stage').forEach((stageEl, index) => {
            const stageId = index + 1;
            stageEl.classList.remove('active', 'completed');
            
            if (stageId < this.currentStage) {
                stageEl.classList.add('completed');
            } else if (stageId === this.currentStage) {
                stageEl.classList.add('active');
            }
        });
    }
    
    completeGeneration() {
        clearInterval(this.progressInterval);
        this.isGenerating = false;
        
        // Update final stage
        document.querySelectorAll('.stage').forEach(stage => {
            stage.classList.remove('active');
            stage.classList.add('completed');
        });
        
        // Show success and results after a short delay
        setTimeout(() => {
            this.showResults();
        }, 1000);
    }
    
    showResults() {
        this.hideSection('progressSection');
        this.showSection('resultsSection');
        
        // Update video duration in results
        const duration = document.getElementById('duration').value;
        const videoDuration = document.getElementById('videoDuration');
        if (videoDuration) {
            videoDuration.textContent = `${duration} seconds`;
        }
        
        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
    
    cancelGeneration() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        this.isGenerating = false;
        this.hideSection('progressSection');
        
        // Scroll back to form
        document.querySelector('.generation-form').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
    
    resetForm() {
        // Hide results section
        this.hideSection('resultsSection');
        
        // Clear form
        document.getElementById('scriptText').value = '';
        document.getElementById('charCount').textContent = '0';
        document.getElementById('duration').value = '60';
        document.getElementById('voice').value = 'female_1';
        
        // Reset style selection
        const modernRadio = document.querySelector('input[name="style"][value="modern"]');
        if (modernRadio) {
            modernRadio.checked = true;
        }
        
        // Reset background music checkbox
        const backgroundMusic = document.getElementById('backgroundMusic');
        if (backgroundMusic) {
            backgroundMusic.checked = true;
        }
        
        // Scroll to form
        document.querySelector('.generation-form').scrollIntoView({ 
            behavior: 'smooth' 
        });
    }
    
    downloadVideo() {
        // Simulate download
        const link = document.createElement('a');
        link.href = '#';
        link.download = 'vidgen-ai-video.mp4';
        
        // Show download started notification
        this.showSuccess('Download started! Your video will be saved shortly.');
        
        // In a real implementation, this would trigger actual file download
        console.log('Download initiated for generated video');
    }
    
    shareVideo() {
        // Simulate share functionality
        if (navigator.share) {
            navigator.share({
                title: 'Check out my AI-generated video!',
                text: 'I created this amazing video using VidGen AI',
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: copy link to clipboard
            navigator.clipboard.writeText(window.location.href).then(() => {
                this.showSuccess('Link copied to clipboard!');
            }).catch(() => {
                this.showError('Unable to copy link');
            });
        }
    }
    
    playExampleVideo(e) {
        e.preventDefault();
        
        // In a real implementation, this would open a video modal or player
        const card = e.target.closest('.example-card');
        const title = card.querySelector('h3').textContent;
        
        this.showInfo(`Playing example: ${title}`);
        
        // Simulate video loading
        setTimeout(() => {
            console.log(`Playing example video: ${title}`);
        }, 1000);
    }
    
    showSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('hidden');
            section.classList.add('fade-in');
        }
    }
    
    hideSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('hidden');
            section.classList.remove('fade-in');
        }
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles for notification
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-base);
            padding: var(--space-16);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add notification-specific styling
        if (type === 'error') {
            notification.style.borderLeftColor = 'var(--color-error)';
            notification.style.borderLeftWidth = '4px';
        } else if (type === 'success') {
            notification.style.borderLeftColor = 'var(--color-success)';
            notification.style.borderLeftWidth = '4px';
        } else if (type === 'warning') {
            notification.style.borderLeftColor = 'var(--color-warning)';
            notification.style.borderLeftWidth = '4px';
        }
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showWarning(message) {
        this.showNotification(message, 'warning');
    }
    
    showInfo(message) {
        this.showNotification(message, 'info');
    }
}

// Additional CSS for notifications (added dynamically)
const notificationStyles = `
@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.notification-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-12);
}

.notification-message {
    flex: 1;
    font-size: var(--font-size-sm);
    line-height: var(--line-height-normal);
}

.notification-close {
    background: none;
    border: none;
    font-size: var(--font-size-lg);
    cursor: pointer;
    color: var(--color-text-secondary);
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all var(--duration-fast) var(--ease-standard);
}

.notification-close:hover {
    background: var(--color-secondary);
    color: var(--color-text);
}
`;

// Add notification styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Enhanced form validation
class FormValidator {
    static validateScript(text) {
        const errors = [];
        
        if (!text || text.trim().length === 0) {
            errors.push('Script text is required');
        } else if (text.trim().length < 10) {
            errors.push('Script must be at least 10 characters long');
        } else if (text.length > 500) {
            errors.push('Script must be less than 500 characters');
        }
        
        // Check for potentially problematic content
        const suspiciousWords = ['hack', 'virus', 'malware', 'spam'];
        const lowerText = text.toLowerCase();
        const foundSuspicious = suspiciousWords.filter(word => lowerText.includes(word));
        
        if (foundSuspicious.length > 0) {
            errors.push('Content may contain inappropriate terms');
        }
        
        return errors;
    }
    
    static validateDuration(duration) {
        const errors = [];
        const dur = parseInt(duration);
        
        if (!dur || dur < 30 || dur > 300) {
            errors.push('Duration must be between 30 and 300 seconds');
        }
        
        return errors;
    }
}

// WebSocket simulation for real-time updates
class ProgressSimulator {
    constructor(callback) {
        this.callback = callback;
        this.stages = [
            { name: 'Analyzing Text', duration: 2000, progress: 0 },
            { name: 'Generating Audio', duration: 3000, progress: 25 },
            { name: 'Creating Slideshow', duration: 4000, progress: 60 },
            { name: 'Finalizing Video', duration: 2000, progress: 90 }
        ];
        this.currentStageIndex = 0;
        this.isRunning = false;
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.currentStageIndex = 0;
        this.runStage();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    runStage() {
        if (!this.isRunning || this.currentStageIndex >= this.stages.length) {
            this.callback({ type: 'complete', progress: 100 });
            return;
        }
        
        const stage = this.stages[this.currentStageIndex];
        
        // Send stage start event
        this.callback({
            type: 'stage_start',
            stage: stage.name,
            progress: stage.progress
        });
        
        // Simulate gradual progress within stage
        const progressIncrement = (this.currentStageIndex < this.stages.length - 1 ? 
            this.stages[this.currentStageIndex + 1].progress - stage.progress :
            100 - stage.progress) / 10;
        
        let stageProgress = 0;
        const stageInterval = setInterval(() => {
            if (!this.isRunning) {
                clearInterval(stageInterval);
                return;
            }
            
            stageProgress += progressIncrement;
            const totalProgress = stage.progress + stageProgress;
            
            this.callback({
                type: 'progress',
                stage: stage.name,
                progress: Math.min(totalProgress, 100)
            });
            
            if (stageProgress >= progressIncrement * 10) {
                clearInterval(stageInterval);
                this.currentStageIndex++;
                setTimeout(() => this.runStage(), 500);
            }
        }, stage.duration / 10);
    }
}

// Performance monitoring
class PerformanceMonitor {
    static measurePageLoad() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            console.log(`Page load time: ${loadTime}ms`);
            
            // Track if load time is slow
            if (loadTime > 3000) {
                console.warn('Slow page load detected');
            }
        }
    }
    
    static measureFunction(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Measure page load performance
    PerformanceMonitor.measurePageLoad();
    
    // Initialize main application
    window.vidgenApp = new VidGenApp();
    
    console.log('VidGen AI application initialized successfully');
});

// Handle window resize for responsive updates
window.addEventListener('resize', () => {
    // Add any responsive adjustments here
    const navbar = document.querySelector('.navbar');
    if (navbar && window.innerWidth <= 768) {
        // Mobile responsive adjustments could go here
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.vidgenApp && window.vidgenApp.isGenerating) {
        // Optionally pause generation when page is hidden
        console.log('Page hidden during video generation');
    }
});

// Service Worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // In a production app, you would register a service worker here
        // navigator.serviceWorker.register('/sw.js');
    });
}
