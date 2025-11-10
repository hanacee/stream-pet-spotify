/**
 * Stream Pet Enhancement Systems
 * Handles Growth, Analytics, Seasonal Themes, and Integrations
 */

class PetEnhancements {
    constructor(streamPet) {
        this.pet = streamPet;
        this.config = streamPet.config;
        this.sessionStartTime = Date.now();
    }

    /**
     * Initialize growth system
     */
    initGrowthSystem() {
        if (!this.config.growth || !this.config.growth.enabled) return;
        
        this.pet.log(`Pet level ${this.config.growth.level} - ${this.config.growth.experience}/${this.config.growth.experienceToNextLevel} XP`, 'info');
        
        // Check if pet should evolve based on current level
        this.checkEvolution();
    }

    /**
     * Add experience and check for level up
     */
    addExperience(amount, source = 'unknown') {
        if (!this.config.growth || !this.config.growth.enabled) return;
        
        this.config.growth.experience += amount;
        this.config.growth.totalExperience += amount;
        
        this.pet.log(`+${amount} XP from ${source}`, 'info');
        
        // Check for level up
        while (this.config.growth.experience >= this.config.growth.experienceToNextLevel) {
            this.levelUp();
        }
        
        // Save progress
        petStorage.save(this.config);
    }

    /**
     * Level up the pet
     */
    levelUp() {
        this.config.growth.experience -= this.config.growth.experienceToNextLevel;
        this.config.growth.level++;
        
        // Increase XP needed for next level (1.5x multiplier)
        this.config.growth.experienceToNextLevel = Math.floor(this.config.growth.experienceToNextLevel * 1.5);
        
        this.pet.log(`🎉 LEVEL UP! Now level ${this.config.growth.level}!`, 'info');
        
        // Show level up status bar instead of speech bubble
        if (this.config.growth.showLevelUp) {
            this.showLevelUpBar(this.config.growth.level);
            this.showLevelUpEffect();
            this.pet.spawnParticles('celebrate', 20);
            this.pet.movePet('spin');
        }
        
        // Check for evolution
        this.checkEvolution();
        
        // Unlock new features every few levels
        this.unlockFeatures();
    }

    /**
     * Show level up visual effect on pet
     */
    showLevelUpEffect() {
        console.log('showLevelUpEffect called');
        const petElement = document.getElementById('pet-container');
        if (!petElement) {
            console.error('Pet element not found for level up effect');
            return;
        }
        
        const settings = this.config.growth?.levelUpEffect || {
            type: 'glow',
            color: '#FFD700',
            duration: 2000,
            intensity: 1
        };
        
        console.log('Level up effect settings:', settings);
        
        // Create effect overlay
        const effectOverlay = document.createElement('div');
        effectOverlay.className = 'level-up-effect';
        effectOverlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 150%;
            height: 150%;
            pointer-events: none;
            z-index: 5;
            border-radius: 50%;
        `;
        
        console.log('Effect type:', settings.type);
        
        switch(settings.type) {
            case 'glow':
                console.log('Applying glow effect');
                effectOverlay.style.cssText += `
                    background: radial-gradient(circle, ${settings.color}40 0%, transparent 70%);
                    box-shadow: 
                        0 0 ${40 * settings.intensity}px ${settings.color},
                        0 0 ${80 * settings.intensity}px ${settings.color},
                        inset 0 0 ${60 * settings.intensity}px ${settings.color};
                    animation: levelUpGlow ${settings.duration}ms ease-out;
                `;
                break;
                
            case 'sparkle':
                effectOverlay.innerHTML = this.createSparkles(settings.color, settings.intensity);
                effectOverlay.style.cssText += `
                    animation: levelUpSparkle ${settings.duration}ms ease-out;
                `;
                break;
                
            case 'aura':
                effectOverlay.style.cssText += `
                    background: transparent;
                    border: ${3 * settings.intensity}px solid ${settings.color};
                    box-shadow: 
                        0 0 ${20 * settings.intensity}px ${settings.color},
                        inset 0 0 ${20 * settings.intensity}px ${settings.color};
                    animation: levelUpAura ${settings.duration}ms ease-out;
                `;
                break;
                
            case 'rainbow':
                effectOverlay.style.cssText += `
                    background: radial-gradient(circle, 
                        rgba(255,0,0,0.3) 0%, 
                        rgba(255,127,0,0.3) 17%, 
                        rgba(255,255,0,0.3) 34%, 
                        rgba(0,255,0,0.3) 51%, 
                        rgba(0,0,255,0.3) 68%, 
                        rgba(75,0,130,0.3) 85%, 
                        rgba(148,0,211,0.3) 100%);
                    box-shadow: 0 0 ${60 * settings.intensity}px rgba(255,255,255,0.8);
                    animation: levelUpRainbow ${settings.duration}ms ease-out;
                `;
                break;
                
            case 'pulse':
                effectOverlay.style.cssText += `
                    background: radial-gradient(circle, ${settings.color}60 0%, ${settings.color}20 50%, transparent 100%);
                    animation: levelUpPulse ${settings.duration}ms ease-out;
                `;
                break;
        }
        
        // Add CSS animations if not already added
        this.addLevelUpStyles();
        
        console.log('Appending effect overlay to pet element');
        petElement.appendChild(effectOverlay);
        console.log('Effect overlay appended, will remove after', settings.duration, 'ms');
        
        // Remove after animation
        setTimeout(() => {
            console.log('Removing effect overlay');
            effectOverlay.remove();
        }, settings.duration);
    }
    
    /**
     * Create sparkle elements
     */
    createSparkles(color, intensity) {
        let sparkles = '';
        const count = Math.floor(20 * intensity);
        
        for (let i = 0; i < count; i++) {
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const size = 2 + Math.random() * 4;
            const delay = Math.random() * 0.5;
            
            sparkles += `
                <div style="
                    position: absolute;
                    left: ${x}%;
                    top: ${y}%;
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    border-radius: 50%;
                    box-shadow: 0 0 ${size * 2}px ${color};
                    animation: sparkleFloat 1s ease-out ${delay}s;
                    opacity: 0;
                "></div>
            `;
        }
        
        return sparkles;
    }
    
    /**
     * Add level up effect styles to document
     */
    addLevelUpStyles() {
        if (document.getElementById('level-up-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'level-up-styles';
        style.textContent = `
            @keyframes levelUpGlow {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
            }
            
            @keyframes levelUpSparkle {
                0% { opacity: 1; }
                100% { opacity: 0; }
            }
            
            @keyframes sparkleFloat {
                0% { opacity: 1; transform: translateY(0) scale(0); }
                50% { opacity: 1; transform: translateY(-30px) scale(1); }
                100% { opacity: 0; transform: translateY(-60px) scale(0); }
            }
            
            @keyframes levelUpAura {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8) rotate(0deg); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1) rotate(180deg); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.3) rotate(360deg); }
            }
            
            @keyframes levelUpRainbow {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); filter: hue-rotate(0deg); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); filter: hue-rotate(180deg); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); filter: hue-rotate(360deg); }
            }
            
            @keyframes levelUpPulse {
                0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
                10% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
                20% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
                30% { opacity: 1; transform: translate(-50%, -50%) scale(1.4); }
                40% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.2); }
                50% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
            }
            
            @keyframes evolutionBurst {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0); }
                30% { opacity: 1; transform: translate(-50%, -50%) scale(1.5); }
                60% { opacity: 1; transform: translate(-50%, -50%) scale(1.8) rotate(360deg); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(2.5) rotate(720deg); }
            }
            
            @keyframes evolutionShine {
                0%, 100% { opacity: 0; }
                50% { opacity: 1; }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Show level up status bar
     */
    showLevelUpBar(level) {
        // Get level up bar settings
        const settings = this.config.growth?.levelUpBar || {
            style: 'default',
            position: 'top',
            offsetY: 0,
            duration: 3000,
            textSize: 24
        };
        
        const statusBar = document.createElement('div');
        statusBar.className = 'level-up-bar';
        
        // Add style class if not default
        if (settings.style && settings.style !== 'default') {
            statusBar.classList.add(settings.style);
        }
        
        statusBar.innerHTML = `
            <div class="level-up-content">
                <span class="level-up-icon">🎉</span>
                <span class="level-up-text">Level Up! Now Level ${level}</span>
                <span class="level-up-icon">🎉</span>
            </div>
        `;
        
        // Calculate position based on settings
        let topPosition = '20%';
        if (settings.position === 'top') {
            topPosition = `${20 + (settings.offsetY / 10)}%`;
        } else if (settings.position === 'middle') {
            topPosition = `${50 + (settings.offsetY / 10)}%`;
        } else if (settings.position === 'bottom') {
            topPosition = `${80 + (settings.offsetY / 10)}%`;
        }
        
        // Base styles (can be overridden by style classes)
        let baseStyles = `
            position: fixed;
            top: ${topPosition};
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            padding: 20px 40px;
            border-radius: 50px;
            font-size: ${settings.textSize}px;
            font-weight: bold;
            z-index: 10000;
            opacity: 0;
            animation: levelUpSlide ${settings.duration}ms ease-out forwards;
            pointer-events: none;
        `;
        
        // Add default styling only if using default style
        if (!settings.style || settings.style === 'default') {
            baseStyles += `
                background: linear-gradient(135deg, #6b46c1 0%, #4c1d95 100%);
                color: white;
                box-shadow: 0 8px 32px rgba(107, 70, 193, 0.5);
            `;
        }
        
        statusBar.style.cssText = baseStyles;
        
        document.body.appendChild(statusBar);
        
        // Remove after animation
        setTimeout(() => {
            statusBar.remove();
        }, settings.duration);
    }

    /**
     * Check if pet should evolve to next stage
     */
    checkEvolution() {
        const stages = this.config.growth.stages;
        const currentLevel = this.config.growth.level;
        
        for (let i = stages.length - 1; i >= 0; i--) {
            if (currentLevel >= stages[i].level && this.config.growth.evolutionStage < i) {
                this.evolve(i);
                break;
            }
        }
    }

    /**
     * Evolve pet to new stage
     */
    async evolve(stageIndex) {
        this.config.growth.evolutionStage = stageIndex;
        const stage = this.config.growth.stages[stageIndex];
        
        this.pet.log(`✨ EVOLUTION! ${stage.name} stage unlocked!`, 'info');
        this.showEvolutionEffect(stage.name);
        this.pet.showMessage(`✨ Your pet evolved into ${stage.name}! ✨`, 6000);
        this.pet.spawnParticles('stars', 30);
        
        // Update pet image if stage has one
        if (stage.image) {
            setTimeout(() => {
                this.pet.updateImage();
            }, 2000); // Wait for evolution effect to show
        }
    }
    
    /**
     * Show epic evolution effect
     */
    showEvolutionEffect(stageName) {
        console.log('showEvolutionEffect called with stageName:', stageName);
        const petElement = document.getElementById('pet-container');
        if (!petElement) {
            console.error('Pet element not found for evolution effect');
            return;
        }
        
        const settings = this.config.growth?.evolutionEffect || {
            type: 'burst',
            color: '#FF6EC7',
            secondaryColor: '#7C3AED',
            duration: 3000,
            intensity: 1.5
        };
        
        console.log('Evolution effect settings:', settings);
        
        // Main evolution burst
        const burstOverlay = document.createElement('div');
        burstOverlay.className = 'evolution-burst';
        burstOverlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200%;
            height: 200%;
            pointer-events: none;
            z-index: 6;
            border-radius: 50%;
            background: radial-gradient(circle,
                ${settings.color}80 0%,
                ${settings.secondaryColor}60 30%,
                ${settings.color}40 60%,
                transparent 100%);
            box-shadow: 
                0 0 ${80 * settings.intensity}px ${settings.color},
                0 0 ${120 * settings.intensity}px ${settings.secondaryColor},
                inset 0 0 ${100 * settings.intensity}px ${settings.color};
            animation: evolutionBurst ${settings.duration}ms ease-out;
        `;
        
        // Rotating rings
        const ring1 = document.createElement('div');
        ring1.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 180%;
            height: 180%;
            border: ${4 * settings.intensity}px solid ${settings.color};
            border-radius: 50%;
            opacity: 0;
            animation: evolutionBurst ${settings.duration * 0.8}ms ease-out;
        `;
        
        const ring2 = document.createElement('div');
        ring2.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 160%;
            height: 160%;
            border: ${3 * settings.intensity}px solid ${settings.secondaryColor};
            border-radius: 50%;
            opacity: 0;
            animation: evolutionBurst ${settings.duration * 0.9}ms ease-out 100ms;
        `;
        
        // Shine rays
        const shineContainer = document.createElement('div');
        shineContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200%;
            height: 200%;
            pointer-events: none;
            z-index: 5;
        `;
        
        for (let i = 0; i < 8; i++) {
            const ray = document.createElement('div');
            const angle = (i * 45);
            ray.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 4px;
                height: 100%;
                background: linear-gradient(to bottom,
                    transparent 0%,
                    ${settings.color} 45%,
                    ${settings.secondaryColor} 50%,
                    ${settings.color} 55%,
                    transparent 100%);
                transform: translate(-50%, -50%) rotate(${angle}deg);
                transform-origin: center;
                animation: evolutionShine ${settings.duration}ms ease-out;
                box-shadow: 0 0 ${10 * settings.intensity}px ${settings.color};
            `;
            shineContainer.appendChild(ray);
        }
        
        // Evolution text
        const evolutionText = document.createElement('div');
        evolutionText.style.cssText = `
            position: absolute;
            top: -80px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 28px;
            font-weight: bold;
            color: ${settings.color};
            text-shadow: 
                0 0 10px ${settings.secondaryColor},
                0 0 20px ${settings.color},
                0 0 30px ${settings.secondaryColor};
            white-space: nowrap;
            z-index: 7;
            animation: evolutionShine ${settings.duration}ms ease-out;
        `;
        evolutionText.textContent = `✨ EVOLUTION! ✨`;
        
        // Add CSS animations if not already added
        this.addLevelUpStyles();
        
        petElement.appendChild(burstOverlay);
        petElement.appendChild(ring1);
        petElement.appendChild(ring2);
        petElement.appendChild(shineContainer);
        petElement.appendChild(evolutionText);
        
        // Create particle burst
        setTimeout(() => {
            this.pet.spawnParticles('celebrate', 40);
        }, settings.duration / 3);
        
        setTimeout(() => {
            this.pet.spawnParticles('stars', 40);
        }, settings.duration / 2);
        
        // Remove after animation
        setTimeout(() => {
            burstOverlay.remove();
            ring1.remove();
            ring2.remove();
            shineContainer.remove();
            evolutionText.remove();
        }, settings.duration);
        
        // Find stage by name and change to evolution image if available
        const stage = this.config.growth?.stages?.find(s => s.name === stageName);
        if (stage && stage.image) {
            setTimeout(() => {
                this.pet.updateImage();
            }, settings.duration / 2);
        }
        
        petStorage.save(this.config);
    }

    /**
     * Reset growth stats to level 1
     */
    resetGrowth() {
        this.config.growth.level = 1;
        this.config.growth.experience = 0;
        this.config.growth.evolutionStage = 0;
        this.config.growth.experienceToNextLevel = 100;
        
        const firstStage = this.config.growth.stages?.[0];
        if (firstStage) {
            this.config.growth.evolutionStage = firstStage.name;
        }
        
        this.pet.log('Growth stats reset to level 1', 'info');
        petStorage.save(this.config);
    }

    /**
     * Unlock new features based on level
     */
    unlockFeatures() {
        const level = this.config.growth.level;
        const animations = ['bounce', 'wiggle', 'spin', 'float', 'shake', 'sway', 'jump', 'hop', 'pulse', 'slide-left', 'slide-right'];
        const particles = ['hearts', 'stars', 'celebrate', 'money', 'fire', 'ice', 'food'];
        
        // Unlock animations every 2 levels
        if (level % 2 === 0 && level / 2 <= animations.length) {
            const newAnimation = animations[Math.floor(level / 2) - 1];
            if (!this.config.growth.unlockedAnimations.includes(newAnimation)) {
                this.config.growth.unlockedAnimations.push(newAnimation);
                this.pet.log(`🔓 Unlocked animation: ${newAnimation}!`, 'info');
            }
        }
        
        // Unlock particles every 3 levels
        if (level % 3 === 0 && level / 3 <= particles.length) {
            const newParticle = particles[Math.floor(level / 3) - 1];
            if (!this.config.growth.unlockedParticles.includes(newParticle)) {
                this.config.growth.unlockedParticles.push(newParticle);
                this.pet.log(`🔓 Unlocked particle effect: ${newParticle}!`, 'info');
            }
        }
    }

    /**
     * Initialize analytics tracking
     */
    initAnalytics() {
        if (!this.config.analytics || !this.config.analytics.enabled) return;
        
        // Increment session count
        this.config.analytics.sessionCount++;
        this.sessionStartTime = Date.now();
        
        // Track uptime
        this.uptimeInterval = setInterval(() => {
            if (this.config.analytics.enabled) {
                this.config.analytics.totalUptime += 60000; // Add 1 minute
                petStorage.save(this.config);
            }
        }, 60000); // Every minute
        
        this.pet.log('Analytics tracking initialized', 'info');
    }

    /**
     * Track event for analytics
     */
    trackAnalytics(type, name) {
        if (!this.config.analytics || !this.config.analytics.enabled) return;
        
        try {
            const stats = this.config.analytics.stats;
            
            switch (type) {
                case 'event':
                    stats.eventsTriggered[name] = (stats.eventsTriggered[name] || 0) + 1;
                    break;
                case 'command':
                    stats.commandsUsed[name] = (stats.commandsUsed[name] || 0) + 1;
                    break;
                case 'state':
                    stats.statesEntered[name] = (stats.statesEntered[name] || 0) + 1;
                    break;
                case 'click':
                    stats.totalClicks++;
                    break;
            }
            
            // Update top lists periodically
            this.updateTopLists();
        } catch (error) {
            this.pet.handleError('trackAnalytics', error);
        }
    }

    /**
     * Update top events/commands/states lists
     */
    updateTopLists() {
        const stats = this.config.analytics.stats;
        
        // Top events
        this.config.analytics.topEvents = Object.entries(stats.eventsTriggered)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        // Top commands
        this.config.analytics.topCommands = Object.entries(stats.commandsUsed)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        // Top states
        this.config.analytics.topStates = Object.entries(stats.statesEntered)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }

    /**
     * Apply seasonal theme based on current date
     */
    applySeasonalTheme() {
        if (!this.config.seasonal || !this.config.seasonal.enabled || !this.config.seasonal.autoDetect) return;
        
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const day = now.getDate();
        
        // Check each theme
        for (const [themeName, theme] of Object.entries(this.config.seasonal.themes)) {
            // Skip themes without date range defined
            if (!theme.startDate || !theme.endDate) continue;
            
            const [startMonth, startDay] = theme.startDate.split('-').map(Number);
            const [endMonth, endDay] = theme.endDate.split('-').map(Number);
            
            const startDate = new Date(now.getFullYear(), startMonth - 1, startDay);
            const endDate = new Date(now.getFullYear(), endMonth - 1, endDay);
            
            // Handle year wrap (e.g., Dec 27 - Jan 2)
            if (endDate < startDate) {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }
            
            if (now >= startDate && now <= endDate) {
                this.config.seasonal.currentSeason = themeName;
                this.pet.log(`🎃 Seasonal theme active: ${themeName}`, 'info');
                
                // Apply theme if image exists
                if (theme.defaultImage) {
                    this.config.pet.defaultImage = theme.defaultImage;
                }
                if (theme.bubbleStyle) {
                    this.config.advanced.bubbleStyle = theme.bubbleStyle;
                }
                
                break;
            }
        }
    }

    /**
     * Initialize integrations
     */
    async initIntegrations() {
        if (!this.config.integrations) return;
        
        // Twitch Integration
        if (typeof TwitchIntegration !== 'undefined' && this.config.twitch?.enabled) {
            this.pet.twitchIntegration = new TwitchIntegration(this.pet);
            await this.pet.twitchIntegration.init();
        }
        
        // Spotify Integration
        if (typeof SpotifyIntegration !== 'undefined' && this.config.integrations.spotify?.enabled) {
            this.pet.spotifyIntegration = new SpotifyIntegration(this.pet);
            await this.pet.spotifyIntegration.init();
        }
        
        // StreamElements
        if (this.config.integrations.streamElements?.enabled) {
            this.initStreamElements();
        }
        
        // Streamlabs
        if (this.config.integrations.streamlabs?.enabled) {
            this.initStreamlabs();
        }
        
        // Discord webhooks
        if (this.config.integrations.discord?.enabled) {
            this.pet.log('Discord webhooks configured', 'info');
        }
    }

    /**
     * Send Discord webhook notification
     */
    async sendDiscordNotification(eventName, eventData) {
        if (!this.config.integrations?.discord?.enabled) return;
        if (!this.config.integrations.discord.notifyOnEvents.includes(eventName)) return;
        
        const webhookUrl = this.config.integrations.discord.webhookUrl;
        if (!webhookUrl) return;
        
        try {
            const embed = {
                title: `Stream Pet - ${eventName}`,
                description: this.pet.replaceVariables(this.config.events[eventName]?.message || '', eventData),
                color: 0x9146FF, // Twitch purple
                timestamp: new Date().toISOString()
            };
            
            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] })
            });
        } catch (error) {
            this.pet.handleError('sendDiscordNotification', error);
        }
    }

    /**
     * Initialize StreamElements integration
     */
    initStreamElements() {
        const config = this.config.integrations.streamElements;
        if (!config.accountId || !config.jwtToken) {
            this.pet.log('StreamElements not configured', 'warn');
            return;
        }
        
        // Connect to StreamElements Socket API
        this.pet.log('StreamElements integration would connect here', 'info');
        // Implementation would use: https://github.com/StreamElements/widgets/wiki/Socket-API
    }

    /**
     * Initialize Streamlabs integration
     */
    initStreamlabs() {
        const config = this.config.integrations.streamlabs;
        if (!config.socketToken) {
            this.pet.log('Streamlabs not configured', 'warn');
            return;
        }
        
        // Connect to Streamlabs Socket API
        this.pet.log('Streamlabs integration would connect here', 'info');
        // Implementation would use: https://github.com/StreamlabsSupport/Streamlabs-Socket-API
    }

    /**
     * Get analytics summary
     */
    getAnalyticsSummary() {
        if (!this.config.analytics) return null;
        
        const stats = this.config.analytics.stats;
        const uptime = this.config.analytics.totalUptime;
        const hours = Math.floor(uptime / 3600000);
        const minutes = Math.floor((uptime % 3600000) / 60000);
        
        return {
            level: this.config.growth?.level || 1,
            totalXP: this.config.growth?.totalExperience || 0,
            sessions: this.config.analytics.sessionCount,
            uptime: `${hours}h ${minutes}m`,
            totalEvents: Object.values(stats.eventsTriggered).reduce((a, b) => a + b, 0),
            totalCommands: Object.values(stats.commandsUsed).reduce((a, b) => a + b, 0),
            totalClicks: stats.totalClicks,
            topEvent: this.config.analytics.topEvents[0],
            topCommand: this.config.analytics.topCommands[0]
        };
    }

    /**
     * Cleanup on unload
     */
    cleanup() {
        if (this.uptimeInterval) {
            clearInterval(this.uptimeInterval);
        }
    }
}
