// VideoGen Pro - JavaScript Application Logic

// VideoGen Pro - JavaScript Application Logic with RunwayML Integration

class VideoGenerator {
    constructor() {
        this.isGenerating = false;
        this.currentProgress = 0;
        this.progressInterval = null;
        this.currentStage = 0;
        this.totalDuration = 20000; // still used for fake progress animation

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
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    setActiveNavLink(activeLink) {
        document.querySelectorAll('.nav__link').forEach(link => {
            link.classList.remove('nav__link--active');
        });
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
        document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
    }

    handleFormSubmit(e) {
        e.preventDefault();
        if (this.isGenerating) return;

        const formData = this.getFormData();
        if (!this.validateForm(formData)) return;

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

    // ===== RunwayML Integration =====
    async startGeneration(formData) {
        if (this.isGenerating) return;

        this.isGenerating = true;
        this.currentProgress = 0;
        this.currentStage = 0;

        this.showGenerationUI();
        this.resetProgress();
        this.currentVideoData = formData;

        try {
            const runwayApiKey = "YOUR_RUNWAY_API_KEY"; // replace with your key
            const model = "gen3_alpha"; // or gen4_turbo, etc.

            const response = await fetch("https://api.runwayml.com/v1/image_to_video", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${runwayApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model,
                    input: {
                        prompt: formData.script,
                        duration: parseInt(formData.duration)
                    }
                })
            });

            if (!response.ok) {
                throw new Error("RunwayML request failed: " + response.status);
            }

            const task = await response.json();
            const taskId = task.id;

            // Progress animation
            this.progressInterval = setInterval(() => {
                this.updateGenerationProgress();
            }, 500);

            // Poll until completion
            let result = task;
            while (result.status !== "succeeded" && result.status !== "failed") {
                await new Promise(r => setTimeout(r, 3000));
                const pollResp = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
                    headers: { "Authorization": `Bearer ${runwayApiKey}` }
                });
                result = await pollResp.json();
            }

            clearInterval(this.progressInterval);
            this.isGenerating = false;

            if (result.status === "succeeded" && result.output && result.output[0]) {
                const videoUrl = result.output[0];
                const video = {
                    ...this.createVideoObject(formData),
                    videoUrl
                };
                this.addToHistory(video);
                this.showResult(video);
            } else {
                this.showNotification("Video generation failed on RunwayML.", "error");
            }

        } catch (err) {
            clearInterval(this.progressInterval);
            this.isGenerating = false;
            console.error("RunwayML error:", err);
            this.showNotification("Error connecting to RunwayML API.", "error");
        }
    }

    showGenerationUI() {
        const progressSection = document.getElementById('progressSection');
        const resultSection = document.getElementById('resultSection');
        if (progressSection) progressSection.classList.remove('hidden');
        if (resultSection) resultSection.classList.add('hidden');

        const generateBtn = document.querySelector('.generate-btn');
        if (generateBtn) {
            generateBtn.classList.add('loading');
            const btnText = generateBtn.querySelector('.btn-text');
            const btnLoader = generateBtn.querySelector('.btn-loader');
            if (btnText) btnText.classList.add('hidden');
            if (btnLoader) btnLoader.classList.remove('hidden');
        }

        setTimeout(() => {
            if (progressSection) progressSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    resetProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        if (progressBar) progressBar.style.width = '0%';
        if (progressPercent) progressPercent.textContent = '0%';

        document.querySelectorAll('.stage').forEach(stage => {
            stage.classList.remove('active', 'completed');
        });

        const firstStage = document.querySelector('.stage[data-stage="text"]');
        if (firstStage) firstStage.classList.add('active');
    }

    updateGenerationProgress() {
        const progressPerSecond = 100 / (this.totalDuration / 100);
        this.currentProgress += progressPerSecond;

        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');

        if (progressBar && progressPercent) {
            progressBar.style.width = Math.min(this.currentProgress, 100) + '%';
            progressPercent.textContent = Math.floor(Math.min(this.currentProgress, 100)) + '%';
        }

        this.updateStages();

        const timeRemaining = Math.max(0, this.totalDuration - (this.currentProgress / 100 * this.totalDuration));
        const timeRemainingEl = document.getElementById('timeRemaining');
        if (timeRemainingEl) timeRemainingEl.textContent = this.formatTime(timeRemaining);

        this.updateStatus();
    }

    updateStages() {
        let elapsed = this.currentProgress / 100 * this.totalDuration;
        let currentElapsed = 0;

        this.stages.forEach((stage, index) => {
            const stageElement = document.querySelector(`[data-stage="${stage.id}"]`);
            if (!stageElement) return;

            if (elapsed > currentElapsed + stage.duration) {
                stageElement.classList.remove('active');
                stageElement.classList.add('completed');
            } else if (elapsed > currentElapsed) {
                stageElement.classList.add('active');
                stageElement.classList.remove('completed');
                this.currentStage = index;
            } else {
                stageElement.classList.remove('active', 'completed');
            }
            currentElapsed += stage.duration;
        });
    }

    updateStatus() {
        const statusMessages = [
            'Analyzing your script and extracting key themes...',
            'Searching for relevant visuals...',
            'Generating voiceover...',
            'Rendering final video...'
        ];

        const currentStatus = document.getElementById('currentStatus');
        if (currentStatus && this.currentStage < statusMessages.length) {
            currentStatus.textContent = statusMessages[this.currentStage];
        }
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
        const progressSection = document.getElementById('progressSection');
        const resultSection = document.getElementById('resultSection');
        if (progressSection) progressSection.classList.add('hidden');
        if (resultSection) resultSection.classList.remove('hidden');

        const videoPlayer = document.getElementById('resultVideo');
        if (videoPlayer && video.videoUrl) {
            videoPlayer.innerHTML = `
                <video controls width="100%">
                    <source src="${video.videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
            `;
        }

        const resultDuration = document.getElementById('resultDuration');
        const resultResolution = document.getElementById('resultResolution');
        if (resultDuration) resultDuration.textContent = video.durationText;
        if (resultResolution) resultResolution.textContent = video.settings.resolution.toUpperCase();

        const generateBtn = document.querySelector('.generate-btn');
        if (generateBtn) {
            generateBtn.classList.remove('loading');
            const btnText = generateBtn.querySelector('.btn-text');
            const btnLoader = generateBtn.querySelector('.btn-loader');
            if (btnText) btnText.classList.remove('hidden');
            if (btnLoader) btnLoader.classList.add('hidden');
        }

        this.showNotification('Your video has been generated successfully!', 'success');
        setTimeout(() => {
            if (resultSection) resultSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    cancelGeneration() {
        if (!this.isGenerating) return;
        clearInterval(this.progressInterval);
        this.isGenerating = false;

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
        this.showNotification('Download started! (Demo)', 'success');
    }

    showShareModal() {
        const modal = document.getElementById('shareModal');
        const shareLink = document.getElementById('shareLink');
        if (modal && shareLink) {
            const videoId = 'video_' + Date.now();
            shareLink.value = `https://videogen.pro/watch/${videoId}`;
            modal.classList.remove('hidden');
        }
    }

    hideShareModal() {
        const modal = document.getElementById('shareModal');
        if (modal) modal.classList.add('hidden');
    }

    copyShareLink() {
        const shareLink = document.getElementById('shareLink');
        if (shareLink) {
            shareLink.select();
            shareLink.setSelectionRange(0, 99999);
            try {
                document.execCommand('copy');
                this.showNotification('Link copied to clipboard!', 'success');
            } catch {
                this.showNotification('Could not copy link', 'error');
            }
        }
    }

    startNewVideo() {
        const videoForm = document.getElementById('videoForm');
        if (videoForm) videoForm.reset();
        const scriptInput = document.getElementById('script');
        if (scriptInput) scriptInput.value = '';
        this.updateCharCount();

        document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('active'));
        const defaultDurationBtn = document.querySelector('.duration-btn[data-duration="60"]');
        if (defaultDurationBtn) defaultDurationBtn.classList.add('active');

        const resultSection = document.getElementById('resultSection');
        if (resultSection) resultSection.classList.add('hidden');

        this.showSection('generator');
        this
