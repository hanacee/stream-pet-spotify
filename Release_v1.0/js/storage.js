/**
 * Stream Pet Configuration Storage Manager
 * Handles localStorage for pet settings, events, and states
 */

class PetStorage {
    constructor() {
        this.storageKey = 'streamPetConfig';
        this.defaultConfig = this.getDefaultConfig();
    }

    /**
     * Get default configuration schema
     */
    getDefaultConfig() {
        return {
            version: '1.0.0',
            pet: {
                name: 'Stream Pet',
                defaultImage: 'Images/default.png',
                blinkImage: 'Images/blink.png',
                blinkInterval: 5000,      // ms between blinks
                blinkDuration: 200,       // ms blink lasts
                position: { x: 50, y: 50 }, // percentage from left/top
                size: { 
                    width: 200, 
                    height: 200,
                    mode: 'pixels',       // pixels, percent, auto, scale
                    widthPercent: 10,     // % of screen width
                    heightPercent: 10,    // % of screen height
                    scale: 1.0,           // scale factor for auto/scale modes
                    maintainAspect: true  // maintain aspect ratio
                },
                opacity: 1.0,
                flipHorizontal: false,
                imageVariants: {}  // Stores growth stage and seasonal variants for each image
            },
            events: {
                raid: {
                    enabled: true,
                    image: 'Images/excited.png',
                    message: 'Welcome {raider} and their {count} raiders! 🎉',
                    duration: 5000,
                    sound: '',
                    priority: 10
                },
                follow: {
                    enabled: true,
                    image: 'Images/happy.png',
                    message: 'Thanks for the follow, {username}! 💜',
                    duration: 4000,
                    sound: '',
                    priority: 5
                },
                subscribe: {
                    enabled: true,
                    image: 'Images/excited.png',
                    message: 'Thank you for subscribing, {username}! 🌟',
                    duration: 5000,
                    sound: '',
                    priority: 9
                },
                giftSub: {
                    enabled: true,
                    image: 'Images/excited.png',
                    message: '{gifter} gifted {count} subs! Amazing! 🎁',
                    duration: 5000,
                    sound: '',
                    priority: 9
                },
                bits: {
                    enabled: true,
                    image: 'Images/happy.png',
                    message: '{username} cheered {amount} bits! Thanks! ✨',
                    duration: 4000,
                    sound: '',
                    priority: 7,
                    minAmount: 100  // Only react to 100+ bits
                },
                channelPoints: {
                    enabled: true,
                    image: 'Images/curious.png',
                    message: '{username} redeemed {reward}!',
                    duration: 4000,
                    sound: '',
                    priority: 6
                }
            },
            
            // Custom chat commands
            commands: {
                '!pet': {
                    enabled: true,
                    image: 'Images/happy.png',
                    message: 'Thanks for the pets! 💜',
                    duration: 3000,
                    sound: '',
                    requiredRole: 'everyone', // everyone, subscriber, vip, moderator, broadcaster
                    cooldown: 10000 // milliseconds
                },
                '!treat': {
                    enabled: true,
                    image: 'Images/excited.png',
                    message: '{username} gave me a treat! 🍪',
                    duration: 3000,
                    sound: '',
                    requiredRole: 'everyone',
                    cooldown: 10000
                }
            },
            
            states: {
                sad: {
                    enabled: true,
                    image: 'Images/sad.png',
                    triggerChance: 0.05,    // 5% chance per interval
                    checkInterval: 300000,   // Check every 5 minutes
                    recoveryCommand: '!pet',
                    allowedEvents: ['raid', 'subscribe', 'giftSub'],
                    message: "I'm feeling a bit down... 😢",
                    commandMessage: '{username} cheered me up! 💖',
                    requiredRole: 'everyone'  // everyone, subscriber, vip, moderator
                },
                asleep: {
                    enabled: true,
                    image: 'Images/asleep.png',
                    triggerChance: 0.03,
                    checkInterval: 600000,   // Check every 10 minutes
                    recoveryCommand: '!wake',
                    allowedEvents: ['raid'],
                    message: 'Zzz... 😴',
                    commandMessage: '{username} woke me up!',
                    requiredRole: 'everyone'
                },
                excited: {
                    enabled: true,
                    image: 'Images/excited.png',
                    triggerChance: 0.08,
                    checkInterval: 240000,
                    recoveryCommand: '',  // Auto-recovers
                    allowedEvents: [],    // Reacts to all events
                    message: "I'm super hyped! 🔥",
                    commandMessage: '',
                    autoRecoverTime: 30000  // Returns to normal after 30s
                }
            },
            twitch: {
                enabled: false,
                channel: '',
                clientId: '',
                redirectUri: '',
                useAnonymous: true,  // Connect without auth for basic chat
                useBotAccount: false,  // Use separate bot account for chat
                botUsername: '',  // Bot account username
                emoteRain: {
                    enabled: false,
                    userLevel: 'all',  // all, follower, subscriber, vip, moderator
                    maxEmotes: 5,
                    emoteSize: 48,
                    fallDuration: 2000,
                    userCooldown: 5,
                    globalCooldown: 1,
                    rotate: true,
                    bounce: true
                }
            },
            advanced: {
                transitionDuration: 300,  // ms for image transitions
                messageQueueDelay: 2000,  // ms between queued messages
                bubbleStyle: 'default',   // default, neon-cyberpunk, vaporwave, cute, manga, fiery, ice
                enableSounds: true,
                soundVolume: 0.5,         // 0.0 to 1.0
                enableParticles: true,
                particleSettings: {
                    size: 40,             // px
                    count: 10,            // number of particles
                    spread: 150,          // px radius
                    speed: 5,             // 1-10 movement speed
                    lifetime: 2000,       // ms particles stay on screen
                    gravity: 0.5          // 0-2 gravity effect
                },
                enableClickInteraction: true,
                clickMessage: 'You clicked me! 😊',
                clickAnimation: 'bounce',
                clickParticles: 'hearts',
                clickSound: '',
                enableIdleAnimations: true,
                idleAnimationInterval: 30000,  // ms between idle animation checks
                idleAnimations: {
                    bounce: true,
                    wiggle: true,
                    float: true,
                    spin: false,
                    sway: true,
                    hop: true
                },
                debugMode: false
            },
            growth: {
                enabled: true,
                level: 1,
                experience: 0,
                experienceToNextLevel: 100,
                totalExperience: 0,
                evolutionStage: 0, // 0=baby, 1=teen, 2=adult, 3=legendary
                stages: [
                    { name: 'Baby', level: 1, image: 'Images/baby.png' },
                    { name: 'Teen', level: 5, image: 'Images/teen.png' },
                    { name: 'Adult', level: 10, image: 'Images/adult.png' },
                    { name: 'Legendary', level: 20, image: 'Images/legendary.png' }
                ],
                experienceGains: {
                    follow: 10,
                    subscribe: 50,
                    giftSub: 75,
                    raid: 100,
                    bits: 1, // per bit
                    channelPoints: 5,
                    command: 2,
                    click: 1
                },
                unlockedAnimations: ['bounce', 'wiggle'],
                unlockedParticles: ['hearts'],
                showLevelUp: true,
                levelUpBar: {
                    style: 'default',
                    position: 'top',
                    offsetY: 0,
                    duration: 3000,
                    textSize: 24
                },
                levelUpEffect: {
                    type: 'rainbow',
                    color: '#FFD700',
                    duration: 2000,
                    intensity: 1.2
                },
                evolutionEffect: {
                    type: 'burst',
                    color: '#FF6EC7',
                    secondaryColor: '#7C3AED',
                    duration: 3000,
                    intensity: 1.5
                }
            },
            analytics: {
                enabled: true,
                startDate: Date.now(),
                totalUptime: 0,
                sessionCount: 0,
                stats: {
                    eventsTriggered: {},
                    commandsUsed: {},
                    statesEntered: {},
                    totalClicks: 0,
                    totalParticles: 0,
                    totalMessages: 0,
                    uniqueViewers: new Set()
                },
                topEvents: [],
                topCommands: [],
                topStates: []
            },
            seasonal: {
                enabled: true,
                currentSeason: 'default',
                autoDetect: true,
                themes: {
                    halloween: {
                        startDate: '10-15',
                        endDate: '11-01',
                        defaultImage: 'Images/halloween.png',
                        particles: 'celebrate',
                        bubbleStyle: 'fiery'
                    },
                    christmas: {
                        startDate: '12-01',
                        endDate: '12-26',
                        defaultImage: 'Images/christmas.png',
                        particles: 'ice',
                        bubbleStyle: 'ice'
                    },
                    newYear: {
                        startDate: '12-27',
                        endDate: '01-02',
                        defaultImage: 'Images/newyear.png',
                        particles: 'celebrate',
                        bubbleStyle: 'neon-cyberpunk'
                    },
                    valentine: {
                        startDate: '02-10',
                        endDate: '02-15',
                        defaultImage: 'Images/valentine.png',
                        particles: 'hearts',
                        bubbleStyle: 'cute'
                    },
                    easter: {
                        startDate: '04-13',
                        endDate: '04-21',
                        defaultImage: 'Images/easter.png',
                        particles: 'celebrate',
                        bubbleStyle: 'cute'
                    },
                    summer: {
                        startDate: '06-20',
                        endDate: '09-22',
                        defaultImage: 'Images/summer.png',
                        particles: 'fire',
                        bubbleStyle: 'fiery'
                    }
                }
            },
            integrations: {
                streamElements: {
                    enabled: false,
                    accountId: '',
                    jwtToken: ''
                },
                streamlabs: {
                    enabled: false,
                    socketToken: ''
                },
                discord: {
                    enabled: false,
                    webhookUrl: '',
                    notifyOnEvents: ['raid', 'subscribe', 'giftSub']
                },
                spotify: {
                    enabled: false,
                    clientId: '',
                    reactToGenres: true,
                    genreAnimations: {
                        'rock': 'shake',
                        'electronic': 'pulse',
                        'classical': 'float',
                        'hip hop': 'bounce'
                    }
                },
                customWebhooks: []
            },
            
            // Viewer Interaction System
            viewerInteraction: {
                enabled: true,
                channelPoints: {
                    enabled: true,
                    customRedemptions: [
                        {
                            id: 'pet_happy',
                            name: 'Make Pet Happy',
                            cost: 100,
                            action: 'emotion',
                            parameters: { emotion: 'happy', duration: 5000 }
                        },
                        {
                            id: 'pet_dance',
                            name: 'Make Pet Dance',
                            cost: 200,
                            action: 'animation',
                            parameters: { animation: 'dance', duration: 3000 }
                        },
                        {
                            id: 'pet_zoom',
                            name: 'Zoom Pet',
                            cost: 150,
                            action: 'state',
                            parameters: { state: 'zoomed', duration: 5000 }
                        },
                        {
                            id: 'pet_spin',
                            name: 'Spin Pet',
                            cost: 100,
                            action: 'animation',
                            parameters: { animation: 'spin', duration: 2000 }
                        },
                        {
                            id: 'weather_effect',
                            name: 'Weather Effect',
                            cost: 300,
                            action: 'weather',
                            parameters: { type: 'random', duration: 10000 }
                        }
                    ]
                },
                chatCommands: {
                    enabled: true,
                    allowViewerCommands: true,
                    cooldown: 30000, // 30 seconds per user
                    globalCooldown: 5000 // 5 seconds between any commands
                },
                polls: {
                    enabled: true,
                    allowPetActions: true,
                    duration: 60000 // 60 second polls
                }
            },

            // First-Time Chatter Greetings
            greetings: {
                enabled: true,
                image: 'Images/wave.png', // Image to show on greeting
                sound: '',                // Optional greeting sound
                particles: true,          // Show particles on greeting
                duration: 5000,           // How long to display message (ms)
                messages: [
                    'Welcome {user}! Thanks for chatting! 💜',
                    'Hey {user}! Great to see you here! 👋',
                    'Hello {user}! Thanks for joining the chat! ✨',
                    '{user} is here! Welcome! 🎉',
                    'Hi {user}! Happy to have you chatting! 😊'
                ],
                customGreetings: {
                    // username: 'Custom message for specific user'
                    // Example: 'hana_cee': 'The queen herself has arrived! 👑'
                }
            }
        };
    }

    /**
     * Load configuration from localStorage
     */
    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            console.log('Loading config from localStorage, key:', this.storageKey);
            console.log('Window origin:', window.location.origin);
            console.log('Window href:', window.location.href);
            console.log('Stored value:', stored ? 'Found' : 'Not found');
            
            if (stored) {
                // Log first 200 characters of the stored string to see what's in there
                console.log('Stored config (first 200 chars):', stored.substring(0, 200));
            }
            
            if (!stored) {
                console.log('No stored config found, using defaults');
                console.log('Default image will be:', this.defaultConfig.pet.defaultImage);
                return this.defaultConfig;
            }

            const config = JSON.parse(stored);
            console.log('Loaded config from storage, default image:', config.pet?.defaultImage);
            console.log('Full pet config:', config.pet);
            
            // Merge with defaults to handle new fields
            const merged = this.mergeConfig(this.defaultConfig, config);
            console.log('After merge, default image:', merged.pet.defaultImage);
            console.log('After merge, full pet config:', merged.pet);
            return merged;
        } catch (error) {
            console.error('Error loading config:', error);
            return this.defaultConfig;
        }
    }

    /**
     * Save configuration to localStorage
     */
    save(config) {
        try {
            console.log('Saving config, default image:', config.pet.defaultImage);
            console.trace('Save called from:'); // This will show the call stack
            const validated = this.validate(config);
            console.log('After validation, default image:', validated.pet.defaultImage);
            localStorage.setItem(this.storageKey, JSON.stringify(validated));
            console.log('Config saved to localStorage with key:', this.storageKey);
            
            // Verify it was saved
            const verification = localStorage.getItem(this.storageKey);
            console.log('Verification - config exists in localStorage:', !!verification);
            
            return { success: true };
        } catch (error) {
            console.error('Error saving config:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Validate configuration object
     */
    validate(config) {
        // Basic validation - ensure required fields exist
        if (!config.pet || !config.events || !config.states) {
            throw new Error('Invalid configuration: missing required sections');
        }

        // Validate blink timing
        if (config.pet.blinkDuration >= config.pet.blinkInterval) {
            config.pet.blinkDuration = config.pet.blinkInterval / 2;
        }

        // Validate position
        config.pet.position.x = Math.max(0, Math.min(100, config.pet.position.x));
        config.pet.position.y = Math.max(0, Math.min(100, config.pet.position.y));

        // Validate opacity
        config.pet.opacity = Math.max(0, Math.min(1, config.pet.opacity));

        return config;
    }

    /**
     * Merge stored config with defaults (for version updates)
     */
    mergeConfig(defaults, stored) {
        const merged = JSON.parse(JSON.stringify(defaults));

        // Deep merge function
        const deepMerge = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    target[key] = target[key] || {};
                    deepMerge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
            return target;
        };

        return deepMerge(merged, stored);
    }

    /**
     * Reset to default configuration
     */
    reset() {
        localStorage.removeItem(this.storageKey);
        // Save the default config
        this.save(this.defaultConfig);
        return this.defaultConfig;
    }

    /**
     * Export configuration as JSON
     */
    export() {
        const config = this.load();
        return JSON.stringify(config, null, 2);
    }

    /**
     * Import configuration from JSON string
     */
    import(jsonString) {
        try {
            const config = JSON.parse(jsonString);
            return this.save(config);
        } catch (error) {
            return { success: false, error: 'Invalid JSON format' };
        }
    }

    /**
     * Update a specific section of config
     */
    updateSection(section, data) {
        const config = this.load();
        config[section] = data;
        return this.save(config);
    }

    /**
     * Update a specific event config
     */
    updateEvent(eventName, eventData) {
        const config = this.load();
        config.events[eventName] = eventData;
        return this.save(config);
    }

    /**
     * Update a specific state config
     */
    updateState(stateName, stateData) {
        const config = this.load();
        config.states[stateName] = stateData;
        return this.save(config);
    }

    /**
     * Add a custom state
     */
    addState(stateName, stateData) {
        const config = this.load();
        if (config.states[stateName]) {
            return { success: false, error: 'State already exists' };
        }
        config.states[stateName] = stateData;
        return this.save(config);
    }

    /**
     * Delete a custom state
     */
    deleteState(stateName) {
        const config = this.load();
        if (!config.states[stateName]) {
            return { success: false, error: 'State not found' };
        }
        delete config.states[stateName];
        return this.save(config);
    }
    
    /**
     * Add a custom command
     */
    addCommand(commandName, commandData) {
        const config = this.load();
        if (config.commands[commandName]) {
            return { success: false, error: 'Command already exists' };
        }
        config.commands[commandName] = commandData;
        return this.save(config);
    }
    
    /**
     * Update a command
     */
    updateCommand(commandName, commandData) {
        const config = this.load();
        config.commands[commandName] = commandData;
        return this.save(config);
    }
    
    /**
     * Delete a custom command
     */
    deleteCommand(commandName) {
        const config = this.load();
        if (!config.commands[commandName]) {
            return { success: false, error: 'Command not found' };
        }
        delete config.commands[commandName];
        return this.save(config);
    }
}

// Create global instance
const petStorage = new PetStorage();
