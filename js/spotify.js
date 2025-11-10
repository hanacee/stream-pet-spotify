/**
 * Spotify Integration
 * Handles Spotify Web API authentication and now playing tracking
 */

class SpotifyIntegration {
    constructor(streamPet) {
        this.pet = streamPet;
        this.config = null;
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.currentTrack = null;
        this.pollInterval = null;
        this.pollRate = 10000; // Check every 10 seconds
    }

    /**
     * Initialize Spotify integration
     */
    async init() {
        try {
            this.config = petStorage.load().integrations?.spotify;
            
            if (!this.config || !this.config.enabled) {
                this.pet.log('Spotify integration disabled');
                return;
            }
            
            if (!this.config.clientId) {
                this.pet.log('Spotify Client ID not configured', 'warn');
                return;
            }
            
            // Load saved tokens
            this.loadTokens();
            
            // If we have a valid token, start polling
            if (this.accessToken && this.tokenExpiry > Date.now()) {
                this.pet.log('Spotify connected with saved token', 'info');
                this.startPolling();
            } else if (this.refreshToken) {
                // Try to refresh the token
                await this.refreshAccessToken();
            } else {
                this.pet.log('Spotify: Please authenticate via config panel', 'info');
            }
        } catch (error) {
            this.pet.log(`Spotify init error: ${error.message}`, 'error');
        }
    }

    /**
     * Load saved tokens from localStorage
     */
    loadTokens() {
        this.accessToken = localStorage.getItem('spotify_access_token');
        this.refreshToken = localStorage.getItem('spotify_refresh_token');
        const expiry = localStorage.getItem('spotify_token_expiry');
        this.tokenExpiry = expiry ? parseInt(expiry) : null;
    }

    /**
     * Save tokens to localStorage
     */
    saveTokens() {
        if (this.accessToken) {
            localStorage.setItem('spotify_access_token', this.accessToken);
        }
        if (this.refreshToken) {
            localStorage.setItem('spotify_refresh_token', this.refreshToken);
        }
        if (this.tokenExpiry) {
            localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
        }
    }

    /**
     * Start authorization flow (Implicit Grant - no backend needed!)
     */
    authorize() {
        const scopes = 'user-read-currently-playing user-read-playback-state';
        const redirectUri = encodeURIComponent(window.location.origin + '/config.html');
        const state = Math.random().toString(36).substring(7);
        
        localStorage.setItem('spotify_auth_state', state);
        
        // Use response_type=token for Implicit Grant (no backend needed!)
        const authUrl = `https://accounts.spotify.com/authorize?` +
            `client_id=${this.config.clientId}` +
            `&response_type=token` +
            `&redirect_uri=${redirectUri}` +
            `&scope=${encodeURIComponent(scopes)}` +
            `&state=${state}`;
        
        window.location.href = authUrl;
    }

    /**
     * Handle OAuth callback (Implicit Grant returns token in URL hash)
     */
    handleCallback() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');
        const state = params.get('state');
        const savedState = localStorage.getItem('spotify_auth_state');
        
        if (!accessToken) {
            return false;
        }
        
        if (state !== savedState) {
            this.pet.log('Spotify auth state mismatch', 'error');
            return false;
        }
        
        // Save token
        this.accessToken = accessToken;
        this.tokenExpiry = Date.now() + (parseInt(expiresIn) * 1000);
        localStorage.setItem('spotify_access_token', this.accessToken);
        localStorage.setItem('spotify_token_expiry', this.tokenExpiry.toString());
        localStorage.removeItem('spotify_auth_state');
        
        this.pet.log('✅ Spotify connected successfully!', 'info');
        this.startPolling();
        
        // Clear hash from URL
        window.location.hash = '';
        
        return true;
    }

    /**
     * Refresh access token (Implicit Grant doesn't support refresh - requires re-auth)
     */
    async refreshAccessToken() {
        this.pet.log('Spotify: Token expired. Please re-authenticate.', 'warn');
        // Implicit Grant doesn't provide refresh tokens - user must re-auth
        // Could auto-redirect here if desired
    }

    /**
     * Start polling for currently playing track
     */
    startPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        
        // Poll immediately
        this.checkNowPlaying();
        
        // Then poll at regular intervals
        this.pollInterval = setInterval(() => {
            this.checkNowPlaying();
        }, this.pollRate);
    }

    /**
     * Stop polling
     */
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }

    /**
     * Check currently playing track
     */
    async checkNowPlaying() {
        if (!this.accessToken) return;
        
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });
            
            if (response.status === 401) {
                // Token expired
                this.pet.log('Spotify token expired', 'warn');
                this.stopPolling();
                if (this.refreshToken) {
                    await this.refreshAccessToken();
                }
                return;
            }
            
            if (response.status === 204 || !response.ok) {
                // Nothing playing
                if (this.currentTrack) {
                    this.currentTrack = null;
                    this.onTrackChange(null);
                }
                return;
            }
            
            const data = await response.json();
            
            if (data.item && data.is_playing) {
                const track = {
                    name: data.item.name,
                    artist: data.item.artists[0].name,
                    album: data.item.album.name,
                    albumArt: data.item.album.images[0]?.url,
                    uri: data.item.uri,
                    id: data.item.id,
                    genres: [] // Genre info requires additional API call
                };
                
                // Check if track changed
                if (!this.currentTrack || this.currentTrack.id !== track.id) {
                    this.currentTrack = track;
                    this.onTrackChange(track);
                }
            } else if (this.currentTrack) {
                this.currentTrack = null;
                this.onTrackChange(null);
            }
        } catch (error) {
            this.pet.log(`Spotify API error: ${error.message}`, 'error');
        }
    }

    /**
     * Handle track change
     */
    onTrackChange(track) {
        if (track) {
            this.pet.log(`🎵 Now playing: ${track.artist} - ${track.name}`, 'info');
            
            // React to genre if enabled
            if (this.config.reactToGenres) {
                // Since we don't have genre info without additional API calls,
                // you could add custom reactions based on artist/track name patterns
                this.reactToTrack(track);
            }
        } else {
            this.pet.log('🎵 Playback stopped', 'info');
        }
    }

    /**
     * React to track based on patterns
     */
    reactToTrack(track) {
        const trackInfo = `${track.name} ${track.artist}`.toLowerCase();
        
        // Example reactions - customize these
        if (trackInfo.includes('dance') || trackInfo.includes('party')) {
            this.pet.changeState('dancing', 10000);
        } else if (trackInfo.includes('sad') || trackInfo.includes('cry')) {
            this.pet.changeState('crying', 10000);
        } else if (trackInfo.includes('sleep') || trackInfo.includes('chill')) {
            this.pet.changeState('sleeping', 10000);
        }
    }

    /**
     * Disconnect Spotify
     */
    disconnect() {
        this.stopPolling();
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenExpiry = null;
        this.currentTrack = null;
        
        localStorage.removeItem('spotify_access_token');
        localStorage.removeItem('spotify_refresh_token');
        localStorage.removeItem('spotify_token_expiry');
        localStorage.removeItem('spotify_auth_state');
        
        this.pet.log('Spotify disconnected', 'info');
    }
}
