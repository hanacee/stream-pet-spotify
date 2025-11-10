/**
 * Advanced Animation System
 * Sprite sheets, physics-based movement, weather effects
 */

class AdvancedAnimations {
    constructor(streamPet) {
        this.pet = streamPet;
        this.spriteSheets = {};
        this.weatherActive = false;
        this.weatherType = null;
        this.physicsEnabled = false;
        
        // Physics properties
        this.velocity = { x: 0, y: 0 };
        this.gravity = 0.5;
        this.bounce = 0.7;
    }

    /**
     * Load sprite sheet
     */
    loadSpriteSheet(name, imagePath, frameWidth, frameHeight, frameCount) {
        const img = new Image();
        img.src = imagePath;
        
        img.onload = () => {
            this.spriteSheets[name] = {
                image: img,
                frameWidth,
                frameHeight,
                frameCount,
                currentFrame: 0
            };
            this.pet.log(`Sprite sheet loaded: ${name}`, 'info');
        };
        
        img.onerror = () => {
            this.pet.log(`Failed to load sprite sheet: ${name}`, 'error');
        };
    }

    /**
     * Animate sprite sheet
     */
    animateSpriteSheet(name, duration = 1000, loop = false) {
        const sheet = this.spriteSheets[name];
        if (!sheet) {
            this.pet.log(`Sprite sheet not found: ${name}`, 'warn');
            return;
        }

        const frameTime = duration / sheet.frameCount;
        let currentFrame = 0;

        const animate = () => {
            // Update sprite position
            const x = (currentFrame % (sheet.image.width / sheet.frameWidth)) * sheet.frameWidth;
            const y = Math.floor(currentFrame / (sheet.image.width / sheet.frameWidth)) * sheet.frameHeight;

            // Apply to pet image (would need canvas for proper sprite rendering)
            // This is a simplified version
            this.pet.petImage.style.backgroundImage = `url(${sheet.image.src})`;
            this.pet.petImage.style.backgroundPosition = `-${x}px -${y}px`;

            currentFrame++;

            if (currentFrame < sheet.frameCount) {
                setTimeout(animate, frameTime);
            } else if (loop) {
                currentFrame = 0;
                setTimeout(animate, frameTime);
            }
        };

        animate();
    }

    /**
     * Enable physics-based movement
     */
    enablePhysics() {
        this.physicsEnabled = true;
        this.startPhysicsLoop();
    }

    /**
     * Disable physics
     */
    disablePhysics() {
        this.physicsEnabled = false;
        if (this.physicsInterval) {
            clearInterval(this.physicsInterval);
        }
    }

    /**
     * Apply force to pet (for physics-based movement)
     */
    applyForce(forceX, forceY) {
        if (!this.physicsEnabled) return;
        
        this.velocity.x += forceX;
        this.velocity.y += forceY;
    }

    /**
     * Physics update loop
     */
    startPhysicsLoop() {
        this.physicsInterval = setInterval(() => {
            if (!this.physicsEnabled) return;

            // Apply gravity
            this.velocity.y += this.gravity;

            // Get current position
            const rect = this.pet.petContainer.getBoundingClientRect();
            const x = rect.left + this.velocity.x;
            const y = rect.top + this.velocity.y;

            // Bounce off edges
            if (y + rect.height > window.innerHeight) {
                this.velocity.y *= -this.bounce;
                this.pet.petContainer.style.top = (window.innerHeight - rect.height) + 'px';
            } else if (y < 0) {
                this.velocity.y *= -this.bounce;
                this.pet.petContainer.style.top = '0px';
            }

            if (x + rect.width > window.innerWidth) {
                this.velocity.x *= -this.bounce;
                this.pet.petContainer.style.left = (window.innerWidth - rect.width) + 'px';
            } else if (x < 0) {
                this.velocity.x *= -this.bounce;
                this.pet.petContainer.style.left = '0px';
            }

            // Apply velocity
            this.pet.petContainer.style.left = x + 'px';
            this.pet.petContainer.style.top = y + 'px';

            // Damping
            this.velocity.x *= 0.99;
            this.velocity.y *= 0.99;

            // Stop if velocity is very small
            if (Math.abs(this.velocity.x) < 0.1 && Math.abs(this.velocity.y) < 0.1) {
                this.velocity.x = 0;
                this.velocity.y = 0;
            }
        }, 16); // ~60fps
    }

    /**
     * Start weather effect
     */
    startWeather(type = 'rain') {
        if (this.weatherActive) {
            this.stopWeather();
        }

        this.weatherActive = true;
        this.weatherType = type;

        const weatherContainer = document.createElement('div');
        weatherContainer.id = 'weather-container';
        weatherContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
        `;

        document.body.appendChild(weatherContainer);

        switch (type) {
            case 'rain':
                this.createRain(weatherContainer);
                break;
            case 'snow':
                this.createSnow(weatherContainer);
                break;
            case 'leaves':
                this.createLeaves(weatherContainer);
                break;
            case 'sakura':
                this.createSakura(weatherContainer);
                break;
        }

        this.pet.log(`Weather started: ${type}`, 'info');
    }

    /**
     * Stop weather effect
     */
    stopWeather() {
        const weatherContainer = document.getElementById('weather-container');
        if (weatherContainer) {
            weatherContainer.remove();
        }

        if (this.weatherInterval) {
            clearInterval(this.weatherInterval);
        }

        this.weatherActive = false;
        this.weatherType = null;
    }

    /**
     * Create rain effect
     */
    createRain(container) {
        const createDrop = () => {
            const drop = document.createElement('div');
            drop.textContent = '💧';
            drop.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                top: -20px;
                font-size: ${12 + Math.random() * 8}px;
                animation: fall ${1 + Math.random() * 2}s linear;
                opacity: 0.6;
            `;
            container.appendChild(drop);

            setTimeout(() => drop.remove(), 3000);
        };

        // Create initial drops
        for (let i = 0; i < 30; i++) {
            setTimeout(() => createDrop(), i * 100);
        }

        // Keep creating drops
        this.weatherInterval = setInterval(createDrop, 100);
    }

    /**
     * Create snow effect
     */
    createSnow(container) {
        const createFlake = () => {
            const flake = document.createElement('div');
            flake.textContent = ['❄️', '❅', '❆'][Math.floor(Math.random() * 3)];
            flake.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                top: -20px;
                font-size: ${12 + Math.random() * 12}px;
                animation: fallAndSway ${3 + Math.random() * 3}s linear;
                opacity: 0.8;
            `;
            container.appendChild(flake);

            setTimeout(() => flake.remove(), 6000);
        };

        for (let i = 0; i < 50; i++) {
            setTimeout(() => createFlake(), i * 100);
        }

        this.weatherInterval = setInterval(createFlake, 200);
    }

    /**
     * Create falling leaves effect
     */
    createLeaves(container) {
        const createLeaf = () => {
            const leaf = document.createElement('div');
            leaf.textContent = ['🍂', '🍁'][Math.floor(Math.random() * 2)];
            leaf.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                top: -20px;
                font-size: ${16 + Math.random() * 16}px;
                animation: fallAndRotate ${4 + Math.random() * 3}s linear;
                opacity: 0.7;
            `;
            container.appendChild(leaf);

            setTimeout(() => leaf.remove(), 7000);
        };

        for (let i = 0; i < 30; i++) {
            setTimeout(() => createLeaf(), i * 150);
        }

        this.weatherInterval = setInterval(createLeaf, 300);
    }

    /**
     * Create sakura petals effect
     */
    createSakura(container) {
        const createPetal = () => {
            const petal = document.createElement('div');
            petal.textContent = '🌸';
            petal.style.cssText = `
                position: absolute;
                left: ${Math.random() * 100}%;
                top: -20px;
                font-size: ${14 + Math.random() * 10}px;
                animation: fallAndSway ${5 + Math.random() * 3}s linear;
                opacity: 0.8;
            `;
            container.appendChild(petal);

            setTimeout(() => petal.remove(), 8000);
        };

        for (let i = 0; i < 40; i++) {
            setTimeout(() => createPetal(), i * 100);
        }

        this.weatherInterval = setInterval(createPetal, 200);
    }

    /**
     * Smooth path following animation
     */
    async followPath(points, duration = 3000) {
        this.pathActive = true;
        const container = this.pet.petContainer;
        const totalPoints = points.length;
        const timePerPoint = duration / totalPoints;

        for (let i = 0; i < totalPoints; i++) {
            if (!this.pathActive) break; // Allow stopping mid-path
            const point = points[i];
            await this.smoothMove(point.x, point.y, timePerPoint);
        }
        
        this.pathActive = false;
    }

    /**
     * Stop path movement
     */
    stopPath() {
        this.pathActive = false;
        this.pet.log('Path movement stopped', 'info');
    }

    /**
     * Smooth movement to position
     */
    smoothMove(targetX, targetY, duration) {
        return new Promise((resolve) => {
            const container = this.pet.petContainer;
            const startX = parseFloat(container.style.left) || 50;
            const startY = parseFloat(container.style.top) || 50;
            const startTime = Date.now();

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Easing function (ease-in-out)
                const eased = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                const currentX = startX + (targetX - startX) * eased;
                const currentY = startY + (targetY - startY) * eased;

                container.style.left = currentX + '%';
                container.style.top = currentY + '%';

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    }

    /**
     * Add weather animation styles
     */
    addWeatherStyles() {
        if (document.getElementById('weather-styles')) return;

        const style = document.createElement('style');
        style.id = 'weather-styles';
        style.textContent = `
            @keyframes fall {
                to {
                    transform: translateY(110vh);
                }
            }

            @keyframes fallAndSway {
                0% {
                    transform: translateY(0) translateX(0);
                }
                25% {
                    transform: translateY(27.5vh) translateX(15px);
                }
                50% {
                    transform: translateY(55vh) translateX(-15px);
                }
                75% {
                    transform: translateY(82.5vh) translateX(15px);
                }
                100% {
                    transform: translateY(110vh) translateX(0);
                }
            }

            @keyframes fallAndRotate {
                0% {
                    transform: translateY(0) rotate(0deg);
                }
                100% {
                    transform: translateY(110vh) rotate(720deg);
                }
            }

            @keyframes sway {
                0%, 100% {
                    transform: translateX(0);
                }
                50% {
                    transform: translateX(30px);
                }
            }

            @keyframes rotate {
                from {
                    transform: rotate(0deg);
                }
                to {
                    transform: rotate(360deg);
                }
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Initialize advanced animations
     */
    init() {
        this.addWeatherStyles();
        this.pet.log('Advanced animations initialized', 'info');
    }
}
