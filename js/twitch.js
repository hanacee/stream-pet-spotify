/**
 * Twitch Integration
 * Handles OAuth authentication, chat connection, and EventSub WebSocket
 * Supports both main account and optional bot account
 */

class TwitchIntegration {
    constructor(streamPet) {
        this.pet = streamPet;
        this.chatClient = null;
        this.botClient = null;
        this.eventSubSocket = null;
        this.connected = false;
        this.config = null;
        this.accessToken = null;
        this.botAccessToken = null;
        this.userId = null;
        this.sessionId = null;
        
        // Reconnection settings
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 5000; // Start with 5 seconds
        this.reconnectTimer = null;
        
        // Error tracking
        this.lastError = null;
        this.errorCount = 0;
        
        // Emote rain cooldowns
        this.emoteRainUserCooldowns = new Map();
        this.emoteRainLastTrigger = 0;
        
        // First-time chatter tracking (resets each stream session)
        this.greetedChatters = new Set();
        this.greetingStats = {
            sent: 0,
            uniqueChatters: 0
        };
    }

    /**
     * Initialize Twitch connection
     */
    async init() {
        try {
            this.config = petStorage.load().twitch;
            
            if (!this.config.enabled) {
                this.pet.log('Twitch integration disabled');
                return;
            }
            
            if (!this.config.channel) {
                this.pet.log('No Twitch channel configured', 'warn');
                return;
            }
            
            // Check for existing tokens
            this.loadTokens();
            
            // If using OAuth mode and no token, don't auto-connect
            if (!this.config.useAnonymous && !this.accessToken) {
                this.pet.log('OAuth required. Please authenticate via config panel.', 'info');
                return;
            }
            
            // Check if tmi.js is loaded
            if (typeof tmi === 'undefined') {
                this.pet.log('tmi.js not loaded. Cannot connect to Twitch chat.', 'error');
                return;
            }
            
            await this.connect();
        } catch (error) {
            this.handleError('init', error);
        }
    }

    /**
     * Load saved access tokens from localStorage
     */
    loadTokens() {
        this.accessToken = localStorage.getItem('twitch_access_token');
        this.botAccessToken = localStorage.getItem('twitch_bot_access_token');
        this.userId = localStorage.getItem('twitch_user_id');
    }

    /**
     * Save access tokens to localStorage
     */
    saveTokens() {
        if (this.accessToken) {
            localStorage.setItem('twitch_access_token', this.accessToken);
        }
        if (this.botAccessToken) {
            localStorage.setItem('twitch_bot_access_token', this.botAccessToken);
        }
        if (this.userId) {
            localStorage.setItem('twitch_user_id', this.userId);
        }
    }

    /**
     * Clear saved tokens
     */
    clearTokens() {
        localStorage.removeItem('twitch_access_token');
        localStorage.removeItem('twitch_bot_access_token');
        localStorage.removeItem('twitch_user_id');
        this.accessToken = null;
        this.botAccessToken = null;
        this.userId = null;
    }

    /**
     * Start OAuth flow for main account
     */
    async authenticateMainAccount() {
        if (!this.config.clientId) {
            this.pet.log('No Client ID configured', 'error');
            return;
        }

        const redirectUri = this.config.redirectUri || window.location.origin + '/config.html';
        const scopes = [
            'chat:read',
            'chat:edit',
            'channel:read:subscriptions',
            'bits:read',
            'channel:read:redemptions',
            'moderator:read:followers'
        ].join(' ');

        const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
            `client_id=${this.config.clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=token&` +
            `scope=${encodeURIComponent(scopes)}`;

        window.open(authUrl, 'TwitchAuth', 'width=600,height=800');
    }

    /**
     * Start OAuth flow for bot account
     */
    async authenticateBotAccount() {
        if (!this.config.clientId) {
            this.pet.log('No Client ID configured', 'error');
            return;
        }

        const redirectUri = this.config.redirectUri || window.location.origin + '/config.html';
        const scopes = [
            'chat:read',
            'chat:edit'
        ].join(' ');

        const authUrl = `https://id.twitch.tv/oauth2/authorize?` +
            `client_id=${this.config.clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=token&` +
            `scope=${encodeURIComponent(scopes)}&` +
            `state=bot_account`;

        window.open(authUrl, 'TwitchBotAuth', 'width=600,height=800');
    }

    /**
     * Handle OAuth redirect callback
     */
    handleOAuthCallback() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        const state = params.get('state');

        if (token) {
            if (state === 'bot_account') {
                this.botAccessToken = token;
                this.pet.log('Bot account authenticated!', 'info');
            } else {
                this.accessToken = token;
                this.pet.log('Main account authenticated!', 'info');
                this.getUserId();
            }
            
            this.saveTokens();
            
            // Clear hash from URL
            window.location.hash = '';
            
            return true;
        }
        
        return false;
    }

    /**
     * Get user ID from Twitch API
     */
    async getUserId() {
        if (!this.accessToken) return;

        try {
            const response = await fetch('https://api.twitch.tv/helix/users', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Client-Id': this.config.clientId
                }
            });

            const data = await response.json();
            if (data.data && data.data.length > 0) {
                this.userId = data.data[0].id;
                this.saveTokens();
                this.pet.log(`Authenticated as ${data.data[0].display_name} (${this.userId})`, 'info');
            }
        } catch (error) {
            this.pet.log(`Error getting user ID: ${error.message}`, 'error');
        }
    }

    /**
     * Connect to Twitch chat and EventSub
     */
    async connect() {
        try {
            // Connect to chat
            await this.connectToChat();
            
            // Connect bot account if configured
            if (this.config.useBotAccount && this.botAccessToken) {
                await this.connectBotToChat();
            }
            
            // Connect to EventSub if we have OAuth
            if (this.accessToken && this.userId) {
                await this.connectEventSub();
            }
            
            this.connected = true;
            localStorage.setItem('twitch_connected', 'true');
            localStorage.setItem('twitch_channel', this.config.channel);
            this.pet.log(`Connected to Twitch channel: ${this.config.channel}`, 'info');
            
        } catch (error) {
            this.pet.log(`Error connecting to Twitch: ${error.message}`, 'error');
        }
    }

    /**
     * Connect to Twitch chat with main account or anonymous
     */
    async connectToChat() {
        try {
            this.pet.log(`Connecting to Twitch chat (channel: ${this.config.channel}, anonymous: ${this.config.useAnonymous})`, 'info');
            
            const opts = {
                identity: this.config.useAnonymous ? undefined : {
                    username: this.config.channel,
                    password: `oauth:${this.accessToken}`
                },
                channels: [this.config.channel]
            };
            
            this.chatClient = new tmi.Client(opts);
            
            // Setup event handlers
            this.setupChatHandlers(this.chatClient);
            
            // Connect
            await this.chatClient.connect();
            this.pet.log('Successfully connected to Twitch chat!', 'info');
        } catch (error) {
            this.handleError('connectToChat', error);
            throw error;
        }
    }

    /**
     * Connect bot account to chat
     */
    async connectBotToChat() {
        try {
            if (!this.config.botUsername || !this.botAccessToken) {
                this.pet.log('Bot account not configured', 'warn');
                return;
            }

            const opts = {
                identity: {
                    username: this.config.botUsername,
                    password: `oauth:${this.botAccessToken}`
                },
                channels: [this.config.channel]
            };
            
            this.botClient = new tmi.Client(opts);
            await this.botClient.connect();
            
            this.pet.log(`Bot account ${this.config.botUsername} connected`, 'info');
        } catch (error) {
            this.handleError('connectBotToChat', error);
        }
    }

    /**
     * Setup chat event handlers
     */
    setupChatHandlers(client) {
        // Chat message (for commands)
        client.on('message', (channel, tags, message, self) => {
            if (self) return;
            this.handleChatMessage(tags, message);
        });
        
        // Raid (only available via chat, not perfect but works)
        client.on('raided', (channel, username, viewers) => {
            this.pet.triggerEvent('raid', {
                raider: username,
                count: viewers,
                username: username
            });
        });
        
        // Subscription (basic - EventSub is better)
        client.on('subscription', (channel, username, method, message, userstate) => {
            this.pet.triggerEvent('subscribe', {
                username: username
            });
        });
        
        // Gift sub
        client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
            this.pet.triggerEvent('giftSub', {
                gifter: username,
                recipient: recipient,
                count: 1
            });
        });
        
        // Bits/Cheer
        client.on('cheer', (channel, userstate, message) => {
            const bits = parseInt(userstate.bits);
            const event = this.pet.config.events.bits;
            
            if (bits >= (event.minAmount || 0)) {
                this.pet.triggerEvent('bits', {
                    username: userstate['display-name'],
                    amount: bits
                });
            }
        });
    }

    /**
     * Connect to EventSub WebSocket
     */
    async connectEventSub() {
        this.pet.log('Connecting to EventSub WebSocket...', 'info');
        
        this.eventSubSocket = new WebSocket('wss://eventsub.wss.twitch.tv/ws');
        
        this.eventSubSocket.onopen = () => {
            this.pet.log('EventSub WebSocket connected', 'info');
            localStorage.setItem('eventsub_connected', 'true');
        };
        
        this.eventSubSocket.onmessage = (event) => {
            this.handleEventSubMessage(JSON.parse(event.data));
        };
        
        this.eventSubSocket.onerror = (error) => {
            this.pet.log(`EventSub error: ${error}`, 'error');
            localStorage.setItem('eventsub_connected', 'false');
        };
        
        this.eventSubSocket.onclose = () => {
            this.pet.log('EventSub disconnected', 'warn');
            localStorage.setItem('eventsub_connected', 'false');
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                if (this.connected) {
                    this.connectEventSub();
                }
            }, 5000);
        };
    }

    /**
     * Handle EventSub WebSocket messages
     */
    async handleEventSubMessage(message) {
        const { metadata, payload } = message;
        
        switch (metadata.message_type) {
            case 'session_welcome':
                this.sessionId = payload.session.id;
                this.pet.log(`EventSub session: ${this.sessionId}`, 'info');
                // Subscribe to events
                await this.subscribeToEvents();
                break;
                
            case 'session_keepalive':
                // Keep connection alive
                break;
                
            case 'notification':
                this.handleEventSubNotification(payload);
                break;
                
            case 'session_reconnect':
                // Reconnect to new URL
                this.pet.log('EventSub requesting reconnect', 'info');
                if (payload.session.reconnect_url) {
                    this.eventSubSocket.close();
                    this.eventSubSocket = new WebSocket(payload.session.reconnect_url);
                }
                break;
                
            case 'revocation':
                this.pet.log('EventSub subscription revoked', 'warn');
                break;
        }
    }

    /**
     * Subscribe to Twitch events via EventSub
     */
    async subscribeToEvents() {
        if (!this.sessionId || !this.userId || !this.accessToken) {
            this.pet.log('Cannot subscribe to events: missing session or auth', 'warn');
            return;
        }

        const subscriptions = [
            {
                type: 'channel.follow',
                version: '2',
                condition: {
                    broadcaster_user_id: this.userId,
                    moderator_user_id: this.userId
                }
            },
            {
                type: 'channel.subscribe',
                version: '1',
                condition: {
                    broadcaster_user_id: this.userId
                }
            },
            {
                type: 'channel.subscription.gift',
                version: '1',
                condition: {
                    broadcaster_user_id: this.userId
                }
            },
            {
                type: 'channel.cheer',
                version: '1',
                condition: {
                    broadcaster_user_id: this.userId
                }
            },
            {
                type: 'channel.raid',
                version: '1',
                condition: {
                    to_broadcaster_user_id: this.userId
                }
            },
            {
                type: 'channel.channel_points_custom_reward_redemption.add',
                version: '1',
                condition: {
                    broadcaster_user_id: this.userId
                }
            }
        ];

        for (const subscription of subscriptions) {
            await this.createEventSubSubscription(subscription);
        }
    }

    /**
     * Create an EventSub subscription
     */
    async createEventSubSubscription(subscription) {
        try {
            const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Client-Id': this.config.clientId,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: subscription.type,
                    version: subscription.version,
                    condition: subscription.condition,
                    transport: {
                        method: 'websocket',
                        session_id: this.sessionId
                    }
                })
            });

            if (response.ok) {
                this.pet.log(`Subscribed to ${subscription.type}`, 'info');
            } else {
                const error = await response.json();
                this.pet.log(`Failed to subscribe to ${subscription.type}: ${error.message}`, 'error');
            }
        } catch (error) {
            this.pet.log(`Error subscribing to ${subscription.type}: ${error.message}`, 'error');
        }
    }

    /**
     * Handle EventSub notifications
     */
    handleEventSubNotification(payload) {
        const { subscription, event } = payload;
        
        switch (subscription.type) {
            case 'channel.follow':
                this.pet.triggerEvent('follow', {
                    username: event.user_name
                });
                break;
                
            case 'channel.subscribe':
                this.pet.triggerEvent('subscribe', {
                    username: event.user_name
                });
                break;
                
            case 'channel.subscription.gift':
                this.pet.triggerEvent('giftSub', {
                    gifter: event.user_name,
                    count: event.total || 1
                });
                break;
                
            case 'channel.cheer':
                this.pet.triggerEvent('bits', {
                    username: event.user_name,
                    amount: event.bits
                });
                break;
                
            case 'channel.raid':
                this.pet.triggerEvent('raid', {
                    raider: event.from_broadcaster_user_name,
                    count: event.viewers,
                    username: event.from_broadcaster_user_name
                });
                break;
                
            case 'channel.channel_points_custom_reward_redemption.add':
                this.pet.triggerEvent('channelPoints', {
                    username: event.user_name,
                    reward: event.reward.title
                });
                
                // Handle viewer interaction
                if (this.pet.viewerInteraction) {
                    this.pet.viewerInteraction.handleChannelPointRedemption(
                        event.user_name,
                        event.reward.title,
                        event.reward.id
                    );
                }
                break;
        }
    }

    /**
     * Handle chat messages for commands
     */
    handleChatMessage(tags, message) {
        const msg = message.trim().toLowerCase();
        const username = tags['display-name'];
        const userId = tags['user-id'];
        
        console.log('Chat message received:', { username, message: msg });
        
        // Handle first-time chatter greetings
        this.handleFirstTimeChatter(username, userId, tags);
        
        // Handle emote rain
        this.handleEmoteRain(tags, message);
        
        // Check for custom chat commands
        if (this.pet.config.commands) {
            Object.keys(this.pet.config.commands).forEach(command => {
                if (msg === command.toLowerCase() || msg.startsWith(command.toLowerCase() + ' ')) {
                    console.log('Matched command:', command);
                    this.pet.handleChatCommand(command, username, tags);
                }
            });
        }
        
        // Check for state recovery commands
        Object.entries(this.pet.config.states).forEach(([stateName, state]) => {
            if (state.recoveryCommand && msg === state.recoveryCommand.toLowerCase()) {
                console.log('Matched recovery command for state:', stateName, 'command:', state.recoveryCommand);
                // Check permissions
                if (this.checkPermissions(tags, state.requiredRole)) {
                    console.log('Permission granted, calling handleRecoveryCommand');
                    this.pet.handleRecoveryCommand(stateName, username);
                } else {
                    console.log('Permission denied for user:', username, 'required role:', state.requiredRole);
                }
            }
        });
    }

    /**
     * Send chat message (using bot account if available)
     */
    async sendChatMessage(message) {
        const client = this.botClient || this.chatClient;
        
        if (!client) {
            this.pet.log('No chat client available to send message', 'warn');
            return;
        }

        try {
            await client.say(this.config.channel, message);
            this.pet.log(`Sent message: ${message}`, 'info');
        } catch (error) {
            this.pet.log(`Error sending message: ${error.message}`, 'error');
        }
    }

    /**
     * Handle first-time chatter greetings
     */
    handleFirstTimeChatter(username, userId, tags) {
        const greetingsConfig = this.pet.config.greetings;
        
        // Check if greetings are enabled
        if (!greetingsConfig || !greetingsConfig.enabled) return;
        
        // Check if we've already greeted this user this session
        if (this.greetedChatters.has(userId)) return;
        
        // Mark this user as greeted
        this.greetedChatters.add(userId);
        this.greetingStats.uniqueChatters++;
        
        // Get the greeting message
        let greetingMessage;
        const usernameLower = username.toLowerCase();
        
        // Check for custom user greeting first
        if (greetingsConfig.customGreetings && greetingsConfig.customGreetings[usernameLower]) {
            greetingMessage = greetingsConfig.customGreetings[usernameLower];
        } else if (greetingsConfig.messages && greetingsConfig.messages.length > 0) {
            // Pick a random greeting from the array
            const randomIndex = Math.floor(Math.random() * greetingsConfig.messages.length);
            greetingMessage = greetingsConfig.messages[randomIndex];
        } else {
            // Fallback greeting
            greetingMessage = 'Welcome {user}! 💜';
        }
        
        // Replace {user} placeholder
        greetingMessage = greetingMessage.replace(/\{user\}/g, username);
        
        // Show the greeting
        this.pet.showMessage(greetingMessage, greetingsConfig.duration || 5000);
        
        // Show greeting image (like events)
        if (greetingsConfig.image) {
            this.pet.showImage(greetingsConfig.image, greetingsConfig.duration || 5000);
        }
        
        // Play sound if configured
        if (greetingsConfig.sound) {
            this.pet.playSound(greetingsConfig.sound);
        }
        
        // Show particles if enabled
        if (greetingsConfig.particles) {
            this.pet.createParticles();
        }
        
        // Update stats
        this.greetingStats.sent++;
        
        console.log(`Greeted first-time chatter: ${username}`);
    }

    /**
     * Reset greeting session data
     */
    resetGreetingSession() {
        this.greetedChatters.clear();
        this.greetingStats = {
            sent: 0,
            uniqueChatters: 0
        };
        console.log('Greeting session data reset');
    }

    /**
     * Get greeting statistics
     */
    getGreetingStats() {
        return {
            ...this.greetingStats,
            greetedUsers: Array.from(this.greetedChatters)
        };
    }

    /**
     * Handle emote rain from chat messages
     */
    handleEmoteRain(tags, message) {
        const emoteRainConfig = this.pet.config.twitch?.emoteRain;
        if (!emoteRainConfig || !emoteRainConfig.enabled) return;
        
        const username = tags['display-name'] || tags.username;
        const userId = tags['user-id'];
        const now = Date.now();
        
        // Check global cooldown
        if (now - this.emoteRainLastTrigger < emoteRainConfig.globalCooldown * 1000) {
            return;
        }
        
        // Check user cooldown
        const userLastTrigger = this.emoteRainUserCooldowns.get(userId) || 0;
        if (now - userLastTrigger < emoteRainConfig.userCooldown * 1000) {
            return;
        }
        
        // Check user level permissions
        if (!this.checkEmoteRainPermission(tags, emoteRainConfig.userLevel)) {
            return;
        }
        
        // Extract emotes from the message
        const emotes = this.extractEmotes(tags, message);
        
        if (emotes.length > 0) {
            // Update cooldowns
            this.emoteRainLastTrigger = now;
            this.emoteRainUserCooldowns.set(userId, now);
            
            // Trigger emote rain
            this.triggerEmoteRain(emotes.slice(0, emoteRainConfig.maxEmotes));
        }
    }

    /**
     * Check if user has permission for emote rain
     */
    checkEmoteRainPermission(tags, requiredLevel) {
        if (requiredLevel === 'all') return true;
        if (tags.badges?.broadcaster) return true; // Broadcaster always allowed
        if (requiredLevel === 'moderator' && tags.mod) return true;
        if (requiredLevel === 'vip' && tags.badges?.vip) return true;
        if (requiredLevel === 'subscriber' && tags.subscriber) return true;
        if (requiredLevel === 'follower') return true; // Can't check follower status from chat
        
        return false;
    }

    /**
     * Extract emote URLs from chat message
     */
    extractEmotes(tags, message) {
        const emoteUrls = [];
        
        // Parse Twitch emotes from tags
        if (tags.emotes) {
            const emoteIds = Object.keys(tags.emotes);
            emoteIds.forEach(emoteId => {
                // Use Twitch's CDN to get emote image
                const emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`;
                emoteUrls.push(emoteUrl);
            });
        }
        
        return emoteUrls;
    }

    /**
     * Trigger emote rain animation
     */
    triggerEmoteRain(emoteUrls) {
        const emoteRainConfig = this.pet.config.twitch.emoteRain;
        
        emoteUrls.forEach((emoteUrl, index) => {
            setTimeout(() => {
                this.createFallingEmote(emoteUrl, emoteRainConfig);
            }, index * 100); // Stagger the emotes slightly
        });
    }

    /**
     * Create a falling emote element
     */
    createFallingEmote(emoteUrl, config) {
        const emote = document.createElement('img');
        emote.src = emoteUrl;
        emote.className = 'falling-emote';
        
        // Random horizontal position
        const startX = Math.random() * window.innerWidth;
        const endY = window.innerHeight + 100;
        
        emote.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: -100px;
            width: ${config.emoteSize}px;
            height: ${config.emoteSize}px;
            z-index: 9999;
            pointer-events: none;
            ${config.rotate ? 'animation: emoteRotate ' + (config.fallDuration * 0.001) + 's linear infinite;' : ''}
        `;
        
        document.body.appendChild(emote);
        
        // Animate falling
        const animation = emote.animate([
            { transform: 'translateY(0) translateX(0)', opacity: 1 },
            { transform: `translateY(${endY}px) translateX(${(Math.random() - 0.5) * 100}px)`, opacity: config.bounce ? 1 : 0.5 }
        ], {
            duration: config.fallDuration,
            easing: 'ease-in',
            fill: 'forwards'
        });
        
        animation.onfinish = () => {
            if (config.bounce) {
                // Bounce effect
                emote.animate([
                    { transform: `translateY(${endY}px)` },
                    { transform: `translateY(${endY - 50}px)` },
                    { transform: `translateY(${endY}px)`, opacity: 0 }
                ], {
                    duration: 500,
                    easing: 'ease-out'
                }).onfinish = () => emote.remove();
            } else {
                emote.remove();
            }
        };
    }

    /**
     * Check if user has required permissions
     */
    checkPermissions(tags, requiredRole) {
        if (requiredRole === 'everyone') return true;
        if (requiredRole === 'subscriber' && tags.subscriber) return true;
        if (requiredRole === 'vip' && tags.badges?.vip) return true;
        if (requiredRole === 'moderator' && tags.mod) return true;
        if (tags.badges?.broadcaster) return true; // Broadcaster always has permission
        
        return false;
    }

    /**
     * Disconnect from Twitch
     */
    disconnect() {
        // Clear reconnect timer
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        
        if (this.chatClient) {
            this.chatClient.disconnect();
        }
        if (this.botClient) {
            this.botClient.disconnect();
        }
        if (this.eventSubSocket) {
            this.eventSubSocket.close();
        }
        
        this.connected = false;
        this.pet.log('Disconnected from Twitch', 'info');
    }

    /**
     * Handle errors with reconnection logic
     */
    handleError(context, error) {
        this.errorCount++;
        this.lastError = {
            context,
            message: error.message,
            timestamp: Date.now()
        };
        
        console.error(`[Twitch ${context}]`, error);
        this.pet.log(`Twitch error in ${context}: ${error.message}`, 'error');
        
        // Attempt reconnection if not too many errors
        if (this.errorCount < 3 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectTimer) return; // Already scheduled
        
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
        
        this.pet.log(`Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay/1000}s`, 'info');
        
        this.reconnectTimer = setTimeout(async () => {
            this.reconnectTimer = null;
            try {
                await this.connect();
                this.reconnectAttempts = 0; // Reset on successful connection
                this.errorCount = 0;
            } catch (error) {
                this.handleError('reconnect', error);
            }
        }, delay);
    }

    /**
     * Simulate an event (for testing)
     */
    simulateEvent(eventType, eventData) {
        this.pet.log(`Simulating ${eventType} event`, 'info');
        this.pet.triggerEvent(eventType, eventData);
    }
}

// Initialize when pet is ready
let twitchIntegration;

window.addEventListener('DOMContentLoaded', () => {
    // Handle OAuth callback if present
    if (window.location.hash.includes('access_token')) {
        // Store in a way the config page can access it
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const token = params.get('access_token');
        const state = params.get('state');
        
        if (token) {
            if (state === 'bot_account') {
                localStorage.setItem('twitch_bot_access_token', token);
                alert('Bot account authenticated successfully!');
            } else {
                localStorage.setItem('twitch_access_token', token);
                alert('Main account authenticated successfully!');
            }
            
            // Clear hash and reload
            window.location.hash = '';
            window.location.reload();
        }
    }
    
    // Wait for streamPet to be initialized
    const initTwitch = () => {
        if (window.streamPet) {
            twitchIntegration = new TwitchIntegration(window.streamPet);
            twitchIntegration.init();
        } else {
            setTimeout(initTwitch, 100);
        }
    };
    
    setTimeout(initTwitch, 500);
});
