# 🎵 Spotify Integration Setup Guide

## Quick & Easy Setup (No Backend Required!)

### Step 1: Create Spotify App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create App"**
4. Fill in the form:
   - **App Name:** Stream Pet (or anything you like)
   - **App Description:** Browser source pet for streaming
   - **Redirect URI:** Copy this from the config page (see Step 2)
   - **Which API/SDKs are you planning to use?** Check "Web API"
   - Agree to the terms and click **Create**

### Step 2: Get Your Credentials
1. Open the Stream Pet **config.html** page
2. Go to the **Integrations** tab
3. Scroll to **Spotify** section
4. You'll see the **Redirect URI** displayed - click **Copy** button
5. Go back to your Spotify App settings
6. Click **"Edit Settings"**
7. Paste the Redirect URI in the **Redirect URIs** field
8. Click **Add**, then **Save**
9. Back on the app page, copy your **Client ID**
10. Paste it into the config page

### Step 3: Connect
1. Click the **"Connect Spotify"** button
2. You'll be redirected to Spotify to authorize
3. Click **Agree** to grant permissions
4. You'll be redirected back to the config page
5. ✅ Done! You should see "Connected to Spotify"

## What It Does

Once connected, the Stream Pet will:
- Detect what song you're currently playing
- React to music with animations
- Show "Now Playing" info in the console
- Automatically trigger states based on song/artist keywords

## Custom Reactions

Edit `js/spotify.js` in the `reactToTrack()` function to add your own reactions:

```javascript
reactToTrack(track) {
    const trackInfo = `${track.name} ${track.artist}`.toLowerCase();
    
    // Add your own reactions!
    if (trackInfo.includes('dance') || trackInfo.includes('party')) {
        this.pet.changeState('dancing', 10000);
    } else if (trackInfo.includes('sad')) {
        this.pet.changeState('crying', 10000);
    }
    // Add more here...
}
```

## Token Expiration

Spotify tokens expire after 1 hour. When it expires:
- The pet will show a warning in the console
- Simply click **"Connect Spotify"** again to refresh
- Your settings are saved - just re-authorize

## Troubleshooting

**❌ "Not connected" after authorizing**
- Make sure the Redirect URI exactly matches what's in your Spotify app settings
- Check browser console for errors

**❌ "Please enter your Spotify Client ID first"**
- You need to paste your Client ID from the Spotify Developer Dashboard

**❌ Nothing happens when songs play**
- Make sure "Enable Spotify Integration" is checked
- Check that Spotify is actually playing music (not paused)
- Open browser console to see the "Now playing" logs

**❌ Pet doesn't react to songs**
- Enable "React to Music Genres" checkbox
- Edit `reactToTrack()` function to add keywords from your music

## Privacy & Security

- ✅ **No backend required** - uses Implicit Grant flow
- ✅ **No client secret needed** - safe for browser use
- ✅ **Read-only access** - can only see what you're playing
- ✅ **Stored locally** - tokens saved in browser localStorage only
- ✅ **No data sent anywhere** - everything happens in your browser

## API Limits

Spotify allows:
- Checking "Now Playing" every 10 seconds (default poll rate)
- No specific rate limit for this endpoint
- If you get rate limited, the pet will automatically retry

Enjoy your music-reactive stream pet! 🎵🐾
