/**
 * Stream Pet Configuration Manager
 * Handles configuration UI interactions
 */

class ConfigManager {
    constructor() {
        this.config = null;
        this.autoSaveTimer = null;
        this.autoSaveDelay = 2000; // 2 seconds debounce
        this.lastSaveTime = 0;
        this.saveInProgress = false;
        this.popoutWindow = null; // Reference to popped-out preview window
        this.init();
    }

    /**
     * Initialize configuration manager
     */
    init() {
        // Clean up old image storage (no longer used)
        if (localStorage.getItem('streamPetImages')) {
            console.log('Removing old image storage data to free up space...');
            localStorage.removeItem('streamPetImages');
        }
        
        // Initialize theme (dark mode by default)
        this.initTheme();
        
        // Load config
        this.config = petStorage.load();

        // Setup tab switching
        this.setupTabs();

        // Load form values
        this.loadFormValues();

        // Setup event listeners
        this.setupEventListeners();

        // Build dynamic sections
        this.buildEventsSection();
        this.buildCommandsSection();
        this.buildStatesSection();
        this.buildTestingSection();

        // Load JSON display
        this.updateJsonDisplay();
        
        // Setup auto-save on input changes
        this.setupAutoSave();
        
        // Update Twitch connection status
        this.updateTwitchStatus();
        setInterval(() => this.updateTwitchStatus(), 5000); // Check every 5 seconds

        // Check for closed popout window periodically
        setInterval(() => {
            if (this.popoutWindow && this.popoutWindow.closed) {
                console.log('Detected closed popout window, cleaning up reference');
                this.popoutWindow = null;
            }
        }, 1000);

        // Setup Spotify redirect URI display
        const spotifyRedirectUriElement = document.getElementById('spotify-redirect-uri');
        if (spotifyRedirectUriElement) {
            // Check for custom redirect URI in config
            const customRedirect = this.config.integrations?.spotify?.customRedirectUri;
            const defaultRedirect = 'https://example.com/callback';
            spotifyRedirectUriElement.textContent = customRedirect || defaultRedirect;
            
            // Also populate the custom redirect input if it exists
            const customRedirectInput = document.getElementById('custom-redirect-uri');
            if (customRedirectInput && customRedirect) {
                customRedirectInput.value = customRedirect;
            }
        }
        
        // Check for Spotify OAuth callback (auto-detect if URL has token)
        handleSpotifyCallback();
        updateSpotifyStatus();
        
        // Listen for Spotify token from popup window
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'spotify_token') {
                const tokenData = event.data.data;
                if (tokenData.access_token && tokenData.state) {
                    const savedState = localStorage.getItem('spotify_auth_state');
                    if (tokenData.state === savedState) {
                        localStorage.setItem('spotify_access_token', tokenData.access_token);
                        localStorage.setItem('spotify_token_expiry', tokenData.token_expiry.toString());
                        localStorage.removeItem('spotify_auth_state');
                        updateSpotifyStatus();
                        this.showNotification('✅ Spotify connected successfully!', 'success');
                    }
                }
            }
        });

        console.log('Config Manager initialized');
    }

    /**
     * Initialize theme system
     */
    initTheme() {
        // Check saved preference, default to dark mode
        const savedTheme = localStorage.getItem('streamPetConfigTheme') || 'dark';
        if (savedTheme === 'light') {
            document.body.classList.add('light-mode');
            document.querySelector('.theme-icon').textContent = '🌙';
        } else {
            document.body.classList.remove('light-mode');
            document.querySelector('.theme-icon').textContent = '☀️';
        }
        
        // Check preview minimized preference
        const previewMinimized = localStorage.getItem('streamPetPreviewMinimized') === 'true';
        if (previewMinimized) {
            document.getElementById('preview-panel').classList.add('minimized');
            document.getElementById('toggle-preview').textContent = '+';
        }
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const isLight = document.body.classList.toggle('light-mode');
        const icon = document.querySelector('.theme-icon');
        
        if (isLight) {
            icon.textContent = '🌙';
            localStorage.setItem('streamPetConfigTheme', 'light');
        } else {
            icon.textContent = '☀️';
            localStorage.setItem('streamPetConfigTheme', 'dark');
        }
    }

    /**
     * Toggle preview panel
     */
    togglePreview() {
        const panel = document.getElementById('preview-panel');
        const button = document.getElementById('toggle-preview');
        const isMinimized = panel.classList.toggle('minimized');
        
        button.textContent = isMinimized ? '+' : '−';
        
        // Save preference
        localStorage.setItem('streamPetPreviewMinimized', isMinimized ? 'true' : 'false');
    }

    /**
     * Setup tab switching
     */
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.dataset.tab;

                // Update active states
                tabButtons.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

    /**
     * Load configuration into form
     */
    loadFormValues() {
        // Pet settings
        document.getElementById('pet-name').value = this.config.pet.name;
        document.getElementById('default-image').value = this.config.pet.defaultImage;
        document.getElementById('blink-image').value = this.config.pet.blinkImage;
        document.getElementById('blink-interval').value = this.config.pet.blinkInterval;
        document.getElementById('blink-duration').value = this.config.pet.blinkDuration;
        
        // Size settings
        const sizeMode = this.config.pet.size.mode || 'pixels';
        document.getElementById('pet-size-mode').value = sizeMode;
        document.getElementById('pet-width').value = this.config.pet.size.width || 200;
        document.getElementById('pet-height').value = this.config.pet.size.height || 200;
        document.getElementById('pet-width-percent').value = this.config.pet.size.widthPercent || 10;
        document.getElementById('pet-height-percent').value = this.config.pet.size.heightPercent || 10;
        document.getElementById('pet-scale').value = this.config.pet.size.scale || 1.0;
        document.getElementById('maintain-aspect').checked = this.config.pet.size.maintainAspect !== false;
        this.updateSizeModeUI(sizeMode);
        
        document.getElementById('pet-x').value = this.config.pet.position.x;
        document.getElementById('pet-y').value = this.config.pet.position.y;
        document.getElementById('pet-opacity').value = this.config.pet.opacity;
        document.getElementById('opacity-value').textContent = this.config.pet.opacity;
        document.getElementById('flip-horizontal').checked = this.config.pet.flipHorizontal;
        document.getElementById('enable-click').checked = this.config.advanced.enableClickInteraction;
        document.getElementById('debug-mode').checked = this.config.advanced.debugMode;
        document.getElementById('bubble-style').value = this.config.advanced.bubbleStyle || 'default';
        document.getElementById('enable-sounds').checked = this.config.advanced.enableSounds !== false;
        document.getElementById('sound-volume').value = this.config.advanced.soundVolume || 0.5;
        document.getElementById('volume-value').textContent = Math.round((this.config.advanced.soundVolume || 0.5) * 100) + '%';
        document.getElementById('enable-particles').checked = this.config.advanced.enableParticles !== false;
        document.getElementById('enable-idle-animations').checked = this.config.advanced.enableIdleAnimations !== false;
        document.getElementById('idle-interval').value = (this.config.advanced.idleAnimationInterval || 30000) / 1000;
        
        // Idle animation checkboxes
        
        // Load enhancement sections
        this.loadGrowthSettings();
        this.loadViewerInteractionSettings();
        this.loadGreetingsSettings();
        this.loadSeasonalSettings();
        this.loadAnalyticsDisplay();
        this.loadAnimationsSettings();
        this.loadIntegrationsSettings();
        this.loadParticleSettings();
        const idleAnims = this.config.advanced.idleAnimations || { bounce: true, wiggle: true, float: true, spin: false, sway: true, hop: true };
        document.getElementById('idle-bounce').checked = idleAnims.bounce !== false;
        document.getElementById('idle-wiggle').checked = idleAnims.wiggle !== false;
        document.getElementById('idle-float').checked = idleAnims.float !== false;
        document.getElementById('idle-spin').checked = idleAnims.spin === true;
        document.getElementById('idle-sway').checked = idleAnims.sway !== false;
        document.getElementById('idle-hop').checked = idleAnims.hop !== false;
        
        // Click interaction settings
        document.getElementById('click-message').value = this.config.advanced.clickMessage || 'You clicked me! 😊';
        document.getElementById('click-animation').value = this.config.advanced.clickAnimation || 'bounce';
        document.getElementById('click-particles').value = this.config.advanced.clickParticles || 'hearts';
        document.getElementById('click-sound').value = this.config.advanced.clickSound || '';

        // Twitch settings
        document.getElementById('twitch-enabled').checked = this.config.twitch.enabled;
        document.getElementById('twitch-channel').value = this.config.twitch.channel;
        document.getElementById('twitch-client-id').value = this.config.twitch.clientId || '';
        document.getElementById('twitch-redirect-uri').value = this.config.twitch.redirectUri || window.location.href;
        document.getElementById('use-anonymous').checked = this.config.twitch.useAnonymous;
        document.getElementById('use-bot-account').checked = this.config.twitch.useBotAccount || false;
        document.getElementById('bot-username').value = this.config.twitch.botUsername || '';
        
        // Emote rain settings
        const emoteRain = this.config.twitch.emoteRain || {};
        document.getElementById('emote-rain-enabled').checked = emoteRain.enabled || false;
        document.getElementById('emote-rain-user-level').value = emoteRain.userLevel || 'all';
        document.getElementById('emote-rain-count').value = emoteRain.maxEmotes || 5;
        document.getElementById('emote-rain-size').value = emoteRain.emoteSize || 48;
        document.getElementById('emote-rain-size-value').textContent = (emoteRain.emoteSize || 48) + 'px';
        document.getElementById('emote-rain-duration').value = emoteRain.fallDuration || 2000;
        document.getElementById('emote-rain-duration-value').textContent = (emoteRain.fallDuration || 2000) + 'ms';
        document.getElementById('emote-rain-cooldown').value = emoteRain.userCooldown || 5;
        document.getElementById('emote-rain-global-cooldown').value = emoteRain.globalCooldown || 1;
        document.getElementById('emote-rain-rotate').checked = emoteRain.rotate !== false;
        document.getElementById('emote-rain-bounce').checked = emoteRain.bounce !== false;
        
        // Update auth status
        this.updateAuthStatus();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Save button
        document.getElementById('save-config').addEventListener('click', () => this.saveConfig());

        // Sync to preview button
        document.getElementById('sync-preview').addEventListener('click', () => {
            console.log('Sync to Preview button clicked!');
            this.syncToPreview();
        });

        // Pop out preview button
        document.getElementById('popout-preview').addEventListener('click', () => {
            this.popOutPreview();
        });

        // Reset button
        document.getElementById('reset-config').addEventListener('click', () => this.resetConfig());

        // Export button
        document.getElementById('export-config').addEventListener('click', () => this.exportConfig());

        // Import button
        document.getElementById('import-config').addEventListener('click', () => this.importConfig());

        // Apply JSON button
        document.getElementById('apply-json').addEventListener('click', () => this.applyJson());

        // Refresh preview
        document.getElementById('refresh-preview').addEventListener('click', () => this.refreshPreview());

        // Opacity slider
        document.getElementById('pet-opacity').addEventListener('input', (e) => {
            document.getElementById('opacity-value').textContent = e.target.value;
        });
        
        // Sound volume slider
        document.getElementById('sound-volume').addEventListener('input', (e) => {
            document.getElementById('volume-value').textContent = Math.round(e.target.value * 100) + '%';
        });

        // Size mode selector
        const petSizeMode = document.getElementById('pet-size-mode');
        if (petSizeMode) {
            petSizeMode.addEventListener('change', (e) => {
                this.updateSizeModeUI(e.target.value);
                this.scheduleAutoSave();
            });
        }

        // Add state button
        document.getElementById('add-state').addEventListener('click', () => this.addCustomState());
        
        // Add command button
        document.getElementById('add-command').addEventListener('click', () => this.addCustomCommand());

        // Theme toggle button
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Preview toggle button
        document.getElementById('toggle-preview').addEventListener('click', () => this.togglePreview());
        
        // Also toggle on header click
        document.querySelector('.preview-header').addEventListener('click', (e) => {
            if (e.target.id !== 'toggle-preview') {
                this.togglePreview();
            }
        });

        // Twitch authentication buttons
        document.getElementById('authenticate-main').addEventListener('click', () => this.authenticateMainAccount());
        document.getElementById('disconnect-main').addEventListener('click', () => this.disconnectMainAccount());
        document.getElementById('authenticate-bot').addEventListener('click', () => this.authenticateBotAccount());
        document.getElementById('disconnect-bot').addEventListener('click', () => this.disconnectBotAccount());

        // Position configuration button
        const configurePositionBtn = document.getElementById('configure-position-btn');
        if (configurePositionBtn) {
            configurePositionBtn.addEventListener('click', () => this.openPositionConfigMode());
        }

        // Greetings buttons
        const addGreetingMessage = document.getElementById('add-greeting-message');
        if (addGreetingMessage) {
            addGreetingMessage.addEventListener('click', () => this.addGreetingMessage());
        }

        const addCustomGreeting = document.getElementById('add-custom-greeting');
        if (addCustomGreeting) {
            addCustomGreeting.addEventListener('click', () => this.addCustomGreeting());
        }

        const resetGreetingSession = document.getElementById('reset-greeting-session');
        if (resetGreetingSession) {
            resetGreetingSession.addEventListener('click', () => this.resetGreetingSession());
        }

        // Analytics buttons
        const refreshAnalytics = document.getElementById('refresh-analytics');
        if (refreshAnalytics) {
            refreshAnalytics.addEventListener('click', () => this.loadAnalyticsDisplay());
        }

        // Weather buttons
        const startWeather = document.getElementById('start-weather');
        if (startWeather) {
            startWeather.addEventListener('click', () => {
                const type = document.getElementById('weather-type').value;
                if (type !== 'none') {
                    this.sendToPreview({ type: 'startWeather', weatherType: type });
                }
            });
        }

        const stopWeather = document.getElementById('stop-weather');
        if (stopWeather) {
            stopWeather.addEventListener('click', () => {
                this.sendToPreview({ type: 'stopWeather' });
            });
        }

        // Physics toggle
        const togglePhysics = document.getElementById('toggle-physics');
        if (togglePhysics) {
            togglePhysics.addEventListener('click', () => {
                this.sendToPreview({ type: 'togglePhysics' });
            });
        }

        // Apply force button
        const applyForce = document.getElementById('apply-force');
        if (applyForce) {
            applyForce.addEventListener('click', () => {
                this.sendToPreview({ type: 'applyForce' });
            });
        }

        // Physics settings changes
        const physicsEnabled = document.getElementById('physics-enabled');
        if (physicsEnabled) {
            physicsEnabled.addEventListener('change', (e) => {
                this.sendToPreview({ type: 'togglePhysics' });
            });
        }

        // Weather intensity slider
        const weatherIntensity = document.getElementById('weather-intensity');
        if (weatherIntensity) {
            weatherIntensity.addEventListener('input', (e) => {
                document.getElementById('weather-intensity-value').textContent = e.target.value;
            });
        }

        // Physics sliders
        const gravity = document.getElementById('gravity');
        if (gravity) {
            gravity.addEventListener('input', (e) => {
                document.getElementById('gravity-value').textContent = e.target.value;
                this.sendToPreview({ 
                    type: 'updatePhysicsSettings', 
                    gravity: e.target.value 
                });
            });
        }

        const bounce = document.getElementById('bounce');
        if (bounce) {
            bounce.addEventListener('input', (e) => {
                document.getElementById('bounce-value').textContent = e.target.value;
                this.sendToPreview({ 
                    type: 'updatePhysicsSettings', 
                    bounce: e.target.value 
                });
            });
        }

        const friction = document.getElementById('friction');
        if (friction) {
            friction.addEventListener('input', (e) => {
                document.getElementById('friction-value').textContent = e.target.value;
            });
        }

        // Path movement buttons
        const createPath = document.getElementById('create-path');
        if (createPath) {
            createPath.addEventListener('click', () => {
                const iframe = document.getElementById('preview-frame');
                iframe.contentWindow.postMessage({ type: 'testPath' }, '*');
            });
        }

        const followCircle = document.getElementById('follow-circle');
        if (followCircle) {
            followCircle.addEventListener('click', () => {
                // Create circle path
                const points = [];
                for (let i = 0; i <= 360; i += 30) {
                    const rad = i * Math.PI / 180;
                    points.push({
                        x: 50 + Math.cos(rad) * 30,
                        y: 50 + Math.sin(rad) * 30
                    });
                }
                this.sendToPreview({ 
                    type: 'followPath', 
                    points: points,
                    duration: 6000
                });
            });
        }

        const followWave = document.getElementById('follow-wave');
        if (followWave) {
            followWave.addEventListener('click', () => {
                // Create wave path
                const points = [];
                for (let i = 0; i <= 100; i += 5) {
                    points.push({
                        x: i,
                        y: 50 + Math.sin(i * 0.1) * 20
                    });
                }
                this.sendToPreview({ 
                    type: 'followPath', 
                    points: points,
                    duration: 8000
                });
            });
        }

        const stopPath = document.getElementById('stop-path');
        if (stopPath) {
            stopPath.addEventListener('click', () => {
                this.sendToPreview({ type: 'stopPath' });
            });
        }

        const resetPosition = document.getElementById('reset-position');
        if (resetPosition) {
            resetPosition.addEventListener('click', () => {
                this.sendToPreview({ type: 'resetPosition' });
            });
        }

        // Particle customization sliders
        const particleSize = document.getElementById('particle-size');
        if (particleSize) {
            particleSize.addEventListener('input', (e) => {
                document.getElementById('particle-size-value').textContent = e.target.value + 'px';
            });
        }

        const particleCount = document.getElementById('particle-count');
        if (particleCount) {
            particleCount.addEventListener('input', (e) => {
                document.getElementById('particle-count-value').textContent = e.target.value;
            });
        }

        const particleSpread = document.getElementById('particle-spread');
        if (particleSpread) {
            particleSpread.addEventListener('input', (e) => {
                document.getElementById('particle-spread-value').textContent = e.target.value + 'px';
            });
        }

        const particleSpeed = document.getElementById('particle-speed');
        if (particleSpeed) {
            particleSpeed.addEventListener('input', (e) => {
                document.getElementById('particle-speed-value').textContent = e.target.value;
            });
        }

        const particleGravity = document.getElementById('particle-gravity');
        if (particleGravity) {
            particleGravity.addEventListener('input', (e) => {
                document.getElementById('particle-gravity-value').textContent = e.target.value;
            });
        }

        // Test particles button
        const testParticles = document.getElementById('test-particles');
        if (testParticles) {
            testParticles.addEventListener('click', () => {
                this.sendToPreview({ 
                    type: 'testParticles',
                    settings: this.getParticleSettings()
                });
            });
        }

        // Growth system buttons
        const addEvolutionStage = document.getElementById('add-evolution-stage');
        if (addEvolutionStage) {
            addEvolutionStage.addEventListener('click', () => this.addEvolutionStage());
        }

        const resetGrowth = document.getElementById('reset-growth');
        if (resetGrowth) {
            resetGrowth.addEventListener('click', () => this.resetGrowth());
        }

        const levelUpTest = document.getElementById('level-up-test');
        if (levelUpTest) {
            levelUpTest.addEventListener('click', () => this.testLevelUp());
        }

        // Level up bar size slider
        const levelUpSize = document.getElementById('levelup-size');
        if (levelUpSize) {
            levelUpSize.addEventListener('input', (e) => {
                document.getElementById('levelup-size-value').textContent = e.target.value + 'px';
            });
        }

        // Level up effect settings
        const levelUpEffectType = document.getElementById('levelup-effect-type');
        if (levelUpEffectType) {
            levelUpEffectType.addEventListener('change', () => this.scheduleAutoSave());
        }

        const levelUpEffectColor = document.getElementById('levelup-effect-color');
        if (levelUpEffectColor) {
            levelUpEffectColor.addEventListener('change', () => this.scheduleAutoSave());
        }

        const levelUpEffectDuration = document.getElementById('levelup-effect-duration');
        if (levelUpEffectDuration) {
            levelUpEffectDuration.addEventListener('change', () => this.scheduleAutoSave());
        }

        const levelUpEffectIntensity = document.getElementById('levelup-effect-intensity');
        if (levelUpEffectIntensity) {
            levelUpEffectIntensity.addEventListener('input', (e) => {
                document.getElementById('levelup-effect-intensity-value').textContent = e.target.value + 'x';
                this.scheduleAutoSave();
            });
        }

        // Evolution effect settings
        const evolutionEffectType = document.getElementById('evolution-effect-type');
        if (evolutionEffectType) {
            evolutionEffectType.addEventListener('change', () => this.scheduleAutoSave());
        }

        const evolutionEffectColor = document.getElementById('evolution-effect-color');
        if (evolutionEffectColor) {
            evolutionEffectColor.addEventListener('change', () => this.scheduleAutoSave());
        }

        const evolutionEffectColor2 = document.getElementById('evolution-effect-color2');
        if (evolutionEffectColor2) {
            evolutionEffectColor2.addEventListener('change', () => this.scheduleAutoSave());
        }

        const evolutionEffectDuration = document.getElementById('evolution-effect-duration');
        if (evolutionEffectDuration) {
            evolutionEffectDuration.addEventListener('change', () => this.scheduleAutoSave());
        }

        const evolutionEffectIntensity = document.getElementById('evolution-effect-intensity');
        if (evolutionEffectIntensity) {
            evolutionEffectIntensity.addEventListener('input', (e) => {
                document.getElementById('evolution-effect-intensity-value').textContent = e.target.value + 'x';
                this.scheduleAutoSave();
            });
        }

        // Test evolution effect button
        const evolutionTest = document.getElementById('evolution-test');
        if (evolutionTest) {
            evolutionTest.addEventListener('click', () => this.testEvolutionEffect());
        }

        // Emote rain sliders
        const emoteRainSize = document.getElementById('emote-rain-size');
        if (emoteRainSize) {
            emoteRainSize.addEventListener('input', (e) => {
                document.getElementById('emote-rain-size-value').textContent = e.target.value + 'px';
            });
        }

        const emoteRainDuration = document.getElementById('emote-rain-duration');
        if (emoteRainDuration) {
            emoteRainDuration.addEventListener('input', (e) => {
                document.getElementById('emote-rain-duration-value').textContent = e.target.value + 'ms';
            });
        }

        // Test emote rain button
        const testEmoteRain = document.getElementById('test-emote-rain');
        if (testEmoteRain) {
            testEmoteRain.addEventListener('click', () => this.testEmoteRain());
        }

        // Spotify buttons
        const spotifyConnectBtn = document.getElementById('spotify-connect-btn');
        if (spotifyConnectBtn) {
            spotifyConnectBtn.addEventListener('click', () => this.connectSpotify());
        }

        const spotifyDisconnectBtn = document.getElementById('spotify-disconnect-btn');
        if (spotifyDisconnectBtn) {
            spotifyDisconnectBtn.addEventListener('click', () => this.disconnectSpotify());
        }

        const copyRedirectUri = document.getElementById('copy-redirect-uri');
        if (copyRedirectUri) {
            copyRedirectUri.addEventListener('click', () => this.copyRedirectUri());
        }

        const completeSpotifyLogin = document.getElementById('complete-spotify-login');
        if (completeSpotifyLogin) {
            completeSpotifyLogin.addEventListener('click', () => this.completeSpotifyLogin());
        }

        const cancelSpotifyLogin = document.getElementById('cancel-spotify-login');
        if (cancelSpotifyLogin) {
            cancelSpotifyLogin.addEventListener('click', () => this.cancelSpotifyLogin());
        }

        const showGithubSetup = document.getElementById('show-github-setup');
        if (showGithubSetup) {
            showGithubSetup.addEventListener('click', (e) => {
                e.preventDefault();
                const instructions = document.getElementById('github-setup-instructions');
                instructions.style.display = instructions.style.display === 'none' ? 'block' : 'none';
            });
        }

        const setCustomRedirect = document.getElementById('set-custom-redirect');
        if (setCustomRedirect) {
            setCustomRedirect.addEventListener('click', () => this.setCustomRedirectUri());
        }

        const saveSpotifyToken = document.getElementById('save-spotify-token');
        if (saveSpotifyToken) {
            saveSpotifyToken.addEventListener('click', () => this.saveSpotifyToken());
        }

        const cancelSpotifyToken = document.getElementById('cancel-spotify-token');
        if (cancelSpotifyToken) {
            cancelSpotifyToken.addEventListener('click', () => this.cancelSpotifyToken());
        }

        // Event delegation for browse buttons (handles dynamically created buttons)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('browse-btn')) {
                e.preventDefault();
                const targetId = e.target.dataset.target;
                console.log('Browse button clicked for:', targetId);
                if (targetId) {
                    selectImage(targetId);
                }
            }
        });

        // Setup drag and drop for image inputs
        this.setupDragAndDrop();
        
        // Check for OAuth callback
        this.handleOAuthCallback();
    }

    /**
     * Setup drag and drop for all image inputs
     */
    setupDragAndDrop() {
        // Get all image inputs (including dynamically created ones)
        const imageInputs = document.querySelectorAll('input.image-input, input[type="text"][id*="image"]');
        
        console.log(`Setting up drag & drop for ${imageInputs.length} image inputs`);
        
        imageInputs.forEach(input => {
            // Remove existing listeners to prevent duplicates
            input.ondragenter = null;
            input.ondragover = null;
            input.ondragleave = null;
            input.ondrop = null;
            
            // Enable drag and drop
            this.enableDragDrop(input);
        });
    }

    /**
     * Enable drag and drop on an input element
     */
    enableDragDrop(element) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, this.preventDefaults, false);
        });

        // Highlight on drag over
        ['dragenter', 'dragover'].forEach(eventName => {
            element.addEventListener(eventName, () => {
                element.style.borderColor = '#667eea';
                element.style.background = '#f0f0ff';
            }, false);
        });

        // Remove highlight on drag leave/drop
        ['dragleave', 'drop'].forEach(eventName => {
            element.addEventListener(eventName, () => {
                element.style.borderColor = '#ddd';
                element.style.background = 'white';
            }, false);
        });

        // Handle dropped files
        element.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageDrop(files[0], element);
            }
        }, false);
    }

    /**
     * Prevent default drag/drop behavior
     */
    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    /**
     * Handle dropped image file
     */
    handleImageDrop(file, inputElement) {
        console.log('handleImageDrop called with file:', file.name, 'input:', inputElement.id);
        
        // Check if it's an image
        if (!file.type.startsWith('image/')) {
            alert('Please drop an image file (PNG, JPG, GIF)');
            return;
        }

        // Create a FileReader to read the image
        const reader = new FileReader();
        
        reader.onload = (e) => {
            console.log('File read complete, creating image...');
            
            // Create an image element to validate and get dimensions
            const img = new Image();
            img.onload = () => {
                // For local files, we'll just use the file name
                // The actual file should be placed in the Images/ folder
                const imagePath = `Images/${file.name}`;
                
                console.log('Image loaded successfully:', imagePath, `${img.width}x${img.height}`);
                
                // Update the input field
                inputElement.value = imagePath;
                console.log('Input field updated:', inputElement.id, '=', imagePath);
                
                // Trigger change event so any listeners know the value changed
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Show success message with instructions
                this.showNotification(
                    `✅ Image "${file.name}" selected (${img.width}x${img.height})\n` +
                    `Make sure to save this file to the Images/ folder!`,
                    'success'
                );
                
                // Provide option to download/save the file
                this.offerImageDownload(file, e.target.result);
                
                // Update preview if this is the default image
                if (inputElement.id === 'default-image') {
                    this.updateImagePreview(imagePath, e.target.result);
                }
            };
            
            img.onerror = () => {
                console.error('Error loading image:', file.name);
                alert('Error loading image. Please try a different file.');
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = () => {
            console.error('Error reading file:', file.name);
            alert('Error reading file. Please try again.');
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * Offer to download/save the image file
     */
    offerImageDownload(file, dataUrl) {
        // Create a temporary download link
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = file.name;
        downloadLink.style.display = 'none';
        document.body.appendChild(downloadLink);
        
        // Show a notification with download option
        const notification = document.createElement('div');
        notification.className = 'alert alert-info';
        notification.style.cssText = 'position: fixed; top: 80px; right: 20px; z-index: 10000; max-width: 400px;';
        notification.innerHTML = `
            <strong>Save Image File</strong><br>
            Click the button below to download "${file.name}" and save it to your Images/ folder.<br>
            <button class="btn btn-sm btn-primary mt-2" id="download-image-btn">
                💾 Download ${file.name}
            </button>
            <button class="btn btn-sm btn-secondary mt-2 ms-2" id="dismiss-download-btn">
                Dismiss
            </button>
        `;
        document.body.appendChild(notification);
        
        // Add click handler for download button
        document.getElementById('download-image-btn').addEventListener('click', () => {
            downloadLink.click();
            notification.remove();
        });
        
        // Add click handler for dismiss button
        document.getElementById('dismiss-download-btn').addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-remove after 15 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
            downloadLink.remove();
        }, 15000);
    }

    /**
     * Update image preview
     */
    updateImagePreview(path, dataUrl) {
        // Update preview iframe's pet image if possible
        const iframe = document.getElementById('preview-frame');
        try {
            if (iframe.contentWindow && iframe.contentWindow.streamPet) {
                const petImg = iframe.contentWindow.document.getElementById('pet-image');
                if (petImg) {
                    petImg.src = dataUrl;
                }
            }
        } catch (e) {
            // Cross-origin issues - ignore
        }
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Build events section
     */
    buildEventsSection() {
        const container = document.getElementById('events-container');
        container.innerHTML = '';

        Object.entries(this.config.events).forEach(([eventName, eventData]) => {
            const card = this.createEventCard(eventName, eventData);
            container.appendChild(card);
        });
        
        // Re-enable drag and drop for new event inputs
        setTimeout(() => this.setupDragAndDrop(), 0);
    }

    /**
     * Create event configuration card
     */
    createEventCard(eventName, eventData) {
        const card = document.createElement('div');
        card.className = 'event-card';
        card.innerHTML = `
            <h4>
                ${this.formatEventName(eventName)}
                <div class="toggle-switch">
                    <label>
                        <input type="checkbox" id="event-${eventName}-enabled" ${eventData.enabled ? 'checked' : ''}>
                        Enabled
                    </label>
                </div>
            </h4>
            <div class="form-grid">
                <div class="form-group">
                    <label>Event Image</label>
                    <input type="hidden" id="event-${eventName}-image" value="${eventData.image}">
                    <button class="btn btn-primary" onclick="openImagePicker('event-${eventName}-image', '${this.formatEventName(eventName)} Image')">🖼️ Image Settings</button>
                    <small>💡 Set images for growth stages and holiday modes</small>
                </div>
                <div class="form-group">
                    <label>Message</label>
                    <input type="text" id="event-${eventName}-message" value="${eventData.message}" placeholder="Welcome {username}!">
                    <small>Use {username}, {count}, {amount}, etc.</small>
                </div>
                <div class="form-group">
                    <label>Duration (ms)</label>
                    <input type="number" id="event-${eventName}-duration" value="${eventData.duration}" min="1000" step="100">
                </div>
                <div class="form-group">
                    <label>Priority (1-10)</label>
                    <input type="number" id="event-${eventName}-priority" value="${eventData.priority}" min="1" max="10">
                </div>
                <div class="form-group">
                    <label>Animation</label>
                    <select id="event-${eventName}-animation">
                        <option value="none" ${(eventData.animation || 'none') === 'none' ? 'selected' : ''}>None</option>
                        <option value="bounce" ${(eventData.animation || 'none') === 'bounce' ? 'selected' : ''}>Bounce</option>
                        <option value="wiggle" ${(eventData.animation || 'none') === 'wiggle' ? 'selected' : ''}>Wiggle</option>
                        <option value="spin" ${(eventData.animation || 'none') === 'spin' ? 'selected' : ''}>Spin</option>
                        <option value="float" ${(eventData.animation || 'none') === 'float' ? 'selected' : ''}>Float</option>
                        <option value="shake" ${(eventData.animation || 'none') === 'shake' ? 'selected' : ''}>Shake</option>
                        <option value="sway" ${(eventData.animation || 'none') === 'sway' ? 'selected' : ''}>Sway</option>
                        <option value="jump" ${(eventData.animation || 'none') === 'jump' ? 'selected' : ''}>Jump</option>
                        <option value="hop" ${(eventData.animation || 'none') === 'hop' ? 'selected' : ''}>Hop</option>
                        <option value="pulse" ${(eventData.animation || 'none') === 'pulse' ? 'selected' : ''}>Pulse</option>
                        <option value="slide-left" ${(eventData.animation || 'none') === 'slide-left' ? 'selected' : ''}>Slide Left</option>
                        <option value="slide-right" ${(eventData.animation || 'none') === 'slide-right' ? 'selected' : ''}>Slide Right</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Particle Effect</label>
                    <select id="event-${eventName}-particles">
                        <option value="none" ${(eventData.particles || 'none') === 'none' ? 'selected' : ''}>None</option>
                        <option value="hearts" ${(eventData.particles || 'none') === 'hearts' ? 'selected' : ''}>Hearts</option>
                        <option value="stars" ${(eventData.particles || 'none') === 'stars' ? 'selected' : ''}>Stars</option>
                        <option value="celebrate" ${(eventData.particles || 'none') === 'celebrate' ? 'selected' : ''}>Celebrate</option>
                        <option value="money" ${(eventData.particles || 'none') === 'money' ? 'selected' : ''}>Money</option>
                        <option value="fire" ${(eventData.particles || 'none') === 'fire' ? 'selected' : ''}>Fire</option>
                        <option value="ice" ${(eventData.particles || 'none') === 'ice' ? 'selected' : ''}>Ice</option>
                        <option value="food" ${(eventData.particles || 'none') === 'food' ? 'selected' : ''}>Food</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Sound Effect</label>
                    <div class="input-group">
                        <input type="text" id="event-${eventName}-sound" value="${eventData.sound || ''}" placeholder="sounds/event.mp3">
                        <button class="btn btn-sm browse-btn" data-target="event-${eventName}-sound">Browse</button>
                    </div>
                    <small>💡 Audio file for this event</small>
                </div>
                ${eventName === 'bits' ? `
                <div class="form-group">
                    <label>Minimum Amount</label>
                    <input type="number" id="event-${eventName}-minAmount" value="${eventData.minAmount || 100}" min="1">
                </div>
                ` : ''}
            </div>
        `;
        return card;
    }

    /**
     * Build commands section
     */
    buildCommandsSection() {
        const container = document.getElementById('commands-container');
        container.innerHTML = '';

        Object.entries(this.config.commands || {}).forEach(([commandName, commandData]) => {
            const card = this.createCommandCard(commandName, commandData);
            container.appendChild(card);
        });
        
        // Re-enable drag and drop for new command inputs
        setTimeout(() => this.setupDragAndDrop(), 0);
    }

    /**
     * Create command configuration card
     */
    createCommandCard(commandName, commandData) {
        const card = document.createElement('div');
        card.className = 'command-card';
        card.innerHTML = `
            <h4>
                <code>${commandName}</code>
                <div class="toggle-switch">
                    <label>
                        <input type="checkbox" id="command-${this.sanitizeId(commandName)}-enabled" ${commandData.enabled ? 'checked' : ''}>
                        Enabled
                    </label>
                </div>
                <button class="btn btn-danger btn-sm" onclick="configManager.deleteCommand('${commandName}')">🗑️ Delete</button>
            </h4>
            <div class="form-grid">
                <div class="form-group">
                    <label>Command Image</label>
                    <input type="hidden" id="command-${this.sanitizeId(commandName)}-image" value="${commandData.image}">
                    <button class="btn btn-primary" onclick="openImagePicker('command-${this.sanitizeId(commandName)}-image', '${commandName} Image')">🖼️ Image Settings</button>
                    <small>💡 Set images for growth stages and holiday modes</small>
                </div>
                <div class="form-group">
                    <label>Response Message</label>
                    <input type="text" id="command-${this.sanitizeId(commandName)}-message" value="${commandData.message}" placeholder="Thanks for using the command!">
                    <small>Use {username} for the user's name</small>
                </div>
                <div class="form-group">
                    <label>Duration (ms)</label>
                    <input type="number" id="command-${this.sanitizeId(commandName)}-duration" value="${commandData.duration}" min="1000" step="100">
                </div>
                <div class="form-group">
                    <label>Required Role</label>
                    <select id="command-${this.sanitizeId(commandName)}-requiredRole">
                        <option value="everyone" ${commandData.requiredRole === 'everyone' ? 'selected' : ''}>Everyone</option>
                        <option value="subscriber" ${commandData.requiredRole === 'subscriber' ? 'selected' : ''}>Subscribers</option>
                        <option value="vip" ${commandData.requiredRole === 'vip' ? 'selected' : ''}>VIPs</option>
                        <option value="moderator" ${commandData.requiredRole === 'moderator' ? 'selected' : ''}>Moderators</option>
                        <option value="broadcaster" ${commandData.requiredRole === 'broadcaster' ? 'selected' : ''}>Broadcaster Only</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Cooldown (seconds)</label>
                    <input type="number" id="command-${this.sanitizeId(commandName)}-cooldown" value="${(commandData.cooldown || 0) / 1000}" min="0" step="1">
                    <small>Time before command can be used again</small>
                </div>
                <div class="form-group">
                    <label>Animation</label>
                    <select id="command-${this.sanitizeId(commandName)}-animation">
                        <option value="none" ${(commandData.animation || 'none') === 'none' ? 'selected' : ''}>None</option>
                        <option value="bounce" ${(commandData.animation || 'none') === 'bounce' ? 'selected' : ''}>Bounce</option>
                        <option value="wiggle" ${(commandData.animation || 'none') === 'wiggle' ? 'selected' : ''}>Wiggle</option>
                        <option value="spin" ${(commandData.animation || 'none') === 'spin' ? 'selected' : ''}>Spin</option>
                        <option value="float" ${(commandData.animation || 'none') === 'float' ? 'selected' : ''}>Float</option>
                        <option value="shake" ${(commandData.animation || 'none') === 'shake' ? 'selected' : ''}>Shake</option>
                        <option value="sway" ${(commandData.animation || 'none') === 'sway' ? 'selected' : ''}>Sway</option>
                        <option value="jump" ${(commandData.animation || 'none') === 'jump' ? 'selected' : ''}>Jump</option>
                        <option value="hop" ${(commandData.animation || 'none') === 'hop' ? 'selected' : ''}>Hop</option>
                        <option value="pulse" ${(commandData.animation || 'none') === 'pulse' ? 'selected' : ''}>Pulse</option>
                        <option value="slide-left" ${(commandData.animation || 'none') === 'slide-left' ? 'selected' : ''}>Slide Left</option>
                        <option value="slide-right" ${(commandData.animation || 'none') === 'slide-right' ? 'selected' : ''}>Slide Right</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Particle Effect</label>
                    <select id="command-${this.sanitizeId(commandName)}-particles">
                        <option value="none" ${(commandData.particles || 'none') === 'none' ? 'selected' : ''}>None</option>
                        <option value="hearts" ${(commandData.particles || 'none') === 'hearts' ? 'selected' : ''}>Hearts</option>
                        <option value="stars" ${(commandData.particles || 'none') === 'stars' ? 'selected' : ''}>Stars</option>
                        <option value="celebrate" ${(commandData.particles || 'none') === 'celebrate' ? 'selected' : ''}>Celebrate</option>
                        <option value="money" ${(commandData.particles || 'none') === 'money' ? 'selected' : ''}>Money</option>
                        <option value="fire" ${(commandData.particles || 'none') === 'fire' ? 'selected' : ''}>Fire</option>
                        <option value="ice" ${(commandData.particles || 'none') === 'ice' ? 'selected' : ''}>Ice</option>
                        <option value="food" ${(commandData.particles || 'none') === 'food' ? 'selected' : ''}>Food</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Sound Effect</label>
                    <div class="input-group">
                        <input type="text" id="command-${this.sanitizeId(commandName)}-sound" value="${commandData.sound || ''}" placeholder="sounds/command.mp3">
                        <button class="btn btn-sm browse-btn" data-target="command-${this.sanitizeId(commandName)}-sound">Browse</button>
                    </div>
                    <small>💡 Audio file for this command</small>
                </div>
            </div>
        `;
        return card;
    }
    
    /**
     * Sanitize ID for use in HTML
     */
    sanitizeId(str) {
        return str.replace(/[^a-zA-Z0-9]/g, '_');
    }

    /**
     * Build states section
     */
    buildStatesSection() {
        const container = document.getElementById('states-container');
        container.innerHTML = '';

        Object.entries(this.config.states).forEach(([stateName, stateData]) => {
            const card = this.createStateCard(stateName, stateData);
            container.appendChild(card);
        });
        
        // Re-enable drag and drop for new state inputs
        setTimeout(() => this.setupDragAndDrop(), 0);
    }

    /**
     * Create state configuration card
     */
    createStateCard(stateName, stateData) {
        const card = document.createElement('div');
        card.className = 'state-card';
        card.innerHTML = `
            <h4>
                ${this.formatEventName(stateName)}
                <div class="toggle-switch">
                    <label>
                        <input type="checkbox" id="state-${stateName}-enabled" ${stateData.enabled ? 'checked' : ''}>
                        Enabled
                    </label>
                    <button class="btn btn-danger btn-sm" onclick="configManager.deleteState('${stateName}')">Delete</button>
                </div>
            </h4>
            <div class="form-grid">
                <div class="form-group">
                    <label>State Image</label>
                    <input type="hidden" id="state-${stateName}-image" value="${stateData.image}">
                    <button class="btn btn-primary" onclick="openImagePicker('state-${stateName}-image', '${this.formatEventName(stateName)} Image')">🖼️ Image Settings</button>
                    <small>💡 Set images for growth stages and holiday modes</small>
                </div>
                <div class="form-group">
                    <label>Trigger Chance (0-1)</label>
                    <input type="number" id="state-${stateName}-triggerChance" value="${stateData.triggerChance}" min="0" max="1" step="0.01">
                    <small>${(stateData.triggerChance * 100).toFixed(0)}% chance</small>
                </div>
                <div class="form-group">
                    <label>Check Interval (ms)</label>
                    <input type="number" id="state-${stateName}-checkInterval" value="${stateData.checkInterval}" min="10000" step="10000">
                </div>
                <div class="form-group">
                    <label>Recovery Command</label>
                    <input type="text" id="state-${stateName}-recoveryCommand" value="${stateData.recoveryCommand || ''}" placeholder="!pet">
                </div>
                <div class="form-group">
                    <label>State Message</label>
                    <input type="text" id="state-${stateName}-message" value="${stateData.message}" placeholder="I'm feeling sad...">
                </div>
                <div class="form-group">
                    <label>Command Message</label>
                    <input type="text" id="state-${stateName}-commandMessage" value="${stateData.commandMessage || ''}" placeholder="{username} cheered me up!">
                </div>
                <div class="form-group">
                    <label>Required Role</label>
                    <select id="state-${stateName}-requiredRole">
                        <option value="everyone" ${stateData.requiredRole === 'everyone' ? 'selected' : ''}>Everyone</option>
                        <option value="subscriber" ${stateData.requiredRole === 'subscriber' ? 'selected' : ''}>Subscribers</option>
                        <option value="vip" ${stateData.requiredRole === 'vip' ? 'selected' : ''}>VIPs</option>
                        <option value="moderator" ${stateData.requiredRole === 'moderator' ? 'selected' : ''}>Moderators</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Animation</label>
                    <select id="state-${stateName}-animation">
                        <option value="none" ${(stateData.animation || 'none') === 'none' ? 'selected' : ''}>None</option>
                        <option value="bounce" ${(stateData.animation || 'none') === 'bounce' ? 'selected' : ''}>Bounce</option>
                        <option value="wiggle" ${(stateData.animation || 'none') === 'wiggle' ? 'selected' : ''}>Wiggle</option>
                        <option value="spin" ${(stateData.animation || 'none') === 'spin' ? 'selected' : ''}>Spin</option>
                        <option value="float" ${(stateData.animation || 'none') === 'float' ? 'selected' : ''}>Float</option>
                        <option value="shake" ${(stateData.animation || 'none') === 'shake' ? 'selected' : ''}>Shake</option>
                        <option value="sway" ${(stateData.animation || 'none') === 'sway' ? 'selected' : ''}>Sway</option>
                        <option value="jump" ${(stateData.animation || 'none') === 'jump' ? 'selected' : ''}>Jump</option>
                        <option value="hop" ${(stateData.animation || 'none') === 'hop' ? 'selected' : ''}>Hop</option>
                        <option value="pulse" ${(stateData.animation || 'none') === 'pulse' ? 'selected' : ''}>Pulse</option>
                        <option value="slide-left" ${(stateData.animation || 'none') === 'slide-left' ? 'selected' : ''}>Slide Left</option>
                        <option value="slide-right" ${(stateData.animation || 'none') === 'slide-right' ? 'selected' : ''}>Slide Right</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Particle Effect</label>
                    <select id="state-${stateName}-particles">
                        <option value="none" ${(stateData.particles || 'none') === 'none' ? 'selected' : ''}>None</option>
                        <option value="hearts" ${(stateData.particles || 'none') === 'hearts' ? 'selected' : ''}>Hearts</option>
                        <option value="stars" ${(stateData.particles || 'none') === 'stars' ? 'selected' : ''}>Stars</option>
                        <option value="celebrate" ${(stateData.particles || 'none') === 'celebrate' ? 'selected' : ''}>Celebrate</option>
                        <option value="money" ${(stateData.particles || 'none') === 'money' ? 'selected' : ''}>Money</option>
                        <option value="fire" ${(stateData.particles || 'none') === 'fire' ? 'selected' : ''}>Fire</option>
                        <option value="ice" ${(stateData.particles || 'none') === 'ice' ? 'selected' : ''}>Ice</option>
                        <option value="food" ${(stateData.particles || 'none') === 'food' ? 'selected' : ''}>Food</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Sound Effect</label>
                    <div class="input-group">
                        <input type="text" id="state-${stateName}-sound" value="${stateData.sound || ''}" placeholder="sounds/state.mp3">
                        <button class="btn btn-sm browse-btn" data-target="state-${stateName}-sound">Browse</button>
                    </div>
                    <small>💡 Audio file for this state</small>
                </div>
                ${stateData.autoRecoverTime !== undefined ? `
                <div class="form-group">
                    <label>Auto Recover Time (ms)</label>
                    <input type="number" id="state-${stateName}-autoRecoverTime" value="${stateData.autoRecoverTime}" min="0" step="1000">
                </div>
                ` : ''}
            </div>
        `;
        return card;
    }

    /**
     * Build testing section
     */
    buildTestingSection() {
        // Build state test buttons
        const stateContainer = document.getElementById('state-test-buttons');
        stateContainer.innerHTML = '';

        Object.keys(this.config.states).forEach(stateName => {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = `Trigger ${this.formatEventName(stateName)}`;
            btn.onclick = () => this.testState(stateName);
            stateContainer.appendChild(btn);
        });

        // Build recovery command test buttons
        const recoveryContainer = document.getElementById('command-test-buttons');
        recoveryContainer.innerHTML = '';

        Object.entries(this.config.states).forEach(([stateName, stateData]) => {
            if (stateData.recoveryCommand) {
                const btn = document.createElement('button');
                btn.className = 'btn';
                btn.textContent = `Test ${stateData.recoveryCommand}`;
                btn.onclick = () => this.testCommand(stateName);
                recoveryContainer.appendChild(btn);
            }
        });
        
        // Build custom command test buttons
        const customCmdContainer = document.getElementById('custom-command-test-buttons');
        if (customCmdContainer) {
            customCmdContainer.innerHTML = '';

            if (this.config.commands) {
                Object.keys(this.config.commands).forEach(commandName => {
                    const btn = document.createElement('button');
                    btn.className = 'btn';
                    btn.textContent = `Test ${commandName}`;
                    btn.onclick = () => this.testCustomCommand(commandName);
                    customCmdContainer.appendChild(btn);
                });
            }
        }
    }

    /**
     * Save configuration
     */
    saveConfig() {
        // Collect form data
        this.config.pet.name = document.getElementById('pet-name').value;
        this.config.pet.defaultImage = document.getElementById('default-image').value;
        this.config.pet.blinkImage = document.getElementById('blink-image').value;
        this.config.pet.blinkInterval = parseInt(document.getElementById('blink-interval').value);
        this.config.pet.blinkDuration = parseInt(document.getElementById('blink-duration').value);
        
        // Size settings
        if (!this.config.pet.size) this.config.pet.size = {};
        this.config.pet.size.mode = document.getElementById('pet-size-mode').value;
        this.config.pet.size.width = parseInt(document.getElementById('pet-width').value);
        this.config.pet.size.height = parseInt(document.getElementById('pet-height').value);
        this.config.pet.size.widthPercent = parseFloat(document.getElementById('pet-width-percent').value);
        this.config.pet.size.heightPercent = parseFloat(document.getElementById('pet-height-percent').value);
        this.config.pet.size.scale = parseFloat(document.getElementById('pet-scale').value);
        this.config.pet.size.maintainAspect = document.getElementById('maintain-aspect').checked;
        
        this.config.pet.position.x = parseFloat(document.getElementById('pet-x').value);
        this.config.pet.position.y = parseFloat(document.getElementById('pet-y').value);
        this.config.pet.opacity = parseFloat(document.getElementById('pet-opacity').value);
        this.config.pet.flipHorizontal = document.getElementById('flip-horizontal').checked;
        this.config.advanced.enableClickInteraction = document.getElementById('enable-click').checked;
        this.config.advanced.debugMode = document.getElementById('debug-mode').checked;
        this.config.advanced.bubbleStyle = document.getElementById('bubble-style').value;
        this.config.advanced.enableSounds = document.getElementById('enable-sounds').checked;
        this.config.advanced.soundVolume = parseFloat(document.getElementById('sound-volume').value);
        this.config.advanced.enableParticles = document.getElementById('enable-particles').checked;
        this.config.advanced.enableIdleAnimations = document.getElementById('enable-idle-animations').checked;
        this.config.advanced.idleAnimationInterval = parseInt(document.getElementById('idle-interval').value) * 1000;
        
        // Idle animation selections
        this.config.advanced.idleAnimations = {
            bounce: document.getElementById('idle-bounce').checked,
            wiggle: document.getElementById('idle-wiggle').checked,
            float: document.getElementById('idle-float').checked,
            spin: document.getElementById('idle-spin').checked,
            sway: document.getElementById('idle-sway').checked,
            hop: document.getElementById('idle-hop').checked
        };
        
        // Click interaction settings
        this.config.advanced.clickMessage = document.getElementById('click-message').value;
        this.config.advanced.clickAnimation = document.getElementById('click-animation').value;
        this.config.advanced.clickParticles = document.getElementById('click-particles').value;
        this.config.advanced.clickSound = document.getElementById('click-sound').value;

        // Twitch settings
        this.config.twitch.enabled = document.getElementById('twitch-enabled').checked;
        this.config.twitch.channel = document.getElementById('twitch-channel').value;
        this.config.twitch.clientId = document.getElementById('twitch-client-id').value;
        this.config.twitch.redirectUri = document.getElementById('twitch-redirect-uri').value;
        this.config.twitch.useAnonymous = document.getElementById('use-anonymous').checked;
        this.config.twitch.useBotAccount = document.getElementById('use-bot-account').checked;
        this.config.twitch.botUsername = document.getElementById('bot-username').value;

        // Emote rain settings
        if (!this.config.twitch.emoteRain) {
            this.config.twitch.emoteRain = {};
        }
        this.config.twitch.emoteRain.enabled = document.getElementById('emote-rain-enabled').checked;
        this.config.twitch.emoteRain.userLevel = document.getElementById('emote-rain-user-level').value;
        this.config.twitch.emoteRain.maxEmotes = parseInt(document.getElementById('emote-rain-count').value);
        this.config.twitch.emoteRain.emoteSize = parseInt(document.getElementById('emote-rain-size').value);
        this.config.twitch.emoteRain.fallDuration = parseInt(document.getElementById('emote-rain-duration').value);
        this.config.twitch.emoteRain.userCooldown = parseInt(document.getElementById('emote-rain-cooldown').value);
        this.config.twitch.emoteRain.globalCooldown = parseInt(document.getElementById('emote-rain-global-cooldown').value);
        this.config.twitch.emoteRain.rotate = document.getElementById('emote-rain-rotate').checked;
        this.config.twitch.emoteRain.bounce = document.getElementById('emote-rain-bounce').checked;

        // Events
        Object.keys(this.config.events).forEach(eventName => {
            this.config.events[eventName].enabled = document.getElementById(`event-${eventName}-enabled`).checked;
            this.config.events[eventName].image = document.getElementById(`event-${eventName}-image`).value;
            this.config.events[eventName].message = document.getElementById(`event-${eventName}-message`).value;
            this.config.events[eventName].duration = parseInt(document.getElementById(`event-${eventName}-duration`).value);
            this.config.events[eventName].priority = parseInt(document.getElementById(`event-${eventName}-priority`).value);
            this.config.events[eventName].animation = document.getElementById(`event-${eventName}-animation`).value;
            this.config.events[eventName].particles = document.getElementById(`event-${eventName}-particles`).value;
            this.config.events[eventName].sound = document.getElementById(`event-${eventName}-sound`).value;
            
            if (eventName === 'bits') {
                this.config.events[eventName].minAmount = parseInt(document.getElementById(`event-${eventName}-minAmount`).value);
            }
        });
        
        // Commands
        if (this.config.commands) {
            Object.keys(this.config.commands).forEach(commandName => {
                const sanitizedId = this.sanitizeId(commandName);
                this.config.commands[commandName].enabled = document.getElementById(`command-${sanitizedId}-enabled`).checked;
                this.config.commands[commandName].image = document.getElementById(`command-${sanitizedId}-image`).value;
                this.config.commands[commandName].message = document.getElementById(`command-${sanitizedId}-message`).value;
                this.config.commands[commandName].duration = parseInt(document.getElementById(`command-${sanitizedId}-duration`).value);
                this.config.commands[commandName].requiredRole = document.getElementById(`command-${sanitizedId}-requiredRole`).value;
                this.config.commands[commandName].cooldown = parseInt(document.getElementById(`command-${sanitizedId}-cooldown`).value) * 1000; // Convert to ms
                this.config.commands[commandName].animation = document.getElementById(`command-${sanitizedId}-animation`).value;
                this.config.commands[commandName].particles = document.getElementById(`command-${sanitizedId}-particles`).value;
                this.config.commands[commandName].sound = document.getElementById(`command-${sanitizedId}-sound`).value;
            });
        }

        // States
        Object.keys(this.config.states).forEach(stateName => {
            const stateData = this.config.states[stateName];
            stateData.enabled = document.getElementById(`state-${stateName}-enabled`).checked;
            stateData.image = document.getElementById(`state-${stateName}-image`).value;
            stateData.triggerChance = parseFloat(document.getElementById(`state-${stateName}-triggerChance`).value);
            stateData.checkInterval = parseInt(document.getElementById(`state-${stateName}-checkInterval`).value);
            stateData.recoveryCommand = document.getElementById(`state-${stateName}-recoveryCommand`).value;
            stateData.message = document.getElementById(`state-${stateName}-message`).value;
            stateData.commandMessage = document.getElementById(`state-${stateName}-commandMessage`).value;
            stateData.requiredRole = document.getElementById(`state-${stateName}-requiredRole`).value;
            stateData.animation = document.getElementById(`state-${stateName}-animation`).value;
            stateData.particles = document.getElementById(`state-${stateName}-particles`).value;
            stateData.sound = document.getElementById(`state-${stateName}-sound`).value;
            
            if (stateData.autoRecoverTime !== undefined) {
                stateData.autoRecoverTime = parseInt(document.getElementById(`state-${stateName}-autoRecoverTime`).value);
            }
        });

        // Save enhancement settings
        this.saveGrowthSettings();
        this.saveViewerInteractionSettings();
        this.saveGreetingsSettings();
        this.saveSeasonalSettings();
        this.saveIntegrationsSettings();
        this.saveParticleSettings();

        // Save to storage
        const result = petStorage.save(this.config);
        
        if (result.success) {
            // Also try to save to a shared location that works across file:// origins
            try {
                // Save a backup to sessionStorage
                sessionStorage.setItem('streamPetConfig', JSON.stringify(this.config));
                
                // Save images to sessionStorage too
                const images = localStorage.getItem('streamPetImages');
                if (images) {
                    sessionStorage.setItem('streamPetImages', images);
                }
            } catch (e) {
                console.warn('Could not save to sessionStorage:', e);
            }
            
            // Show success message (no alert dialog)
            this.showNotification('Configuration saved successfully!', 'success');
            this.updateJsonDisplay();
            this.refreshPreview();
        } else {
            this.showNotification('Error saving configuration: ' + result.error, 'error');
        }
    }

    /**
     * Show notification message
     */
    showNotification(message, type = 'info') {
        let notification = document.getElementById('notification-message');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification-message';
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 8px;
                font-weight: 500;
                z-index: 10001;
                min-width: 250px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease-out;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(notification);
        }
        
        // Set colors based on type
        switch (type) {
            case 'success':
                notification.style.background = '#10b981';
                notification.style.color = 'white';
                notification.textContent = '✅ ' + message;
                break;
            case 'error':
                notification.style.background = '#ef4444';
                notification.style.color = 'white';
                notification.textContent = '❌ ' + message;
                break;
            case 'warning':
                notification.style.background = '#f59e0b';
                notification.style.color = 'white';
                notification.textContent = '⚠️ ' + message;
                break;
            default:
                notification.style.background = '#6b46c1';
                notification.style.color = 'white';
                notification.textContent = 'ℹ️ ' + message;
        }
        
        notification.style.opacity = '1';
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * Reset configuration
     */
    resetConfig() {
        if (confirm('Are you sure you want to reset to default configuration? This cannot be undone.')) {
            petStorage.reset();
            this.config = petStorage.load();
            this.loadFormValues();
            this.buildEventsSection();
            this.buildCommandsSection();
            this.buildStatesSection();
            this.buildTestingSection();
            this.updateJsonDisplay();
            this.showNotification('Configuration reset to defaults', 'success');
        }
    }

    /**
     * Export configuration
     */
    exportConfig() {
        const json = petStorage.export();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stream-pet-config.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Import configuration
     */
    importConfig() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showNotification('Please select a file to import', 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = petStorage.import(e.target.result);
            if (result.success) {
                this.config = petStorage.load();
                this.loadFormValues();
                this.buildEventsSection();
                this.buildStatesSection();
                this.buildTestingSection();
                this.updateJsonDisplay();
                this.showNotification('Configuration imported successfully!', 'success');
            } else {
                this.showNotification('Error importing configuration: ' + result.error, 'error');
            }
        };
        reader.readAsText(file);
    }

    /**
     * Apply JSON
     */
    applyJson() {
        const json = document.getElementById('config-json').value;
        const result = petStorage.import(json);
        
        if (result.success) {
            this.config = petStorage.load();
            this.loadFormValues();
            this.buildEventsSection();
            this.buildStatesSection();
            this.buildTestingSection();
            this.showNotification('JSON applied successfully!', 'success');
        } else {
            this.showNotification('Error applying JSON: ' + result.error, 'error');
        }
    }

    /**
     * Update JSON display
     */
    /**
     * Setup auto-save on input changes
     */
    setupAutoSave() {
        // Listen to all input changes in the form
        const form = document.querySelector('.config-container');
        
        form.addEventListener('input', (e) => {
            // Skip if it's the JSON editor
            if (e.target.id === 'config-json') return;
            
            this.scheduleAutoSave();
        });
        
        form.addEventListener('change', (e) => {
            // Skip if it's the JSON editor
            if (e.target.id === 'config-json') return;
            
            this.scheduleAutoSave();
        });
    }

    /**
     * Schedule auto-save with debouncing
     */
    /**
     * Update size mode UI visibility
     */
    updateSizeModeUI(mode) {
        const pixelsGroup = document.getElementById('size-pixels-group');
        const pixelsGroupHeight = document.getElementById('size-pixels-group-height');
        const percentGroup = document.getElementById('size-percent-group');
        const percentGroupHeight = document.getElementById('size-percent-group-height');
        const scaleGroup = document.getElementById('size-scale-group');
        const aspectGroup = document.getElementById('maintain-aspect-group');
        
        // Hide all first
        pixelsGroup.style.display = 'none';
        pixelsGroupHeight.style.display = 'none';
        percentGroup.style.display = 'none';
        percentGroupHeight.style.display = 'none';
        scaleGroup.style.display = 'none';
        
        // Show relevant fields based on mode
        switch(mode) {
            case 'pixels':
                pixelsGroup.style.display = 'block';
                pixelsGroupHeight.style.display = 'block';
                aspectGroup.style.display = 'block';
                break;
            case 'percent':
                percentGroup.style.display = 'block';
                percentGroupHeight.style.display = 'block';
                aspectGroup.style.display = 'block';
                break;
            case 'auto':
                // No size inputs needed, just uses natural image size
                aspectGroup.style.display = 'none';
                break;
            case 'scale':
                scaleGroup.style.display = 'block';
                aspectGroup.style.display = 'block';
                break;
        }
    }

    scheduleAutoSave() {
        // Clear existing timer
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }
        
        // Show saving indicator
        this.showSaveStatus('saving');
        
        // Schedule save after delay
        this.autoSaveTimer = setTimeout(() => {
            this.performAutoSave();
        }, this.autoSaveDelay);
    }

    /**
     * Perform auto-save
     */
    async performAutoSave() {
        if (this.saveInProgress) return;
        
        try {
            this.saveInProgress = true;
            this.saveConfig();
            this.showSaveStatus('saved');
            
            // Hide status after 2 seconds
            setTimeout(() => {
                this.showSaveStatus('hidden');
            }, 2000);
        } catch (error) {
            console.error('Auto-save failed:', error);
            this.showSaveStatus('error');
        } finally {
            this.saveInProgress = false;
        }
    }

    /**
     * Show save status indicator
     */
    showSaveStatus(status) {
        let statusElement = document.getElementById('save-status');
        
        // Create status element if it doesn't exist
        if (!statusElement) {
            statusElement = document.createElement('div');
            statusElement.id = 'save-status';
            statusElement.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                border-radius: 5px;
                font-weight: bold;
                z-index: 10000;
                transition: opacity 0.3s;
            `;
            document.body.appendChild(statusElement);
        }
        
        switch (status) {
            case 'saving':
                statusElement.textContent = '💾 Saving...';
                statusElement.style.background = '#ffd700';
                statusElement.style.color = '#333';
                statusElement.style.opacity = '1';
                break;
            case 'saved':
                statusElement.textContent = '✅ Saved!';
                statusElement.style.background = '#4caf50';
                statusElement.style.color = 'white';
                statusElement.style.opacity = '1';
                break;
            case 'error':
                statusElement.textContent = '❌ Save failed';
                statusElement.style.background = '#f44336';
                statusElement.style.color = 'white';
                statusElement.style.opacity = '1';
                break;
            case 'hidden':
                statusElement.style.opacity = '0';
                break;
        }
    }

    updateJsonDisplay() {
        document.getElementById('config-json').value = JSON.stringify(this.config, null, 2);
    }

    /**
     * Update Twitch connection status display
     */
    updateTwitchStatus() {
        const chatStatus = document.getElementById('chat-status');
        const botStatus = document.getElementById('bot-status');
        const eventsubStatus = document.getElementById('eventsub-status');
        
        if (chatStatus) {
            const connected = localStorage.getItem('twitch_connected') === 'true';
            const channel = localStorage.getItem('twitch_channel');
            
            if (connected && channel) {
                chatStatus.textContent = `✅ Connected to ${channel}`;
                chatStatus.style.color = '#4CAF50';
            } else {
                chatStatus.textContent = '❌ Not connected';
                chatStatus.style.color = '#f44336';
            }
        }
        
        if (botStatus) {
            botStatus.textContent = '⚪ Not configured';
            botStatus.style.color = '#999';
        }
        
        if (eventsubStatus) {
            const eventsubConnected = localStorage.getItem('eventsub_connected') === 'true';
            
            if (eventsubConnected) {
                eventsubStatus.textContent = '✅ Connected';
                eventsubStatus.style.color = '#4CAF50';
            } else {
                eventsubStatus.textContent = '❌ Not connected';
                eventsubStatus.style.color = '#f44336';
            }
        }
    }

    /**
     * Refresh preview
     */
    refreshPreview() {
        const iframe = document.getElementById('preview-frame');
        iframe.src = iframe.src;
    }

    /**
     * Sync config to preview iframe
     * Workaround for file:// localStorage isolation
     */
    syncToPreview() {
        console.log('=== SYNC TO PREVIEW CALLED ===');
        
        // Save current config first
        this.saveConfig();
        
        // Get the iframe
        const iframe = document.getElementById('preview-frame');
        console.log('Preview iframe element:', iframe);
        
        if (iframe && iframe.contentWindow) {
            console.log('Sending config to preview iframe via postMessage');
            console.log('Config pet name:', this.config.pet.name);
            console.log('Config default image:', this.config.pet.defaultImage);
            console.log('Full config (first 300 chars):', JSON.stringify(this.config).substring(0, 300));
            
            // Send config via postMessage (works across localStorage boundaries)
            iframe.contentWindow.postMessage({
                type: 'forceConfigUpdate',
                config: this.config
            }, '*');
            
            console.log('postMessage sent to iframe');
            this.showNotification('Config synced to preview!', 'success');
        } else {
            console.error('Preview iframe not found or no contentWindow');
            this.showNotification('Preview iframe not found', 'error');
        }
        
        // Also sync to any popped-out windows
        if (this.popoutWindow && !this.popoutWindow.closed) {
            console.log('Syncing to popped-out window');
            this.popoutWindow.postMessage({
                type: 'forceConfigUpdate',
                config: this.config
            }, '*');
        }
    }

    /**
     * Send message to both iframe preview and popped-out window
     */
    sendToPreview(message) {
        console.log('sendToPreview called with:', message);
        
        // Send to iframe
        const iframe = document.getElementById('preview-frame');
        if (iframe && iframe.contentWindow) {
            console.log('Sending to iframe');
            iframe.contentWindow.postMessage(message, '*');
        }
        
        // Send to popped-out window
        if (this.popoutWindow && !this.popoutWindow.closed) {
            console.log('Sending to popout window');
            try {
                this.popoutWindow.postMessage(message, '*');
                console.log('Message sent to popout window successfully');
            } catch (e) {
                console.error('Error sending to popout window:', e);
            }
        } else {
            console.log('No popout window available:', {
                exists: !!this.popoutWindow,
                closed: this.popoutWindow ? this.popoutWindow.closed : 'N/A'
            });
        }
    }

    /**
     * Pop out preview window
     */
    popOutPreview() {
        // Check if window already exists and is open
        if (this.popoutWindow && !this.popoutWindow.closed) {
            this.popoutWindow.focus();
            this.showNotification('Preview window already open!', 'info');
            return;
        }
        
        // Save config first
        this.saveConfig();
        
        // Get the full path to index.html
        const currentPath = window.location.href;
        const basePath = currentPath.substring(0, currentPath.lastIndexOf('/'));
        const indexPath = basePath + '/index.html';
        
        // Open in a new window (unique name each time to avoid reuse issues)
        const windowName = 'StreamPetPreview_' + Date.now();
        this.popoutWindow = window.open(
            indexPath,
            windowName,
            'width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no'
        );
        
        if (this.popoutWindow) {
            console.log('Popout window opened:', this.popoutWindow);
            
            // Poll until window is ready, then sync config
            let attempts = 0;
            const maxAttempts = 25; // 5 seconds
            const syncInterval = setInterval(() => {
                attempts++;
                
                if (this.popoutWindow.closed) {
                    console.log('Popout window was closed');
                    clearInterval(syncInterval);
                    this.popoutWindow = null;
                    return;
                }
                
                // Try to send config
                try {
                    this.popoutWindow.postMessage({
                        type: 'forceConfigUpdate',
                        config: this.config
                    }, '*');
                    console.log('Config sent to popout window (attempt ' + attempts + ')');
                    
                    // Stop after first successful send
                    if (attempts >= 3) {
                        clearInterval(syncInterval);
                    }
                } catch (e) {
                    console.log('Window not ready yet (attempt ' + attempts + '):', e.message);
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(syncInterval);
                    console.log('Stopped polling after ' + maxAttempts + ' attempts');
                }
            }, 200);
            
            this.showNotification('Preview window opened! Use "Sync to Preview" to update it.', 'success');
        } else {
            this.showNotification('Could not open preview window. Check popup blocker.', 'error');
        }
    }

    /**
     * Format event/state name for display
     */
    formatEventName(name) {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Test event
     */
    testEvent(eventName) {
        console.log('testEvent called for:', eventName);
        
        const testData = {
            raid: {
                raider: document.getElementById('test-raider').value,
                count: parseInt(document.getElementById('test-raid-count').value),
                username: document.getElementById('test-raider').value
            },
            follow: {
                username: document.getElementById('test-follower').value
            },
            subscribe: {
                username: document.getElementById('test-subscriber').value
            },
            giftSub: {
                gifter: document.getElementById('test-gifter').value,
                count: parseInt(document.getElementById('test-gift-count').value)
            },
            bits: {
                username: document.getElementById('test-cheerer').value,
                amount: parseInt(document.getElementById('test-bits-amount').value)
            }
        };

        console.log('Test data:', testData[eventName]);

        // Save test event to localStorage for the browser source to pick up
        const testEvent = {
            type: 'testEvent',
            eventName: eventName,
            eventData: testData[eventName],
            timestamp: Date.now()
        };
        localStorage.setItem('streamPetTestTrigger', JSON.stringify(testEvent));
        console.log('Test event saved to localStorage');

        // Send to both iframe and popout window
        const message = {
            type: 'testEvent',
            eventName: eventName,
            eventData: testData[eventName]
        };
        console.log('Sending message via sendToPreview:', message);
        this.sendToPreview(message);
        this.showNotification(`Test event "${eventName}" sent`, 'info');
    }

    /**
     * Test state
     */
    testState(stateName) {
        console.log('testState called for:', stateName);
        
        // Save test state to localStorage for the browser source to pick up
        const testState = {
            type: 'testState',
            stateName: stateName,
            timestamp: Date.now()
        };
        localStorage.setItem('streamPetTestTrigger', JSON.stringify(testState));
        console.log('Test state saved to localStorage');
        
        // Send to both iframe and popout window
        const message = {
            type: 'testState',
            stateName: stateName
        };
        console.log('Sending message via sendToPreview:', message);
        this.sendToPreview(message);
        this.showNotification(`Test state "${stateName}" sent`, 'info');
    }

    /**
     * Test command
     */
    testCommand(stateName) {
        console.log('testCommand called for state:', stateName);
        
        // Save test command to localStorage for browser source to pick up
        const testCommand = {
            type: 'testCommand',
            stateName: stateName,
            username: 'TestUser',
            timestamp: Date.now()
        };
        localStorage.setItem('streamPetTestTrigger', JSON.stringify(testCommand));
        console.log('Test command saved to localStorage');
        
        // Send to both iframe and popout window
        this.sendToPreview({
            type: 'testCommand',
            stateName: stateName,
            username: 'TestUser'
        });
        this.showNotification(`Test recovery command sent`, 'info');
    }
    
    /**
     * Test custom command
     */
    testCustomCommand(commandName) {
        console.log('testCustomCommand called for:', commandName);
        
        // Save test command to localStorage for browser source to pick up
        const testCommand = {
            type: 'testCustomCommand',
            commandName: commandName,
            username: 'TestUser',
            timestamp: Date.now()
        };
        localStorage.setItem('streamPetTestTrigger', JSON.stringify(testCommand));
        console.log('Test custom command saved to localStorage');
        
        // Send to both iframe and popout window
        this.sendToPreview({
            type: 'testCustomCommand',
            commandName: commandName,
            username: 'TestUser'
        });
        this.showNotification(`Test custom command sent`, 'info');
    }

    /**
     * Add custom state
     */
    addCustomState() {
        const stateName = prompt('Enter custom state name:');
        if (!stateName) return;

        const stateKey = stateName.toLowerCase().replace(/\s+/g, '_');
        
        if (this.config.states[stateKey]) {
            alert('State already exists!');
            return;
        }

        const newState = {
            enabled: true,
            image: 'Images/default.png',
            triggerChance: 0.05,
            checkInterval: 300000,
            recoveryCommand: '!pet',
            allowedEvents: [],
            message: `I'm ${stateName}!`,
            commandMessage: '{username} helped me!',
            requiredRole: 'everyone'
        };

        const result = petStorage.addState(stateKey, newState);
        if (result.success) {
            this.config = petStorage.load();
            this.buildStatesSection();
            this.buildTestingSection();
            alert('Custom state added!');
        } else {
            alert('Error adding state: ' + result.error);
        }
    }

    /**
     * Delete state
     */
    deleteState(stateName) {
        if (confirm(`Are you sure you want to delete the "${stateName}" state?`)) {
            const result = petStorage.deleteState(stateName);
            if (result.success) {
                this.config = petStorage.load();
                this.buildStatesSection();
                this.buildTestingSection();
                alert('State deleted!');
            } else {
                alert('Error deleting state: ' + result.error);
            }
        }
    }
    
    /**
     * Add custom command
     */
    addCustomCommand() {
        const commandName = prompt('Enter command name (include ! if needed):');
        if (!commandName) return;

        const cmdKey = commandName.trim();
        
        if (this.config.commands && this.config.commands[cmdKey]) {
            alert('Command already exists!');
            return;
        }

        const newCommand = {
            enabled: true,
            image: 'Images/happy.png',
            message: `Thanks for using ${cmdKey}!`,
            duration: 3000,
            sound: '',
            requiredRole: 'everyone',
            cooldown: 10000
        };

        const result = petStorage.addCommand(cmdKey, newCommand);
        if (result.success) {
            this.config = petStorage.load();
            this.buildCommandsSection();
            this.buildTestingSection();
            this.showNotification(`Command ${cmdKey} added!`, 'success');
        } else {
            alert('Error adding command: ' + result.error);
        }
    }

    /**
     * Delete command
     */
    deleteCommand(commandName) {
        if (confirm(`Are you sure you want to delete the "${commandName}" command?`)) {
            const result = petStorage.deleteCommand(commandName);
            if (result.success) {
                this.config = petStorage.load();
                this.buildCommandsSection();
                this.buildTestingSection();
                this.showNotification(`Command ${commandName} deleted!`, 'success');
            } else {
                alert('Error deleting command: ' + result.error);
            }
        }
    }
    
    /**
     * Handle OAuth callback
     */
    handleOAuthCallback() {
        if (window.location.hash.includes('access_token')) {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('access_token');
            const state = params.get('state');
            
            if (token) {
                if (state === 'bot_account') {
                    localStorage.setItem('twitch_bot_access_token', token);
                    this.showNotification('Bot account authenticated successfully!', 'success');
                } else {
                    localStorage.setItem('twitch_access_token', token);
                    this.showNotification('Main account authenticated successfully!', 'success');
                    // Get user ID
                    this.getUserIdFromToken(token);
                }
                
                // Clear hash
                window.location.hash = '';
                this.updateAuthStatus();
            }
        }
    }
    
    /**
     * Get user ID from token
     */
    async getUserIdFromToken(token) {
        const clientId = document.getElementById('twitch-client-id').value;
        if (!clientId) return;
        
        try {
            const response = await fetch('https://api.twitch.tv/helix/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Client-Id': clientId
                }
            });
            
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                localStorage.setItem('twitch_user_id', data.data[0].id);
                localStorage.setItem('twitch_username', data.data[0].display_name);
                this.updateAuthStatus();
            }
        } catch (error) {
            console.error('Error getting user ID:', error);
        }
    }
    
    /**
     * Update authentication status display
     */
    updateAuthStatus() {
        const mainToken = localStorage.getItem('twitch_access_token');
        const botToken = localStorage.getItem('twitch_bot_access_token');
        const username = localStorage.getItem('twitch_username');
        
        const mainAuthText = document.getElementById('main-auth-text');
        const botAuthText = document.getElementById('bot-auth-text');
        
        if (mainToken) {
            mainAuthText.textContent = `✅ Authenticated${username ? ` as ${username}` : ''}`;
            mainAuthText.style.color = '#4CAF50';
        } else {
            mainAuthText.textContent = '❌ Not authenticated';
            mainAuthText.style.color = '#f44336';
        }
        
        if (botToken) {
            const botUsername = document.getElementById('bot-username').value;
            botAuthText.textContent = `✅ Authenticated${botUsername ? ` as ${botUsername}` : ''}`;
            botAuthText.style.color = '#4CAF50';
        } else {
            botAuthText.textContent = '❌ Not authenticated';
            botAuthText.style.color = '#f44336';
        }
    }
    
    /**
     * Authenticate main Twitch account
     */
    authenticateMainAccount() {
        const clientId = document.getElementById('twitch-client-id').value;
        const redirectUri = document.getElementById('twitch-redirect-uri').value;
        
        if (!clientId) {
            alert('Please enter a Client ID first');
            return;
        }
        
        if (!redirectUri) {
            alert('Please enter a Redirect URI first');
            return;
        }
        
        const scopes = [
            'chat:read',
            'chat:edit',
            'channel:read:subscriptions',
            'bits:read',
            'channel:read:redemptions',
            'moderator:read:followers'
        ].join(' ');
        
        const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=token&` +
            `scope=${encodeURIComponent(scopes)}`;
        
        window.location.href = authUrl;
    }
    
    /**
     * Disconnect main account
     */
    disconnectMainAccount() {
        if (confirm('Are you sure you want to disconnect the main account?')) {
            localStorage.removeItem('twitch_access_token');
            localStorage.removeItem('twitch_user_id');
            localStorage.removeItem('twitch_username');
            this.updateAuthStatus();
            this.showNotification('Main account disconnected', 'info');
        }
    }
    
    /**
     * Authenticate bot account
     */
    authenticateBotAccount() {
        const clientId = document.getElementById('twitch-client-id').value;
        const redirectUri = document.getElementById('twitch-redirect-uri').value;
        
        if (!clientId) {
            alert('Please enter a Client ID first');
            return;
        }
        
        if (!redirectUri) {
            alert('Please enter a Redirect URI first');
            return;
        }
        
        const scopes = [
            'chat:read',
            'chat:edit'
        ].join(' ');
        
        const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=token&` +
            `scope=${encodeURIComponent(scopes)}&` +
            `state=bot_account`;
        
        window.location.href = authUrl;
    }
    
    /**
     * Disconnect bot account
     */
    disconnectBotAccount() {
        if (confirm('Are you sure you want to disconnect the bot account?')) {
            localStorage.removeItem('twitch_bot_access_token');
            this.updateAuthStatus();
            this.showNotification('Bot account disconnected', 'info');
        }
    }

    /**
     * Connect Spotify
     */
    connectSpotify() {
        const clientId = document.getElementById('spotify-clientid').value.trim();
        const redirectUri = document.getElementById('spotify-redirect-uri-input').value.trim();
        
        if (!clientId) {
            this.showNotification('Please enter your Spotify Client ID first', 'error');
            return;
        }
        
        if (!redirectUri) {
            this.showNotification('Please enter your Redirect URI', 'error');
            return;
        }
        
        if (!redirectUri.startsWith('https://') && !redirectUri.startsWith('http://localhost')) {
            this.showNotification('Redirect URI must start with https:// (or http://localhost for testing)', 'error');
            return;
        }
        
        // Warning about common mistakes
        const commonWarnings = [];
        if (!redirectUri.includes('example.com') && !redirectUri.includes('localhost')) {
            commonWarnings.push('ℹ️ Make sure this EXACT URL is added to your Spotify app Redirect URIs in the Dashboard → Settings → Edit Settings → Redirect URIs');
        }
        
        if (commonWarnings.length > 0) {
            console.warn('Spotify Connection Warnings:\n' + commonWarnings.join('\n'));
        }
        
        // Save client ID and redirect URI
        if (!this.config.integrations.spotify) {
            this.config.integrations.spotify = {};
        }
        this.config.integrations.spotify.clientId = clientId;
        this.config.integrations.spotify.redirectUri = redirectUri;
        this.scheduleAutoSave();
        
        const scopes = 'user-read-currently-playing user-read-playback-state';
        const state = Math.random().toString(36).substring(7);
        
        localStorage.setItem('spotify_auth_state', state);
        localStorage.setItem('spotify_client_id', clientId);
        localStorage.setItem('spotify_redirect_uri', redirectUri);
        
        // Generate PKCE code verifier and challenge
        const codeVerifier = this.generateCodeVerifier();
        localStorage.setItem('spotify_code_verifier', codeVerifier);
        
        this.generateCodeChallenge(codeVerifier).then(codeChallenge => {
            // Use Authorization Code flow with PKCE (Implicit Grant is deprecated)
            const authUrl = `https://accounts.spotify.com/authorize?` +
                `client_id=${encodeURIComponent(clientId)}` +
                `&response_type=code` +
                `&redirect_uri=${encodeURIComponent(redirectUri)}` +
                `&scope=${scopes.split(' ').map(s => encodeURIComponent(s)).join('%20')}` +
                `&state=${encodeURIComponent(state)}` +
                `&code_challenge_method=S256` +
                `&code_challenge=${encodeURIComponent(codeChallenge)}`;
            
            console.log('Spotify Auth URL (PKCE):', authUrl);
            console.log('Scopes (raw):', scopes);
            console.log('Make sure this redirect URI is in your Spotify app settings:', redirectUri);
            console.log('\n🔍 TROUBLESHOOTING:');
            console.log('1. Go to https://developer.spotify.com/dashboard');
            console.log('2. Click your app → Settings (top right)');
            console.log('3. Find "Redirect URIs" section → Click "Edit"');
            console.log('4. Add this EXACT URL:', redirectUri);
            console.log('5. Click "Add", then "Save" at the bottom');
            console.log('6. Wait 30 seconds, then try connecting again\n');
            
            // Open in new tab
            window.open(authUrl, 'spotify_auth', 'width=600,height=700');
            
            this.showNotification('Authorization window opened. Please approve the connection.', 'info');
        });
    }
    
    /**
     * Generate PKCE code verifier
     */
    generateCodeVerifier() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.base64URLEncode(array);
    }
    
    /**
     * Generate PKCE code challenge from verifier
     */
    async generateCodeChallenge(verifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const hash = await crypto.subtle.digest('SHA-256', data);
        return this.base64URLEncode(new Uint8Array(hash));
    }
    
    /**
     * Base64 URL encode
     */
    base64URLEncode(buffer) {
        const base64 = btoa(String.fromCharCode(...buffer));
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Save manually pasted Spotify token
     */
    saveSpotifyToken() {
        const tokenInput = document.getElementById('spotify-token-input').value.trim();
        
        if (!tokenInput) {
            this.showNotification('Please paste the redirect URL', 'error');
            return;
        }
        
        try {
            let tokenData;
            
            // Check if it's a JSON object or a URL
            if (tokenInput.startsWith('{')) {
                // It's JSON format
                tokenData = JSON.parse(tokenInput);
            } else if (tokenInput.includes('#access_token=')) {
                // It's a URL with hash fragment
                const hashPart = tokenInput.split('#')[1];
                const params = new URLSearchParams(hashPart);
                tokenData = {
                    access_token: params.get('access_token'),
                    expires_in: params.get('expires_in'),
                    state: params.get('state'),
                    token_expiry: Date.now() + (parseInt(params.get('expires_in')) * 1000)
                };
            } else if (tokenInput.includes('#error=')) {
                // It's an error response
                const hashPart = tokenInput.split('#')[1];
                const params = new URLSearchParams(hashPart);
                const error = params.get('error');
                
                if (error === 'unsupported_response_type') {
                    this.showNotification('❌ That redirect URI doesn\'t exist. Use https://example.com/callback instead (it works even though it\'s not a real page!)', 'error');
                } else if (error === 'invalid_client') {
                    this.showNotification('❌ INVALID_CLIENT: Make sure the redirect URI in Spotify Dashboard EXACTLY matches what you entered above', 'error');
                } else {
                    this.showNotification(`Spotify error: ${error}`, 'error');
                }
                console.error('Spotify auth error:', error, tokenInput);
                return;
            } else {
                this.showNotification('Invalid format - please paste the full URL from the browser address bar', 'error');
                return;
            }
            
            if (!tokenData.access_token) {
                this.showNotification('No access token found in the URL', 'error');
                return;
            }
            
            const savedState = localStorage.getItem('spotify_auth_state');
            
            if (tokenData.state !== savedState) {
                this.showNotification('Security check failed - please try connecting again', 'error');
                return;
            }
            
            // Save token
            localStorage.setItem('spotify_access_token', tokenData.access_token);
            localStorage.setItem('spotify_token_expiry', tokenData.token_expiry.toString());
            localStorage.removeItem('spotify_auth_state');
            
            // Hide manual token section and clear input
            document.getElementById('spotify-manual-token').style.display = 'none';
            document.getElementById('spotify-token-input').value = '';
            
            // Update UI
            updateSpotifyStatus();
            this.showNotification('✅ Spotify connected successfully!', 'success');
        } catch (error) {
            this.showNotification('Error parsing token - please paste the entire URL from your browser', 'error');
            console.error('Token parse error:', error);
        }
    }

    /**
     * Cancel Spotify token input
     */
    cancelSpotifyToken() {
        document.getElementById('spotify-manual-token').style.display = 'none';
        document.getElementById('spotify-token-input').value = '';
        localStorage.removeItem('spotify_auth_state');
    }

    /**
     * Set custom redirect URI
     */
    setCustomRedirectUri() {
        const customUri = document.getElementById('custom-redirect-uri').value.trim();
        
        if (!customUri) {
            this.showNotification('Please enter a redirect URI', 'error');
            return;
        }
        
        if (!customUri.startsWith('https://')) {
            this.showNotification('Redirect URI must start with https://', 'error');
            return;
        }
        
        if (!this.config.integrations.spotify) {
            this.config.integrations.spotify = {};
        }
        
        this.config.integrations.spotify.customRedirectUri = customUri;
        this.scheduleAutoSave();
        
        // Update display
        document.getElementById('spotify-redirect-uri').textContent = customUri;
        
        this.showNotification('✅ Custom redirect URI saved! Use this in your Spotify app settings.', 'success');
    }

    /**
     * Disconnect Spotify
     */
    disconnectSpotify() {
        if (confirm('Are you sure you want to disconnect Spotify?')) {
            localStorage.removeItem('spotify_access_token');
            localStorage.removeItem('spotify_token_expiry');
            localStorage.removeItem('spotify_auth_state');
            updateSpotifyStatus();
            this.showNotification('Spotify disconnected', 'info');
        }
    }

    /**
     * Copy Spotify redirect URI to clipboard
     */
    copyRedirectUri() {
        const customRedirect = this.config.integrations?.spotify?.customRedirectUri;
        const redirectUri = customRedirect || 'https://example.com/callback';
        navigator.clipboard.writeText(redirectUri).then(() => {
            this.showNotification('Redirect URI copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification(`Failed to copy. Please copy manually: ${redirectUri}`, 'error');
        });
    }

    /**
     * Load Growth System settings
     */
    loadGrowthSettings() {
        if (!this.config.growth) return;

        // Display current stats
        document.getElementById('current-level').textContent = this.config.growth.level || 1;
        const maxXP = Math.floor(100 * Math.pow(1.5, (this.config.growth.level || 1) - 1));
        document.getElementById('current-xp').textContent = `${this.config.growth.experience || 0} / ${maxXP}`;
        const xpPercent = ((this.config.growth.experience || 0) / maxXP) * 100;
        document.getElementById('xp-progress').style.width = `${xpPercent}%`;
        document.getElementById('evolution-stage').textContent = this.config.growth.evolutionStage || 'Baby';

        // Load XP gain values
        const gains = this.config.growth.experienceGains || {};
        document.getElementById('xp-follow').value = gains.follow || 10;
        document.getElementById('xp-subscribe').value = gains.subscribe || 50;
        document.getElementById('xp-giftsub').value = gains.giftSub || 75;
        document.getElementById('xp-raid').value = gains.raid || 100;
        document.getElementById('xp-bits').value = gains.bits || 1;
        document.getElementById('xp-channelpoints').value = gains.channelPoints || 5;
        document.getElementById('xp-command').value = gains.command || 2;
        document.getElementById('xp-click').value = gains.click || 1;
        
        // Load level up bar settings
        const levelUpBar = this.config.growth.levelUpBar || {};
        document.getElementById('levelup-style').value = levelUpBar.style || 'default';
        document.getElementById('levelup-position').value = levelUpBar.position || 'top';
        document.getElementById('levelup-offset-y').value = levelUpBar.offsetY || 0;
        document.getElementById('levelup-duration').value = levelUpBar.duration || 3000;
        document.getElementById('levelup-size').value = levelUpBar.textSize || 24;
        document.getElementById('levelup-size-value').textContent = (levelUpBar.textSize || 24) + 'px';
        
        // Load level up effect settings
        const levelUpEffect = this.config.growth.levelUpEffect || {};
        document.getElementById('levelup-effect-type').value = levelUpEffect.type || 'rainbow';
        document.getElementById('levelup-effect-color').value = levelUpEffect.color || '#FFD700';
        document.getElementById('levelup-effect-duration').value = levelUpEffect.duration || 2000;
        document.getElementById('levelup-effect-intensity').value = levelUpEffect.intensity || 1.2;
        document.getElementById('levelup-effect-intensity-value').textContent = (levelUpEffect.intensity || 1.2) + 'x';
        
        // Load evolution effect settings
        const evolutionEffect = this.config.growth.evolutionEffect || {};
        document.getElementById('evolution-effect-type').value = evolutionEffect.type || 'burst';
        document.getElementById('evolution-effect-color').value = evolutionEffect.color || '#FF6EC7';
        document.getElementById('evolution-effect-color2').value = evolutionEffect.secondaryColor || '#7C3AED';
        document.getElementById('evolution-effect-duration').value = evolutionEffect.duration || 3000;
        document.getElementById('evolution-effect-intensity').value = evolutionEffect.intensity || 1.5;
        document.getElementById('evolution-effect-intensity-value').textContent = (evolutionEffect.intensity || 1.5) + 'x';
        
        // Build evolution stages list
        this.buildEvolutionStagesList();
    }

    /**
     * Build evolution stages list
     */
    buildEvolutionStagesList() {
        const container = document.getElementById('evolution-stages-list');
        if (!container) return;

        const stages = this.config.growth?.stages || [];
        
        container.innerHTML = stages.map((stage, index) => `
            <div class="evolution-stage-item">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Stage Name</label>
                        <input type="text" class="stage-name" data-index="${index}" value="${stage.name || ''}">
                    </div>
                    <div class="form-group">
                        <label>Required Level</label>
                        <input type="number" class="stage-level" data-index="${index}" min="1" value="${stage.level || 1}">
                    </div>
                    <div class="form-group">
                        <label>Stage Image</label>
                        <input type="text" class="stage-image" id="stage-image-${index}" data-index="${index}" value="${stage.image || ''}" placeholder="Images/stage.png">
                        <button class="btn btn-sm" onclick="selectImage('stage-image-${index}')">Browse</button>
                    </div>
                    <div class="form-group">
                        <button class="btn btn-danger btn-sm" onclick="configManager.removeEvolutionStage(${index})">Remove Stage</button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners for stage inputs
        container.querySelectorAll('.stage-name, .stage-level, .stage-image').forEach(input => {
            input.addEventListener('change', () => this.scheduleAutoSave());
        });
    }

    /**
     * Add evolution stage
     */
    addEvolutionStage() {
        if (!this.config.growth.stages) {
            this.config.growth.stages = [];
        }
        
        this.config.growth.stages.push({
            name: 'New Stage',
            level: (this.config.growth.stages.length + 1) * 5,
            image: 'Images/stage.png'
        });
        
        this.buildEvolutionStagesList();
        this.scheduleAutoSave();
    }

    /**
     * Remove evolution stage
     */
    removeEvolutionStage(index) {
        if (!this.config.growth?.stages) return;
        
        this.config.growth.stages.splice(index, 1);
        this.buildEvolutionStagesList();
        this.scheduleAutoSave();
        this.showNotification('Evolution stage removed', 'success');
    }

    /**
     * Reset growth stats
     */
    resetGrowth() {
        this.config.growth.level = 1;
        this.config.growth.experience = 0;
        this.config.growth.evolutionStage = this.config.growth.stages?.[0]?.name || 'Baby';
        
        // Update display
        this.loadGrowthSettings();
        this.scheduleAutoSave();
        
        // Send message to preview
        this.sendToPreview({ 
            type: 'resetGrowth'
        });
        
        this.showNotification('Growth stats reset to level 1', 'success');
    }

    /**
     * Test level up
     */
    testLevelUp() {
        this.sendToPreview({ 
            type: 'testLevelUp'
        });
        this.showNotification('Level up test triggered', 'info');
    }

    /**
     * Test emote rain
     */
    testEmoteRain() {
        // Save settings first
        this.saveConfig();
        
        // Trigger test emote rain
        this.sendToPreview({ 
            type: 'testEmoteRain',
            emotes: ['Kappa', 'PogChamp', 'LUL', '4Head', 'Kreygasm']
        });
        this.showNotification('Emote rain test triggered', 'info');
    }

    /**
     * Test evolution effect
     */
    testEvolutionEffect() {
        this.sendToPreview({ 
            type: 'testEvolutionEffect',
            stageName: 'Test Evolution'
        });
        this.showNotification('Evolution effect test triggered', 'info');
    }

    /**
     * Load Viewer Interaction settings
     */
    loadViewerInteractionSettings() {
        if (!this.config.viewerInteraction) return;

        document.getElementById('viewer-enabled').checked = this.config.viewerInteraction.enabled !== false;
        document.getElementById('channelpoints-enabled').checked = this.config.viewerInteraction.channelPoints?.enabled !== false;
        document.getElementById('viewer-commands-enabled').checked = this.config.viewerInteraction.chatCommands?.enabled !== false;
        document.getElementById('allow-viewer-commands').checked = this.config.viewerInteraction.chatCommands?.allowViewerCommands !== false;
        document.getElementById('user-cooldown').value = this.config.viewerInteraction.chatCommands?.cooldown || 30000;
        document.getElementById('global-cooldown').value = this.config.viewerInteraction.chatCommands?.globalCooldown || 5000;
        document.getElementById('polls-enabled').checked = this.config.viewerInteraction.polls?.enabled !== false;
        document.getElementById('poll-duration').value = this.config.viewerInteraction.polls?.duration || 60000;

        this.buildRedemptionsList();
    }

    /**
     * Build redemptions list
     */
    buildRedemptionsList() {
        const container = document.getElementById('redemptions-list');
        if (!container) return;

        const redemptions = this.config.viewerInteraction?.channelPoints?.customRedemptions || [];
        
        container.innerHTML = redemptions.map((redemption, index) => `
            <div class="redemption-item">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Name</label>
                        <input type="text" class="redemption-name" data-index="${index}" value="${redemption.name}">
                    </div>
                    <div class="form-group">
                        <label>Cost</label>
                        <input type="number" class="redemption-cost" data-index="${index}" value="${redemption.cost}">
                    </div>
                    <div class="form-group">
                        <label>Action Type</label>
                        <select class="redemption-action" data-index="${index}">
                            <option value="emotion" ${redemption.action === 'emotion' ? 'selected' : ''}>Emotion</option>
                            <option value="animation" ${redemption.action === 'animation' ? 'selected' : ''}>Animation</option>
                            <option value="state" ${redemption.action === 'state' ? 'selected' : ''}>State</option>
                            <option value="weather" ${redemption.action === 'weather' ? 'selected' : ''}>Weather</option>
                            <option value="physics" ${redemption.action === 'physics' ? 'selected' : ''}>Physics</option>
                            <option value="particle" ${redemption.action === 'particle' ? 'selected' : ''}>Particles</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <button class="btn btn-danger btn-sm" onclick="configManager.removeRedemption(${index})">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Remove redemption
     */
    removeRedemption(index) {
        if (!this.config.viewerInteraction?.channelPoints?.customRedemptions) return;
        this.config.viewerInteraction.channelPoints.customRedemptions.splice(index, 1);
        this.buildRedemptionsList();
        this.scheduleAutoSave();
    }

    /**
     * Load Greetings settings
     */
    loadGreetingsSettings() {
        if (!this.config.greetings) {
            this.config.greetings = petStorage.getDefaultConfig().greetings;
        }

        document.getElementById('greetings-enabled').checked = this.config.greetings.enabled !== false;
        document.getElementById('greeting-image').value = this.config.greetings.image || 'Images/wave.png';
        document.getElementById('greeting-sound').value = this.config.greetings.sound || '';
        document.getElementById('greeting-particles').checked = this.config.greetings.particles !== false;
        document.getElementById('greeting-duration').value = this.config.greetings.duration || 5000;

        // Build greeting messages list
        this.buildGreetingMessagesList();

        // Build custom greetings list
        this.buildCustomGreetingsList();
    }

    /**
     * Build greeting messages list
     */
    buildGreetingMessagesList() {
        const container = document.getElementById('greeting-messages-list');
        if (!container) return;

        const messages = this.config.greetings.messages || [];
        
        if (messages.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">No greeting messages yet. Add one below!</p>';
            return;
        }

        container.innerHTML = messages.map((message, index) => `
            <div class="list-item" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                <input type="text" value="${this.escapeHtml(message)}" 
                       class="greeting-message-input" 
                       data-index="${index}" 
                       style="flex: 1;"
                       onchange="configManager.updateGreetingMessage(${index}, this.value)">
                <button class="btn btn-danger btn-sm" onclick="configManager.removeGreetingMessage(${index})">Delete</button>
            </div>
        `).join('');
    }

    /**
     * Build custom greetings list
     */
    buildCustomGreetingsList() {
        const container = document.getElementById('custom-greetings-list');
        if (!container) return;

        const customGreetings = this.config.greetings.customGreetings || {};
        const entries = Object.entries(customGreetings);
        
        if (entries.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">No custom user greetings yet. Add one below!</p>';
            return;
        }

        container.innerHTML = entries.map(([username, message]) => `
            <div class="list-item" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center;">
                <strong style="min-width: 120px;">${this.escapeHtml(username)}:</strong>
                <input type="text" value="${this.escapeHtml(message)}" 
                       class="custom-greeting-input" 
                       data-username="${this.escapeHtml(username)}" 
                       style="flex: 1;"
                       onchange="configManager.updateCustomGreeting('${this.escapeHtml(username)}', this.value)">
                <button class="btn btn-danger btn-sm" onclick="configManager.removeCustomGreeting('${this.escapeHtml(username)}')">Delete</button>
            </div>
        `).join('');
    }

    /**
     * Add new greeting message
     */
    addGreetingMessage() {
        const input = document.getElementById('new-greeting-message');
        if (!input || !input.value.trim()) return;

        if (!this.config.greetings.messages) {
            this.config.greetings.messages = [];
        }

        this.config.greetings.messages.push(input.value.trim());
        input.value = '';
        
        this.buildGreetingMessagesList();
        this.scheduleAutoSave();
    }

    /**
     * Update greeting message
     */
    updateGreetingMessage(index, newValue) {
        if (!this.config.greetings.messages || index < 0 || index >= this.config.greetings.messages.length) return;
        
        this.config.greetings.messages[index] = newValue;
        this.scheduleAutoSave();
    }

    /**
     * Remove greeting message
     */
    removeGreetingMessage(index) {
        if (!this.config.greetings.messages) return;
        
        this.config.greetings.messages.splice(index, 1);
        this.buildGreetingMessagesList();
        this.scheduleAutoSave();
    }

    /**
     * Add custom greeting
     */
    addCustomGreeting() {
        const usernameInput = document.getElementById('custom-greeting-username');
        const messageInput = document.getElementById('custom-greeting-message');
        
        if (!usernameInput || !messageInput) return;
        
        const username = usernameInput.value.trim().toLowerCase();
        const message = messageInput.value.trim();
        
        if (!username || !message) {
            alert('Please enter both username and message');
            return;
        }

        if (!this.config.greetings.customGreetings) {
            this.config.greetings.customGreetings = {};
        }

        this.config.greetings.customGreetings[username] = message;
        
        usernameInput.value = '';
        messageInput.value = '';
        
        this.buildCustomGreetingsList();
        this.scheduleAutoSave();
    }

    /**
     * Update custom greeting
     */
    updateCustomGreeting(username, newMessage) {
        if (!this.config.greetings.customGreetings) return;
        
        this.config.greetings.customGreetings[username] = newMessage;
        this.scheduleAutoSave();
    }

    /**
     * Remove custom greeting
     */
    removeCustomGreeting(username) {
        if (!this.config.greetings.customGreetings) return;
        
        delete this.config.greetings.customGreetings[username];
        this.buildCustomGreetingsList();
        this.scheduleAutoSave();
    }

    /**
     * Reset greeting session (clears who has been greeted)
     */
    resetGreetingSession() {
        if (window.opener && window.opener.pet && window.opener.pet.twitch) {
            window.opener.pet.twitch.resetGreetingSession();
            alert('Greeting session has been reset! The pet will greet returning chatters again.');
        } else {
            alert('Could not reset greeting session. Make sure the pet window is open.');
        }
        this.updateGreetingStats();
    }

    /**
     * Update greeting statistics display
     */
    updateGreetingStats() {
        if (window.opener && window.opener.pet && window.opener.pet.twitch) {
            const stats = window.opener.pet.twitch.getGreetingStats();
            document.getElementById('greetings-sent-count').textContent = stats.sent;
            document.getElementById('unique-chatters-count').textContent = stats.uniqueChatters;
        }
    }

    /**
     * Open position configuration mode
     * Opens a larger preview window where user can drag and resize the pet
     */
    openPositionConfigMode() {
        // First, save current config to localStorage so the popup gets the latest settings
        console.log('Saving config before opening position window...');
        console.log('Current defaultImage:', this.config.pet.defaultImage);
        this.saveConfig();
        
        // Wait a moment to ensure save completes
        setTimeout(() => {
            // Verify the save
            const verification = petStorage.load();
            console.log('Verified saved defaultImage:', verification.pet.defaultImage);
            
            // Open index.html in a new popup window at full 1920x1080 size
            const width = 1920;
            const height = 1080;
            const left = (screen.width - width) / 2;
            const top = (screen.height - height) / 2;
            
            const positionWindow = window.open(
                'index.html',
                'PositionConfig',
                `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=no,toolbar=no,menubar=no,location=no,status=no`
            );
            
            if (!positionWindow) {
                alert('Could not open position configuration window. Please allow popups for this site.');
                return;
            }
            
            // Store reference for message handling
            this.positionWindow = positionWindow;
            
            // Wait for window to fully load, then send message to enter position mode
            // Use a longer delay to ensure streamPet is initialized
            setTimeout(() => {
                if (positionWindow && !positionWindow.closed) {
                    console.log('Sending enterPositionMode message to popup');
                    positionWindow.postMessage({ type: 'enterPositionMode' }, '*');
                }
            }, 1500);
            
            // Update button state
            const btn = document.getElementById('configure-position-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓ Position window opened - drag and resize, then save';
            btn.disabled = true;
            
            // Re-enable button when window closes
            const checkClosed = setInterval(() => {
                if (!positionWindow || positionWindow.closed) {
                    clearInterval(checkClosed);
                    btn.textContent = originalText;
                    btn.disabled = false;
                    this.positionWindow = null;
                }
            }, 500);
        }, 100); // Small delay to ensure save completes
    }

    /**
     * Helper to escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Load Seasonal settings
     */
    loadSeasonalSettings() {
        if (!this.config.seasonal) return;

        document.getElementById('seasonal-enabled').checked = this.config.seasonal.enabled !== false;
        document.getElementById('seasonal-autodetect').checked = this.config.seasonal.autoDetect !== false;
        document.getElementById('current-season').value = this.config.seasonal.currentSeason || 'none';

        // Load theme images
        const themes = this.config.seasonal.themes || {};
        document.getElementById('halloween-image').value = themes.halloween?.image || '';
        document.getElementById('halloween-particles').value = themes.halloween?.particles || 'none';
        document.getElementById('christmas-image').value = themes.christmas?.image || '';
        document.getElementById('christmas-particles').value = themes.christmas?.particles || 'none';
        document.getElementById('newyear-image').value = themes.newYear?.image || '';
        document.getElementById('newyear-particles').value = themes.newYear?.particles || 'none';
        document.getElementById('valentine-image').value = themes.valentine?.image || '';
        document.getElementById('valentine-particles').value = themes.valentine?.particles || 'none';
        document.getElementById('easter-image').value = themes.easter?.image || '';
        document.getElementById('easter-particles').value = themes.easter?.particles || 'none';
        document.getElementById('summer-image').value = themes.summer?.image || '';
        document.getElementById('summer-particles').value = themes.summer?.particles || 'none';
    }

    /**
     * Load Analytics display
     */
    loadAnalyticsDisplay() {
        if (!this.config.analytics) return;

        const stats = this.config.analytics.stats || {};
        
        // Calculate totals from objects
        const totalEvents = Object.values(stats.eventsTriggered || {}).reduce((sum, count) => sum + count, 0);
        const totalCommands = Object.values(stats.commandsUsed || {}).reduce((sum, count) => sum + count, 0);
        const totalStates = Object.values(stats.statesEntered || {}).reduce((sum, count) => sum + count, 0);
        
        document.getElementById('total-events').textContent = totalEvents;
        document.getElementById('total-commands').textContent = totalCommands;
        document.getElementById('total-states').textContent = totalStates;
        document.getElementById('total-clicks').textContent = stats.totalClicks || 0;
        document.getElementById('session-count').textContent = this.config.analytics.sessionCount || 0;
        const uptimeMinutes = Math.floor((this.config.analytics.totalUptime || 0) / 60000);
        document.getElementById('total-uptime').textContent = `${uptimeMinutes} min`;

        // Top lists
        this.updateTopList('top-events-list', this.config.analytics.topEvents);
        this.updateTopList('top-commands-list', this.config.analytics.topCommands);
        this.updateTopList('top-states-list', this.config.analytics.topStates);
    }

    /**
     * Update top list display
     */
    updateTopList(elementId, items) {
        const list = document.getElementById(elementId);
        if (!list) return;

        if (!items || items.length === 0) {
            list.innerHTML = '<li>No data yet</li>';
            return;
        }

        // Handle both formats: [['name', count]] and [{name, count}]
        list.innerHTML = items.map(item => {
            const name = Array.isArray(item) ? item[0] : item.name;
            const count = Array.isArray(item) ? item[1] : item.count;
            return `<li>${name}: ${count} times</li>`;
        }).join('');
    }

    /**
     * Load Animations settings
     */
    loadAnimationsSettings() {
        // Weather settings would go here if we store them in config
        // For now, these are runtime only
    }

    /**
     * Load Integrations settings
     */
    loadIntegrationsSettings() {
        if (!this.config.integrations) return;

        // Discord
        const discord = this.config.integrations.discord || {};
        document.getElementById('discord-enabled').checked = discord.enabled || false;
        document.getElementById('discord-webhook').value = discord.webhookUrl || '';
        
        // Check discord event checkboxes
        const notifyEvents = discord.notifyOnEvents || [];
        document.querySelectorAll('.discord-event').forEach(checkbox => {
            checkbox.checked = notifyEvents.includes(checkbox.value);
        });

        // StreamElements
        const se = this.config.integrations.streamElements || {};
        document.getElementById('streamelements-enabled').checked = se.enabled || false;
        document.getElementById('streamelements-account').value = se.accountId || '';
        document.getElementById('streamelements-token').value = se.jwtToken || '';

        // Streamlabs
        const sl = this.config.integrations.streamlabs || {};
        document.getElementById('streamlabs-enabled').checked = sl.enabled || false;
        document.getElementById('streamlabs-token').value = sl.socketToken || '';

        // Spotify
        const spotify = this.config.integrations.spotify || {};
        document.getElementById('spotify-enabled').checked = spotify.enabled || false;
        document.getElementById('spotify-react-genres').checked = spotify.reactToGenres !== false;
        document.getElementById('spotify-clientid').value = spotify.clientId || '';
        document.getElementById('spotify-redirect-uri-input').value = spotify.redirectUri || 'https://example.com/callback';
    }

    /**
     * Save Growth settings to config
     */
    saveGrowthSettings() {
        if (!this.config.growth) {
            this.config.growth = {};
        }
        if (!this.config.growth.experienceGains) {
            this.config.growth.experienceGains = {};
        }

        this.config.growth.experienceGains.follow = parseInt(document.getElementById('xp-follow').value);
        this.config.growth.experienceGains.subscribe = parseInt(document.getElementById('xp-subscribe').value);
        this.config.growth.experienceGains.giftSub = parseInt(document.getElementById('xp-giftsub').value);
        this.config.growth.experienceGains.raid = parseInt(document.getElementById('xp-raid').value);
        this.config.growth.experienceGains.bits = parseInt(document.getElementById('xp-bits').value);
        this.config.growth.experienceGains.channelPoints = parseInt(document.getElementById('xp-channelpoints').value);
        this.config.growth.experienceGains.command = parseInt(document.getElementById('xp-command').value);
        this.config.growth.experienceGains.click = parseInt(document.getElementById('xp-click').value);
        
        // Save level up bar settings
        if (!this.config.growth.levelUpBar) {
            this.config.growth.levelUpBar = {};
        }
        this.config.growth.levelUpBar.style = document.getElementById('levelup-style').value;
        this.config.growth.levelUpBar.position = document.getElementById('levelup-position').value;
        this.config.growth.levelUpBar.offsetY = parseInt(document.getElementById('levelup-offset-y').value);
        this.config.growth.levelUpBar.duration = parseInt(document.getElementById('levelup-duration').value);
        this.config.growth.levelUpBar.textSize = parseInt(document.getElementById('levelup-size').value);
        
        // Save level up effect settings
        if (!this.config.growth.levelUpEffect) {
            this.config.growth.levelUpEffect = {};
        }
        this.config.growth.levelUpEffect.type = document.getElementById('levelup-effect-type').value;
        this.config.growth.levelUpEffect.color = document.getElementById('levelup-effect-color').value;
        this.config.growth.levelUpEffect.duration = parseInt(document.getElementById('levelup-effect-duration').value);
        this.config.growth.levelUpEffect.intensity = parseFloat(document.getElementById('levelup-effect-intensity').value);
        
        // Save evolution effect settings
        if (!this.config.growth.evolutionEffect) {
            this.config.growth.evolutionEffect = {};
        }
        this.config.growth.evolutionEffect.type = document.getElementById('evolution-effect-type').value;
        this.config.growth.evolutionEffect.color = document.getElementById('evolution-effect-color').value;
        this.config.growth.evolutionEffect.secondaryColor = document.getElementById('evolution-effect-color2').value;
        this.config.growth.evolutionEffect.duration = parseInt(document.getElementById('evolution-effect-duration').value);
        this.config.growth.evolutionEffect.intensity = parseFloat(document.getElementById('evolution-effect-intensity').value);
        
        // Save evolution stages from UI
        const stagesContainer = document.getElementById('evolution-stages-list');
        if (stagesContainer) {
            const stages = [];
            stagesContainer.querySelectorAll('.evolution-stage-item').forEach((item, index) => {
                const nameInput = item.querySelector('.stage-name');
                const levelInput = item.querySelector('.stage-level');
                const imageInput = item.querySelector('.stage-image');
                
                if (nameInput && levelInput && imageInput) {
                    stages.push({
                        name: nameInput.value || 'New Stage',
                        level: parseInt(levelInput.value) || 1,
                        image: imageInput.value || 'Images/stage.png'
                    });
                }
            });
            
            if (stages.length > 0) {
                this.config.growth.stages = stages;
            }
        }
    }

    /**
     * Save Viewer Interaction settings
     */
    saveViewerInteractionSettings() {
        if (!this.config.viewerInteraction) {
            this.config.viewerInteraction = { channelPoints: {}, chatCommands: {}, polls: {} };
        }

        this.config.viewerInteraction.enabled = document.getElementById('viewer-enabled').checked;
        this.config.viewerInteraction.channelPoints.enabled = document.getElementById('channelpoints-enabled').checked;
        this.config.viewerInteraction.chatCommands.enabled = document.getElementById('viewer-commands-enabled').checked;
        this.config.viewerInteraction.chatCommands.allowViewerCommands = document.getElementById('allow-viewer-commands').checked;
        this.config.viewerInteraction.chatCommands.cooldown = parseInt(document.getElementById('user-cooldown').value);
        this.config.viewerInteraction.chatCommands.globalCooldown = parseInt(document.getElementById('global-cooldown').value);
        this.config.viewerInteraction.polls.enabled = document.getElementById('polls-enabled').checked;
        this.config.viewerInteraction.polls.duration = parseInt(document.getElementById('poll-duration').value);
    }

    /**
     * Save Greetings settings
     */
    saveGreetingsSettings() {
        if (!this.config.greetings) {
            this.config.greetings = { messages: [], customGreetings: {} };
        }

        this.config.greetings.enabled = document.getElementById('greetings-enabled').checked;
        this.config.greetings.image = document.getElementById('greeting-image').value;
        this.config.greetings.sound = document.getElementById('greeting-sound').value;
        this.config.greetings.particles = document.getElementById('greeting-particles').checked;
        this.config.greetings.duration = parseInt(document.getElementById('greeting-duration').value);
        
        // Messages and custom greetings are already saved in this.config via the add/update/remove methods
    }

    /**
     * Save Seasonal settings
     */
    saveSeasonalSettings() {
        if (!this.config.seasonal) {
            this.config.seasonal = { themes: {} };
        }

        this.config.seasonal.enabled = document.getElementById('seasonal-enabled').checked;
        this.config.seasonal.autoDetect = document.getElementById('seasonal-autodetect').checked;
        this.config.seasonal.currentSeason = document.getElementById('current-season').value;

        if (!this.config.seasonal.themes) {
            this.config.seasonal.themes = {};
        }

        // Save theme settings
        this.config.seasonal.themes.halloween = {
            image: document.getElementById('halloween-image').value,
            particles: document.getElementById('halloween-particles').value
        };
        this.config.seasonal.themes.christmas = {
            image: document.getElementById('christmas-image').value,
            particles: document.getElementById('christmas-particles').value
        };
        this.config.seasonal.themes.newYear = {
            image: document.getElementById('newyear-image').value,
            particles: document.getElementById('newyear-particles').value
        };
        this.config.seasonal.themes.valentine = {
            image: document.getElementById('valentine-image').value,
            particles: document.getElementById('valentine-particles').value
        };
        this.config.seasonal.themes.easter = {
            image: document.getElementById('easter-image').value,
            particles: document.getElementById('easter-particles').value
        };
        this.config.seasonal.themes.summer = {
            image: document.getElementById('summer-image').value,
            particles: document.getElementById('summer-particles').value
        };
    }

    /**
     * Save Integrations settings
     */
    saveIntegrationsSettings() {
        if (!this.config.integrations) {
            this.config.integrations = {};
        }

        // Discord
        if (!this.config.integrations.discord) {
            this.config.integrations.discord = {};
        }
        this.config.integrations.discord.enabled = document.getElementById('discord-enabled').checked;
        this.config.integrations.discord.webhookUrl = document.getElementById('discord-webhook').value;
        this.config.integrations.discord.notifyOnEvents = Array.from(document.querySelectorAll('.discord-event:checked')).map(cb => cb.value);

        // StreamElements
        if (!this.config.integrations.streamElements) {
            this.config.integrations.streamElements = {};
        }
        this.config.integrations.streamElements.enabled = document.getElementById('streamelements-enabled').checked;
        this.config.integrations.streamElements.accountId = document.getElementById('streamelements-account').value;
        this.config.integrations.streamElements.jwtToken = document.getElementById('streamelements-token').value;

        // Streamlabs
        if (!this.config.integrations.streamlabs) {
            this.config.integrations.streamlabs = {};
        }
        this.config.integrations.streamlabs.enabled = document.getElementById('streamlabs-enabled').checked;
        this.config.integrations.streamlabs.socketToken = document.getElementById('streamlabs-token').value;

        // Spotify
        if (!this.config.integrations.spotify) {
            this.config.integrations.spotify = {};
        }
        this.config.integrations.spotify.enabled = document.getElementById('spotify-enabled').checked;
        this.config.integrations.spotify.reactToGenres = document.getElementById('spotify-react-genres').checked;
        this.config.integrations.spotify.clientId = document.getElementById('spotify-clientid').value;
    }

    /**
     * Load Particle settings
     */
    loadParticleSettings() {
        if (!this.config.advanced.particleSettings) {
            this.config.advanced.particleSettings = {
                size: 40,
                count: 10,
                spread: 150,
                speed: 5,
                lifetime: 2000,
                gravity: 0.5
            };
        }

        const settings = this.config.advanced.particleSettings;
        document.getElementById('particle-size').value = settings.size || 40;
        document.getElementById('particle-size-value').textContent = (settings.size || 40) + 'px';
        document.getElementById('particle-count').value = settings.count || 10;
        document.getElementById('particle-count-value').textContent = settings.count || 10;
        document.getElementById('particle-spread').value = settings.spread || 150;
        document.getElementById('particle-spread-value').textContent = (settings.spread || 150) + 'px';
        document.getElementById('particle-speed').value = settings.speed || 5;
        document.getElementById('particle-speed-value').textContent = settings.speed || 5;
        document.getElementById('particle-lifetime').value = settings.lifetime || 2000;
        document.getElementById('particle-gravity').value = settings.gravity || 0.5;
        document.getElementById('particle-gravity-value').textContent = settings.gravity || 0.5;
    }

    /**
     * Get current particle settings
     */
    getParticleSettings() {
        return {
            size: parseInt(document.getElementById('particle-size').value),
            count: parseInt(document.getElementById('particle-count').value),
            spread: parseInt(document.getElementById('particle-spread').value),
            speed: parseInt(document.getElementById('particle-speed').value),
            lifetime: parseInt(document.getElementById('particle-lifetime').value),
            gravity: parseFloat(document.getElementById('particle-gravity').value)
        };
    }

    /**
     * Save Particle settings
     */
    saveParticleSettings() {
        if (!this.config.advanced.particleSettings) {
            this.config.advanced.particleSettings = {};
        }

        const settings = this.getParticleSettings();
        this.config.advanced.particleSettings = settings;
    }
}

// Helper function for image selection
function selectImage(inputId) {
    console.log('selectImage called with ID:', inputId);
    const input = document.getElementById(inputId);
    
    if (!input) {
        console.error('Input element not found:', inputId);
        alert('Error: Could not find input element');
        return;
    }
    
    console.log('Found input element:', input);
    
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        console.log('File selected:', file?.name);
        if (file && configManager) {
            configManager.handleImageDrop(file, input);
        } else if (!configManager) {
            console.error('configManager not available');
            alert('Error: Configuration manager not ready');
        }
    };
    
    // Trigger file picker
    fileInput.click();
}

// Initialize on page load
let configManager;

window.addEventListener('DOMContentLoaded', () => {
    configManager = new ConfigManager();
});

// Listen for test messages from config page
window.addEventListener('message', (event) => {
    if (event.data.type === 'testEvent') {
        if (window.streamPet) {
            streamPet.triggerEvent(event.data.eventName, event.data.eventData);
        }
    } else if (event.data.type === 'testState') {
        if (window.streamPet) {
            streamPet.changeState(event.data.stateName);
        }
    } else if (event.data.type === 'testCommand') {
        if (window.streamPet) {
            streamPet.handleRecoveryCommand(event.data.stateName, event.data.username);
        }
    } else if (event.data.type === 'positionSaved') {
        // Position was saved from the pet window, update the input fields
        if (configManager) {
            document.getElementById('pet-x').value = event.data.position.x.toFixed(1);
            document.getElementById('pet-y').value = event.data.position.y.toFixed(1);
            document.getElementById('pet-width').value = Math.round(event.data.size.width);
            document.getElementById('pet-height').value = Math.round(event.data.size.height);
            document.getElementById('pet-size-mode').value = 'pixels';
            
            // Show confirmation
            alert('Position and size saved! The values have been updated in the configuration.');
        }
    }
});

/**
 * Image Picker Modal Functions
 */
let currentImagePickerField = null;
let currentImagePickerTitle = '';
let imagePickerData = {};

function openImagePicker(fieldId, title) {
    currentImagePickerField = fieldId;
    currentImagePickerTitle = title;
    
    // Set modal title
    document.getElementById('image-picker-title').textContent = `${title} - Advanced Settings`;
    
    // Load current values
    loadImagePickerData(fieldId);
    
    // Populate growth stages
    populateGrowthStages();
    
    // Populate seasonal themes
    populateSeasonalThemes();
    
    // Populate sprite sheet options
    populateSpriteSheetOptions();
    
    // Setup tab switching
    setupModalTabs();
    
    // Show modal
    document.getElementById('image-picker-modal').classList.add('active');
}

function closeImagePicker() {
    document.getElementById('image-picker-modal').classList.remove('active');
    currentImagePickerField = null;
    imagePickerData = {};
}

function setupModalTabs() {
    const modal = document.getElementById('image-picker-modal');
    const tabButtons = modal.querySelectorAll('.tab-btn');
    const tabContents = modal.querySelectorAll('.modal-tab-content');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Update active states
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            modal.querySelector(`.modal-tab-content[data-tab="${tabName}"]`).classList.add('active');
        });
    });
}

function loadImagePickerData(fieldId) {
    const config = configManager.config;
    
    // Get the base field name (e.g., "default-image" -> "defaultImage")
    const baseFieldName = fieldId.replace(/-image$/, '').replace(/-/g, '');
    
    // Load default value
    const defaultValue = document.getElementById(fieldId).value;
    document.getElementById('picker-default-image').value = defaultValue;
    
    // Initialize data structure
    imagePickerData = {
        default: defaultValue,
        growth: {},
        seasonal: {},
        useDefaultGrowth: true,
        useDefaultSeasonal: true,
        spriteSheet: null
    };
    
    // Load growth stage data if exists
    if (config.pet.imageVariants && config.pet.imageVariants[baseFieldName]) {
        const variants = config.pet.imageVariants[baseFieldName];
        if (variants.growth) {
            imagePickerData.growth = {...variants.growth};
            imagePickerData.useDefaultGrowth = false;
        }
        if (variants.seasonal) {
            imagePickerData.seasonal = {...variants.seasonal};
            imagePickerData.useDefaultSeasonal = false;
        }
        if (variants.spriteSheet) {
            imagePickerData.spriteSheet = variants.spriteSheet;
        }
    }
    
    // Update checkboxes
    document.getElementById('picker-use-default-growth').checked = imagePickerData.useDefaultGrowth;
    document.getElementById('picker-use-default-seasonal').checked = imagePickerData.useDefaultSeasonal;
    
    // Load sprite sheet data if exists
    if (imagePickerData.spriteSheet) {
        document.getElementById('picker-use-spritesheet').checked = true;
        document.getElementById('picker-sprite-default').value = imagePickerData.spriteSheet.default?.image || '';
        document.getElementById('picker-sprite-framewidth').value = imagePickerData.spriteSheet.default?.frameWidth || 64;
        document.getElementById('picker-sprite-frameheight').value = imagePickerData.spriteSheet.default?.frameHeight || 64;
        document.getElementById('picker-sprite-frames').value = imagePickerData.spriteSheet.default?.frames || 8;
        document.getElementById('picker-sprite-fps').value = imagePickerData.spriteSheet.default?.fps || 12;
        document.getElementById('picker-sprite-loop').checked = imagePickerData.spriteSheet.default?.loop !== false;
    } else {
        document.getElementById('picker-use-spritesheet').checked = false;
    }
}

function populateGrowthStages() {
    const container = document.getElementById('picker-growth-stages');
    const stages = configManager.config.growth?.stages || [];
    const useDefault = document.getElementById('picker-use-default-growth').checked;
    
    container.innerHTML = stages.map((stage, index) => `
        <div class="stage-item ${useDefault ? 'disabled' : ''}">
            <h4>${stage.name} (Level ${stage.level})</h4>
            <div class="form-group">
                <label>Image Path</label>
                <input type="text" 
                       class="growth-stage-image" 
                       data-stage-index="${index}" 
                       data-stage-name="${stage.name}"
                       value="${imagePickerData.growth[stage.name] || ''}"
                       placeholder="Use default or enter custom path">
                <button class="btn btn-sm" onclick="selectImageForStage('growth', ${index}, '${stage.name}')">Browse</button>
            </div>
        </div>
    `).join('');
    
    // Add event listener to checkbox
    document.getElementById('picker-use-default-growth').addEventListener('change', (e) => {
        populateGrowthStages();
    });
}

function populateSeasonalThemes() {
    const container = document.getElementById('picker-seasonal-themes');
    const seasonal = configManager.config.seasonal?.themes || {};
    const useDefault = document.getElementById('picker-use-default-seasonal').checked;
    
    const themes = [
        { key: 'halloween', name: 'Halloween', emoji: '🎃' },
        { key: 'christmas', name: 'Christmas', emoji: '🎄' },
        { key: 'newyear', name: 'New Year', emoji: '🎉' },
        { key: 'valentines', name: "Valentine's Day", emoji: '💝' },
        { key: 'easter', name: 'Easter', emoji: '🐰' },
        { key: 'summer', name: 'Summer', emoji: '☀️' }
    ];
    
    container.innerHTML = themes.map(theme => `
        <div class="theme-item ${useDefault ? 'disabled' : ''}">
            <h4>${theme.emoji} ${theme.name}</h4>
            <div class="form-group">
                <label>Image Path</label>
                <input type="text" 
                       class="seasonal-theme-image" 
                       data-theme-key="${theme.key}"
                       value="${imagePickerData.seasonal[theme.key] || ''}"
                       placeholder="Use default or enter custom path">
                <button class="btn btn-sm" onclick="selectImageForTheme('${theme.key}', '${theme.name}')">Browse</button>
            </div>
        </div>
    `).join('');
    
    // Add event listener to checkbox
    document.getElementById('picker-use-default-seasonal').addEventListener('change', (e) => {
        populateSeasonalThemes();
    });
}

function populateSpriteSheetOptions() {
    // Populate growth stages for sprite sheets
    const growthContainer = document.getElementById('picker-sprite-growth-stages');
    const stages = configManager.config.growth?.stages || [];
    const useDefaultGrowth = document.getElementById('picker-sprite-use-default-growth').checked;
    
    growthContainer.innerHTML = stages.map((stage, index) => `
        <div class="stage-item ${useDefaultGrowth ? 'disabled' : ''}" style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
            <h5>${stage.name} (Level ${stage.level})</h5>
            <div class="form-group">
                <label>Sprite Sheet Image</label>
                <input type="text" 
                       class="sprite-growth-image" 
                       data-stage-name="${stage.name}"
                       placeholder="Images/spritesheet_${stage.name.toLowerCase()}.png"
                       ${useDefaultGrowth ? 'disabled' : ''}>
                <button class="btn btn-sm" onclick="selectImage('sprite-growth-${stage.name}')" ${useDefaultGrowth ? 'disabled' : ''}>Browse</button>
            </div>
        </div>
    `).join('');
    
    // Populate seasonal themes for sprite sheets
    const seasonalContainer = document.getElementById('picker-sprite-seasonal-themes');
    const useDefaultSeasonal = document.getElementById('picker-sprite-use-default-seasonal').checked;
    
    const themes = [
        { key: 'halloween', name: 'Halloween', emoji: '🎃' },
        { key: 'christmas', name: 'Christmas', emoji: '🎄' },
        { key: 'newyear', name: 'New Year', emoji: '🎉' },
        { key: 'valentines', name: "Valentine's Day", emoji: '💝' },
        { key: 'easter', name: 'Easter', emoji: '🐰' },
        { key: 'summer', name: 'Summer', emoji: '☀️' }
    ];
    
    seasonalContainer.innerHTML = themes.map(theme => `
        <div class="theme-item ${useDefaultSeasonal ? 'disabled' : ''}" style="margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
            <h5>${theme.emoji} ${theme.name}</h5>
            <div class="form-group">
                <label>Sprite Sheet Image</label>
                <input type="text" 
                       class="sprite-seasonal-image" 
                       data-theme-key="${theme.key}"
                       placeholder="Images/spritesheet_${theme.key}.png"
                       ${useDefaultSeasonal ? 'disabled' : ''}>
                <button class="btn btn-sm" onclick="selectImage('sprite-seasonal-${theme.key}')" ${useDefaultSeasonal ? 'disabled' : ''}>Browse</button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners
    document.getElementById('picker-sprite-use-default-growth').addEventListener('change', () => {
        populateSpriteSheetOptions();
    });
    
    document.getElementById('picker-sprite-use-default-seasonal').addEventListener('change', () => {
        populateSpriteSheetOptions();
    });
    
    // Toggle sprite sheet settings visibility
    const useSpriteSheet = document.getElementById('picker-use-spritesheet').checked;
    document.getElementById('spritesheet-settings').style.display = useSpriteSheet ? 'block' : 'none';
    
    document.getElementById('picker-use-spritesheet').addEventListener('change', (e) => {
        document.getElementById('spritesheet-settings').style.display = e.target.checked ? 'block' : 'none';
    });
}

function selectImageForStage(type, index, name) {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file && configManager) {
            const input = document.querySelector(`[data-stage-name="${name}"]`);
            if (input) {
                configManager.handleImageDrop(file, input);
            }
        }
    };
    
    fileInput.click();
}

function selectImageForTheme(key, name) {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file && configManager) {
            const input = document.querySelector(`[data-theme-key="${key}"]`);
            if (input) {
                configManager.handleImageDrop(file, input);
            }
        }
    };
    
    fileInput.click();
}

function saveImagePicker() {
    if (!currentImagePickerField) return;
    
    console.log('saveImagePicker called, currentImagePickerField:', currentImagePickerField);
    
    // Get the base field name - convert "default-image" to "defaultImage", "blink-image" to "blinkImage", etc.
    const baseFieldName = currentImagePickerField.replace(/-image$/, '').replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
    
    // Get default value
    const defaultValue = document.getElementById('picker-default-image').value;
    console.log('Default value from picker:', defaultValue);
    
    // Update main input
    document.getElementById(currentImagePickerField).value = defaultValue;
    console.log('Updated main input field:', currentImagePickerField, 'to:', defaultValue);
    
    // IMPORTANT: Also update the config object directly for the main image fields
    if (currentImagePickerField === 'default-image') {
        configManager.config.pet.defaultImage = defaultValue;
        console.log('Updated config.pet.defaultImage to:', defaultValue);
    } else if (currentImagePickerField === 'blink-image') {
        configManager.config.pet.blinkImage = defaultValue;
        console.log('Updated config.pet.blinkImage to:', defaultValue);
    }
    
    // Prepare image variants
    const imageVariants = {
        default: defaultValue,
        growth: {},
        seasonal: {},
        spriteSheet: null
    };
    
    // Check if sprite sheet is enabled
    const useSpriteSheet = document.getElementById('picker-use-spritesheet').checked;
    if (useSpriteSheet) {
        const spriteSheetData = {
            enabled: true,
            default: {
                image: document.getElementById('picker-sprite-default').value,
                frameWidth: parseInt(document.getElementById('picker-sprite-framewidth').value) || 64,
                frameHeight: parseInt(document.getElementById('picker-sprite-frameheight').value) || 64,
                frames: parseInt(document.getElementById('picker-sprite-frames').value) || 8,
                fps: parseInt(document.getElementById('picker-sprite-fps').value) || 12,
                loop: document.getElementById('picker-sprite-loop').checked
            },
            growth: {},
            seasonal: {}
        };
        
        // Get growth stage sprite sheets if not using default
        const useDefaultGrowth = document.getElementById('picker-sprite-use-default-growth').checked;
        if (!useDefaultGrowth) {
            document.querySelectorAll('.sprite-growth-image').forEach(input => {
                const stageName = input.dataset.stageName;
                if (input.value) {
                    spriteSheetData.growth[stageName] = {
                        image: input.value,
                        frameWidth: spriteSheetData.default.frameWidth,
                        frameHeight: spriteSheetData.default.frameHeight,
                        frames: spriteSheetData.default.frames,
                        fps: spriteSheetData.default.fps,
                        loop: spriteSheetData.default.loop
                    };
                }
            });
        }
        
        // Get seasonal sprite sheets if not using default
        const useDefaultSeasonal = document.getElementById('picker-sprite-use-default-seasonal').checked;
        if (!useDefaultSeasonal) {
            document.querySelectorAll('.sprite-seasonal-image').forEach(input => {
                const themeKey = input.dataset.themeKey;
                if (input.value) {
                    spriteSheetData.seasonal[themeKey] = {
                        image: input.value,
                        frameWidth: spriteSheetData.default.frameWidth,
                        frameHeight: spriteSheetData.default.frameHeight,
                        frames: spriteSheetData.default.frames,
                        fps: spriteSheetData.default.fps,
                        loop: spriteSheetData.default.loop
                    };
                }
            });
        }
        
        imageVariants.spriteSheet = spriteSheetData;
    }
    
    // Get growth stage images if not using default
    const useDefaultGrowth = document.getElementById('picker-use-default-growth').checked;
    if (!useDefaultGrowth) {
        document.querySelectorAll('.growth-stage-image').forEach(input => {
            const stageName = input.dataset.stageName;
            if (input.value) {
                imageVariants.growth[stageName] = input.value;
            }
        });
    }
    
    // Get seasonal theme images if not using default
    const useDefaultSeasonal = document.getElementById('picker-use-default-seasonal').checked;
    if (!useDefaultSeasonal) {
        document.querySelectorAll('.seasonal-theme-image').forEach(input => {
            const themeKey = input.dataset.themeKey;
            if (input.value) {
                imageVariants.seasonal[themeKey] = input.value;
            }
        });
    }
    
    // Save to config
    if (!configManager.config.pet.imageVariants) {
        configManager.config.pet.imageVariants = {};
    }
    
    configManager.config.pet.imageVariants[baseFieldName] = imageVariants;
    
    // Immediately save config to localStorage
    console.log('Saving config immediately with default image:', configManager.config.pet.defaultImage);
    petStorage.save(configManager.config);
    
    // Refresh the preview iframe to load the new config
    configManager.refreshPreview();
    
    // Also schedule auto-save for UI updates
    configManager.scheduleAutoSave();
    configManager.showNotification('Image settings saved', 'success');
    
    // Close modal
    closeImagePicker();
}

/**
 * Spotify Integration Methods
 */

// Update Spotify status display
function updateSpotifyStatus() {
    const statusDiv = document.getElementById('spotify-status');
    const connectBtn = document.getElementById('spotify-connect-btn');
    const disconnectBtn = document.getElementById('spotify-disconnect-btn');
    const token = localStorage.getItem('spotify_access_token');
    const expiry = localStorage.getItem('spotify_token_expiry');
    
    if (token && expiry && parseInt(expiry) > Date.now()) {
        statusDiv.textContent = '✅ Connected to Spotify';
        statusDiv.style.color = '#4CAF50';
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'inline-block';
    } else {
        statusDiv.textContent = '❌ Not connected';
        statusDiv.style.color = '#f44336';
        connectBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';
    }
}

// Check for Spotify OAuth callback
function handleSpotifyCallback() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    const state = params.get('state');
    
    if (accessToken && state) {
        const savedState = localStorage.getItem('spotify_auth_state');
        
        if (state === savedState) {
            // Save token
            const tokenExpiry = Date.now() + (parseInt(expiresIn) * 1000);
            localStorage.setItem('spotify_access_token', accessToken);
            localStorage.setItem('spotify_token_expiry', tokenExpiry.toString());
            localStorage.removeItem('spotify_auth_state');
            
            // Clear hash
            window.location.hash = '';
            
            // Update UI
            updateSpotifyStatus();
            if (configManager) {
                configManager.showNotification('✅ Spotify connected successfully!', 'success');
            }
        } else {
            if (configManager) {
                configManager.showNotification('Spotify authentication failed (state mismatch)', 'error');
            }
        }
    }
}

/**
 * Test bubble message
 */
function testBubbleMessage() {
    if (configManager) {
        configManager.sendToPreview({
            type: 'showMessage',
            message: 'This is a test message!'
        });
        configManager.showNotification('Test message sent to preview', 'info');
    }
}


