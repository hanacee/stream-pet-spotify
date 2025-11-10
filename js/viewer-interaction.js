/**
 * Viewer Interaction System
 * Handles channel points, interactive chat commands, and viewer-driven pet actions
 */

class ViewerInteraction {
    constructor(streamPet) {
        this.pet = streamPet;
        this.config = null;
        
        // Cooldown tracking
        this.userCooldowns = new Map(); // username -> { command -> timestamp }
        this.globalCooldown = 0;
        
        // Active polls
        this.activePolls = new Map(); // pollId -> { question, options, votes, endTime }
        
        // Channel point redemption tracking
        this.redemptionHistory = [];
        this.redemptionStats = {};
    }

    /**
     * Initialize viewer interaction system
     */
    init() {
        this.config = this.pet.config.viewerInteraction;
        
        if (!this.config || !this.config.enabled) {
            this.pet.log('Viewer interaction disabled');
            return;
        }

        this.pet.log('Viewer interaction system initialized');
    }

    /**
     * Handle channel point redemption
     */
    handleChannelPointRedemption(username, rewardTitle, rewardId) {
        if (!this.config.channelPoints || !this.config.channelPoints.enabled) {
            return;
        }

        // Find matching redemption
        const redemption = this.config.channelPoints.customRedemptions.find(r => 
            r.name.toLowerCase() === rewardTitle.toLowerCase() || r.id === rewardId
        );

        if (!redemption) {
            this.pet.log(`Unknown channel point redemption: ${rewardTitle}`, 'warn');
            return;
        }

        this.pet.log(`Channel point redeemed: ${rewardTitle} by ${username}`);

        // Track redemption
        this.trackRedemption(username, redemption);

        // Execute action
        this.executeRedemptionAction(redemption, username);
    }

    /**
     * Execute action from channel point redemption
     */
    executeRedemptionAction(redemption, username) {
        const { action, parameters } = redemption;

        try {
            switch (action) {
                case 'emotion':
                    this.applyEmotion(parameters.emotion, parameters.duration, username);
                    break;

                case 'animation':
                    this.playAnimation(parameters.animation, parameters.duration, username);
                    break;

                case 'state':
                    this.triggerState(parameters.state, parameters.duration, username);
                    break;

                case 'weather':
                    this.triggerWeather(parameters.type, parameters.duration, username);
                    break;

                case 'physics':
                    this.enablePhysics(parameters.duration, username);
                    break;

                case 'particle':
                    this.spawnParticles(parameters.type, parameters.count, username);
                    break;

                case 'sound':
                    this.playSound(parameters.sound, username);
                    break;

                case 'custom':
                    this.executeCustomAction(parameters, username);
                    break;

                default:
                    this.pet.log(`Unknown redemption action: ${action}`, 'warn');
            }

            // Show thank you message
            this.showRedemptionMessage(username, redemption.name);

        } catch (error) {
            this.pet.log(`Error executing redemption: ${error.message}`, 'error');
        }
    }

    /**
     * Apply emotion from redemption
     */
    applyEmotion(emotion, duration, username) {
        const emotionMap = {
            'happy': '😊',
            'excited': '😄',
            'love': '😍',
            'sad': '😢',
            'angry': '😠',
            'surprised': '😮',
            'sleepy': '😴',
            'cool': '😎'
        };

        const emoji = emotionMap[emotion] || '😊';
        
        // Create emotion overlay
        const emotionDiv = document.createElement('div');
        emotionDiv.className = 'viewer-emotion';
        emotionDiv.textContent = emoji;
        emotionDiv.style.cssText = `
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 40px;
            animation: emotionBounce 0.5s ease-out;
            z-index: 1000;
        `;

        this.pet.petContainer.appendChild(emotionDiv);

        // Remove after duration
        setTimeout(() => {
            emotionDiv.remove();
        }, duration);
    }

    /**
     * Play animation from redemption
     */
    playAnimation(animation, duration, username) {
        const animationMap = {
            'dance': 'spin',
            'spin': 'rotate',
            'bounce': 'bounce',
            'shake': 'shake',
            'float': 'float',
            'wave': 'wave'
        };

        const cssAnimation = animationMap[animation] || animation;
        const img = this.pet.petImage;
        const originalAnimation = img.style.animation;

        // Apply animation
        img.style.animation = `${cssAnimation} ${duration}ms ease-in-out`;

        // Restore after duration
        setTimeout(() => {
            img.style.animation = originalAnimation;
        }, duration);
    }

    /**
     * Trigger state from redemption
     */
    triggerState(stateName, duration, username) {
        if (!this.pet.config.states[stateName]) {
            this.pet.log(`State not found: ${stateName}`, 'warn');
            return;
        }

        // Enter state
        this.pet.enterState(stateName);

        // Auto-recover after duration
        if (duration) {
            setTimeout(() => {
                this.pet.recoverFromState();
            }, duration);
        }
    }

    /**
     * Trigger weather effect from redemption
     */
    triggerWeather(type, duration, username) {
        if (!this.pet.advancedAnimations) {
            this.pet.log('Advanced animations not available', 'warn');
            return;
        }

        // Random weather if specified
        if (type === 'random') {
            const types = ['rain', 'snow', 'leaves', 'sakura'];
            type = types[Math.floor(Math.random() * types.length)];
        }

        // Start weather effect
        this.pet.advancedAnimations.startWeather(type);

        // Stop after duration
        if (duration) {
            setTimeout(() => {
                this.pet.advancedAnimations.stopWeather();
            }, duration);
        }
    }

    /**
     * Enable physics temporarily
     */
    enablePhysics(duration, username) {
        if (!this.pet.advancedAnimations) {
            this.pet.log('Advanced animations not available', 'warn');
            return;
        }

        this.pet.advancedAnimations.enablePhysics();

        if (duration) {
            setTimeout(() => {
                this.pet.advancedAnimations.disablePhysics();
            }, duration);
        }
    }

    /**
     * Spawn particles
     */
    spawnParticles(type, count, username) {
        if (!this.pet.particleSystem) {
            this.pet.log('Particle system not available', 'warn');
            return;
        }

        const rect = this.pet.petContainer.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        for (let i = 0; i < (count || 20); i++) {
            this.pet.particleSystem.createParticle(centerX, centerY, type);
        }
    }

    /**
     * Play sound
     */
    playSound(soundName, username) {
        if (!this.pet.soundManager) {
            this.pet.log('Sound manager not available', 'warn');
            return;
        }

        this.pet.soundManager.playSound(soundName);
    }

    /**
     * Execute custom action
     */
    executeCustomAction(parameters, username) {
        // Allow custom JavaScript execution (be careful!)
        if (parameters.script) {
            try {
                const fn = new Function('pet', 'username', 'params', parameters.script);
                fn(this.pet, username, parameters);
            } catch (error) {
                this.pet.log(`Custom action error: ${error.message}`, 'error');
            }
        }
    }

    /**
     * Show redemption thank you message
     */
    showRedemptionMessage(username, redemptionName) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'viewer-message';
        messageDiv.textContent = `${username} redeemed ${redemptionName}!`;
        messageDiv.style.cssText = `
            position: absolute;
            top: -60px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(145, 70, 255, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-family: 'Segoe UI', Tahoma, sans-serif;
            font-size: 14px;
            font-weight: bold;
            white-space: nowrap;
            animation: slideDown 0.3s ease-out, fadeOut 0.5s ease-in 2.5s;
            z-index: 1001;
        `;

        this.pet.petContainer.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    /**
     * Handle interactive chat command
     */
    handleInteractiveCommand(command, username, args) {
        if (!this.config.chatCommands || !this.config.chatCommands.enabled) {
            return false;
        }

        // Check if viewer commands are allowed
        if (!this.config.chatCommands.allowViewerCommands) {
            return false;
        }

        // Check global cooldown
        if (Date.now() < this.globalCooldown) {
            return false;
        }

        // Check user cooldown
        if (this.isOnCooldown(username, command)) {
            return false;
        }

        // Update cooldowns
        this.globalCooldown = Date.now() + this.config.chatCommands.globalCooldown;
        this.setUserCooldown(username, command);

        // Execute command
        return this.executeViewerCommand(command, username, args);
    }

    /**
     * Execute viewer command
     */
    executeViewerCommand(command, username, args) {
        const viewerCommands = {
            'pet': () => this.petThePet(username),
            'wave': () => this.waveAtPet(username),
            'feed': () => this.feedPet(username),
            'play': () => this.playWithPet(username),
            'hug': () => this.hugPet(username)
        };

        const action = viewerCommands[command.toLowerCase()];
        if (action) {
            action();
            return true;
        }

        return false;
    }

    /**
     * Pet the pet
     */
    petThePet(username) {
        this.applyEmotion('happy', 3000, username);
        this.spawnParticles('hearts', 10, username);
        this.pet.log(`${username} pet the pet!`);
    }

    /**
     * Wave at pet
     */
    waveAtPet(username) {
        this.playAnimation('wave', 2000, username);
        this.pet.log(`${username} waved at the pet!`);
    }

    /**
     * Feed pet
     */
    feedPet(username) {
        this.applyEmotion('love', 3000, username);
        this.pet.log(`${username} fed the pet!`);
    }

    /**
     * Play with pet
     */
    playWithPet(username) {
        this.playAnimation('bounce', 3000, username);
        this.spawnParticles('stars', 15, username);
        this.pet.log(`${username} played with the pet!`);
    }

    /**
     * Hug pet
     */
    hugPet(username) {
        this.applyEmotion('love', 4000, username);
        this.pet.log(`${username} hugged the pet!`);
    }

    /**
     * Check if user is on cooldown
     */
    isOnCooldown(username, command) {
        const userCooldowns = this.userCooldowns.get(username);
        if (!userCooldowns) return false;

        const lastUse = userCooldowns.get(command);
        if (!lastUse) return false;

        const timeSinceLastUse = Date.now() - lastUse;
        return timeSinceLastUse < this.config.chatCommands.cooldown;
    }

    /**
     * Set user cooldown
     */
    setUserCooldown(username, command) {
        if (!this.userCooldowns.has(username)) {
            this.userCooldowns.set(username, new Map());
        }
        this.userCooldowns.get(username).set(command, Date.now());
    }

    /**
     * Track redemption for analytics
     */
    trackRedemption(username, redemption) {
        this.redemptionHistory.push({
            username,
            redemption: redemption.name,
            timestamp: Date.now()
        });

        // Keep only last 100 redemptions
        if (this.redemptionHistory.length > 100) {
            this.redemptionHistory.shift();
        }

        // Update stats
        if (!this.redemptionStats[redemption.name]) {
            this.redemptionStats[redemption.name] = 0;
        }
        this.redemptionStats[redemption.name]++;
    }

    /**
     * Get redemption statistics
     */
    getRedemptionStats() {
        return {
            total: this.redemptionHistory.length,
            byType: this.redemptionStats,
            recent: this.redemptionHistory.slice(-10)
        };
    }

    /**
     * Create poll
     */
    createPoll(question, options, duration) {
        if (!this.config.polls || !this.config.polls.enabled) {
            return null;
        }

        const pollId = `poll_${Date.now()}`;
        const poll = {
            id: pollId,
            question,
            options: options.map(opt => ({ text: opt, votes: 0, voters: [] })),
            startTime: Date.now(),
            endTime: Date.now() + (duration || this.config.polls.duration)
        };

        this.activePolls.set(pollId, poll);

        // Auto-end poll
        setTimeout(() => {
            this.endPoll(pollId);
        }, duration || this.config.polls.duration);

        return pollId;
    }

    /**
     * Vote in poll
     */
    vote(pollId, username, optionIndex) {
        const poll = this.activePolls.get(pollId);
        if (!poll) return false;

        // Check if poll has ended
        if (Date.now() > poll.endTime) {
            return false;
        }

        // Check if user already voted
        const alreadyVoted = poll.options.some(opt => opt.voters.includes(username));
        if (alreadyVoted) {
            return false;
        }

        // Add vote
        if (optionIndex >= 0 && optionIndex < poll.options.length) {
            poll.options[optionIndex].votes++;
            poll.options[optionIndex].voters.push(username);
            return true;
        }

        return false;
    }

    /**
     * End poll and get results
     */
    endPoll(pollId) {
        const poll = this.activePolls.get(pollId);
        if (!poll) return null;

        // Find winner
        let winner = poll.options[0];
        for (const option of poll.options) {
            if (option.votes > winner.votes) {
                winner = option;
            }
        }

        const results = {
            question: poll.question,
            winner: winner.text,
            totalVotes: poll.options.reduce((sum, opt) => sum + opt.votes, 0),
            results: poll.options.map(opt => ({
                text: opt.text,
                votes: opt.votes,
                percentage: (opt.votes / Math.max(1, poll.options.reduce((s, o) => s + o.votes, 0)) * 100).toFixed(1)
            }))
        };

        this.activePolls.delete(pollId);
        return results;
    }

    /**
     * Get active poll
     */
    getActivePoll(pollId) {
        return this.activePolls.get(pollId);
    }

    /**
     * Cleanup
     */
    cleanup() {
        this.userCooldowns.clear();
        this.activePolls.clear();
    }
}

// Add CSS for viewer interaction elements
const style = document.createElement('style');
style.textContent = `
    @keyframes emotionBounce {
        0% { transform: translateX(-50%) translateY(0) scale(0); }
        50% { transform: translateX(-50%) translateY(-10px) scale(1.2); }
        100% { transform: translateX(-50%) translateY(0) scale(1); }
    }

    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }

    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }

    .viewer-emotion,
    .viewer-message {
        pointer-events: none;
        user-select: none;
    }
`;
document.head.appendChild(style);
