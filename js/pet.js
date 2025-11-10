/**
 * Stream Pet Core Behavior
 * Handles pet display, animations, states, and message bubbles
 */

class StreamPet {
    constructor() {
        this.config = null;
        this.currentState = 'default';
        this.currentImage = '';
        this.blinkTimer = null;
        this.stateCheckTimers = {};
        this.messageQueue = [];
        this.isShowingMessage = false;
        this.animationQueue = [];
        this.isAnimating = false;
        
        // Audio management
        this.audioCache = {};
        this.audioVolume = 0.5;
        
        // Click interaction
        this.lastClickTime = 0;
        this.clickCooldown = 3000; // 3 seconds
        
        // Idle animations
        this.idleTimer = null;
        this.idleAnimations = ['look-left', 'look-right', 'stretch', 'bounce'];
        
        // Movement
        this.isMoving = false;
        this.moveAnimation = null;
        
        // Resource management
        this.imageCache = {};
        this.maxCacheSize = 50; // Maximum cached images
        this.preloadedImages = new Set();
        
        // Error tracking
        this.errorCount = 0;
        this.maxErrors = 10;
        this.lastError = null;
        
        // Performance tracking
        this.performanceMetrics = {
            eventsProcessed: 0,
            messagesShown: 0,
            particlesSpawned: 0,
            startTime: Date.now()
        };
        
        // Enhancements system
        this.enhancements = null;
        
        // Advanced animations
        this.advancedAnimations = null;
        
        // Viewer interaction
        this.viewerInteraction = null;
        
        // DOM elements
        this.petImage = document.getElementById('pet-image');
        this.petContainer = document.getElementById('pet-container');
        this.messageBubble = document.getElementById('message-bubble');
        this.bubbleText = document.getElementById('bubble-text');
        this.debugPanel = document.getElementById('debug-panel');
        this.debugLog = document.getElementById('debug-log');
        this.particleContainer = document.getElementById('particle-container');
        
        // Cleanup on page unload
        window.addEventListener('beforeunload', () => this.cleanup());
        
        this.init();
    }

    /**
     * Initialize the pet
     */
    async init() {
        try {
            console.log('Initializing Stream Pet...');
            
            // Ensure petStorage exists
            if (typeof petStorage === 'undefined') {
                console.error('petStorage not found - storage.js may not be loaded');
                document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Storage module not loaded. Check console.</div>';
                return;
            }
            
            // Load configuration
            this.config = petStorage.load();
            
            if (!this.config) {
                console.error('Failed to load config, using defaults');
                // Force save defaults if config is null
                petStorage.reset();
                this.config = petStorage.load();
            }
            
            if (!this.config) {
                console.error('Still no config after reset - critical error');
                document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Could not load configuration. Check browser console.</div>';
                return;
            }
            
            console.log('Config loaded:', this.config);
            console.log('Default image path:', this.config.pet.defaultImage);
            console.log('Blink image path:', this.config.pet.blinkImage);
            console.log('Seasonal config:', this.config.seasonal);
            console.log('Image variants:', this.config.pet.imageVariants);
            
            // Apply pet settings
            this.applyPetSettings();
            
            // Setup click interaction
            this.setupClickInteraction();
            
            // Preload sounds
            this.preloadSounds();
            
            // Preload images for better performance
            this.preloadImages();
            
            // Show default image (with seasonal/growth variants if available)
            await this.showImage(this.config.pet.defaultImage, 0, 'defaultImage');
            
            // Start blink animation
            this.startBlinkAnimation();
            
            // Start state checks
            this.startStateChecks();
            
            // Start idle animations
            this.startIdleAnimations();
            
            // Initialize enhancements system
            if (typeof PetEnhancements !== 'undefined') {
                this.enhancements = new PetEnhancements(this);
                this.enhancements.initGrowthSystem();
                this.enhancements.initAnalytics();
                this.enhancements.applySeasonalTheme();
                await this.enhancements.initIntegrations();
            }
            
            // Initialize advanced animations
            if (typeof AdvancedAnimations !== 'undefined') {
                this.advancedAnimations = new AdvancedAnimations(this);
                this.advancedAnimations.init();
            }
            
            // Initialize viewer interaction
            if (typeof ViewerInteraction !== 'undefined') {
                this.viewerInteraction = new ViewerInteraction(this);
                this.viewerInteraction.init();
            }
            
            // Show debug panel if enabled
            if (this.config.advanced && this.config.advanced.debugMode) {
                this.debugPanel.classList.remove('hidden');
            }
            
            // Setup click interaction if enabled
            if (this.config.advanced && this.config.advanced.enableClickInteraction) {
                this.setupClickInteraction();
            }
        
            this.log('Stream Pet initialized!', 'info');
        } catch (error) {
            console.error('Error initializing pet:', error);
            this.handleError('Error initializing pet', error);
            document.body.innerHTML += `<div style="color: red; padding: 20px;">Error: ${error.message}<br>Check browser console for details.</div>`;
        }
    }

    /**
     * Preload all images used in config for smoother transitions
     */
    preloadImages() {
        const imagePaths = new Set();
        
        // Add pet images
        if (this.config.pet.defaultImage) imagePaths.add(this.config.pet.defaultImage);
        if (this.config.pet.blinkImage) imagePaths.add(this.config.pet.blinkImage);
        
        // Add event images
        Object.values(this.config.events || {}).forEach(event => {
            if (event.image) imagePaths.add(event.image);
        });
        
        // Add command images
        Object.values(this.config.commands || {}).forEach(cmd => {
            if (cmd.image) imagePaths.add(cmd.image);
        });
        
        // Add state images
        Object.values(this.config.states || {}).forEach(state => {
            if (state.image) imagePaths.add(state.image);
        });
        
        // Preload each image
        let preloadedCount = 0;
        imagePaths.forEach(path => {
            if (!this.preloadedImages.has(path)) {
                const img = new Image();
                img.onload = () => {
                    this.imageCache[path] = img;
                    this.preloadedImages.add(path);
                    preloadedCount++;
                    if (preloadedCount % 5 === 0) {
                        this.log(`Preloaded ${preloadedCount}/${imagePaths.size} images`, 'info');
                    }
                };
                img.onerror = () => {
                    this.log(`Failed to preload image: ${path}`, 'warn');
                };
                img.src = path;
            }
        });
        
        this.log(`Preloading ${imagePaths.size} images...`, 'info');
    }

    /**
     * Cleanup resources on unload
     */
    cleanup() {
        this.log('Cleaning up resources...', 'info');
        
        // Clear all timers
        if (this.blinkTimer) clearInterval(this.blinkTimer);
        if (this.idleTimer) clearInterval(this.idleTimer);
        Object.values(this.stateCheckTimers).forEach(timer => clearInterval(timer));
        
        // Cleanup enhancements
        if (this.enhancements) {
            this.enhancements.cleanup();
        }
        
        // Cleanup viewer interaction
        if (this.viewerInteraction) {
            this.viewerInteraction.cleanup();
        }
        
        // Clear caches
        this.audioCache = {};
        this.imageCache = {};
        this.preloadedImages.clear();
        
        // Clear queues
        this.messageQueue = [];
        this.animationQueue = [];
        
        this.log('Cleanup complete', 'info');
    }

    /**
     * Handle errors gracefully
     */
    handleError(context, error) {
        this.errorCount++;
        this.lastError = {
            context,
            message: error.message,
            stack: error.stack,
            timestamp: Date.now()
        };
        
        console.error(`[${context}]`, error);
        this.log(`Error in ${context}: ${error.message}`, 'error');
        
        // If too many errors, show warning
        if (this.errorCount >= this.maxErrors) {
            this.log(`Warning: ${this.errorCount} errors detected. Consider reloading.`, 'error');
        }
    }

    /**
     * Apply pet position, size, and other settings
     */
    applyPetSettings() {
        const { position, size, opacity, flipHorizontal } = this.config.pet;
        
        // Position
        this.petContainer.style.left = `${position.x}%`;
        this.petContainer.style.top = `${position.y}%`;
        
        // Size - handle different modes
        this.applySizeSettings(size);
        
        // Opacity
        this.petImage.style.opacity = opacity;
        
        // Flip
        if (flipHorizontal) {
            this.petImage.classList.add('flip');
        } else {
            this.petImage.classList.remove('flip');
        }
        
        // Click interaction
        if (this.config.advanced.enableClickInteraction) {
            this.petImage.classList.add('clickable');
            this.petImage.style.cursor = 'pointer';
        } else {
            this.petImage.classList.remove('clickable');
            this.petImage.style.cursor = 'default';
        }
    }

    /**
     * Apply size settings based on size mode
     */
    applySizeSettings(size) {
        const mode = size.mode || 'pixels';
        
        switch(mode) {
            case 'pixels':
                // Fixed pixel dimensions
                this.petImage.style.width = `${size.width || 200}px`;
                this.petImage.style.height = size.maintainAspect !== false ? 'auto' : `${size.height || 200}px`;
                break;
                
            case 'percent':
                // Percentage of screen
                this.petImage.style.width = `${size.widthPercent || 10}vw`;
                this.petImage.style.height = size.maintainAspect !== false ? 'auto' : `${size.heightPercent || 10}vh`;
                break;
                
            case 'auto':
                // Natural image size
                this.petImage.style.width = 'auto';
                this.petImage.style.height = 'auto';
                this.petImage.style.maxWidth = '100vw';
                this.petImage.style.maxHeight = '100vh';
                break;
                
            case 'scale':
                // Scale factor of natural size
                const scale = size.scale || 1.0;
                this.petImage.style.width = 'auto';
                this.petImage.style.height = 'auto';
                this.petImage.style.transform = `scale(${scale})`;
                this.petImage.style.transformOrigin = 'center';
                break;
                
            default:
                // Fallback to pixels
                this.petImage.style.width = `${size.width || 200}px`;
                this.petImage.style.height = size.maintainAspect !== false ? 'auto' : `${size.height || 200}px`;
        }
    }

    /**
     * Setup click interaction
     */
    setupClickInteraction() {
        this.petImage.addEventListener('click', () => {
            if (!this.config.advanced.enableClickInteraction) return;
            
            const now = Date.now();
            if (now - this.lastClickTime < this.clickCooldown) {
                this.log('Click on cooldown', 'info');
                return;
            }
            
            this.lastClickTime = now;
            this.log('Pet clicked!', 'info');
            
            // Random reactions
            const reactions = [
                () => {
                    this.showMessage('You clicked me! 💜', 2000);
                    this.movePet('bounce');
                    this.spawnParticles('hearts', 8);
                },
                () => {
                    this.showMessage('Hehe! That tickles! 😊', 2000);
                    this.movePet('wiggle');
                    this.spawnParticles('stars', 6);
                },
                () => {
                    this.showMessage('*happy noises* ✨', 2000);
                    this.movePet('spin');
                    this.spawnParticles('celebrate', 10);
                }
            ];
            
            const reaction = reactions[Math.floor(Math.random() * reactions.length)];
            reaction();
        });
    }

    /**
     * Start idle animations
     */
    startIdleAnimations() {
        if (!this.config.advanced.enableIdleAnimations) return;
        
        const idleInterval = this.config.advanced.idleAnimationInterval || 30000;
        
        if (this.idleTimer) {
            clearInterval(this.idleTimer);
        }
        
        this.idleTimer = setInterval(() => {
            // Don't interrupt if showing message or in non-default state
            if (this.isShowingMessage || this.currentState !== 'default') return;
            
            const chance = Math.random();
            if (chance < 0.3) { // 30% chance
                this.performIdleAnimation();
            }
        }, idleInterval);
    }

    /**
     * Perform random idle animation
     */
    async performIdleAnimation() {
        const enabledAnimations = this.config.advanced.idleAnimations || {};
        const animations = [];
        
        // Build list of enabled animation functions
        if (enabledAnimations.bounce) animations.push(() => this.movePet('bounce'));
        if (enabledAnimations.wiggle) animations.push(() => this.movePet('wiggle'));
        if (enabledAnimations.float) animations.push(() => this.movePet('float'));
        if (enabledAnimations.spin) animations.push(() => this.movePet('spin'));
        if (enabledAnimations.sway) animations.push(() => this.movePet('sway'));
        if (enabledAnimations.hop) animations.push(() => this.movePet('hop'));
        
        // Add special idle behaviors
        animations.push(() => {
            this.showMessage('*yawn* 😴', 2000);
        });
        animations.push(() => {
            this.petContainer.classList.add('look-around');
            setTimeout(() => {
                this.petContainer.classList.remove('look-around');
            }, 1000);
        });
        
        // If no animations are enabled, just return
        if (animations.length === 0) return;
        
        const animation = animations[Math.floor(Math.random() * animations.length)];
        await animation();
    }

    /**
     * Show an image
     */
    async showImage(imagePath, duration = 0, fieldName = null) {
        console.log('showImage called with:', imagePath);
        
        return new Promise((resolve) => {
            // Resolve image path (check for variants based on growth/seasonal)
            const resolvedPath = this.resolveImagePath(imagePath, fieldName);
            console.log('Resolved path:', resolvedPath);
            
            // Create a temporary image to test if it loads
            const testImg = new Image();
            
            testImg.onload = () => {
                console.log('Image loaded successfully:', imagePath);
                // Image loaded successfully, show it
                // Fade out
                this.petImage.classList.add('fade-out');
                
                setTimeout(() => {
                    // Change image
                    this.petImage.src = resolvedPath;
                    this.currentImage = imagePath;
                    
                    // Fade in
                    this.petImage.classList.remove('fade-out');
                    this.petImage.classList.add('fade-in');
                    
                    // If duration is specified, revert after timeout
                    if (duration > 0) {
                        setTimeout(() => {
                            this.returnToCurrentState();
                            resolve();
                        }, duration);
                    } else {
                        resolve();
                    }
                }, this.config.advanced.transitionDuration);
            };
            
            testImg.onerror = () => {
                // Image failed to load
                console.error(`Image failed to load: ${imagePath}, resolved: ${resolvedPath}`);
                this.log(`Image not found: ${imagePath}. Please upload an image in config.html`, 'warn');
                
                // Show placeholder or keep current image
                if (!this.petImage.src || this.petImage.src.includes('data:image/svg')) {
                    // Create a placeholder SVG
                    const placeholder = this.createPlaceholderImage();
                    this.petImage.src = placeholder;
                }
                
                resolve();
            };
            
            testImg.src = resolvedPath;
        });
    }
    
    /**
     * Create a placeholder image when no image is available
     */
    createPlaceholderImage() {
        const svg = `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#f0f0f0" stroke="#ddd" stroke-width="2"/>
            <text x="100" y="100" font-family="Arial" font-size="16" fill="#999" text-anchor="middle" dominant-baseline="middle">
                No Image
            </text>
            <text x="100" y="120" font-family="Arial" font-size="12" fill="#999" text-anchor="middle" dominant-baseline="middle">
                Upload in config.html
            </text>
        </svg>`;
        return 'data:image/svg+xml;base64,' + btoa(svg);
    }

    /**
     * Resolve image path based on growth stage and seasonal mode
     * @param {string} imagePath - Original image path (e.g., "default-image" or full path)
     * @param {string} fieldName - Optional field name for variant lookup
     * @returns {string} - Resolved path
     */
    resolveImagePath(imagePath, fieldName = null) {
        // If no field name provided, try to extract from imagePath
        if (!fieldName && imagePath) {
            // Check if it's a config property (e.g., this.config.pet.defaultImage)
            if (imagePath === this.config.pet.defaultImage) {
                fieldName = 'defaultImage';
            } else if (imagePath === this.config.pet.blinkImage) {
                fieldName = 'blinkImage';
            } else {
                // For event/command/state images, we'll need the field name passed in
                // For now, just return the original path
                console.log('Using image path:', imagePath);
                return imagePath;
            }
        }
        
        // Check if imageVariants exist for this field
        if (fieldName && this.config.pet.imageVariants && this.config.pet.imageVariants[fieldName]) {
            const variants = this.config.pet.imageVariants[fieldName];
            console.log(`Image variants for ${fieldName}:`, variants);
            console.log(`Seasonal enabled: ${this.config.seasonal?.enabled}, Current season: ${this.config.seasonal?.currentSeason}`);
            
            // Priority 1: Check seasonal variant if seasonal mode is active
            if (this.config.seasonal?.enabled && this.config.seasonal?.currentSeason && 
                this.config.seasonal.currentSeason !== 'none' && this.config.seasonal.currentSeason !== 'default') {
                const seasonalImage = variants.seasonal?.[this.config.seasonal.currentSeason];
                console.log(`Looking for seasonal image in variants.seasonal.${this.config.seasonal.currentSeason}:`, seasonalImage);
                if (seasonalImage) {
                    console.log(`✅ Using seasonal image for ${fieldName} (${this.config.seasonal.currentSeason}):`, seasonalImage);
                    return seasonalImage;
                } else {
                    console.log(`❌ No seasonal image found for ${this.config.seasonal.currentSeason}`);
                }
            }
            
            // Priority 2: Check growth stage variant
            if (this.enhancements?.growth?.currentStage) {
                const stageName = this.enhancements.growth.currentStage.name;
                const stageImage = variants.growth?.[stageName];
                if (stageImage) {
                    console.log(`Using growth stage image for ${fieldName}:`, stageImage);
                    return stageImage;
                }
            }
            
            // Priority 3: Use default variant if set
            if (variants.default) {
                console.log(`Using default variant for ${fieldName}:`, variants.default);
                return variants.default;
            }
        }
        
        // Fallback to original path
        console.log('Using image path:', imagePath);
        return imagePath;
    }

    /**
     * Return to current state image
     */
    async returnToCurrentState() {
        if (this.currentState === 'default') {
            await this.showImage(this.config.pet.defaultImage, 0, 'defaultImage');
        } else if (this.config.states[this.currentState]) {
            await this.showImage(this.config.states[this.currentState].image);
        }
    }

    /**
     * Blink animation
     */
    startBlinkAnimation() {
        if (this.blinkTimer) {
            clearInterval(this.blinkTimer);
        }
        
        const blink = () => {
            // Only blink if in default state and not showing a message
            if (this.currentState === 'default' && !this.isShowingMessage) {
                const blinkPath = this.resolveImagePath(this.config.pet.blinkImage, 'blinkImage');
                const defaultPath = this.resolveImagePath(this.config.pet.defaultImage, 'defaultImage');
                
                // Only blink if images exist (not placeholders)
                if (!blinkPath.includes('data:image/svg') && !defaultPath.includes('data:image/svg')) {
                    // Show blink image
                    this.petImage.src = blinkPath;
                    
                    // Return to default after blink duration
                    setTimeout(() => {
                        if (this.currentState === 'default') {
                            this.petImage.src = defaultPath;
                        }
                    }, this.config.pet.blinkDuration);
                }
            }
        };
        
        this.blinkTimer = setInterval(blink, this.config.pet.blinkInterval);
    }

    /**
     * Show message bubble
     */
    async showMessage(text, duration = 4000) {
        // If showing the same message, don't re-queue
        if (this.isShowingMessage && this.bubbleText.textContent === text) {
            return;
        }
        
        // Add to queue
        this.messageQueue.push({ text, duration });
        
        // Process queue
        if (!this.isShowingMessage) {
            this.processMessageQueue();
        }
    }

    /**
     * Process message queue
     */
    async processMessageQueue() {
        if (this.messageQueue.length === 0) {
            this.isShowingMessage = false;
            return;
        }
        
        this.isShowingMessage = true;
        const { text, duration } = this.messageQueue.shift();
        
        // Set text
        this.bubbleText.textContent = text;
        
        // Apply bubble style from config
        const bubbleStyle = this.config.advanced.bubbleStyle || 'default';
        const bubbleContent = this.bubbleText.parentElement;
        const bubbleTail = bubbleContent.nextElementSibling;
        
        // Remove all style classes
        const styleClasses = ['neon-cyberpunk', 'vaporwave', 'cute', 'manga', 'fiery', 'ice', 'wind', 'earth', 'water', 'lightning', 'gothic', 'terrafae', 'pommie', 'pokemon'];
        styleClasses.forEach(cls => {
            this.messageBubble.classList.remove(cls);
            bubbleContent.classList.remove(cls);
            if (bubbleTail) bubbleTail.classList.remove(cls);
        });
        
        // Add selected style class (if not default)
        if (bubbleStyle !== 'default') {
            this.messageBubble.classList.add(bubbleStyle);
            bubbleContent.classList.add(bubbleStyle);
            if (bubbleTail) bubbleTail.classList.add(bubbleStyle);
        }
        
        // Show bubble
        this.messageBubble.classList.remove('hidden');
        this.messageBubble.classList.add('animating-in');
        
        setTimeout(() => {
            this.messageBubble.classList.remove('animating-in');
            this.messageBubble.classList.add('visible');
        }, 400);
        
        // Hide after duration
        setTimeout(() => {
            this.hideMessage();
        }, duration);
    }

    /**
     * Hide message bubble
     */
    hideMessage() {
        this.messageBubble.classList.remove('visible');
        this.messageBubble.classList.add('animating-out');
        
        setTimeout(() => {
            this.messageBubble.classList.remove('animating-out');
            this.messageBubble.classList.add('hidden');
            
            // Process next message in queue
            setTimeout(() => {
                this.processMessageQueue();
            }, this.config.advanced.messageQueueDelay);
        }, 300);
    }

    /**
     * Trigger an event reaction
     */
    async triggerEvent(eventName, eventData = {}) {
        try {
            const event = this.config.events[eventName];
            
            if (!event || !event.enabled) {
                return;
            }
            
            // Check if event is allowed in current state
            if (this.currentState !== 'default') {
                const state = this.config.states[this.currentState];
                if (state && state.allowedEvents.length > 0 && !state.allowedEvents.includes(eventName)) {
                    this.log(`Event ${eventName} blocked by state ${this.currentState}`, 'warn');
                    return;
                }
            }
            
            this.log(`Triggering event: ${eventName}`, 'info');
            this.performanceMetrics.eventsProcessed++;
            
            // Track analytics
            if (this.enhancements) {
                this.enhancements.trackAnalytics('event', eventName);
                
                // Add experience
                const xpGain = this.config.growth?.experienceGains?.[eventName] || 10;
                // Special case for bits - give XP per bit
                if (eventName === 'bits' && eventData.amount) {
                    const bitsXP = this.config.growth?.experienceGains?.bits || 1;
                    this.enhancements.addExperience(eventData.amount * bitsXP, `${eventData.amount} bits`);
                } else {
                    this.enhancements.addExperience(xpGain, eventName);
                }
                
                // Send Discord notification if configured
                await this.enhancements.sendDiscordNotification(eventName, eventData);
            }
            
            // Show message with variable replacement
            const message = this.replaceVariables(event.message, eventData);
            this.showMessage(message, event.duration);
            
            // Show event image (don't await - let them happen simultaneously)
            this.showImage(event.image, event.duration);
            
            // Play sound if enabled
            if (this.config.advanced.enableSounds && event.sound) {
                this.playSound(event.sound);
            }
            
            // Spawn particles if enabled and configured
            if (this.config.advanced.enableParticles && event.particles && event.particles !== 'none') {
                this.spawnParticles(event.particles, 12);
            }
            
            // Add movement animation if configured
            if (event.animation && event.animation !== 'none') {
                this.movePet(event.animation);
            }
        } catch (error) {
            this.handleError('triggerEvent', error);
        }
    }

    /**
     * Replace variables in message text
     */
    replaceVariables(text, data) {
        let result = text;
        
        // Replace all {variable} patterns
        Object.keys(data).forEach(key => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            result = result.replace(regex, data[key]);
        });
        
        return result;
    }

    /**
     * Change to a specific state
     */
    async changeState(stateName) {
        const state = this.config.states[stateName];
        
        if (!state || !state.enabled) {
            return;
        }
        
        this.log(`Changing state to: ${stateName}`, 'info');
        
        this.currentState = stateName;
        
        // Show state image
        await this.showImage(state.image);
        
        // Show state message
        if (state.message) {
            await this.showMessage(state.message);
        }
        
        // Play sound if enabled
        if (this.config.advanced.enableSounds && state.sound) {
            this.playSound(state.sound);
        }
        
        // Spawn particles if enabled and configured
        if (this.config.advanced.enableParticles && state.particles && state.particles !== 'none') {
            this.spawnParticles(state.particles, 12);
        }
        
        // Add movement animation if configured
        if (state.animation && state.animation !== 'none') {
            this.movePet(state.animation);
        }
        
        // Auto-recover if specified
        if (state.autoRecoverTime) {
            setTimeout(() => {
                this.recoverFromState();
            }, state.autoRecoverTime);
        }
    }

    /**
     * Recover from state (return to default)
     */
    async recoverFromState() {
        this.log(`Recovering from state: ${this.currentState}`, 'info');
        
        this.currentState = 'default';
        await this.showImage(this.config.pet.defaultImage);
    }

    /**
     * Start random state checks
     */
    startStateChecks() {
        // Clear existing timers
        Object.values(this.stateCheckTimers).forEach(timer => clearInterval(timer));
        this.stateCheckTimers = {};
        
        // Set up timer for each state
        Object.entries(this.config.states).forEach(([stateName, state]) => {
            if (state.enabled && state.triggerChance > 0 && state.checkInterval > 0) {
                this.stateCheckTimers[stateName] = setInterval(() => {
                    this.checkStateChange(stateName, state);
                }, state.checkInterval);
            }
        });
    }

    /**
     * Check if state should trigger randomly
     */
    checkStateChange(stateName, state) {
        // Don't trigger if already in a state
        if (this.currentState !== 'default') {
            return;
        }
        
        // Random chance
        if (Math.random() < state.triggerChance) {
            this.changeState(stateName);
        }
    }

    /**
     * Handle state recovery command
     */
    handleRecoveryCommand(stateName, username) {
        console.log('Recovery command triggered:', { 
            stateName, 
            username, 
            currentState: this.currentState 
        });
        
        if (this.currentState === stateName) {
            const state = this.config.states[stateName];
            
            this.log(`${username} used recovery command for ${stateName}`, 'info');
            
            if (state.commandMessage) {
                const message = this.replaceVariables(state.commandMessage, { username });
                this.showMessage(message);
            }
            
            this.recoverFromState();
        } else {
            console.log(`Not in state ${stateName}, currently in: ${this.currentState}`);
        }
    }
    
    /**
     * Handle custom chat command
     */
    handleChatCommand(command, username, tags) {
        // First check if it's a viewer interaction command
        if (this.viewerInteraction) {
            const handled = this.viewerInteraction.handleInteractiveCommand(command, username, []);
            if (handled) {
                return;
            }
        }
        
        if (!this.config.commands || !this.config.commands[command]) {
            return;
        }
        
        const commandData = this.config.commands[command];
        
        // Check if enabled
        if (!commandData.enabled) {
            return;
        }
        
        // Check permissions
        const hasPermission = this.checkPermissions(tags, commandData.requiredRole);
        if (!hasPermission) {
            this.log(`User ${username} doesn't have permission for ${command}`, 'warn');
            return;
        }
        
        // Check cooldown (simple implementation - could be improved)
        const now = Date.now();
        const lastUsed = this.commandCooldowns?.[command] || 0;
        if (now - lastUsed < commandData.cooldown) {
            this.log(`Command ${command} is on cooldown`, 'info');
            return;
        }
        
        // Update cooldown
        if (!this.commandCooldowns) {
            this.commandCooldowns = {};
        }
        this.commandCooldowns[command] = now;
        
        // Show command reaction
        this.log(`${username} used ${command}`, 'info');
        
        // Track analytics and give XP
        if (this.enhancements) {
            this.enhancements.trackAnalytics('command', command);
            const xpGain = this.config.growth?.experienceGains?.command || 2;
            this.enhancements.addExperience(xpGain, `command: ${command}`);
        }
        
        if (commandData.image) {
            this.showImage(commandData.image, commandData.duration);
        }
        
        if (commandData.message) {
            const message = this.replaceVariables(commandData.message, { username });
            this.showMessage(message, commandData.duration);
        }
        
        if (this.config.advanced.enableSounds && commandData.sound) {
            this.playSound(commandData.sound);
        }
        
        // Spawn particles if enabled and configured
        if (this.config.advanced.enableParticles && commandData.particles && commandData.particles !== 'none') {
            this.spawnParticles(commandData.particles, 12);
        }
        
        // Add movement animation if configured
        if (commandData.animation && commandData.animation !== 'none') {
            this.movePet(commandData.animation);
        }
    }
    
    /**
     * Check user permissions
     */
    checkPermissions(tags, requiredRole) {
        if (!tags) return true;
        
        switch (requiredRole) {
            case 'broadcaster':
                return tags.badges?.broadcaster === '1';
            case 'moderator':
                return tags.mod || tags.badges?.moderator === '1' || tags.badges?.broadcaster === '1';
            case 'vip':
                return tags.badges?.vip === '1' || tags.mod || tags.badges?.broadcaster === '1';
            case 'subscriber':
                return tags.subscriber || tags.badges?.subscriber || tags.mod || tags.badges?.broadcaster === '1';
            case 'everyone':
            default:
                return true;
        }
    }

    /**
     * Setup click interaction
     */
    setupClickInteraction() {
        if (!this.config.advanced.enableClickInteraction) return;
        
        this.petImage.classList.add('clickable');
        
        let clickCooldown = false;
        
        this.petImage.addEventListener('click', () => {
            if (clickCooldown) {
                this.log('Click on cooldown', 'info');
                return;
            }
            
            this.log('Pet clicked!', 'info');
            
            // Track analytics and give XP
            if (this.enhancements) {
                this.enhancements.trackAnalytics('click', 'pet');
                const xpGain = this.config.growth?.experienceGains?.click || 1;
                this.enhancements.addExperience(xpGain, 'click');
            }
            
            // Show configured message
            const message = this.config.advanced.clickMessage || 'You clicked me! 😊';
            this.showMessage(message, 3000);
            
            // Play sound if configured
            if (this.config.advanced.enableSounds && this.config.advanced.clickSound) {
                this.playSound(this.config.advanced.clickSound);
            }
            
            // Spawn particles if configured
            if (this.config.advanced.enableParticles && this.config.advanced.clickParticles && this.config.advanced.clickParticles !== 'none') {
                this.spawnParticles(this.config.advanced.clickParticles, 8);
            }
            
            // Perform animation if configured
            if (this.config.advanced.clickAnimation && this.config.advanced.clickAnimation !== 'none') {
                this.movePet(this.config.advanced.clickAnimation);
            }
            
            // Set cooldown
            clickCooldown = true;
            setTimeout(() => {
                clickCooldown = false;
            }, 3000);
        });
    }

    /**
     * Play sound
     */
    /**
     * Preload audio files
     */
    preloadSounds() {
        if (!this.config.advanced.enableSounds) return;
        
        const soundPaths = new Set();
        
        // Collect all sound paths from events
        Object.values(this.config.events).forEach(event => {
            if (event.sound) soundPaths.add(event.sound);
        });
        
        // Collect from commands
        Object.values(this.config.commands).forEach(cmd => {
            if (cmd.sound) soundPaths.add(cmd.sound);
        });
        
        // Collect from states
        Object.values(this.config.states).forEach(state => {
            if (state.sound) soundPaths.add(state.sound);
        });
        
        // Add click sound
        if (this.config.advanced.clickSound) {
            soundPaths.add(this.config.advanced.clickSound);
        }
        
        // Preload each unique sound
        soundPaths.forEach(path => {
            if (!this.audioCache[path]) {
                const audio = new Audio();
                audio.preload = 'auto';
                audio.src = path;
                audio.volume = this.config.advanced.soundVolume || 0.5;
                this.audioCache[path] = audio;
                this.log(`Preloaded sound: ${path}`, 'info');
            }
        });
    }

    /**
     * Play sound effect
     */
    playSound(soundPath) {
        if (!soundPath || !this.config.advanced.enableSounds) return;
        
        try {
            let audio = this.audioCache[soundPath];
            
            // If not cached, create new audio
            if (!audio) {
                audio = new Audio(soundPath);
                audio.volume = this.config.advanced.soundVolume || 0.5;
                this.audioCache[soundPath] = audio;
            }
            
            // Clone the audio to allow overlapping sounds
            const soundInstance = audio.cloneNode();
            soundInstance.volume = this.config.advanced.soundVolume || 0.5;
            
            soundInstance.play().catch(err => {
                this.log(`Error playing sound: ${err.message}`, 'error');
            });
        } catch (error) {
            this.log(`Error creating audio: ${error.message}`, 'error');
        }
    }

    /**
     * Spawn particle effects
     */
    spawnParticles(type = 'hearts', count = 10) {
        try {
            if (!this.config.advanced.enableParticles) return;
            if (!this.particleContainer) {
                this.log('Particle container not found', 'warn');
                return;
            }
            
            const particleEmojis = {
                hearts: ['💖', '💕', '💗', '💓', '💝'],
                stars: ['⭐', '✨', '🌟', '💫', '⚡'],
                celebrate: ['🎉', '🎊', '🎈', '🎆', '✨'],
                money: ['💰', '💵', '💴', '💶', '💷'],
                fire: ['🔥', '💥', '✨', '⚡', '💫'],
                ice: ['❄️', '💎', '💠', '🔷', '✨'],
                food: ['🍪', '🍰', '🎂', '🍕', '🍔']
            };
            
            const particles = particleEmojis[type] || particleEmojis.hearts;
            
            // Get pet position
            const petRect = this.petContainer.getBoundingClientRect();
            const centerX = petRect.left + petRect.width / 2;
            const centerY = petRect.top + petRect.height / 2;
            
            this.performanceMetrics.particlesSpawned += count;
            
            for (let i = 0; i < count; i++) {
                setTimeout(() => {
                    this.createParticle(centerX, centerY, particles);
                }, i * 50); // Stagger particle creation
            }
        } catch (error) {
            this.handleError('spawnParticles', error);
        }
    }

    /**
     * Create individual particle
     */
    createParticle(x, y, emojiArray) {
        try {
            const settings = this.config.advanced.particleSettings || {
                size: 40,
                count: 10,
                spread: 150,
                speed: 5,
                lifetime: 2000,
                gravity: 0.5
            };

            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = emojiArray[Math.floor(Math.random() * emojiArray.length)];
            
            // Random offset from center using spread setting
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * settings.spread;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;
            
            particle.style.left = (x + offsetX) + 'px';
            particle.style.top = (y + offsetY) + 'px';
            particle.style.fontSize = settings.size + 'px';
            
            // Animation duration based on speed (inverse relationship)
            const duration = (2000 / settings.speed) / 1000; // Convert to seconds
            particle.style.animationDuration = duration + 's';
            
            // Apply custom CSS variables for animation
            particle.style.setProperty('--particle-gravity', settings.gravity);
            particle.style.setProperty('--particle-lifetime', settings.lifetime + 'ms');
            
            this.particleContainer.appendChild(particle);
            
            // Remove after lifetime setting
            setTimeout(() => {
                if (particle.parentNode) {
                    particle.remove();
                }
            }, settings.lifetime);
        } catch (error) {
            this.handleError('createParticle', error);
        }
    }

    /**
     * Animate pet movement
     */
    async movePet(animation = 'bounce') {
        if (this.isMoving) return;
        this.isMoving = true;
        
        const animations = {
            bounce: () => this.bounceAnimation(),
            wiggle: () => this.wiggleAnimation(),
            spin: () => this.spinAnimation(),
            float: () => this.floatAnimation(),
            shake: () => this.shakeAnimation(),
            sway: () => this.swayAnimation(),
            jump: () => this.jumpAnimation(),
            hop: () => this.hopAnimation(),
            pulse: () => this.pulseAnimation(),
            'slide-left': () => this.slideLeftAnimation(),
            'slide-right': () => this.slideRightAnimation()
        };
        
        if (animations[animation]) {
            await animations[animation]();
        }
        
        this.isMoving = false;
    }

    /**
     * Bounce animation
     */
    async bounceAnimation() {
        this.petContainer.classList.add('bounce-animation');
        return new Promise(resolve => {
            setTimeout(() => {
                this.petContainer.classList.remove('bounce-animation');
                resolve();
            }, 600);
        });
    }

    /**
     * Wiggle animation
     */
    async wiggleAnimation() {
        this.petContainer.classList.add('wiggle-animation');
        return new Promise(resolve => {
            setTimeout(() => {
                this.petContainer.classList.remove('wiggle-animation');
                resolve();
            }, 500);
        });
    }

    /**
     * Spin animation
     */
    async spinAnimation() {
        this.petContainer.classList.add('spin-animation');
        return new Promise(resolve => {
            setTimeout(() => {
                this.petContainer.classList.remove('spin-animation');
                resolve();
            }, 800);
        });
    }

    /**
     * Float animation
     */
    async floatAnimation() {
        this.petContainer.classList.add('float-animation');
        return new Promise(resolve => {
            setTimeout(() => {
                this.petContainer.classList.remove('float-animation');
                resolve();
            }, 2000);
        });
    }

    /**
     * Shake animation
     */
    async shakeAnimation() {
        this.petContainer.classList.add('shake-animation');
        return new Promise(resolve => {
            setTimeout(() => {
                this.petContainer.classList.remove('shake-animation');
                resolve();
            }, 500);
        });
    }

    /**
     * Sway animation
     */
    async swayAnimation() {
        this.petContainer.classList.add('sway-animation');
        return new Promise(resolve => {
            setTimeout(() => {
                this.petContainer.classList.remove('sway-animation');
                resolve();
            }, 2000);
        });
    }

    /**
     * Jump animation
     */
    async jumpAnimation() {
        this.petContainer.classList.add('jump-animation');
        return new Promise(resolve => {
            setTimeout(() => {
                this.petContainer.classList.remove('jump-animation');
                resolve();
            }, 600);
        });
    }

    /**
     * Hop animation
     */
    async hopAnimation() {
        this.petContainer.classList.add('hop-animation');
        return new Promise(resolve => {
            setTimeout(() => {
                this.petContainer.classList.remove('hop-animation');
                resolve();
            }, 400);
        });
    }

    /**
     * Pulse animation
     */
    async pulseAnimation() {
        this.petContainer.classList.add('pulse-animation');
        return new Promise(resolve => {
            setTimeout(() => {
                this.petContainer.classList.remove('pulse-animation');
                resolve();
            }, 600);
        });
    }

    /**
     * Slide left animation
     */
    async slideLeftAnimation() {
        this.petContainer.classList.add('slide-left-animation');
        return new Promise(resolve => {
            setTimeout(() => {
                this.petContainer.classList.remove('slide-left-animation');
                resolve();
            }, 1000);
        });
    }

    /**
     * Slide right animation
     */
    async slideRightAnimation() {
        this.petContainer.classList.add('slide-right-animation');
        return new Promise(resolve => {
            setTimeout(() => {
                this.petContainer.classList.remove('slide-right-animation');
                resolve();
            }, 1000);
        });
    }

    /**
     * Reload configuration
     */
    reloadConfig() {
        this.config = petStorage.load();
        this.applyPetSettings();
        this.startBlinkAnimation();
        this.startStateChecks();
        this.log('Configuration reloaded', 'info');
    }

    /**
     * Debug logging
     */
    log(message, type = 'log') {
        // Always log to console
        console.log(`[StreamPet] ${message}`);
        
        // Only log to UI if config exists and debug mode is enabled
        if (this.config && this.config.advanced && this.config.advanced.debugMode && this.debugLog) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.className = type;
            logEntry.textContent = `[${timestamp}] ${message}`;
            this.debugLog.appendChild(logEntry);
            
            // Auto-scroll to bottom
            this.debugLog.scrollTop = this.debugLog.scrollHeight;
            
            // Limit log entries
            while (this.debugLog.children.length > 100) {
                this.debugLog.removeChild(this.debugLog.firstChild);
            }
        }
    }

    /**
     * Enter position configuration mode
     * Shows a larger preview with drag/resize controls
     */
    enterPositionMode() {
        console.log('enterPositionMode called');
        this.log('Entering position configuration mode', 'info');
        
        // Store original state
        this.positionModeActive = true;
        this.positionModeOriginal = {
            x: this.config.pet.position.x,
            y: this.config.pet.position.y,
            width: this.config.pet.size.width,
            height: this.config.pet.size.height
        };
        
        console.log('Position mode original state:', this.positionModeOriginal);
        
        // Add position mode class
        this.petContainer.classList.add('position-mode');
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'position-mode-overlay';
        overlay.id = 'position-overlay';
        document.body.appendChild(overlay);
        console.log('Overlay created');
        
        // Create resize border
        const border = document.createElement('div');
        border.className = 'position-resize-border';
        border.id = 'resize-border';
        this.petContainer.appendChild(border);
        console.log('Border created');
        
        // Create resize handles
        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        positions.forEach(pos => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${pos}`;
            handle.dataset.position = pos;
            this.petContainer.appendChild(handle);
            
            // Add resize event listeners
            handle.addEventListener('mousedown', (e) => this.startResize(e, pos));
        });
        console.log('Resize handles created');
        
        // Create save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'position-save-button';
        saveBtn.id = 'position-save-btn';
        saveBtn.textContent = '✓ Save Position & Size';
        saveBtn.addEventListener('click', () => this.savePosition());
        document.body.appendChild(saveBtn);
        console.log('Save button created');
        
        // Create info display
        const info = document.createElement('div');
        info.className = 'position-info';
        info.id = 'position-info';
        this.updatePositionInfo();
        document.body.appendChild(info);
        console.log('Info display created');
        
        // Add drag event listeners
        this.petContainer.addEventListener('mousedown', (e) => this.startDrag(e));
        
        console.log('Position mode fully activated');
        this.log('Position mode activated - Drag to move, use handles to resize', 'info');
    }

    /**
     * Start dragging the pet
     */
    startDrag(e) {
        // Don't drag if clicking on a resize handle
        if (e.target.classList.contains('resize-handle')) return;
        
        e.preventDefault();
        
        const rect = this.petContainer.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        const onMouseMove = (e) => {
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            
            this.petContainer.style.left = x + 'px';
            this.petContainer.style.top = y + 'px';
            this.petContainer.style.transform = 'none';
            
            this.updatePositionInfo();
        };
        
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    /**
     * Start resizing the pet
     */
    startResize(e, position) {
        e.preventDefault();
        e.stopPropagation();
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = this.petContainer.offsetWidth;
        const startHeight = this.petContainer.offsetHeight;
        const startLeft = this.petContainer.offsetLeft;
        const startTop = this.petContainer.offsetTop;
        
        const onMouseMove = (e) => {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;
            
            switch(position) {
                case 'bottom-right':
                    newWidth = startWidth + deltaX;
                    newHeight = startHeight + deltaY;
                    break;
                case 'bottom-left':
                    newWidth = startWidth - deltaX;
                    newHeight = startHeight + deltaY;
                    newLeft = startLeft + deltaX;
                    break;
                case 'top-right':
                    newWidth = startWidth + deltaX;
                    newHeight = startHeight - deltaY;
                    newTop = startTop + deltaY;
                    break;
                case 'top-left':
                    newWidth = startWidth - deltaX;
                    newHeight = startHeight - deltaY;
                    newLeft = startLeft + deltaX;
                    newTop = startTop + deltaY;
                    break;
            }
            
            // Maintain aspect ratio if enabled
            if (this.config.pet.size.maintainAspect) {
                const aspectRatio = startWidth / startHeight;
                newHeight = newWidth / aspectRatio;
                
                // Adjust position for top handles when maintaining aspect
                if (position.includes('top')) {
                    newTop = startTop + (startHeight - newHeight);
                }
                if (position.includes('left')) {
                    newLeft = startLeft + (startWidth - newWidth);
                }
            }
            
            // Apply minimum size
            newWidth = Math.max(50, newWidth);
            newHeight = Math.max(50, newHeight);
            
            this.petContainer.style.width = newWidth + 'px';
            this.petContainer.style.height = newHeight + 'px';
            this.petContainer.style.left = newLeft + 'px';
            this.petContainer.style.top = newTop + 'px';
            
            // Update the image size to match the container
            this.petImage.style.width = newWidth + 'px';
            this.petImage.style.height = newHeight + 'px';
            
            this.updatePositionInfo();
        };
        
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    /**
     * Update position info display
     */
    updatePositionInfo() {
        const info = document.getElementById('position-info');
        if (!info) return;
        
        const rect = this.petContainer.getBoundingClientRect();
        const xPercent = ((rect.left / window.innerWidth) * 100).toFixed(1);
        const yPercent = ((rect.top / window.innerHeight) * 100).toFixed(1);
        
        info.innerHTML = `
            <div>Position: X=${xPercent}%, Y=${yPercent}%</div>
            <div>Size: ${rect.width.toFixed(0)}px × ${rect.height.toFixed(0)}px</div>
            <div>💡 Drag to move • Use corners to resize</div>
        `;
    }

    /**
     * Save position and exit positioning mode
     */
    savePosition() {
        const rect = this.petContainer.getBoundingClientRect();
        
        // Calculate percentage position
        const xPercent = (rect.left / window.innerWidth) * 100;
        const yPercent = (rect.top / window.innerHeight) * 100;
        
        // Update config
        this.config.pet.position.x = xPercent;
        this.config.pet.position.y = yPercent;
        this.config.pet.size.width = rect.width;
        this.config.pet.size.height = rect.height;
        this.config.pet.size.mode = 'pixels';
        
        // Save to storage
        petStorage.save(this.config);
        
        this.log(`Position saved: X=${xPercent.toFixed(1)}%, Y=${yPercent.toFixed(1)}%, Size=${rect.width.toFixed(0)}×${rect.height.toFixed(0)}px`, 'info');
        
        // Exit positioning mode
        this.exitPositionMode();
        
        // Send message to config page to update inputs
        if (window.opener) {
            window.opener.postMessage({
                type: 'positionSaved',
                position: { x: xPercent, y: yPercent },
                size: { width: rect.width, height: rect.height }
            }, '*');
        }
    }

    /**
     * Exit position configuration mode
     */
    exitPositionMode() {
        this.positionModeActive = false;
        
        // Remove position mode class
        this.petContainer.classList.remove('position-mode');
        
        // Remove overlay
        const overlay = document.getElementById('position-overlay');
        if (overlay) overlay.remove();
        
        // Remove border
        const border = document.getElementById('resize-border');
        if (border) border.remove();
        
        // Remove resize handles
        document.querySelectorAll('.resize-handle').forEach(h => h.remove());
        
        // Remove save button
        const saveBtn = document.getElementById('position-save-btn');
        if (saveBtn) saveBtn.remove();
        
        // Remove info display
        const info = document.getElementById('position-info');
        if (info) info.remove();
        
        // Reapply position from config
        this.applyPetSettings();
        
        this.log('Position mode exited', 'info');
    }
}

// Initialize when page loads
let streamPet;

window.addEventListener('DOMContentLoaded', () => {
    streamPet = new StreamPet();
});

// Listen for config updates from config page
window.addEventListener('storage', (e) => {
    if (e.key === 'streamPetConfig') {
        streamPet.reloadConfig();
    } else if (e.key === 'streamPetTestTrigger') {
        // Handle test triggers from config page
        try {
            const testData = JSON.parse(e.newValue);
            console.log('Test trigger detected from localStorage:', testData);
            
            if (testData.type === 'testEvent') {
                streamPet.log(`Test event triggered: ${testData.eventName}`, 'info');
                streamPet.triggerEvent(testData.eventName, testData.eventData);
                
            } else if (testData.type === 'testState') {
                streamPet.log(`Test state triggered: ${testData.stateName}`, 'info');
                streamPet.changeState(testData.stateName);
                
                // Reset to default after 5 seconds
                setTimeout(() => {
                    streamPet.changeState('default');
                }, 5000);
                
            } else if (testData.type === 'testCommand') {
                streamPet.log(`Test recovery command: ${testData.stateName}`, 'info');
                streamPet.handleRecoveryCommand(testData.stateName, testData.username || 'TestUser');
                
            } else if (testData.type === 'testCustomCommand') {
                streamPet.log(`Test custom command: ${testData.commandName}`, 'info');
                const fakeTags = {
                    'display-name': testData.username || 'TestUser',
                    mod: true,
                    subscriber: true,
                    badges: { vip: '1' }
                };
                streamPet.handleChatCommand(testData.commandName, testData.username || 'TestUser', fakeTags);
            }
        } catch (err) {
            console.error('Error processing test trigger:', err);
        }
    }
});

// Listen for test messages from config page (when in iframe)
window.addEventListener('message', (e) => {
    if (!streamPet) {
        console.log('streamPet not initialized yet');
        return;
    }
    
    console.log('Received postMessage:', e.data);
    console.log('Message type:', e.data.type);
    
    if (e.data.type === 'testEvent') {
        const eventName = e.data.eventName;
        const eventData = e.data.eventData || {};
        
        console.log(`Testing event: ${eventName}`, eventData);
        streamPet.log(`Test event triggered: ${eventName}`, 'info');
        
        // Trigger the event directly
        streamPet.triggerEvent(eventName, eventData);
        
    } else if (e.data.type === 'testState') {
        const stateName = e.data.stateName;
        
        console.log(`Testing state: ${stateName}`);
        streamPet.log(`Test state triggered: ${stateName}`, 'info');
        
        // Change to the state
        streamPet.changeState(stateName);
        
        // Reset to default after 5 seconds
        setTimeout(() => {
            streamPet.changeState('default');
        }, 5000);
        
    } else if (e.data.type === 'testCommand') {
        const stateName = e.data.stateName;
        const username = e.data.username || 'TestUser';
        
        console.log(`Testing recovery command for state: ${stateName}, current state: ${streamPet.currentState}`);
        streamPet.log(`Test recovery command: ${stateName} (currently in: ${streamPet.currentState})`, 'info');
        
        if (streamPet.currentState !== stateName) {
            streamPet.log(`⚠️ Not in ${stateName} state - trigger the state first!`, 'warn');
            streamPet.showMessage(`Not in ${stateName} state! Trigger it first.`, 3000);
        } else {
            // Call the recovery command handler
            streamPet.handleRecoveryCommand(stateName, username);
        }
        
    } else if (e.data.type === 'testCustomCommand') {
        const commandName = e.data.commandName;
        const username = e.data.username || 'TestUser';
        
        console.log(`Testing custom command: ${commandName}`);
        streamPet.log(`Test custom command: ${commandName}`, 'info');
        
        // Create fake tags for testing
        const fakeTags = {
            'display-name': username,
            mod: true,
            subscriber: true,
            badges: { vip: '1' }
        };
        
        streamPet.handleChatCommand(commandName, username, fakeTags);
    } else if (e.data.type === 'testParticles') {
        // Test particles with custom settings
        const settings = e.data.settings || {};
        console.log('Testing particles with settings:', settings);
        streamPet.log('Test particles triggered', 'info');
        streamPet.spawnParticles('celebrate', settings.count || 20);
    } else if (e.data.type === 'resetGrowth') {
        // Reset growth stats
        console.log('Resetting growth stats');
        if (streamPet.enhancements) {
            streamPet.enhancements.resetGrowth();
        }
    } else if (e.data.type === 'testLevelUp') {
        // Test level up
        console.log('Testing level up');
        if (streamPet.enhancements) {
            // Directly call the visual effects for testing purposes
            const level = streamPet.config.growth?.level || 1;
            streamPet.enhancements.showLevelUpBar(level + 1);
            streamPet.enhancements.showLevelUpEffect();
            streamPet.spawnParticles('celebrate', 20);
            streamPet.movePet('spin');
        }
    } else if (e.data.type === 'testEmoteRain') {
        // Test emote rain
        console.log('Testing emote rain');
        if (streamPet.twitchIntegration && e.data.emotes) {
            const emoteUrls = e.data.emotes.map(name => 
                `https://static-cdn.jtvnw.net/emoticons/v2/${name}/default/dark/3.0`
            );
            streamPet.twitchIntegration.triggerEmoteRain(emoteUrls);
        }
    } else if (e.data.type === 'testEvolutionEffect') {
        // Test evolution effect
        console.log('Testing evolution effect');
        if (streamPet.enhancements) {
            streamPet.enhancements.showEvolutionEffect(e.data.stageName || 'Test Stage');
        }
    } else if (e.data.type === 'showMessage') {
        // Show test message
        console.log('Showing message:', e.data.message);
        const message = e.data.message || 'This is a test message!';
        const duration = e.data.duration || 4000;
        streamPet.showMessage(message, duration);
    } else if (e.data.type === 'startWeather') {
        // Start weather effect
        console.log('Starting weather:', e.data.weatherType);
        if (streamPet.advancedAnimations) {
            streamPet.advancedAnimations.startWeather(e.data.weatherType);
        }
    } else if (e.data.type === 'stopWeather') {
        // Stop weather effect
        console.log('Stopping weather');
        if (streamPet.advancedAnimations) {
            streamPet.advancedAnimations.stopWeather();
        }
    } else if (e.data.type === 'togglePhysics') {
        // Toggle physics
        console.log('Toggling physics');
        if (streamPet.advancedAnimations) {
            if (streamPet.advancedAnimations.physicsEnabled) {
                streamPet.advancedAnimations.disablePhysics();
            } else {
                streamPet.advancedAnimations.enablePhysics();
            }
        }
    } else if (e.data.type === 'applyForce') {
        // Apply random force
        console.log('Applying force');
        if (streamPet.advancedAnimations && streamPet.advancedAnimations.physicsEnabled) {
            const forceX = (Math.random() - 0.5) * 20;
            const forceY = (Math.random() - 0.5) * 20;
            streamPet.advancedAnimations.applyForce(forceX, forceY);
        }
    } else if (e.data.type === 'updatePhysicsSettings') {
        // Update physics settings
        console.log('Updating physics settings:', e.data);
        if (streamPet.advancedAnimations) {
            if (e.data.gravity !== undefined) streamPet.advancedAnimations.gravity = parseFloat(e.data.gravity);
            if (e.data.bounce !== undefined) streamPet.advancedAnimations.bounce = parseFloat(e.data.bounce);
        }
    } else if (e.data.type === 'testPath') {
        // Test path movement
        console.log('Testing path movement');
        if (streamPet.advancedAnimations) {
            const points = [
                { x: 20, y: 20 },
                { x: 80, y: 20 },
                { x: 80, y: 80 },
                { x: 20, y: 80 },
                { x: 50, y: 50 }
            ];
            streamPet.advancedAnimations.followPath(points, 5000);
        }
    } else if (e.data.type === 'followPath') {
        // Follow custom path
        console.log('Following path:', e.data.points);
        if (streamPet.advancedAnimations) {
            streamPet.advancedAnimations.followPath(e.data.points, e.data.duration || 5000);
        }
    } else if (e.data.type === 'stopPath') {
        // Stop path movement
        console.log('Stopping path movement');
        if (streamPet.advancedAnimations) {
            streamPet.advancedAnimations.stopPath();
        }
    } else if (e.data.type === 'resetPosition') {
        // Reset to default position
        console.log('Resetting to default position');
        streamPet.petContainer.style.left = '50%';
        streamPet.petContainer.style.top = '50%';
        streamPet.petContainer.style.transform = 'translate(-50%, -50%)';
    } else if (e.data.type === 'enterPositionMode') {
        // Enter position configuration mode
        console.log('Entering position configuration mode');
        streamPet.enterPositionMode();
    } else if (e.data.type === 'exitPositionMode') {
        // Exit position configuration mode
        console.log('Exiting position configuration mode');
        streamPet.exitPositionMode();
    } else if (e.data.type === 'forceConfigUpdate') {
        // Force update config from parent window (fixes file:// localStorage isolation)
        console.log('=== RECEIVED forceConfigUpdate from parent window ===');
        console.log('Message data:', e.data);
        console.log('New config pet name:', e.data.config.pet.name);
        console.log('New config default image:', e.data.config.pet.defaultImage);
        console.log('Current localStorage before update:', localStorage.getItem('streamPetConfig').substring(0, 200));
        
        // Save the new config to THIS window's localStorage
        petStorage.save(e.data.config);
        
        console.log('Config saved to iframe localStorage');
        console.log('New localStorage value:', localStorage.getItem('streamPetConfig').substring(0, 200));
        
        // Reload to apply changes
        console.log('Reloading iframe in 100ms to apply new config...');
        setTimeout(() => {
            window.location.reload();
        }, 100);
    } else {
        console.log('Unknown message type:', e.data.type);
    }
});


