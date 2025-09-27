// AI TalkingPhoto Platform - Main JavaScript

// Application data from JSON
const appData = {
  "app_features": {
    "ai_models": [
      {"name": "Basic", "description": "Fast generation, basic quality", "speed": "RTF 5", "max_duration": "60s"},
      {"name": "Standard", "description": "Balanced quality and speed", "speed": "RTF 10", "max_duration": "120s"},
      {"name": "Premium", "description": "Highest quality, slower", "speed": "RTF 15", "max_duration": "300s"}
    ],
    "voice_options": [
      {"name": "Emma", "gender": "Female", "language": "English", "accent": "US"},
      {"name": "Oliver", "gender": "Male", "language": "English", "accent": "UK"},
      {"name": "Sofia", "gender": "Female", "language": "Spanish", "accent": "ES"},
      {"name": "Lucas", "gender": "Male", "language": "French", "accent": "FR"},
      {"name": "Aisha", "gender": "Female", "language": "Arabic", "accent": "SA"},
      {"name": "Raj", "gender": "Male", "language": "Hindi", "accent": "IN"}
    ],
    "output_formats": [
      {"name": "480p", "description": "Basic quality, small file", "resolution": "854x480"},
      {"name": "720p", "description": "HD quality, balanced", "resolution": "1280x720"},
      {"name": "1080p", "description": "Full HD, high quality", "resolution": "1920x1080"},
      {"name": "4K", "description": "Ultra HD, premium only", "resolution": "3840x2160"}
    ]
  },
  "pricing_tiers": [
    {
      "name": "Free",
      "price": "$0",
      "period": "forever",
      "features": ["3 videos per month", "Basic AI model only", "Watermark included", "480p resolution", "Community support"],
      "limitations": ["Limited generations", "Watermarked output", "Basic quality only"]
    },
    {
      "name": "Basic",
      "price": "$19",
      "period": "per month",
      "features": ["50 videos per month", "All AI models", "No watermark", "Up to 1080p", "Email support", "Download & share"],
      "popular": false
    },
    {
      "name": "Pro",
      "price": "$49",
      "period": "per month",
      "features": ["200 videos per month", "All AI models", "4K resolution", "Priority processing", "Voice cloning", "API access", "Priority support"],
      "popular": true
    },
    {
      "name": "Enterprise",
      "price": "$199",
      "period": "per month",
      "features": ["Unlimited videos", "Custom AI models", "White-label option", "Dedicated support", "SLA guarantee", "Custom integration", "Team management"],
      "popular": false
    }
  ],
  "features_list": [
    {
      "category": "AI Technology",
      "items": [
        "Advanced lip-sync animation",
        "Natural facial expressions",
        "Multiple AI model options",
        "Real-time processing",
        "High-fidelity voice synthesis"
      ]
    },
    {
      "category": "Input Options", 
      "items": [
        "Text-to-speech conversion",
        "Audio file upload",
        "Voice recording",
        "Photo upload",
        "Batch processing"
      ]
    },
    {
      "category": "Output Quality",
      "items": [
        "Multiple resolutions",
        "Format conversion",
        "Quality optimization",
        "Fast rendering",
        "Professional results"
      ]
    },
    {
      "category": "User Experience",
      "items": [
        "Intuitive interface",
        "Real-time preview",
        "Progress tracking",
        "History management",
        "Social sharing"
      ]
    }
  ],
  "testimonials": [
    {
      "name": "Sarah Johnson",
      "role": "Marketing Director",
      "company": "TechCorp",
      "content": "This platform revolutionized our video marketing. We create personalized customer videos in minutes instead of days.",
      "rating": 5
    },
    {
      "name": "Mike Chen",
      "role": "Content Creator",
      "company": "Independent",
      "content": "The quality is incredible. My followers can't tell the difference between AI-generated and real videos.",
      "rating": 5
    },
    {
      "name": "Emily Rodriguez",
      "role": "Training Manager", 
      "company": "Global Corp",
      "content": "We've localized our training content into 15 languages effortlessly. The ROI is amazing.",
      "rating": 5
    }
  ],
  "demo_videos": [
    {
      "title": "Business Presentation",
      "description": "Professional spokesperson delivering quarterly results",
      "thumbnail": "demo1.jpg"
    },
    {
      "title": "Educational Content",
      "description": "Historical figure explaining ancient civilizations",
      "thumbnail": "demo2.jpg"
    },
    {
      "title": "Social Media",
      "description": "Influencer creating engaging product review",
      "thumbnail": "demo3.jpg"
    }
  ],
  "user_dashboard": {
    "recent_generations": [
      {"id": 1, "title": "Product Demo Video", "status": "completed", "date": "2025-09-27", "duration": "45s"},
      {"id": 2, "title": "Training Module", "status": "processing", "date": "2025-09-27", "duration": "120s"},
      {"id": 3, "title": "Marketing Clip", "status": "completed", "date": "2025-09-26", "duration": "30s"}
    ],
    "usage_stats": {
      "videos_generated": 23,
      "monthly_limit": 50,
      "storage_used": "2.4 GB",
      "storage_limit": "10 GB"
    }
  },
  "faq_items": [
    {
      "question": "How realistic are the AI-generated videos?",
      "answer": "Our advanced AI technology creates highly realistic lip-sync and facial animations that are nearly indistinguishable from real videos. The quality depends on the AI model selected and input photo quality."
    },
    {
      "question": "What photo requirements work best?",
      "answer": "For optimal results, use clear, front-facing portrait photos with good lighting. The subject should have a neutral expression with their mouth closed or slightly open."
    },
    {
      "question": "Can I use my own voice?",
      "answer": "Yes! You can upload your own audio files or use our voice cloning feature (Pro plan and above) to create a digital version of your voice."
    },
    {
      "question": "What languages are supported?",
      "answer": "We support over 25 languages including English, Spanish, French, German, Chinese, Japanese, Arabic, Hindi, and many more with native accent options."
    },
    {
      "question": "How long does video generation take?",
      "answer": "Generation time varies by AI model: Basic (1-2 minutes), Standard (3-5 minutes), Premium (5-10 minutes). Pro users get priority processing for faster results."
    }
  ]
};

// Application state
let currentUser = null;
let currentPhoto = null;
let isAuthenticated = false;
let galleryVideos = [
  {id: 1, title: "Product Demo", date: "2025-09-27", duration: "45s", status: "completed", thumbnail: "🎬"},
  {id: 2, title: "Training Video", date: "2025-09-26", duration: "120s", status: "completed", thumbnail: "📚"},
  {id: 3, title: "Marketing Clip", date: "2025-09-25", duration: "30s", status: "completed", thumbnail: "📱"},
  {id: 4, title: "Social Media Post", date: "2025-09-24", duration: "60s", status: "completed", thumbnail: "📺"},
  {id: 5, title: "Company Intro", date: "2025-09-23", duration: "90s", status: "completed", thumbnail: "🏢"},
  {id: 6, title: "Tutorial Video", date: "2025-09-22", duration: "180s", status: "completed", thumbnail: "🎓"}
];

// DOM Elements
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('nav-toggle');
const navMenu = document.getElementById('nav-menu');
const mainContent = document.getElementById('main-content');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    populateContent();
    checkAuthState();
});

// Initialize application
function initializeApp() {
    console.log('AI TalkingPhoto Platform initialized');
    
    // Set up navigation highlighting
    updateActiveNavLink();
    
    // Initialize modals
    setupModals();
    
    // Initialize dashboard if user is authenticated
    if (isAuthenticated) {
        showDashboard();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    navToggle.addEventListener('click', toggleMobileMenu);
    
    // Navigation links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Auth buttons
    document.getElementById('loginBtn').addEventListener('click', () => showModal('loginModal'));
    document.getElementById('signupBtn').addEventListener('click', () => showModal('signupModal'));
    document.getElementById('heroStartBtn').addEventListener('click', () => showModal('signupModal'));
    document.getElementById('heroDemoBtn').addEventListener('click', showDemo);
    document.getElementById('ctaBtn').addEventListener('click', () => showModal('signupModal'));
    
    // Modal controls
    setupModalControls();
    
    // Dashboard controls
    setupDashboardControls();
    
    // Studio controls
    setupStudioControls();
    
    // FAQ accordion
    setupFAQAccordion();
    
    // Scroll effects
    window.addEventListener('scroll', handleScroll);
}

// Navigation functions
function toggleMobileMenu() {
    navMenu.classList.toggle('open');
}

function handleNavigation(e) {
    e.preventDefault();
    const target = e.target.getAttribute('href');
    
    if (target && target.startsWith('#')) {
        const sectionId = target.substring(1);
        scrollToSection(sectionId);
        updateActiveNavLink(target);
    }
    
    // Close mobile menu if open
    if (navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
    }
}

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function updateActiveNavLink(activeHref = '#home') {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === activeHref) {
            link.classList.add('active');
        }
    });
}

function handleScroll() {
    const scrolled = window.pageYOffset;
    
    // Update navbar style
    if (scrolled > 50) {
        navbar.style.background = 'rgba(19, 52, 59, 0.98)';
    } else {
        navbar.style.background = 'rgba(19, 52, 59, 0.95)';
    }
}

// Modal functions
function setupModals() {
    // Close modal when clicking overlay
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal.id);
        });
    });
    
    // Close modal when clicking close button
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            hideModal(modal.id);
        });
    });
}

function setupModalControls() {
    // Auth form switches
    document.getElementById('switchToSignup').addEventListener('click', (e) => {
        e.preventDefault();
        hideModal('loginModal');
        showModal('signupModal');
    });
    
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        hideModal('signupModal');
        showModal('loginModal');
    });
    
    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Authentication functions
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (email && password) {
        // Simulate login
        currentUser = {
            name: 'John Doe',
            email: email,
            plan: 'Basic',
            memberSince: 'September 2025'
        };
        
        isAuthenticated = true;
        hideModal('loginModal');
        showDashboard();
        
        // Update UI
        updateAuthUI();
    }
}

function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (name && email && password) {
        // Simulate signup
        currentUser = {
            name: name,
            email: email,
            plan: 'Free',
            memberSince: 'September 2025'
        };
        
        isAuthenticated = true;
        hideModal('signupModal');
        showDashboard();
        
        // Update UI
        updateAuthUI();
    }
}

function handleLogout() {
    currentUser = null;
    isAuthenticated = false;
    showLandingPage();
    updateAuthUI();
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    
    if (isAuthenticated) {
        loginBtn.textContent = 'Dashboard';
        loginBtn.onclick = showDashboard;
        signupBtn.style.display = 'none';
    } else {
        loginBtn.textContent = 'Sign In';
        loginBtn.onclick = () => showModal('loginModal');
        signupBtn.style.display = 'block';
    }
}

function checkAuthState() {
    // Check if user should be authenticated (simulate)
    // In a real app, this would check localStorage or make an API call
}

// Page navigation functions
function showLandingPage() {
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('home').classList.add('active');
}

function showDashboard() {
    if (!isAuthenticated) {
        showModal('loginModal');
        return;
    }
    
    document.querySelectorAll('.page-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('dashboard').classList.add('active');
    
    // Update dashboard content
    updateDashboardContent();
}

// Dashboard functions
function setupDashboardControls() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', handleDashboardNavigation);
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Quick actions
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', handleQuickAction);
    });
    
    // Gallery controls
    setupGalleryControls();
}

function handleDashboardNavigation(e) {
    e.preventDefault();
    
    const tabName = e.target.dataset.tab;
    if (!tabName) return;
    
    // Update sidebar active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Show corresponding tab
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Load tab-specific content
    if (tabName === 'gallery') {
        populateGallery();
    }
}

function handleQuickAction(e) {
    const action = e.target.closest('.action-btn').dataset.action;
    
    switch(action) {
        case 'studio':
            showStudioTab();
            break;
        case 'gallery':
            showGalleryTab();
            break;
        case 'upgrade':
            showUpgrade();
            break;
    }
}

function showStudioTab() {
    // Activate studio tab
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('.sidebar-link[data-tab="studio"]').classList.add('active');
    
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById('studio-tab').classList.add('active');
}

function showGalleryTab() {
    // Activate gallery tab
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector('.sidebar-link[data-tab="gallery"]').classList.add('active');
    
    document.querySelectorAll('.dashboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById('gallery-tab').classList.add('active');
    
    populateGallery();
}

function showUpgrade() {
    scrollToSection('pricing');
    showLandingPage();
}

function updateDashboardContent() {
    // Update stats
    const stats = appData.user_dashboard.usage_stats;
    document.getElementById('videosGenerated').textContent = stats.videos_generated;
    document.getElementById('monthlyUsage').textContent = `${stats.videos_generated}/${stats.monthly_limit}`;
    document.getElementById('storageUsed').textContent = stats.storage_used;
    
    // Update recent generations
    populateRecentGenerations();
}

function populateRecentGenerations() {
    const recentList = document.getElementById('recentList');
    const generations = appData.user_dashboard.recent_generations;
    
    recentList.innerHTML = generations.map(item => `
        <div class="recent-item">
            <div class="recent-info">
                <h4>${item.title}</h4>
                <p>${item.date} • ${item.duration}</p>
            </div>
            <span class="status status--${item.status === 'completed' ? 'success' : 'warning'}">
                ${item.status}
            </span>
        </div>
    `).join('');
}

// Studio functions
function setupStudioControls() {
    // Photo upload
    const photoUpload = document.getElementById('photoUpload');
    const photoInput = document.getElementById('photoInput');
    
    photoUpload.addEventListener('click', () => photoInput.click());
    photoUpload.addEventListener('dragover', handleDragOver);
    photoUpload.addEventListener('drop', handlePhotoDrop);
    photoInput.addEventListener('change', handlePhotoSelect);
    
    // Input tabs
    document.querySelectorAll('.input-tab').forEach(tab => {
        tab.addEventListener('click', handleInputTab);
    });
    
    // Audio upload
    document.getElementById('audioInput').addEventListener('change', handleAudioSelect);
    
    // Settings
    populateStudioSelects();
    
    // Duration slider
    const durationSlider = document.getElementById('durationSlider');
    const durationDisplay = document.getElementById('durationDisplay');
    
    durationSlider.addEventListener('input', (e) => {
        durationDisplay.textContent = `${e.target.value}s`;
    });
    
    // Generate button
    document.getElementById('generateBtn').addEventListener('click', handleGenerate);
    
    // Form validation
    setupStudioValidation();
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handlePhotoDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        handlePhotoFile(files[0]);
    }
}

function handlePhotoSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handlePhotoFile(file);
    }
}

function handlePhotoFile(file) {
    currentPhoto = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        const previewArea = document.getElementById('previewArea');
        previewArea.innerHTML = `
            <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px;">
        `;
    };
    reader.readAsDataURL(file);
    
    // Update upload area
    const uploadArea = document.getElementById('photoUpload');
    uploadArea.innerHTML = `
        <div class="upload-placeholder">
            <span class="upload-icon">✅</span>
            <p>Photo uploaded: ${file.name}</p>
            <small>Click to change photo</small>
        </div>
    `;
    
    validateStudioForm();
}

function handleInputTab(e) {
    const inputType = e.target.dataset.input;
    
    // Update tab active state
    document.querySelectorAll('.input-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Show corresponding panel
    document.querySelectorAll('.input-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${inputType}-panel`).classList.add('active');
    
    validateStudioForm();
}

function handleAudioSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const uploadBtn = document.querySelector('.audio-upload-btn');
        uploadBtn.innerHTML = `
            <span>✅</span>
            Audio: ${file.name}
        `;
    }
    
    validateStudioForm();
}

function populateStudioSelects() {
    // Voice options
    const voiceSelect = document.getElementById('voiceSelect');
    voiceSelect.innerHTML = appData.app_features.voice_options.map(voice => 
        `<option value="${voice.name}">${voice.name} (${voice.language} - ${voice.accent})</option>`
    ).join('');
    
    // AI models
    const aiModelSelect = document.getElementById('aiModelSelect');
    aiModelSelect.innerHTML = appData.app_features.ai_models.map(model => 
        `<option value="${model.name}">${model.name} - ${model.description}</option>`
    ).join('');
    
    // Resolutions
    const resolutionSelect = document.getElementById('resolutionSelect');
    resolutionSelect.innerHTML = appData.app_features.output_formats.map(format => 
        `<option value="${format.name}">${format.name} (${format.resolution}) - ${format.description}</option>`
    ).join('');
}

function setupStudioValidation() {
    // Add input listeners for validation
    document.getElementById('textInput').addEventListener('input', validateStudioForm);
    document.getElementById('audioInput').addEventListener('change', validateStudioForm);
}

function validateStudioForm() {
    const generateBtn = document.getElementById('generateBtn');
    const hasPhoto = currentPhoto !== null;
    const hasTextInput = document.getElementById('textInput').value.trim().length > 0;
    const hasAudioInput = document.getElementById('audioInput').files.length > 0;
    const activeInputTab = document.querySelector('.input-tab.active').dataset.input;
    
    let hasValidInput = false;
    if (activeInputTab === 'text' && hasTextInput) {
        hasValidInput = true;
    } else if (activeInputTab === 'audio' && hasAudioInput) {
        hasValidInput = true;
    }
    
    if (hasPhoto && hasValidInput) {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate AI Video';
    } else {
        generateBtn.disabled = true;
        if (!hasPhoto) {
            generateBtn.textContent = 'Upload Photo First';
        } else if (!hasValidInput) {
            generateBtn.textContent = 'Add Content Input';
        }
    }
}

function handleGenerate() {
    if (!currentPhoto) return;
    
    const textInput = document.getElementById('textInput').value;
    const aiModel = document.getElementById('aiModelSelect').value;
    const resolution = document.getElementById('resolutionSelect').value;
    const duration = document.getElementById('durationSlider').value;
    
    // Show progress modal
    showGenerationProgress();
}

function showGenerationProgress() {
    showModal('progressModal');
    
    const steps = [
        { text: 'Processing photo...', duration: 2000 },
        { text: 'Analyzing speech patterns...', duration: 3000 },
        { text: 'Generating AI video...', duration: 5000 },
        { text: 'Finalizing video...', duration: 2000 }
    ];
    
    let currentStep = 0;
    let progress = 0;
    
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressSteps = document.querySelectorAll('.step');
    
    function updateProgress() {
        if (currentStep >= steps.length) {
            // Generation complete
            setTimeout(() => {
                hideModal('progressModal');
                showGenerationComplete();
            }, 1000);
            return;
        }
        
        const step = steps[currentStep];
        progressText.textContent = step.text;
        
        // Update step indicators
        progressSteps[currentStep].classList.add('active');
        
        // Animate progress
        const stepProgress = 100 / steps.length;
        const targetProgress = (currentStep + 1) * stepProgress;
        
        const animateProgress = () => {
            if (progress < targetProgress) {
                progress += 2;
                progressFill.style.width = `${Math.min(progress, targetProgress)}%`;
                progressPercentage.textContent = `${Math.floor(Math.min(progress, targetProgress))}%`;
                requestAnimationFrame(animateProgress);
            }
        };
        
        animateProgress();
        
        setTimeout(() => {
            currentStep++;
            updateProgress();
        }, step.duration);
    }
    
    updateProgress();
}

function showGenerationComplete() {
    // Add new video to gallery
    const newVideo = {
        id: galleryVideos.length + 1,
        title: document.getElementById('textInput').value.substring(0, 20) + '...',
        date: new Date().toISOString().split('T')[0],
        duration: document.getElementById('durationSlider').value + 's',
        status: 'completed',
        thumbnail: '🎬'
    };
    
    galleryVideos.unshift(newVideo);
    
    // Update dashboard stats
    appData.user_dashboard.usage_stats.videos_generated++;
    updateDashboardContent();
    
    // Show success message
    alert('🎉 Your AI video has been generated successfully! Check your gallery to view and download it.');
    
    // Reset form
    resetStudioForm();
    
    // Show gallery
    showGalleryTab();
}

function resetStudioForm() {
    currentPhoto = null;
    document.getElementById('photoInput').value = '';
    document.getElementById('textInput').value = '';
    document.getElementById('audioInput').value = '';
    
    // Reset upload area
    const uploadArea = document.getElementById('photoUpload');
    uploadArea.innerHTML = `
        <div class="upload-placeholder">
            <span class="upload-icon">📷</span>
            <p>Drop your photo here or <span class="upload-link">browse</span></p>
            <small>Supports JPG, PNG, WebP • Max 10MB</small>
        </div>
    `;
    
    // Reset preview
    const previewArea = document.getElementById('previewArea');
    previewArea.innerHTML = `
        <div class="preview-placeholder">
            <span>👁️</span>
            <p>Upload photo to see preview</p>
        </div>
    `;
    
    validateStudioForm();
}

// Gallery functions
function setupGalleryControls() {
    // Sort filter
    document.getElementById('sortFilter').addEventListener('change', handleGallerySort);
    
    // View controls
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', handleGalleryView);
    });
}

function handleGallerySort(e) {
    const sortBy = e.target.value;
    
    galleryVideos.sort((a, b) => {
        switch(sortBy) {
            case 'date':
                return new Date(b.date) - new Date(a.date);
            case 'name':
                return a.title.localeCompare(b.title);
            case 'duration':
                return parseInt(b.duration) - parseInt(a.duration);
            default:
                return 0;
        }
    });
    
    populateGallery();
}

function handleGalleryView(e) {
    const viewType = e.target.dataset.view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Update gallery layout
    const galleryGrid = document.getElementById('galleryGrid');
    if (viewType === 'list') {
        galleryGrid.style.gridTemplateColumns = '1fr';
    } else {
        galleryGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
    }
}

function populateGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    
    galleryGrid.innerHTML = galleryVideos.map(video => `
        <div class="gallery-item">
            <div class="gallery-thumbnail">
                ${video.thumbnail}
            </div>
            <div class="gallery-info">
                <h4 class="gallery-title">${video.title}</h4>
                <p class="gallery-meta">${video.date} • ${video.duration}</p>
                <div class="gallery-actions">
                    <button class="btn btn--sm btn--outline" onclick="downloadVideo(${video.id})">
                        Download
                    </button>
                    <button class="btn btn--sm btn--outline" onclick="shareVideo(${video.id})">
                        Share
                    </button>
                    <button class="btn btn--sm btn--outline" onclick="deleteVideo(${video.id})">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function downloadVideo(id) {
    // Simulate download
    alert('🎬 Video download started! Check your downloads folder.');
}

function shareVideo(id) {
    const video = galleryVideos.find(v => v.id === id);
    if (video && navigator.share) {
        navigator.share({
            title: video.title,
            text: 'Check out this AI-generated video!',
            url: window.location.href
        });
    } else {
        // Fallback to copy link
        navigator.clipboard.writeText(window.location.href);
        alert('📋 Video link copied to clipboard!');
    }
}

function deleteVideo(id) {
    if (confirm('Are you sure you want to delete this video?')) {
        galleryVideos = galleryVideos.filter(v => v.id !== id);
        populateGallery();
        
        // Update stats
        appData.user_dashboard.usage_stats.videos_generated--;
        updateDashboardContent();
    }
}

// Content population functions
function populateContent() {
    populateDemo();
    populateFeatures();
    populatePricing();
    populateTestimonials();
    populateFAQ();
}

function populateDemo() {
    const demoGrid = document.getElementById('demoGrid');
    
    demoGrid.innerHTML = appData.demo_videos.map(demo => `
        <div class="demo-card">
            <div class="demo-thumbnail">🎬</div>
            <div class="demo-info">
                <h3 class="demo-title">${demo.title}</h3>
                <p>${demo.description}</p>
            </div>
        </div>
    `).join('');
}

function populateFeatures() {
    const featuresGrid = document.getElementById('featuresGrid');
    
    const featureIcons = {
        'AI Technology': '🤖',
        'Input Options': '🎤',
        'Output Quality': '🎬',
        'User Experience': '✨'
    };
    
    featuresGrid.innerHTML = appData.features_list.map(category => `
        <div class="feature-card">
            <div class="feature-icon">${featureIcons[category.category]}</div>
            <h3 class="feature-title">${category.category}</h3>
            <ul class="feature-list">
                ${category.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

function populatePricing() {
    const pricingGrid = document.getElementById('pricingGrid');
    
    pricingGrid.innerHTML = appData.pricing_tiers.map(tier => `
        <div class="pricing-card ${tier.popular ? 'popular' : ''}">
            <div class="pricing-header">
                <h3 class="pricing-name">${tier.name}</h3>
                <div class="pricing-price">
                    ${tier.price}
                    <span class="pricing-period">/${tier.period}</span>
                </div>
            </div>
            <ul class="pricing-features">
                ${tier.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            <button class="btn ${tier.name === 'Free' ? 'btn--outline' : 'btn--primary'} btn--full-width" 
                    onclick="selectPlan('${tier.name}')">
                ${tier.name === 'Free' ? 'Get Started' : 'Choose Plan'}
            </button>
        </div>
    `).join('');
}

function populateTestimonials() {
    const testimonialsGrid = document.getElementById('testimonialsGrid');
    
    testimonialsGrid.innerHTML = appData.testimonials.map(testimonial => `
        <div class="testimonial-card">
            <div class="testimonial-content">
                "${testimonial.content}"
            </div>
            <div class="testimonial-author">
                <div class="testimonial-avatar">
                    ${testimonial.name.charAt(0)}
                </div>
                <div class="testimonial-info">
                    <h4>${testimonial.name}</h4>
                    <p>${testimonial.role}, ${testimonial.company}</p>
                    <div class="testimonial-rating">
                        ${'★'.repeat(testimonial.rating)}
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function populateFAQ() {
    const faqGrid = document.getElementById('faqGrid');
    
    faqGrid.innerHTML = appData.faq_items.map((item, index) => `
        <div class="faq-item">
            <button class="faq-question" onclick="toggleFAQ(${index})">
                ${item.question}
                <span class="faq-toggle">▼</span>
            </button>
            <div class="faq-answer">
                ${item.answer}
            </div>
        </div>
    `).join('');
}

// FAQ functions
function setupFAQAccordion() {
    // Already handled in populateFAQ with onclick handlers
}

function toggleFAQ(index) {
    const faqItems = document.querySelectorAll('.faq-item');
    const faqItem = faqItems[index];
    
    faqItem.classList.toggle('open');
}

// Utility functions
function selectPlan(planName) {
    if (planName === 'Free') {
        showModal('signupModal');
    } else {
        alert(`🎉 You selected the ${planName} plan! Redirecting to payment...`);
        // In a real app, this would redirect to payment processing
    }
}

function showDemo() {
    alert('🎬 Demo video would play here showing AI TalkingPhoto in action!');
}

// Export functions for global access
window.downloadVideo = downloadVideo;
window.shareVideo = shareVideo;
window.deleteVideo = deleteVideo;
window.selectPlan = selectPlan;
window.toggleFAQ = toggleFAQ;
