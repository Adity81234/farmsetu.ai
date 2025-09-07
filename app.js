class NabhaApp {
    constructor() {
        this.currentRole = null;
        this.currentLanguage = 'en';
        this.isOnline = navigator.onLine;
        this.lessons = [];
        this.students = [];
        this.currentUser = null;
        this.translations = {};
        this.currentLesson = null;
        this.settings = {
            theme: 'auto',
            textSize: 'medium',
            highContrast: false,
            autoDownload: true
        };
        
        // Initialize immediately
        this.init();
    }

    async init() {
        console.log('Initializing app...');
        await this.loadData();
        this.registerServiceWorker();
        this.setupConnectionStatus();
        this.loadSettings();
        this.updateUI();
        // Setup event listeners immediately after init
        this.setupEventListeners();
        console.log('App initialized successfully');
    }

    // Service Worker Registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register(this.createServiceWorkerBlob());
                console.log('ServiceWorker registered successfully');
            } catch (error) {
                console.log('ServiceWorker registration failed: ', error);
            }
        }
    }

    createServiceWorkerBlob() {
        const swCode = `
            const CACHE_NAME = 'nabha-shell-v1';
            const urlsToCache = [
                '/',
                '/index.html',
                '/style.css',
                '/app.js'
            ];

            self.addEventListener('install', event => {
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then(cache => cache.addAll(urlsToCache))
                );
                self.skipWaiting();
            });

            self.addEventListener('activate', event => {
                event.waitUntil(
                    caches.keys().then(cacheNames => {
                        return Promise.all(
                            cacheNames.map(cacheName => {
                                if (cacheName !== CACHE_NAME) {
                                    return caches.delete(cacheName);
                                }
                            })
                        );
                    })
                );
                self.clients.claim();
            });

            self.addEventListener('fetch', event => {
                event.respondWith(
                    caches.match(event.request)
                        .then(response => {
                            if (response) {
                                return response;
                            }
                            return fetch(event.request);
                        })
                );
            });
        `;
        
        const blob = new Blob([swCode], { type: 'application/javascript' });
        return URL.createObjectURL(blob);
    }

    // Data Management
    async loadData() {
        // Load sample lessons with quiz data
        this.lessons = [
            {
                "id": "math-fractions-class6",
                "title": {
                    "en": "Fractions - Class 6",
                    "hi": "भिन्न - कक्षा 6", 
                    "pa": "ਭਿੰਨ - ਕਲਾਸ 6"
                },
                "subject": "Math",
                "thumbnail": "https://via.placeholder.com/300x200/3b82f6/white?text=Fractions",
                "duration": 15,
                "status": "not_started",
                "progress": 0,
                "downloaded": true,
                "content": {
                    "sections": [
                        {
                            "title": "What are Fractions?",
                            "text": "A fraction represents a part of a whole. For example, if you cut a pizza into 4 equal pieces and eat 1 piece, you have eaten 1/4 of the pizza.",
                            "image": "https://via.placeholder.com/400x300/f59e0b/white?text=Pizza+1/4"
                        },
                        {
                            "title": "Reading Fractions",
                            "text": "In the fraction 3/4: 3 is the numerator (top number) and 4 is the denominator (bottom number).",
                            "image": "https://via.placeholder.com/400x300/10b981/white?text=3/4"
                        }
                    ]
                },
                "quiz": {
                    "questions": [
                        {
                            "id": 1,
                            "type": "mcq",
                            "question": "What does 1/4 mean?",
                            "options": ["One out of four equal parts", "Four equal parts", "One plus four", "Four minus one"],
                            "correct": 0
                        },
                        {
                            "id": 2, 
                            "type": "mcq",
                            "question": "In the fraction 2/5, what is the numerator?",
                            "options": ["5", "2", "7", "3"],
                            "correct": 1
                        },
                        {
                            "id": 3,
                            "type": "true_false",
                            "question": "3/3 equals one whole.",
                            "correct": true
                        }
                    ]
                }
            },
            {
                "id": "english-grammar-basic",
                "title": {
                    "en": "Simple Grammar",
                    "hi": "सरल व्याकरण",
                    "pa": "ਸਾਧਾ ਵਿਆਕਰਣ"
                },
                "subject": "English",
                "thumbnail": "https://via.placeholder.com/300x200/8b5cf6/white?text=Grammar",
                "duration": 12,
                "status": "in_progress", 
                "progress": 60,
                "downloaded": true,
                "content": {
                    "sections": [
                        {
                            "title": "Nouns",
                            "text": "A noun is a word that names a person, place, thing, or idea. Examples: teacher, school, book, happiness.",
                            "image": "https://via.placeholder.com/400x300/ec4899/white?text=Nouns"
                        },
                        {
                            "title": "Verbs",
                            "text": "A verb is an action word. It tells us what someone or something is doing. Examples: run, jump, think, sleep.",
                            "image": "https://via.placeholder.com/400x300/f97316/white?text=Verbs"
                        }
                    ]
                },
                "quiz": {
                    "questions": [
                        {
                            "id": 1,
                            "type": "mcq",
                            "question": "Which word is a noun?",
                            "options": ["running", "beautiful", "teacher", "quickly"],
                            "correct": 2
                        },
                        {
                            "id": 2,
                            "type": "mcq", 
                            "question": "Which word is a verb?",
                            "options": ["table", "blue", "jump", "happy"],
                            "correct": 2
                        },
                        {
                            "id": 3,
                            "type": "true_false",
                            "question": "A verb describes an action.",
                            "correct": true
                        }
                    ]
                }
            },
            {
                "id": "digital-literacy-basics",
                "title": {
                    "en": "How to use Mouse & Keyboard",
                    "hi": "माउस और कीबोर्ड का उपयोग",
                    "pa": "ਮਾਊਸ ਅਤੇ ਕੀਬੋਰਡ ਦੀ ਵਰਤੋਂ"
                },
                "subject": "Digital Literacy",
                "thumbnail": "https://via.placeholder.com/300x200/06b6d4/white?text=Computer",
                "duration": 10,
                "status": "completed",
                "progress": 100,
                "downloaded": true,
                "content": {
                    "sections": [
                        {
                            "title": "Using a Mouse",
                            "text": "Hold the mouse gently with your right hand. Move it on a flat surface to move the cursor on screen. Left-click to select items.",
                            "image": "https://via.placeholder.com/400x300/84cc16/white?text=Mouse+Guide"
                        },
                        {
                            "title": "Using a Keyboard", 
                            "text": "Place your fingers on the home row keys. Use all ten fingers to type. The space bar creates spaces between words.",
                            "image": "https://via.placeholder.com/400x300/a855f7/white?text=Keyboard"
                        }
                    ]
                },
                "quiz": {
                    "questions": [
                        {
                            "id": 1,
                            "type": "mcq",
                            "question": "What does left-clicking the mouse do?",
                            "options": ["Delete items", "Select items", "Copy items", "Move items"],
                            "correct": 1
                        },
                        {
                            "id": 2,
                            "type": "true_false",
                            "question": "You should use only one finger to type.",
                            "correct": false
                        },
                        {
                            "id": 3,
                            "type": "mcq",
                            "question": "What creates spaces between words?",
                            "options": ["Enter key", "Shift key", "Space bar", "Tab key"],
                            "correct": 2
                        }
                    ]
                }
            }
        ];

        this.students = [
            {"id": "s001", "name": "Harjit Kaur", "class": "6A", "progress": {"math-fractions-class6": 100, "english-grammar-basic": 75, "digital-literacy-basics": 100}},
            {"id": "s002", "name": "Amar Singh", "class": "6A", "progress": {"math-fractions-class6": 60, "english-grammar-basic": 90, "digital-literacy-basics": 100}},
            {"id": "s003", "name": "Simran Sharma", "class": "6B", "progress": {"math-fractions-class6": 85, "english-grammar-basic": 40, "digital-literacy-basics": 75}},
            {"id": "s004", "name": "Ravi Patel", "class": "6A", "progress": {"math-fractions-class6": 30, "english-grammar-basic": 100, "digital-literacy-basics": 90}},
            {"id": "s005", "name": "Priya Gupta", "class": "6B", "progress": {"math-fractions-class6": 100, "english-grammar-basic": 85, "digital-literacy-basics": 100}}
        ];

        this.translations = {
            "en": {
                "selectLanguage": "Select Language",
                "chooseRole": "Choose Your Role", 
                "student": "Student",
                "teacher": "Teacher",
                "lessons": "Lessons",
                "progress": "Progress",
                "dashboard": "Dashboard",
                "startLesson": "Start Lesson",
                "takeQuiz": "Take Quiz",
                "retakeQuiz": "Retake Quiz",
                "completed": "Completed",
                "inProgress": "In Progress",
                "notStarted": "Not Started",
                "score": "Score",
                "correct": "Correct!",
                "incorrect": "Incorrect",
                "offline": "Offline",
                "online": "Online",
                "sync": "Sync Now",
                "synced": "Synced Successfully",
                "downloadComplete": "Downloaded",
                "classOverview": "Class Overview",
                "studentName": "Student Name",
                "avgProgress": "Avg Progress",
                "lastActivity": "Last Activity",
                "back": "Back",
                "next": "Next",
                "submit": "Submit",
                "audioNarration": "Audio Narration",
                "settings": "Settings",
                "author": "Author",
                "admin": "Admin"
            },
            "hi": {
                "selectLanguage": "भाषा चुनें",
                "chooseRole": "अपनी भूमिका चुनें",
                "student": "छात्र", 
                "teacher": "शिक्षक",
                "lessons": "पाठ",
                "progress": "प्रगति",
                "dashboard": "डैशबोर्ड",
                "startLesson": "पाठ शुरू करें",
                "takeQuiz": "प्रश्नोत्तरी लें",
                "retakeQuiz": "दोबारा प्रश्नोत्तरी लें",
                "completed": "पूर्ण",
                "inProgress": "चालू",
                "notStarted": "शुरू नहीं",
                "score": "अंक",
                "correct": "सही!",
                "incorrect": "गलत",
                "offline": "ऑफलाइन",
                "online": "ऑनलाइन", 
                "sync": "अब सिंक करें",
                "synced": "सफलतापूर्वक सिंक",
                "downloadComplete": "डाउनलोड हो गया",
                "classOverview": "कक्षा अवलोकन",
                "studentName": "छात्र का नाम",
                "avgProgress": "औसत प्रगति",
                "lastActivity": "अंतिम गतिविधि",
                "back": "वापस",
                "next": "अगला",
                "submit": "जमा करें",
                "audioNarration": "ऑडियो वर्णन",
                "settings": "सेटिंग्स",
                "author": "लेखक",
                "admin": "प्रशासक"
            },
            "pa": {
                "selectLanguage": "ਭਾਸ਼ਾ ਚੁਣੋ",
                "chooseRole": "ਆਪਣੀ ਭੂਮਿਕਾ ਚੁਣੋ",
                "student": "ਵਿਦਿਆਰਥੀ",
                "teacher": "ਅਧਿਆਪਕ", 
                "lessons": "ਪਾਠ",
                "progress": "ਪ੍ਰਗਤੀ",
                "dashboard": "ਡੈਸ਼ਬੋਰਡ",
                "startLesson": "ਪਾਠ ਸ਼ੁਰੂ ਕਰੋ",
                "takeQuiz": "ਟੈਸਟ ਲਓ",
                "retakeQuiz": "ਮੁੜ ਟੈਸਟ ਲਓ",
                "completed": "ਮੁਕੰਮਲ",
                "inProgress": "ਜਾਰੀ",
                "notStarted": "ਸ਼ੁਰੂ ਨਹੀਂ",
                "score": "ਸਕੋਰ",
                "correct": "ਸਹੀ!",
                "incorrect": "ਗਲਤ",
                "offline": "ਆਫਲਾਈਨ",
                "online": "ਆਨਲਾਈਨ",
                "sync": "ਹੁਣ ਸਿੰਕ ਕਰੋ",
                "synced": "ਸਫਲਤਾਪੂਰਵਕ ਸਿੰਕ",
                "downloadComplete": "ਡਾਊਨਲੋਡ ਮੁਕੰਮਲ",
                "classOverview": "ਕਲਾਸ ਸੰਖੇਪ",
                "studentName": "ਵਿਦਿਆਰਥੀ ਦਾ ਨਾਮ",
                "avgProgress": "ਔਸਤ ਪ੍ਰਗਤੀ",
                "lastActivity": "ਅੰਤਿਮ ਗਤੀਵਿਧੀ", 
                "back": "ਵਾਪਸ",
                "next": "ਅਗਲਾ",
                "submit": "ਜਮ੍ਹਾ ਕਰੋ",
                "audioNarration": "ਆਡੀਓ ਬਿਰਤਾਂਤ",
                "settings": "ਸੈਟਿੰਗਾਂ",
                "author": "ਲੇਖਕ",
                "admin": "ਪ੍ਰਸ਼ਾਸਕ"
            }
        };
    }

    saveData() {
        try {
            localStorage.setItem('nabha-lessons', JSON.stringify(this.lessons));
            localStorage.setItem('nabha-students', JSON.stringify(this.students));
            localStorage.setItem('nabha-settings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }

    // Event Listeners - Completely rewritten for reliability
    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Global click handler with specific element targeting
        document.addEventListener('click', (e) => {
            console.log('Click detected on:', e.target, e.target.className);
            
            // Role card clicks - check both direct card and any child elements
            const roleCard = e.target.closest('.role-card');
            if (roleCard) {
                e.preventDefault();
                e.stopPropagation();
                const role = roleCard.getAttribute('data-role');
                console.log('Role card clicked:', role);
                if (role) {
                    this.setRole(role);
                    return;
                }
            }
            
            // Navigation button clicks
            const navBtn = e.target.closest('.nav-btn');
            if (navBtn) {
                e.preventDefault();
                e.stopPropagation();
                const view = navBtn.getAttribute('data-view');
                console.log('Nav button clicked:', view);
                if (view) {
                    if (view === 'role-selector') {
                        this.showRoleSelector();
                    } else {
                        this.showView(view);
                    }
                    // Update active state
                    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                    navBtn.classList.add('active');
                    return;
                }
            }
            
            // Lesson play button clicks
            const playBtn = e.target.closest('.play-btn');
            if (playBtn) {
                e.preventDefault();
                e.stopPropagation();
                const lessonId = playBtn.getAttribute('data-lesson-id');
                console.log('Play button clicked:', lessonId);
                if (lessonId) {
                    this.playLesson(lessonId);
                    return;
                }
            }
            
            // Settings button click
            if (e.target.closest('#settings-btn')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Settings button clicked');
                this.showModal('settings-modal');
                return;
            }
            
            // Modal close buttons
            if (e.target.closest('#close-settings-modal')) {
                e.preventDefault();
                this.hideModal('settings-modal');
                return;
            }
            
            if (e.target.closest('#close-lesson-modal')) {
                e.preventDefault();
                this.hideModal('lesson-modal');
                return;
            }
            
            // Quiz buttons
            if (e.target.closest('#start-quiz')) {
                e.preventDefault();
                this.showQuiz();
                return;
            }
            
            if (e.target.closest('#submit-quiz')) {
                e.preventDefault();
                this.submitQuiz();
                return;
            }
            
            // Sync button
            if (e.target.closest('#sync-btn')) {
                e.preventDefault();
                this.syncData();
                return;
            }
            
            // Modal overlay clicks
            if (e.target.classList.contains('modal-overlay')) {
                const modal = e.target.closest('.modal');
                if (modal) {
                    modal.classList.add('hidden');
                }
                return;
            }
        });

        // Language switcher (change event)
        const languageSwitcher = document.getElementById('language-switcher');
        if (languageSwitcher) {
            languageSwitcher.addEventListener('change', (e) => {
                console.log('Language changed to:', e.target.value);
                this.setLanguage(e.target.value);
            });
        }

        // Settings form handlers
        this.setupSettingsHandlers();
        
        console.log('Event listeners setup complete');
    }

    setupSettingsHandlers() {
        const themeSelector = document.getElementById('theme-selector');
        if (themeSelector) {
            themeSelector.addEventListener('change', (e) => {
                this.settings.theme = e.target.value;
                this.applyTheme();
                this.saveData();
            });
        }

        const textSizeSelector = document.getElementById('text-size-selector');
        if (textSizeSelector) {
            textSizeSelector.addEventListener('change', (e) => {
                this.settings.textSize = e.target.value;
                this.applyTextSize();
                this.saveData();
            });
        }

        const highContrastMode = document.getElementById('high-contrast-mode');
        if (highContrastMode) {
            highContrastMode.addEventListener('change', (e) => {
                this.settings.highContrast = e.target.checked;
                this.applyHighContrast();
                this.saveData();
            });
        }
    }

    // Connection Status
    setupConnectionStatus() {
        const updateStatus = () => {
            const statusEl = document.getElementById('connection-status');
            const textEl = document.getElementById('status-text');
            
            if (navigator.onLine) {
                if (statusEl) {
                    statusEl.classList.remove('offline');
                    statusEl.classList.add('online');
                }
                if (textEl) {
                    textEl.textContent = this.translate('online');
                }
                this.isOnline = true;
            } else {
                if (statusEl) {
                    statusEl.classList.remove('online');
                    statusEl.classList.add('offline');
                }
                if (textEl) {
                    textEl.textContent = this.translate('offline');
                }
                this.isOnline = false;
                this.showToast('You are offline. Some features may be limited.', 'warning');
            }
        };

        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        updateStatus();
    }

    // Role Management
    setRole(role) {
        console.log('Setting role to:', role);
        this.currentRole = role;
        this.updateNavigation();
        
        switch(role) {
            case 'student':
                this.showView('student-dashboard');
                this.loadStudentDashboard();
                break;
            case 'teacher':
                this.showView('teacher-dashboard');
                this.loadTeacherDashboard();
                break;
            case 'author':
                this.showView('author-dashboard');
                break;
            case 'admin':
                this.showView('admin-dashboard');
                break;
        }
        
        this.showToast(`Welcome, ${this.translate(role)}!`, 'success');
    }

    showRoleSelector() {
        console.log('Showing role selector');
        this.currentRole = null;
        this.updateNavigation();
        this.showView('role-selector');
        // Reset nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const homeBtn = document.querySelector('.nav-btn[data-view="role-selector"]');
        if (homeBtn) {
            homeBtn.classList.add('active');
        }
    }

    updateNavigation() {
        // Hide all role-specific nav items
        const studentNav = document.getElementById('student-nav');
        const teacherNav = document.getElementById('teacher-nav');
        const authorNav = document.getElementById('author-nav');
        const adminNav = document.getElementById('admin-nav');
        
        if (studentNav) studentNav.style.display = 'none';
        if (teacherNav) teacherNav.style.display = 'none';
        if (authorNav) authorNav.style.display = 'none';
        if (adminNav) adminNav.style.display = 'none';

        // Show relevant nav item
        if (this.currentRole) {
            const currentNav = document.getElementById(`${this.currentRole}-nav`);
            if (currentNav) {
                currentNav.style.display = 'block';
            }
        }
    }

    // View Management
    showView(viewId) {
        console.log('Showing view:', viewId);
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });
        const targetView = document.getElementById(viewId);
        if (targetView) {
            targetView.style.display = 'block';
        } else {
            console.error('View not found:', viewId);
        }
    }

    // Language Management
    setLanguage(lang) {
        console.log('Setting language to:', lang);
        this.currentLanguage = lang;
        document.documentElement.lang = lang;
        this.updateTranslations();
        // Re-render current view to update language
        if (this.currentRole === 'student') {
            this.renderLessons();
        }
        this.saveData();
    }

    translate(key) {
        return this.translations[this.currentLanguage]?.[key] || key;
    }

    updateTranslations() {
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.dataset.translate;
            el.textContent = this.translate(key);
        });
    }

    // Student Dashboard
    loadStudentDashboard() {
        console.log('Loading student dashboard');
        this.renderLessons();
    }

    renderLessons() {
        const grid = document.getElementById('lessons-grid');
        if (!grid) {
            console.error('Lessons grid not found');
            return;
        }
        
        grid.innerHTML = '';
        console.log('Rendering lessons:', this.lessons.length);

        this.lessons.forEach(lesson => {
            const card = document.createElement('div');
            card.className = 'card lesson-card';
            
            const title = lesson.title[this.currentLanguage] || lesson.title.en || lesson.title;
            const progressValue = lesson.progress || 0;
            const statusText = lesson.status === 'completed' ? this.translate('completed') : 
                              lesson.status === 'in_progress' ? this.translate('inProgress') : 
                              this.translate('notStarted');
            
            card.innerHTML = `
                <img src="${lesson.thumbnail}" alt="${title}" class="lesson-thumbnail">
                <div class="download-status ${lesson.downloaded ? 'downloaded' : ''}">
                    ${lesson.downloaded ? '✓ ' + this.translate('downloadComplete') : '☁️ Online'}
                </div>
                <div class="card__body">
                    <h3 class="font-bold mb-4">${title}</h3>
                    <div class="lesson-meta mb-8">
                        <span>⏱️ ${lesson.duration} min</span>
                        <span>📊 ${statusText}</span>
                        <span>🏷️ ${lesson.subject}</span>
                    </div>
                    <div class="progress-bar mb-8">
                        <div class="progress-fill" style="width: ${progressValue}%"></div>
                    </div>
                    <div class="flex gap-8">
                        <button class="btn btn--primary btn--sm play-btn" data-lesson-id="${lesson.id}">
                            ▶️ ${this.translate('startLesson')}
                        </button>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });
    }

    playLesson(lessonId) {
        const lesson = this.lessons.find(l => l.id === lessonId);
        if (!lesson) {
            console.error('Lesson not found:', lessonId);
            return;
        }

        if (!lesson.downloaded && !this.isOnline) {
            this.showToast('This lesson is not downloaded and you are offline', 'error');
            return;
        }

        console.log('Playing lesson:', lesson);
        this.currentLesson = lesson;
        this.showLessonPlayer(lesson);
    }

    showLessonPlayer(lesson) {
        const modalTitle = document.getElementById('lesson-modal-title');
        const contentArea = document.getElementById('lesson-content-area');
        
        const title = lesson.title[this.currentLanguage] || lesson.title.en || lesson.title;
        
        if (modalTitle) {
            modalTitle.textContent = title;
        }
        
        if (contentArea) {
            let contentHTML = '';
            if (lesson.content && lesson.content.sections) {
                lesson.content.sections.forEach(section => {
                    contentHTML += `
                        <div class="lesson-section mb-16">
                            <h3 class="font-bold mb-8">${section.title}</h3>
                            <p class="mb-8">${section.text}</p>
                            ${section.image ? `<img src="${section.image}" alt="${section.title}" class="w-full max-w-md mx-auto mb-8" style="border-radius: 8px;">` : ''}
                        </div>
                    `;
                });
            }
            contentArea.innerHTML = contentHTML;
            contentArea.style.display = 'block';
        }
        
        // Reset quiz area
        const quizArea = document.getElementById('quiz-area');
        if (quizArea) {
            quizArea.style.display = 'none';
        }
        
        // Show start quiz button
        const startQuizBtn = document.getElementById('start-quiz');
        if (startQuizBtn) {
            startQuizBtn.style.display = 'block';
        }
        
        console.log('Showing lesson modal');
        this.showModal('lesson-modal');
    }

    showQuiz() {
        const contentArea = document.getElementById('lesson-content-area');
        const quizArea = document.getElementById('quiz-area');
        const startQuizBtn = document.getElementById('start-quiz');
        
        if (contentArea) contentArea.style.display = 'none';
        if (quizArea) quizArea.style.display = 'block';
        if (startQuizBtn) startQuizBtn.style.display = 'none';
        
        this.renderQuiz();
    }

    renderQuiz() {
        const questionsEl = document.getElementById('quiz-questions');
        if (!questionsEl || !this.currentLesson || !this.currentLesson.quiz) return;
        
        questionsEl.innerHTML = '';

        this.currentLesson.quiz.questions.forEach((question, index) => {
            const questionEl = document.createElement('div');
            questionEl.className = 'question';
            
            let questionHTML = `
                <div class="question-prompt">${index + 1}. ${question.question}</div>
            `;

            if (question.type === 'mcq') {
                questionHTML += `<div class="question-options">`;
                question.options.forEach((option, optIndex) => {
                    questionHTML += `
                        <label class="option-label">
                            <input type="radio" name="q${question.id}" value="${optIndex}">
                            <span>${option}</span>
                        </label>
                    `;
                });
                questionHTML += `</div>`;
            } else if (question.type === 'true_false') {
                questionHTML += `
                    <div class="question-options">
                        <label class="option-label">
                            <input type="radio" name="q${question.id}" value="true">
                            <span>True</span>
                        </label>
                        <label class="option-label">
                            <input type="radio" name="q${question.id}" value="false">
                            <span>False</span>
                        </label>
                    </div>
                `;
            }

            questionEl.innerHTML = questionHTML;
            questionsEl.appendChild(questionEl);
        });
    }

    submitQuiz() {
        if (!this.currentLesson || !this.currentLesson.quiz) return;
        
        let score = 0;
        let total = this.currentLesson.quiz.questions.length;
        
        this.currentLesson.quiz.questions.forEach(question => {
            if (question.type === 'mcq') {
                const selected = document.querySelector(`input[name="q${question.id}"]:checked`);
                if (selected) {
                    const answerIndex = parseInt(selected.value);
                    if (answerIndex === question.correct) {
                        score++;
                    }
                }
            } else if (question.type === 'true_false') {
                const selected = document.querySelector(`input[name="q${question.id}"]:checked`);
                if (selected) {
                    const answer = selected.value === 'true';
                    if (answer === question.correct) {
                        score++;
                    }
                }
            }
        });

        const percentage = Math.round((score / total) * 100);
        this.showQuizResult({ score, total, percentage });
        this.updateProgress();
    }

    showQuizResult(result) {
        const questionsEl = document.getElementById('quiz-questions');
        const submitBtn = document.getElementById('submit-quiz');
        
        if (questionsEl) {
            const resultHTML = `
                <div class="quiz-result">
                    <div class="quiz-score">${result.score}/${result.total}</div>
                    <h3>Quiz Complete!</h3>
                    <p>You scored ${result.percentage}%</p>
                    <button class="btn btn--primary mt-16" onclick="app.hideModal('lesson-modal')">Continue</button>
                </div>
            `;
            questionsEl.innerHTML = resultHTML;
        }
        
        if (submitBtn) {
            submitBtn.style.display = 'none';
        }
    }

    updateProgress() {
        if (this.currentLesson) {
            // Update lesson progress to completed
            this.currentLesson.progress = 100;
            this.currentLesson.status = 'completed';
            this.saveData();
        }
    }

    // Teacher Dashboard
    loadTeacherDashboard() {
        console.log('Loading teacher dashboard');
        this.updateTeacherStats();
        this.renderStudentProgress();
    }

    updateTeacherStats() {
        const totalStudentsEl = document.getElementById('total-students');
        const activeLessonsEl = document.getElementById('active-lessons');
        const avgProgressEl = document.getElementById('avg-progress');
        
        if (totalStudentsEl) totalStudentsEl.textContent = this.students.length;
        if (activeLessonsEl) activeLessonsEl.textContent = this.lessons.length;
        
        let totalProgress = 0;
        let count = 0;
        this.students.forEach(student => {
            Object.values(student.progress || {}).forEach(progress => {
                totalProgress += progress;
                count++;
            });
        });
        
        const avgProgress = count > 0 ? Math.round(totalProgress / count) : 0;
        if (avgProgressEl) avgProgressEl.textContent = `${avgProgress}%`;
    }

    renderStudentProgress() {
        const listEl = document.getElementById('student-progress-list');
        if (!listEl) return;
        
        listEl.innerHTML = '';

        this.students.forEach(student => {
            const progressItems = Object.entries(student.progress || {});
            const avgProgress = progressItems.length > 0 
                ? progressItems.reduce((sum, [, progress]) => sum + progress, 0) / progressItems.length 
                : 0;

            const itemEl = document.createElement('div');
            itemEl.className = 'student-item';
            itemEl.innerHTML = `
                <div class="student-info">
                    <div class="student-name">${student.name}</div>
                    <div class="student-class">Class ${student.class}</div>
                </div>
                <div class="student-progress">
                    <div class="text-sm text-text-secondary mb-2">${Math.round(avgProgress)}%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${avgProgress}%"></div>
                    </div>
                </div>
            `;
            
            listEl.appendChild(itemEl);
        });
    }

    // Data Sync
    async syncData() {
        if (!this.isOnline) {
            this.showToast('Sync requires internet connection', 'error');
            return;
        }

        this.showToast('Syncing data...', 'info');
        
        // Simulate sync process
        setTimeout(() => {
            this.showToast(this.translate('synced'), 'success');
        }, 2000);
    }

    // Settings Management
    loadSettings() {
        const saved = localStorage.getItem('nabha-settings');
        if (saved) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            } catch (e) {
                console.error('Error loading settings:', e);
            }
        }
        
        // Apply settings
        this.applyTheme();
        this.applyTextSize();
        this.applyHighContrast();
        
        // Update form controls
        const themeSelector = document.getElementById('theme-selector');
        const textSizeSelector = document.getElementById('text-size-selector');
        const highContrastMode = document.getElementById('high-contrast-mode');
        
        if (themeSelector) themeSelector.value = this.settings.theme;
        if (textSizeSelector) textSizeSelector.value = this.settings.textSize;
        if (highContrastMode) highContrastMode.checked = this.settings.highContrast;
    }

    applyTheme() {
        const html = document.documentElement;
        if (this.settings.theme === 'auto') {
            html.removeAttribute('data-color-scheme');
        } else {
            html.setAttribute('data-color-scheme', this.settings.theme);
        }
    }

    applyTextSize() {
        document.body.className = document.body.className.replace(/text-size-\w+/, '');
        document.body.classList.add(`text-size-${this.settings.textSize}`);
    }

    applyHighContrast() {
        if (this.settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
    }

    // UI Helpers
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            console.log('Showing modal:', modalId);
            modal.classList.remove('hidden');
        } else {
            console.error('Modal not found:', modalId);
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            console.log('Hiding modal:', modalId);
            modal.classList.add('hidden');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) {
            console.error('Toast container not found');
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="flex items-center justify-between">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="btn btn--sm" style="background:none;border:none;color:inherit;padding:0;margin-left:8px;">✕</button>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 5000);
    }

    updateUI() {
        this.updateTranslations();
    }
}

// Initialize app when DOM is loaded - simplified approach
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    app = new NabhaApp();
});

// PWA functionality
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    deferredPrompt = e;
    console.log('PWA install prompt ready');
});

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    if (app) {
        app.showToast('App installed successfully!', 'success');
    }
});

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal:not(.hidden)').forEach(modal => {
            modal.classList.add('hidden');
        });
    }
});