// VideoGen Pro - JavaScript Application Logic

class VideoGenerator {
    constructor() {
        this.isGenerating = false;
        this.currentProgress = 0;
        this.progressInterval = null;
        this.currentStage = 0;
        this.totalDuration = 20000; // 20 seconds total generation time
        
        this.stages = [
            { id: 'text', name: 'Processing Text', duration: 2000 },
            { id: 'images', name: 'Generating Images', duration: 8000 },
            { id: 'audio', name: 'Adding Audio', duration: 3000 },
            { id: 'rendering', name: 'Rendering Video', duration: 7000 }
        ];
        
        this.init();
        this.loadHistory();
    }

    init() {
        this.bindEvents();
        this.updateSliderValues();
        this.updateCharCount();
        this.showSection('generator'); // Show generator by default
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav__link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    const sectionId = href.substring(1);
                    this.showSection(sectionId);
                    this.setActiveNavLink(link);
                }
            });
        });

        // Form submission
        const videoForm = document.getElementById('videoForm');
        videoForm.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Duration buttons
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectDuration(e));
        });

        // Sliders
        const voiceSpeed = document.getElementById('voiceSpeed');
        const musicVolume = document.getElementById('musicVolume');
        
        voiceSpeed.addEventListener('input', () => this.updateSliderValue('voiceSpeed', 'voiceSpeedValue', 'x'));
        musicVolume.addEventListener('input', () => this.updateSliderValue('musicVolume', 'musicVolumeValue', '%'));

        // Script input character count
        const scriptInput = document.getElementById('script');
        scriptInput.addEventListener('input', () => this.updateCharCount());
        scriptInput.addEventListener('keyup', () => this.updateCharCount());
        scriptInput.addEventListener('paste', () => {
            setTimeout(() => this.updateCharCount(), 10);
        });

        // Cancel button
        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelGeneration());
        }

        // Result buttons
        const downloadBtn = document.getElementById('downloadBtn');
        const shareBtn = document.getElementById('shareBtn');
        const newVideoBtn = document.getElementById('newVideoBtn');
        
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadVideo());
        if (shareBtn) shareBtn.addEventListener('click', () => this.showShareModal());
        if (newVideoBtn) newVideoBtn.addEventListener('click', () => this.startNewVideo());

        // History search and filter
        const historySearch = document.getElementById('historySearch');
        const historyFilter = document.getElementById('historyFilter');
        
        if (historySearch) {
            historySearch.addEventListener('input', (e) => this.filterHistory(e.target.value));
        }
        if (historyFilter) {
            historyFilter.addEventListener('change', (e) => this.filterHistory(null, e.target.value));
        }

        // Modal events
        const shareModal = document.getElementById('shareModal');
        if (shareModal) {
            shareModal.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
                    this.hideShareModal();
                }
            });
        }

        // Copy link button
        const copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => this.copyShareLink());
        }

        // Settings
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    setActiveNavLink(activeLink) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav__link').forEach(link => {
            link.classList.remove('nav__link--active');
        });
        
        // Add active class to clicked link
        activeLink.classList.add('nav__link--active');
    }

    updateSliderValues() {
        this.updateSliderValue('voiceSpeed', 'voiceSpeedValue', 'x');
        this.updateSliderValue('musicVolume', 'musicVolumeValue', '%');
    }

    updateSliderValue(sliderId, displayId, suffix) {
        const slider = document.getElementById(sliderId);
        const display = document.getElementById(displayId);
        if (slider && display) {
            display.textContent = slider.value + suffix;
        }
    }

    updateCharCount() {
        const script = document.getElementById('script');
        const charCount = document.getElementById('charCount');
        if (script && charCount) {
            charCount.textContent = script.value.length;
        }
    }

    selectDuration(e) {
        e.preventDefault();
        
        // Remove active class from all buttons
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        e.target.classList.add('active');
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.isGenerating) {
            return;
        }

        const formData = this.getFormData();
        
        // Validate form
        if (!this.validateForm(formData)) {
            return;
        }

        this.startGeneration(formData);
    }

    getFormData() {
        const activeDurationBtn = document.querySelector('.duration-btn.active');
        
        return {
            script: document.getElementById('script').value.trim(),
            duration: activeDurationBtn ? activeDurationBtn.dataset.duration : '60',
            voice: document.getElementById('voice').value,
            style: document.getElementById('style').value,
            template: document.getElementById('template').value,
            backgroundMusic: document.getElementById('backgroundMusic').checked,
            resolution: document.getElementById('resolution').value,
            frameRate: document.getElementById('frameRate').value,
            transition: document.getElementById('transition').value,
            voiceSpeed: document.getElementById('voiceSpeed').value,
            musicVolume: document.getElementById('musicVolume').value
        };
    }

    validateForm(formData) {
        if (!formData.script) {
            this.showNotification('Please enter a script for your video.', 'error');
            document.getElementById('script').focus();
            return false;
        }

        if (formData.script.length < 10) {
            this.showNotification('Please enter a longer script (at least 10 characters).', 'error');
            return false;
        }

        return true;
    }

    startGeneration(formData) {
        this.isGenerating = true;
        this.currentProgress = 0;
        this.currentStage = 0;

        // Update UI
        this.showGenerationUI();
        this.resetProgress();

        // Start the generation process
        this.progressInterval = setInterval(() => {
            this.updateGenerationProgress();
        }, 100);

        // Store current video data
        this.currentVideoData = formData;
    }

    showGenerationUI() {
        // Show progress section
        const progressSection = document.getElementById('progressSection');
        const resultSection = document.getElementById('resultSection');
        
        if (progressSection) progressSection.classList.remove('hidden');
        if (resultSection) resultSection.classList.add('hidden');

        // Update button state
        const generateBtn = document.querySelector('.generate-btn');
        if (generateBtn) {
            generateBtn.classList.add('loading');
            const btnText = generateBtn.querySelector('.btn-text');
            const btnLoader = generateBtn.querySelector('.btn-loader');
            if (btnText) btnText.classList.add('hidden');
            if (btnLoader) btnLoader.classList.remove('hidden');
        }

        // Scroll to progress section
        setTimeout(() => {
            if (progressSection) {
                progressSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }

    resetProgress() {
        // Reset progress bar
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        
        if (progressBar) progressBar.style.width = '0%';
        if (progressPercent) progressPercent.textContent = '0%';

        // Reset stages
        document.querySelectorAll('.stage').forEach(stage => {
            stage.classList.remove('active', 'completed');
        });
        
        // Set first stage as active
        const firstStage = document.querySelector('.stage[data-stage="text"]');
        if (firstStage) firstStage.classList.add('active');
    }

    updateGenerationProgress() {
        const progressPerSecond = 100 / (this.totalDuration / 100); // Progress per 100ms
        this.currentProgress += progressPerSecond;

        // Update progress bar
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        
        if (progressBar && progressPercent) {
            progressBar.style.width = Math.min(this.currentProgress, 100) + '%';
            progressPercent.textContent = Math.floor(Math.min(this.currentProgress, 100)) + '%';
        }

        // Update stages
        this.updateStages();

        // Update time remaining
        const timeRemaining = Math.max(0, this.totalDuration - (this.currentProgress / 100 * this.totalDuration));
        const timeRemainingEl = document.getElementById('timeRemaining');
        if (timeRemainingEl) {
            timeRemainingEl.textContent = this.formatTime(timeRemaining);
        }

        // Update status
        this.updateStatus();

        // Check if completed
        if (this.currentProgress >= 100) {
            this.completeGeneration();
        }
    }

    updateStages() {
        let elapsed = this.currentProgress / 100 * this.totalDuration;
        let currentElapsed = 0;

        this.stages.forEach((stage, index) => {
            const stageElement = document.querySelector(`[data-stage="${stage.id}"]`);
            
            if (!stageElement) return;
            
            if (elapsed > currentElapsed + stage.duration) {
                // Completed stage
                stageElement.classList.remove('active');
                stageElement.classList.add('completed');
            } else if (elapsed > currentElapsed) {
                // Current stage
                stageElement.classList.add('active');
                stageElement.classList.remove('completed');
                this.currentStage = index;
            } else {
                // Future stage
                stageElement.classList.remove('active', 'completed');
            }
            
            currentElapsed += stage.duration;
        });
    }

    updateStatus() {
        const statusMessages = [
            'Analyzing your script and extracting key themes...',
            'Searching for relevant stock footage and images...',
            'Generating natural-sounding voiceover...',
            'Combining all elements and rendering final video...'
        ];

        const currentStatus = document.getElementById('currentStatus');
        if (currentStatus && this.currentStage < statusMessages.length) {
            currentStatus.textContent = statusMessages[this.currentStage];
        }
    }

    completeGeneration() {
        clearInterval(this.progressInterval);
        this.isGenerating = false;

        // Create video object
        const video = this.createVideoObject(this.currentVideoData);
        
        // Add to history
        this.addToHistory(video);

        // Show result
        setTimeout(() => {
            this.showResult(video);
        }, 500);
    }

    createVideoObject(formData) {
        const id = 'video_' + Date.now();
        const durationText = this.formatDuration(parseInt(formData.duration));
        
        return {
            id: id,
            title: this.generateTitle(formData.script),
            script: formData.script,
            duration: formData.duration,
            durationText: durationText,
            createdAt: new Date().toISOString(),
            thumbnail: this.generateThumbnail(formData.style),
            style: formData.style,
            template: formData.template,
            settings: {
                voice: formData.voice,
                resolution: formData.resolution,
                frameRate: formData.frameRate,
                transition: formData.transition,
                voiceSpeed: formData.voiceSpeed,
                musicVolume: formData.musicVolume,
                backgroundMusic: formData.backgroundMusic
            }
        };
    }

    generateTitle(script) {
        const words = script.split(' ').slice(0, 5);
        return words.join(' ') + (script.split(' ').length > 5 ? '...' : '');
    }

    generateThumbnail(style) {
        const colors = {
            corporate: '4A90E2/FFFFFF',
            creative: 'E94B3C/FFFFFF',
            educational: '50C878/FFFFFF',
            social: 'FF6B35/FFFFFF'
        };
        
        const color = colors[style] || '4A90E2/FFFFFF';
        return `https://via.placeholder.com/300x200/${color}?text=${style.charAt(0).toUpperCase() + style.slice(1)}+Video`;
    }

    showResult(video) {
        // Hide progress and show result
        const progressSection = document.getElementById('progressSection');
        const resultSection = document.getElementById('resultSection');
        
        if (progressSection) progressSection.classList.add('hidden');
        if (resultSection) resultSection.classList.remove('hidden');

        // Update result details
        const resultDuration = document.getElementById('resultDuration');
        const resultResolution = document.getElementById('resultResolution');
        
        if (resultDuration) resultDuration.textContent = video.durationText;
        if (resultResolution) resultResolution.textContent = video.settings.resolution.toUpperCase();

        // Reset button state
        const generateBtn = document.querySelector('.generate-btn');
        if (generateBtn) {
            generateBtn.classList.remove('loading');
            const btnText = generateBtn.querySelector('.btn-text');
            const btnLoader = generateBtn.querySelector('.btn-loader');
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoader) btnLoader.classList.add('hidden');
        }

        this.showNotification('Your video has been generated successfully!', 'success');
        
        // Scroll to result
        setTimeout(() => {
            if (resultSection) {
                resultSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }

    cancelGeneration() {
        if (!this.isGenerating) return;

        clearInterval(this.progressInterval);
        this.isGenerating = false;

        // Reset UI
        const progressSection = document.getElementById('progressSection');
        if (progressSection) progressSection.classList.add('hidden');
        
        const generateBtn = document.querySelector('.generate-btn');
        if (generateBtn) {
            generateBtn.classList.remove('loading');
            const btnText = generateBtn.querySelector('.btn-text');
            const btnLoader = generateBtn.querySelector('.btn-loader');
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoader) btnLoader.classList.add('hidden');
        }

        this.showNotification('Video generation cancelled.', 'info');
    }

    downloadVideo() {
        // Simulate video download
        this.showNotification('Download started! (This is a demo)', 'success');
    }

    showShareModal() {
        const modal = document.getElementById('shareModal');
        const shareLink = document.getElementById('shareLink');
        
        if (modal && shareLink) {
            // Generate shareable link
            const videoId = 'video_' + Date.now();
            shareLink.value = `https://videogen.pro/watch/${videoId}`;
            
            modal.classList.remove('hidden');
        }
    }

    hideShareModal() {
        const modal = document.getElementById('shareModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    copyShareLink() {
        const shareLink = document.getElementById('shareLink');
        if (shareLink) {
            shareLink.select();
            shareLink.setSelectionRange(0, 99999); // For mobile devices
            
            try {
                document.execCommand('copy');
                this.showNotification('Link copied to clipboard!', 'success');
            } catch (err) {
                this.showNotification('Could not copy link', 'error');
            }
        }
    }

    startNewVideo() {
        // Reset form
        const videoForm = document.getElementById('videoForm');
        if (videoForm) videoForm.reset();
        
        const scriptInput = document.getElementById('script');
        if (scriptInput) scriptInput.value = '';
        this.updateCharCount();
        
        // Reset duration selection
        document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('active'));
        const defaultDurationBtn = document.querySelector('.duration-btn[data-duration="60"]');
        if (defaultDurationBtn) defaultDurationBtn.classList.add('active');
        
        // Hide result section
        const resultSection = document.getElementById('resultSection');
        if (resultSection) resultSection.classList.add('hidden');
        
        // Show generator section
        this.showSection('generator');
        this.setActiveNavLink(document.querySelector('.nav__link[href="#generator"]'));
        
        // Scroll to form
        setTimeout(() => {
            const generatorSection = document.getElementById('generator');
            if (generatorSection) {
                generatorSection.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }

    // History Management
    addToHistory(video) {
        let history = this.getHistory();
        history.unshift(video);
        
        // Keep only last 50 videos
        if (history.length > 50) {
            history = history.slice(0, 50);
        }
        
        localStorage.setItem('videoHistory', JSON.stringify(history));
        this.renderHistory();
        this.updateVideoCount();
    }

    getHistory() {
        try {
            const history = localStorage.getItem('videoHistory');
            return history ? JSON.parse(history) : this.getSampleHistory();
        } catch (error) {
            console.error('Error loading history:', error);
            return this.getSampleHistory();
        }
    }

    getSampleHistory() {
        return [
            {
                id: "1",
                title: "Corporate Introduction",
                script: "Welcome to our company. We provide innovative solutions for modern businesses with cutting-edge technology and exceptional service.",
                duration: "60",
                durationText: "1:00",
                createdAt: "2025-09-10T10:30:00Z",
                thumbnail: "https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Corporate+Video",
                style: "corporate",
                template: "presentation",
                settings: {
                    voice: "female1",
                    resolution: "1080p",
                    frameRate: "30fps",
                    transition: "fade",
                    voiceSpeed: "1.0",
                    musicVolume: "50",
                    backgroundMusic: true
                }
            },
            {
                id: "2",
                title: "Product Demo",
                script: "Discover the amazing features of our latest product. Revolutionary design meets incredible functionality in this game-changing innovation.",
                duration: "180",
                durationText: "3:00",
                createdAt: "2025-09-09T14:15:00Z",
                thumbnail: "https://via.placeholder.com/300x200/E94B3C/FFFFFF?text=Product+Demo",
                style: "creative",
                template: "tutorial",
                settings: {
                    voice: "male1",
                    resolution: "1080p",
                    frameRate: "30fps",
                    transition: "slide",
                    voiceSpeed: "1.0",
                    musicVolume: "40",
                    backgroundMusic: true
                }
            },
            {
                id: "3",
                title: "Social Media Promo",
                script: "Get ready for our biggest sale of the year! Amazing discounts on all products. Don't miss out on these incredible deals!",
                duration: "30",
                durationText: "0:30",
                createdAt: "2025-09-08T16:45:00Z",
                thumbnail: "https://via.placeholder.com/300x200/50C878/FFFFFF?text=Promo+Video",
                style: "social",
                template: "slideshow",
                settings: {
                    voice: "female2",
                    resolution: "720p",
                    frameRate: "30fps",
                    transition: "zoom",
                    voiceSpeed: "1.2",
                    musicVolume: "60",
                    backgroundMusic: true
                }
            }
        ];
    }

    loadHistory() {
        this.renderHistory();
        this.updateVideoCount();
    }

    renderHistory(filteredVideos = null) {
        const historyGrid = document.getElementById('historyGrid');
        const historyEmpty = document.getElementById('historyEmpty');
        
        if (!historyGrid || !historyEmpty) return;
        
        const videos = filteredVideos || this.getHistory();
        
        if (videos.length === 0) {
            historyGrid.innerHTML = '';
            historyEmpty.classList.remove('hidden');
            return;
        }
        
        historyEmpty.classList.add('hidden');
        
        historyGrid.innerHTML = videos.map(video => this.createVideoCard(video)).join('');
        
        // Bind events for video cards
        this.bindVideoCardEvents();
    }

    createVideoCard(video) {
        const createdDate = new Date(video.createdAt).toLocaleDateString();
        
        return `
            <div class="video-card" data-video-id="${video.id}">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                    <div class="video-duration">${video.durationText}</div>
                </div>
                <div class="video-card-content">
                    <h4 class="video-title">${video.title}</h4>
                    <p class="video-script">${video.script}</p>
                    <div class="video-meta">
                        <span>${createdDate}</span>
                        <span class="status status--info">${video.style}</span>
                    </div>
                    <div class="video-actions">
                        <button class="btn btn--primary btn--sm download-video-btn">Download</button>
                        <button class="btn btn--outline btn--sm share-video-btn">Share</button>
                        <button class="btn btn--outline btn--sm delete-video-btn">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }

    bindVideoCardEvents() {
        // Download buttons
        document.querySelectorAll('.download-video-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadVideoFromHistory(btn);
            });
        });

        // Share buttons
        document.querySelectorAll('.share-video-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareVideoFromHistory(btn);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-video-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteVideoFromHistory(btn);
            });
        });
    }

    downloadVideoFromHistory(btn) {
        const videoCard = btn.closest('.video-card');
        const videoId = videoCard.dataset.videoId;
        
        this.showNotification(`Downloading video ${videoId}... (This is a demo)`, 'success');
    }

    shareVideoFromHistory(btn) {
        const videoCard = btn.closest('.video-card');
        const videoId = videoCard.dataset.videoId;
        
        const shareLink = document.getElementById('shareLink');
        if (shareLink) {
            shareLink.value = `https://videogen.pro/watch/${videoId}`;
        }
        
        this.showShareModal();
    }

    deleteVideoFromHistory(btn) {
        const videoCard = btn.closest('.video-card');
        const videoId = videoCard.dataset.videoId;
        
        if (confirm('Are you sure you want to delete this video?')) {
            let history = this.getHistory();
            history = history.filter(video => video.id !== videoId);
            localStorage.setItem('videoHistory', JSON.stringify(history));
            
            this.renderHistory();
            this.updateVideoCount();
            this.showNotification('Video deleted successfully.', 'success');
        }
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all video history? This action cannot be undone.')) {
            localStorage.removeItem('videoHistory');
            this.renderHistory();
            this.updateVideoCount();
            this.showNotification('History cleared successfully.', 'success');
        }
    }

    updateVideoCount() {
        const videoCountEl = document.getElementById('videoCount');
        if (videoCountEl) {
            const history = this.getHistory();
            videoCountEl.textContent = history.length;
        }
    }

    filterHistory(searchTerm = null, durationFilter = null) {
        let history = this.getHistory();
        
        // Get current search term and filter if not provided
        if (searchTerm === null) {
            const searchInput = document.getElementById('historySearch');
            searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        } else {
            searchTerm = searchTerm.toLowerCase();
        }
        
        if (durationFilter === null) {
            const filterSelect = document.getElementById('historyFilter');
            durationFilter = filterSelect ? filterSelect.value : 'all';
        }
        
        let filtered = history;
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(video => 
                video.title.toLowerCase().includes(searchTerm) ||
                video.script.toLowerCase().includes(searchTerm) ||
                video.style.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply duration filter
        if (durationFilter !== 'all') {
            filtered = filtered.filter(video => video.duration === durationFilter);
        }
        
        this.renderHistory(filtered);
    }

    // Utility Functions
    formatTime(ms) {
        const seconds = Math.ceil(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${seconds}s`;
    }

    formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        
        if (minutes > 0) {
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `0:${seconds.toString().padStart(2, '0')}`;
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add styles if not already present
        if (!document.querySelector('.notification-styles')) {
            const styles = document.createElement('style');
            styles.className = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 16px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    max-width: 400px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    animation: slideIn 0.3s ease-out;
                }
                .notification--success { background: var(--color-success); }
                .notification--error { background: var(--color-error); }
                .notification--info { background: var(--color-info); }
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 18px;
                    padding: 0;
                    margin-left: auto;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.remove();
            });
        }
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new VideoGenerator();
});
