// VideoGen AI Application JavaScript

class VideoGenApp {
    constructor() {
        this.videoHistory = [];
        this.currentVideoId = null;
        this.processingSteps = [
            {
                step: 1,
                name: "Analyzing Text",
                description: "Processing your input and generating script segments",
                duration: 3
            },
            {
                step: 2,
                name: "Generating Audio",
                description: "Creating high-quality voice narration",
                duration: 8
            },
            {
                step: 3,
                name: "Creating Slides",
                description: "Designing visual slides with your chosen style",
                duration: 5
            },
            {
                step: 4,
                name: "Adding Effects",
                description: "Applying transitions and visual enhancements",
                duration: 4
            },
            {
                step: 5,
                name: "Rendering Video",
                description: "Compiling final video in high quality",
                duration: 10
            },
            {
                step: 6,
                name: "Finalizing",
                description: "Preparing your video for download",
                duration: 2
            }
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateCharacterCount();
        this.showSection('home');
    }

    setupEventListeners() {
        // Text input character counter
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.addEventListener('input', () => this.updateCharacterCount());
            textInput.addEventListener('blur', () => this.validateForm());
        }

        // Generate button
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateVideo());
        }

        // Download button
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadVideo());
        }

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                this.scrollToSection(target);
            });
        });

        // Hero buttons - Add direct event listeners
        const createVideoButtons = document.querySelectorAll('button[onclick="showGenerator()"]');
        createVideoButtons.forEach(button => {
            button.addEventListener('click', () => this.showSection('generator'));
        });

        const learnMoreButtons = document.querySelectorAll('button[onclick="showFeatures()"]');
        learnMoreButtons.forEach(button => {
            button.addEventListener('click', () => this.scrollToSection('features'));
        });
    }

    updateCharacterCount() {
        const textInput = document.getElementById('textInput');
        const charCount = document.getElementById('charCount');
        const counter = document.querySelector('.character-counter');
        
        if (!textInput || !charCount) return;
        
        const length = textInput.value.length;
        charCount.textContent = length;
        
        // Update counter styling based on length
        if (counter) {
            counter.classList.remove('warning', 'error');
            if (length > 800) {
                counter.classList.add('warning');
            }
            if (length >= 1000) {
                counter.classList.add('error');
            }
        }
        
        this.validateForm();
    }

    validateForm() {
        const textInput = document.getElementById('textInput');
        const generateBtn = document.getElementById('generateBtn');
        
        if (!textInput || !generateBtn) return false;
        
        const isValid = textInput.value.trim().length > 0 && textInput.value.length <= 1000;
        generateBtn.disabled = !isValid;
        
        if (!isValid && textInput.value.length > 1000) {
            this.showNotification('Text must be 1000 characters or less', 'error');
        }
        
        return isValid;
    }

    async generateVideo() {
        if (!this.validateForm()) {
            this.showNotification('Please enter valid text content', 'error');
            return;
        }

        // Get form data
        const formData = this.getFormData();
        
        // Generate unique video ID
        this.currentVideoId = 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Show progress section
        this.showSection('progress');
        
        // Start generation process
        await this.simulateVideoGeneration(formData);
    }

    getFormData() {
        return {
            text: document.getElementById('textInput')?.value || '',
            duration: parseInt(document.getElementById('duration')?.value || '30'),
            voice: document.getElementById('voice')?.value || 'female-natural',
            template: document.getElementById('template')?.value || 'modern',
            colorScheme: document.getElementById('colorScheme')?.value || 'blue-gradient',
            font: document.getElementById('font')?.value || 'roboto',
            speed: document.getElementById('speed')?.value || 'normal'
        };
    }

    async simulateVideoGeneration(formData) {
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');
        const currentStep = document.getElementById('currentStep');
        const stepDescription = document.getElementById('stepDescription');
        const timeRemaining = document.getElementById('timeRemaining');
        
        if (!progressFill || !progressPercent) return;
        
        let totalProgress = 0;
        const totalDuration = this.processingSteps.reduce((sum, step) => sum + step.duration, 0);
        
        for (let i = 0; i < this.processingSteps.length; i++) {
            const step = this.processingSteps[i];
            
            // Update step info
            if (currentStep) currentStep.textContent = step.name;
            if (stepDescription) stepDescription.textContent = step.description;
            
            // Calculate remaining time
            const remainingSteps = this.processingSteps.slice(i + 1);
            const remainingTime = remainingSteps.reduce((sum, s) => sum + s.duration, 0);
            if (timeRemaining) {
                timeRemaining.textContent = remainingTime > 0 ? `${remainingTime} seconds` : 'Almost done...';
            }
            
            // Simulate step progress
            const stepStartProgress = totalProgress;
            const stepEndProgress = totalProgress + (step.duration / totalDuration * 100);
            
            await this.animateProgress(stepStartProgress, stepEndProgress, step.duration * 1000);
            
            totalProgress = stepEndProgress;
        }
        
        // Complete generation
        progressFill.style.width = '100%';
        progressPercent.textContent = '100';
        
        // Wait a moment then show results
        setTimeout(() => {
            this.showResults(formData);
        }, 500);
    }

    async animateProgress(startPercent, endPercent, duration) {
        return new Promise(resolve => {
            const startTime = Date.now();
            const progressFill = document.getElementById('progressFill');
            const progressPercent = document.getElementById('progressPercent');
            
            if (!progressFill || !progressPercent) {
                resolve();
                return;
            }
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                const currentPercent = startPercent + (endPercent - startPercent) * progress;
                
                progressFill.style.width = currentPercent + '%';
                progressPercent.textContent = Math.round(currentPercent);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    }

    showResults(formData) {
        // Generate video metadata
        const videoData = {
            id: this.currentVideoId,
            text: formData.text,
            duration: formData.duration,
            voice: formData.voice,
            template: formData.template,
            colorScheme: formData.colorScheme,
            font: formData.font,
            speed: formData.speed,
            createdAt: new Date(),
            fileSize: this.calculateFileSize(formData.duration),
            downloadUrl: `https://api.videogen.ai/download/${this.currentVideoId}.mp4`
        };
        
        // Add to history
        this.videoHistory.unshift(videoData);
        
        // Update results display
        const videoDuration = document.getElementById('videoDuration');
        const videoSize = document.getElementById('videoSize');
        
        if (videoDuration) videoDuration.textContent = `${formData.duration}s`;
        if (videoSize) videoSize.textContent = videoData.fileSize;
        
        // Show results section
        this.showSection('results');
        
        // Update history display
        this.updateHistoryDisplay();
        
        this.showNotification('Video generated successfully!', 'success');
    }

    calculateFileSize(duration) {
        // Simulate realistic file sizes based on duration
        const baseSizeKB = 1200; // Base size for 30s video
        const sizeKB = baseSizeKB * (duration / 30);
        
        if (sizeKB < 1024) {
            return `${Math.round(sizeKB)} KB`;
        } else {
            return `${(sizeKB / 1024).toFixed(1)} MB`;
        }
    }

    updateHistoryDisplay() {
        const historyContainer = document.getElementById('historyContainer');
        if (!historyContainer) return;
        
        if (this.videoHistory.length === 0) {
            historyContainer.innerHTML = `
                <div class="empty-state">
                    <p>No videos generated yet. Create your first video above!</p>
                </div>
            `;
            return;
        }
        
        historyContainer.innerHTML = this.videoHistory.map(video => `
            <div class="history-item">
                <div class="history-preview">
                    <div class="play-button">▶</div>
                </div>
                <div class="history-info">
                    <h4>${this.truncateText(video.text, 50)}</h4>
                    <div class="history-meta">
                        ${video.duration}s • ${video.fileSize} • ${this.getVoiceName(video.voice)}
                        <br>
                        <small>${this.formatDate(video.createdAt)}</small>
                    </div>
                    <div class="history-actions">
                        <button class="btn btn--sm btn--outline" onclick="app.downloadVideoById('${video.id}')">
                            Download
                        </button>
                        <button class="btn btn--sm btn--secondary" onclick="app.shareVideoById('${video.id}')">
                            Share
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    getVoiceName(voiceId) {
        const voices = {
            'female-natural': 'Sarah',
            'male-professional': 'David',
            'female-energetic': 'Emma',
            'male-deep': 'James'
        };
        return voices[voiceId] || 'Unknown';
    }

    formatDate(date) {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    downloadVideo() {
        if (this.currentVideoId) {
            this.downloadVideoById(this.currentVideoId);
        }
    }

    downloadVideoById(videoId) {
        // Simulate download
        const video = this.videoHistory.find(v => v.id === videoId);
        if (video) {
            // Create a temporary link to simulate download
            const link = document.createElement('a');
            link.href = '#';
            link.download = `videogen_${videoId}.mp4`;
            link.style.display = 'none';
            document.body.appendChild(link);
            
            this.showNotification('Download started! (Simulated)', 'success');
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(link);
            }, 100);
        }
    }

    shareVideo(platform) {
        if (!this.currentVideoId) return;
        
        const video = this.videoHistory.find(v => v.id === this.currentVideoId);
        if (!video) return;
        
        const shareText = `Check out my AI-generated video created with VideoGen AI!`;
        const shareUrl = `https://videogen.ai/video/${this.currentVideoId}`;
        
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
        };
        
        if (shareUrls[platform]) {
            window.open(shareUrls[platform], '_blank', 'width=600,height=400');
        }
    }

    shareVideoById(videoId) {
        this.currentVideoId = videoId;
        this.shareVideo('twitter');
    }

    copyVideoLink() {
        if (!this.currentVideoId) return;
        
        const shareUrl = `https://videogen.ai/video/${this.currentVideoId}`;
        
        // Use the modern clipboard API if available
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl).then(() => {
                this.showNotification('Link copied to clipboard!', 'success');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = shareUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Link copied to clipboard!', 'success');
        }
    }

    showSection(sectionId) {
        // Hide all sections
        const sections = ['home', 'generator', 'progress', 'results'];
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.add('hidden');
            }
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
        
        // Scroll to top of section
        if (sectionId !== 'home') {
            setTimeout(() => {
                if (targetSection) {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    }

    scrollToSection(sectionId) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            font-size: var(--font-size-sm);
        `;
        
        // Set type-specific styles
        if (type === 'success') {
            notification.style.borderColor = 'var(--color-success)';
            notification.style.color = 'var(--color-success)';
        } else if (type === 'error') {
            notification.style.borderColor = 'var(--color-error)';
            notification.style.color = 'var(--color-error)';
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize app when DOM is loaded
let app;

// Global functions for HTML onclick handlers - define early
function showGenerator() {
    if (app) {
        app.showSection('generator');
    }
}

function showFeatures() {
    if (app) {
        app.scrollToSection('features');
    }
}

function shareVideo(platform) {
    if (app) {
        app.shareVideo(platform);
    }
}

function copyVideoLink() {
    if (app) {
        app.copyVideoLink();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    app = new VideoGenApp();
    
    // Add additional event listeners after app initialization
    const heroCreateButton = document.querySelector('.hero .btn--primary');
    const heroLearnButton = document.querySelector('.hero .btn--outline');
    
    if (heroCreateButton) {
        heroCreateButton.addEventListener('click', () => app.showSection('generator'));
    }
    
    if (heroLearnButton) {
        heroLearnButton.addEventListener('click', () => app.scrollToSection('features'));
    }

    // Add hover effects to cards
    const cards = document.querySelectorAll('.feature-card, .faq-item, .history-item');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add smooth scrolling for all internal links
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
    
    // Add loading states to buttons
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled) {
                this.style.opacity = '0.8';
                setTimeout(() => {
                    this.style.opacity = '1';
                }, 200);
            }
        });
    });
});

// Handle form auto-save (simulate user-friendly behavior)
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const inputs = document.querySelectorAll('#textInput, #duration, #voice, #template, #colorScheme, #font, #speed');
        
        inputs.forEach(input => {
            if (input) {
                input.addEventListener('change', () => {
                    // Add subtle visual feedback
                    input.style.borderColor = 'var(--color-success)';
                    setTimeout(() => {
                        input.style.borderColor = '';
                    }, 1000);
                });
            }
        });
    }, 1000);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!app) return;
    
    // Ctrl/Cmd + Enter to generate video
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn && !generateBtn.disabled && !document.getElementById('generator').classList.contains('hidden')) {
            generateBtn.click();
        }
    }
    
    // Escape to go back to generator from results
    if (e.key === 'Escape') {
        const resultsSection = document.getElementById('results');
        if (resultsSection && !resultsSection.classList.contains('hidden')) {
            app.showSection('generator');
        }
    }
});
