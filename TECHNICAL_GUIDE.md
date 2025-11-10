# Stream Pet Technical Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Installation & Setup](#installation--setup)
3. [Configuration System](#configuration-system)
4. [Core Features](#core-features)
5. [Integration Setup](#integration-setup)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)
8. [Performance Optimization](#performance-optimization)
9. [Development & Customization](#development--customization)

---

## Introduction

The Stream Pet is a fully-featured, interactive browser source for OBS Studio that responds to Twitch events, chat commands, viewer interactions, and more. Built with vanilla JavaScript, it's highly customizable and designed for streamers who want an engaging on-screen companion.

### Key Features
- **Real-time Twitch Integration**: Chat, EventSub, channel points, follows, subs, bits
- **Growth System**: Level up, evolution stages, visual effects
- **Viewer Interaction**: Custom commands, channel point redemptions, polls
- **First-Time Chatter Greetings**: Welcome viewers automatically on their first message
- **Advanced Animations**: Physics-based movement, weather effects, particle systems
- **External Integrations**: Spotify, StreamElements, Streamlabs, custom webhooks
- **Seasonal Modes**: Automatic holiday themes and special events
- **Analytics Dashboard**: Track all interactions and statistics

---

## Installation & Setup

### Basic Setup

1. **Extract Files**
   - Unzip the Stream Pet folder to a location on your computer
   - Recommended: `C:\StreamAssets\StreamPet\` or similar
   - **Important**: Do not move files after adding to OBS

2. **Add to OBS**
   - Open OBS Studio
   - Add a new **Browser Source**
   - Check "Local file"
   - Browse to `index.html` in the Stream Pet folder
   - Set dimensions: **1920x1080** (or your canvas size)
   - Check "Shutdown source when not visible" (optional, saves resources)
   - Check "Refresh browser when scene becomes active" (optional)

3. **Initial Configuration**
   - Right-click the browser source → Interact
   - Or open `config.html` in your web browser
   - Configure your pet's name, image, and basic settings

### Testing and Preview

The configuration interface includes a built-in preview system for instant testing:

1. **Open `config.html`** in your browser (Chrome/Edge/Firefox recommended)
2. **Make changes** to any settings (images, events, animations, etc.)
3. **Click "🔄 Sync to Preview"** button at the top of the config page
4. **Preview updates instantly** showing your changes in real-time

**Benefits of the preview system:**
- Instant visual feedback without refreshing OBS
- Use browser DevTools (F12) to inspect console errors and logs
- See JavaScript errors and warnings in real-time
- Test animations and interactions without OBS overhead
- Faster iteration on configuration changes
- Debug integration issues with network tab
- Validate localStorage state changes

**Important Note:** Due to browser security with the `file://` protocol, the preview and main page have separate localStorage instances. The "Sync to Preview" button uses `postMessage` to transfer settings from the config page to the preview iframe, allowing you to test changes before they appear in OBS. Once you're happy with your changes, they'll automatically be used by OBS's browser source.

### File Structure
```
Stream Pet/
├── index.html              # Main pet display (add to OBS)
├── config.html             # Configuration interface
├── spotify-callback.html   # Spotify OAuth callback page
├── css/
│   ├── pet.css            # Pet styling
│   └── config.css         # Config interface styling
├── js/
│   ├── pet.js             # Main pet controller
│   ├── config.js          # Configuration manager
│   ├── storage.js         # Default settings & localStorage
│   ├── twitch.js          # Twitch integration
│   └── enhancements.js    # Growth, analytics, integrations
├── Images/                # Pet images and assets
└── data/                  # Custom data files (optional)
```

---

## Configuration System

### Configuration Interface

The configuration interface (`config.html`) is divided into tabs:

1. **Pet Settings**: Basic appearance, sounds, particles, idle behavior
2. **Events**: Twitch event triggers (follows, subs, bits, raids)
3. **Commands**: Chat commands and recovery commands
4. **States**: Custom animation states
5. **Growth**: Leveling system, XP gains, evolution stages
6. **Viewer Interaction**: Channel points, chat commands, polls
7. **Greetings**: First-time chatter welcome messages
8. **Seasonal**: Holiday modes and special event reactions
8. **Advanced Animations**: Physics, weather effects, path movement
9. **Integrations**: Spotify, StreamElements, Streamlabs, webhooks
10. **Twitch**: OAuth setup, chat connection, EventSub
11. **Testing**: Test all features without going live
12. **Import/Export**: Save and load configurations
13. **Analytics**: View interaction statistics

### Storage System

Settings are stored in **localStorage** in your browser. Each setting is saved automatically after a short delay when you make changes.

**Important Notes:**
- Settings are tied to the browser and file location
- Clearing browser data will reset settings
- Use Import/Export to backup configurations
- The pet (`index.html`) reads from the same localStorage

### Configuration Workflow

1. **Make Changes**: Edit settings in any tab
2. **Auto-Save**: Settings save automatically after 2 seconds
3. **Apply**: Click "Save Configuration" to force save
4. **Preview**: Use the live preview panel (bottom right) to test
5. **Export**: Save your configuration as JSON for backup

---

## Core Features

### Pet Settings

#### Basic Settings
- **Pet Name**: Displayed in level up notifications
- **Default Image**: Main pet appearance
- **Size Mode**: How pet size is calculated (see Size Modes below)
- **Position**: Starting X/Y coordinates on screen (percentage-based)
- **Opacity**: Transparency (0.0-1.0)

#### Size Modes

The pet supports four different sizing methods to give you maximum flexibility:

**1. Fixed Pixels (Default)**
- Set exact width and height in pixels
- Recommended range: 200-400px
- Best for: Precise, consistent sizing across all screens
- Example: 300px × 300px

**2. Percentage of Screen**
- Size as percentage of viewport width (vw) and height (vh)
- Automatically scales with different screen sizes
- Recommended range: 5-20% of screen
- Best for: Responsive layouts that adapt to different resolutions
- Example: 10% screen width × 10% screen height

**3. Auto (Natural Size)**
- Uses the image's actual pixel dimensions
- No manual sizing required
- Automatically constrained to fit screen (max 100vw × 100vh)
- Best for: When you want pixel-perfect image quality at native resolution
- Example: A 512×512px image displays at exactly 512×512px

**4. Scale Factor**
- Multiplier applied to the image's natural size
- Scale of 1.0 = original size, 2.0 = double size, 0.5 = half size
- Range: 0.1x to 5.0x
- Best for: Easy scaling while preserving aspect ratio
- Example: 1.5× scale makes a 400px image display at 600px

**Maintain Aspect Ratio**
- Enabled by default (recommended)
- Prevents image distortion
- Only width is used; height calculated automatically
- Disable for custom aspect ratios (stretching/squashing)

**Choosing the Right Size Mode:**
- Use **Pixels** for exact control and consistency
- Use **Percent** for responsive designs across multiple displays
- Use **Auto** when you want natural image quality without math
- Use **Scale** for quick, proportional resizing

#### Appearance
- **Flip Horizontally**: Mirror the pet image
- **Flip Vertically**: Flip upside down
- **Shadow**: Add drop shadow for depth
- **Drag Enabled**: Allow viewers to drag pet (usually disabled for stream)

#### Sound Settings
- **Sound Enabled**: Toggle all sound effects
- **Volume**: Master volume (0.0-1.0)
- **Sound File**: Default sound for interactions

#### Particles
- **Particle Enabled**: Toggle particle effects
- **Particle Color**: Color of emitted particles
- **Particle Image**: Custom particle sprite
- **Size, Count, Spread, Speed, Gravity**: Fine-tune particle behavior

#### Idle Behavior
- **Idle Enabled**: Auto-trigger animations when inactive
- **Idle Interval**: Time between idle animations (ms)
- **Idle Animations**: List of states to randomly trigger

#### Click Behavior
- **Click Sound**: Sound when pet is clicked
- **Click Animation**: State to trigger on click
- **Click Particles**: Show particles on click

### Events System

Events trigger automatically when connected to Twitch:

| Event | Trigger | Configurable |
|-------|---------|--------------|
| **Follow** | New follower | Animation, sound, particles, text |
| **Subscribe** | New subscription | Animation, sound, particles, text |
| **Gift Sub** | Gifted subscription | Animation, sound, particles, text |
| **Bits/Cheer** | Bits donated | Animation, sound, particles, text |
| **Raid** | Channel raided | Animation, sound, particles, text |
| **Host** | Channel hosted | Animation, sound, particles, text |
| **Channel Points** | Redemption redeemed | Custom per redemption |

**Configuration Options:**
- **Enabled**: Toggle event response
- **Animation**: State to trigger
- **Sound**: Audio file to play
- **Particles**: Enable/disable particles
- **Display Text**: Show notification overlay
- **Text Template**: Customize message (e.g., `{user} followed!`)

### Commands System

#### Built-in Commands
- **!pet** - Make the pet wave/greet
- **!pet sit** - Make the pet sit
- **!pet jump** - Make the pet jump
- **!pet sleep** - Make the pet sleep
- **!pet dance** - Make the pet dance

#### Custom Commands
Add unlimited custom commands:
1. Go to Commands tab
2. Click "Add Custom Command"
3. Set command name (e.g., `!bark`)
4. Choose animation state
5. Optional: Custom sound, particles, cooldown

#### Recovery Commands
Emergency commands to fix issues:
- **!pet reset** - Reset to default position
- **!pet show** - Make pet visible
- **!pet hide** - Make pet invisible
- **!pet stop** - Stop all animations

**Permissions:**
- Set who can use commands (Everyone, Subscribers, VIPs, Mods, Broadcaster)
- Configure per-command cooldowns

### States System

States define the pet's animations and appearances:

**Default States:**
- `idle` - Default resting state
- `happy` - Excited/happy animation
- `wave` - Greeting wave
- `sit` - Sitting position
- `jump` - Jumping animation
- `sleep` - Sleeping/resting
- `dance` - Dancing animation

**Custom States:**
1. Go to States tab
2. Click "Add Custom State"
3. Configure:
   - **Name**: State identifier (e.g., `excited`)
   - **Display Name**: User-friendly name
   - **Image**: Path to image file
   - **Duration**: How long state lasts (ms)
   - **Sound**: Optional sound effect
   - **Next State**: State to transition to after duration

**State Properties:**
- **Loop**: Repeat animation indefinitely
- **One-shot**: Play once then return to idle
- **Transition**: Automatically chain to another state

---

## Integration Setup

### Twitch Integration

#### Prerequisites
- Twitch account (main broadcaster account)
- Optional: Separate bot account for chat messages

#### Step 1: Create Twitch App
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Click "Register Your Application"
3. Fill in:
   - **Name**: `StreamPet_YourChannelName`
   - **OAuth Redirect URLs**: `http://localhost/` or your config.html URL
   - **Category**: Chat Bot or similar
4. Click "Create"
5. Copy the **Client ID**

#### Step 2: Configure in Stream Pet
1. Open Config → Twitch tab
2. Enable Twitch Integration
3. Enter your **Channel Name** (without #)
4. Paste **Client ID**
5. Set **Redirect URI** (must match Twitch app settings)

#### Step 3: Authenticate
1. Click "Authenticate Main Account"
2. Login to Twitch and authorize
3. You'll be redirected back - authentication complete
4. Status should show "Connected"

#### Step 4: Test Connection
1. Go to Testing tab
2. Click "Test Follow" or other event
3. Pet should respond in preview panel

**Bot Account (Optional):**
- Follow same process with "Authenticate Bot Account"
- Bot will send chat messages instead of main account
- Useful for keeping automated messages separate

#### EventSub Setup
EventSub provides real-time event notifications:
- **Automatic**: Connects when main account is authenticated
- **Required Scopes**: Automatically requested during auth
- **Status**: Check Twitch tab → Connection Info → EventSub status

### Spotify Integration

#### Step 1: Create Spotify App
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create App"
3. Fill in:
   - **App Name**: Stream Pet
   - **App Description**: Interactive stream pet
   - **Redirect URI**: See step 2
4. Click "Create"
5. Copy **Client ID**

#### Step 2: Upload Callback Page (Recommended)
The included `spotify-callback.html` provides a branded OAuth experience.

**GitHub Pages Hosting:**
1. Create [GitHub account](https://github.com) (free)
2. Create new repository (name: `stream-pet`, make it Public)
3. Upload `spotify-callback.html` to repository
4. Go to Settings → Pages
5. Enable Pages from `main` branch
6. Your callback URL: `https://YOUR-USERNAME.github.io/stream-pet/spotify-callback.html`

**Alternative:**
- Upload to any web host
- Use `https://example.com/callback` (works but shows error page)

#### Step 3: Configure Spotify App
1. In Spotify Dashboard, click your app → Settings
2. Click "Edit Settings"
3. Under "Redirect URIs":
   - Add your callback URL exactly
   - Click "Add"
   - Click "Save" at bottom
4. **Important**: Wait 30 seconds for changes to propagate

#### Step 4: Configure in Stream Pet
1. Open Config → Integrations → Spotify
2. Enable Spotify Integration
3. Paste **Client ID**
4. Enter **Redirect URI** (must match Spotify Dashboard exactly)
5. Click "Connect Spotify"
6. Authorize on Spotify
7. Copy token from callback page
8. Paste and click "Complete Login"

#### Spotify Features
- **Now Playing**: Pet reacts to currently playing music
- **Genre Reactions**: Different animations for different genres
- **Playlist Changes**: Trigger events on song changes

**Genre Animations:**
Configure in Integrations → Spotify → Genre Reactions:
- Rock → headbang animation
- Electronic → dance animation
- Classical → calm sway
- And more...

### StreamElements / Streamlabs Integration

#### StreamElements Setup
1. Get your **JWT Token**:
   - Go to [StreamElements Dashboard](https://streamelements.com/dashboard)
   - Click Account Settings → Channels → Show Secrets
   - Copy JWT Token
2. Config → Integrations → StreamElements
3. Enable integration
4. Paste JWT Token
5. Save

**Events Supported:**
- Donations/Tips
- Merch purchases
- Extra life donations

#### Streamlabs Setup
1. Get your **Socket Token**:
   - Go to [Streamlabs Dashboard](https://streamlabs.com/dashboard)
   - Settings → API Settings → API Tokens
   - Copy Socket API Token
2. Config → Integrations → Streamlabs
3. Enable integration
4. Paste Socket Token
5. Save

**Events Supported:**
- Donations
- Merchandise
- Loyalty store redemptions

### Custom Webhooks

Create custom integrations with any service:

1. Config → Integrations → Custom Webhooks
2. Click "Add Custom Webhook"
3. Configure:
   - **Name**: Identifier (e.g., `StreamlabsAlt`)
   - **URL**: Webhook endpoint
   - **Method**: GET/POST
   - **Headers**: JSON object (e.g., `{"Authorization": "Bearer TOKEN"}`)
   - **Animation**: State to trigger
   - **Sound**: Optional sound effect

**Use Cases:**
- Custom alert systems
- Discord notifications
- Third-party donation platforms
- Analytics tracking

---

## Advanced Features

### Growth System

The growth system tracks engagement and levels up your pet based on stream activity.

#### Experience Sources
Configure XP gained from:
- **Follows**: Default 50 XP
- **Subscriptions**: Default 100 XP
- **Bits**: Default 1 XP per bit
- **Raids**: Default 10 XP + (1 XP × raiders)
- **Channel Points**: Default 5 XP
- **Chat Messages**: Default 1 XP
- **Commands Used**: Default 2 XP

#### Leveling Formula
```
XP Required = 100 × (1.5 ^ (level - 1))
```

Example:
- Level 1 → 2: 100 XP
- Level 2 → 3: 150 XP
- Level 3 → 4: 225 XP
- Level 10 → 11: ~3,842 XP

#### Level Up Effects
Choose from 5 visual effects:
- **Glow**: Radiant pulse from pet
- **Sparkle**: Floating sparkle particles
- **Aura**: Expanding energy ring
- **Rainbow**: Multi-color wave effect
- **Pulse**: Rhythmic size animation

**Customization:**
- Effect type
- Color (hex code)
- Duration (500-5000ms)
- Intensity (0.5x-2.0x)

#### Evolution Stages
Define evolution milestones:

1. Config → Growth → Evolution Stages
2. Click "Add Evolution Stage"
3. Configure:
   - **Name**: Stage name (e.g., "Baby", "Teen", "Adult")
   - **Level**: Level required
   - **Image**: New pet appearance

**Evolution Effect:**
Epic animation when evolving:
- Burst particle explosion
- Rotating energy rings
- Radiant shine rays
- Floating stage name text
- Customizable colors and intensity

#### Level Up Bar
Configure the progress bar:
- **Style**: Classic, modern, minimal, glow, neon
- **Position**: Top, bottom, left, right
- **Offset Y**: Fine-tune vertical position
- **Duration**: Display time (ms)
- **Text Size**: Font size (px)

### Viewer Interaction

#### Channel Point Redemptions
Create custom redemptions that control the pet:

1. Set up redemption in Twitch Dashboard
2. Config → Viewer Interaction → Custom Redemptions
3. Click "Add Redemption"
4. Configure:
   - **Redemption ID**: From Twitch
   - **Name**: Display name
   - **Animation**: State to trigger
   - **Sound**: Optional sound
   - **Particles**: Enable/disable
   - **Cost**: For reference only

**Getting Redemption ID:**
- Use Twitch API
- Or use EventSub webhook logs (check browser console)

#### Chat Commands
Viewers trigger commands in chat:

**Command Format:** `!commandname [args]`

**Cooldown System:**
- **User Cooldown**: Per-user delay (default 30s)
- **Global Cooldown**: Delay for all users (default 5s)

**Permissions:**
- Everyone
- Subscribers only
- VIPs only
- Moderators only
- Broadcaster only

#### Polls
Interactive polls where chat votes control pet:

1. Enable polls in Viewer Interaction
2. Configure poll duration (default 60s)
3. Start poll via chat: `!poll [option1] [option2] [option3]`
4. Chat votes: `!vote 1` or `!vote 2` etc.
5. Winning option triggers associated animation

4. Winning option triggers associated animation

---

### First-Time Chatter Greetings

Automatically welcome viewers when they send their first message of the stream. This creates a welcoming atmosphere without spamming the same greeting to regulars every message.

#### Configuration
**Location:** Config → Greetings tab

**Settings:**
- **Enable Greetings**: Toggle the feature on/off
- **Greeting State**: Animation to play (e.g., "wave", "happy")
- **Sound**: Optional audio file to play
- **Particles**: Show particle effects on greeting
- **Duration**: How long to display the greeting message (default: 5000ms)

#### Random Greeting Messages
Create a pool of greeting messages that the pet randomly selects from:

**Message Format:**
- Use `{user}` placeholder for the viewer's display name
- Example: `"Welcome {user}! Thanks for chatting! 💜"`

**Adding Messages:**
1. Enter message in the "Add New Greeting Message" field
2. Click "+ Add" button
3. Messages appear in the list above

**Editing/Deleting:**
- Edit inline by clicking in the message text field
- Click "Delete" to remove a message
- Minimum 1 message recommended

**Default Messages:**
```
Welcome {user}! Thanks for chatting! 💜
Hey {user}! Great to see you here! 👋
Hello {user}! Thanks for joining the chat! ✨
{user} is here! Welcome! 🎉
Hi {user}! Happy to have you chatting! 😊
```

#### Custom User Greetings
Set specific greeting messages for individual users (VIPs, mods, friends, etc.):

**Adding Custom Greetings:**
1. Enter the Twitch username (case-insensitive)
2. Enter the custom greeting message
3. Click "+ Add"

**Examples:**
```
Username: "hana_cee"
Message: "The queen herself has arrived! 👑"

Username: "your_mod_name"
Message: "Welcome back, {user}! Thanks for keeping chat awesome! 💜"

Username: "best_friend123"
Message: "Hey bestie! {user} is in the house! ✨"
```

**Priority:** Custom user greetings override random messages.

#### Session Management
The greeting system tracks who has been greeted during the current stream session:

**Session Data:**
- Stored in memory (not persistent across refreshes)
- Resets when OBS is restarted or browser source is refreshed
- Each user is greeted only once per session

**Manual Reset:**
Click "Reset Session Data" to clear the greeted users list. Useful for:
- Testing greeting messages
- Allowing re-greets for returning viewers
- Starting a fresh greeting session mid-stream

**Statistics Display:**
- **Greetings sent this session**: Total number of greetings triggered
- **Unique chatters greeted**: Number of individual users greeted

#### Technical Details

**Trigger Mechanism:**
- Monitors Twitch chat via `message` event in `twitch.js`
- Tracks user IDs in a Set (`greetedChatters`)
- First message per user ID triggers greeting flow

**Execution Flow:**
1. User sends first message
2. System checks if user ID is in `greetedChatters` Set
3. If not greeted:
   - Add user ID to Set
   - Check for custom greeting (username match)
   - If no custom, select random from message pool
   - Replace `{user}` placeholder with display name
   - Trigger greeting state/animation
   - Display message overlay
   - Play sound (if configured)
   - Show particles (if enabled)
   - Increment statistics

**Configuration Storage:**
```javascript
greetings: {
    enabled: true,
    state: 'wave',           // Animation state
    sound: '',               // Optional sound file
    particles: true,         // Show particles
    duration: 5000,          // Message duration (ms)
    messages: [              // Random message pool
        'Welcome {user}! Thanks for chatting! 💜',
        // ... more messages
    ],
    customGreetings: {       // User-specific messages
        'username': 'Custom message for user'
    }
}
```

**Use Cases:**
- Welcoming new viewers warmly
- Recognizing regulars without spam
- Special greetings for team members/VIPs
- Creating inclusive chat atmosphere
- Tracking viewer engagement

---

### Seasonal/Holiday Modes

Automatic theme switching based on date:

#### Built-in Holidays
- **Halloween** (October): Spooky theme
- **Christmas** (December): Festive theme
- **New Year** (January 1): Celebration theme
- **Valentine's Day** (February 14): Love theme
- **Easter** (Variable): Spring theme

#### Custom Holiday Modes
1. Config → Seasonal → Custom Holidays
2. Click "Add Holiday"
3. Configure:
   - **Name**: Holiday name
   - **Start Date**: MM-DD
   - **End Date**: MM-DD
   - **Pet Image**: Themed image
   - **Background**: Optional background image
   - **Particles**: Special particle effects
   - **Events**: Custom event responses

#### Time-Based Changes
React to time of day:
- Morning (6 AM - 12 PM)
- Afternoon (12 PM - 6 PM)
- Evening (6 PM - 12 AM)
- Night (12 AM - 6 AM)

**Per-Time Settings:**
- Different pet images
- Ambient particles
- Background changes

### Advanced Animations

#### Physics System
Enable realistic physics-based movement:

1. Config → Advanced Animations → Physics
2. Enable physics mode
3. Configure:
   - **Gravity**: Downward force (0-2)
   - **Bounce**: Bounciness on collision (0-1)
   - **Friction**: Movement resistance (0-1)
   - **Mass**: Pet weight (affects momentum)

**Controls:**
- **Toggle Physics**: Enable/disable in real-time
- **Apply Force**: Random push for fun
- **Reset Position**: Return to starting point

#### Weather Effects
Overlay weather on stream:

**Weather Types:**
- **Rain**: Falling raindrops
- **Snow**: Gentle snowflakes
- **Storm**: Heavy rain with lightning
- **Leaves**: Autumn falling leaves
- **Petals**: Cherry blossom petals
- **Stars**: Twinkling stars

**Configuration:**
- Intensity (1-10)
- Particle count
- Fall speed
- Wind direction

**Usage:**
- Manual trigger from Testing tab
- Event-triggered (e.g., raid = confetti)
- Seasonal automatic (e.g., snow in December)

#### Path Movement
Make pet follow custom paths:

**Preset Paths:**
- Circle: Smooth circular motion
- Wave: Sine wave pattern
- Figure-8: Infinity loop
- Bounce: Edge-to-edge bounce

**Custom Paths:**
1. Define waypoints (X, Y coordinates)
2. Set duration for full path
3. Choose easing function
4. Loop or one-shot

**Path Controls:**
- Start/stop path
- Adjust speed
- Reset to origin

#### Particle System
Advanced particle effects:

**Particle Properties:**
- **Type**: Shape (circle, square, image)
- **Color**: RGB or hex
- **Size**: Min/max size (px)
- **Count**: Particles per burst
- **Spread**: Emission cone angle
- **Speed**: Velocity multiplier
- **Gravity**: Particle fall rate
- **Lifetime**: Duration before fadeout
- **Alpha**: Opacity curve

**Presets:**
- Confetti
- Fireworks
- Hearts
- Stars
- Custom images

---

## Troubleshooting

### Common Issues

#### Pet Not Appearing in OBS

**Symptoms:** Browser source is blank or shows white screen

**Solutions:**
1. **Check File Path**
   - Right-click source → Properties
   - Verify path points to `index.html`
   - Path should be absolute (full path)
   
2. **Browser Source Settings**
   - Width/Height should match canvas (usually 1920x1080)
   - "Local file" should be checked
   - Try unchecking "Shutdown source when not visible"

3. **Clear Cache**
   - Right-click source → Refresh cache of current page
   - Or delete and re-add browser source

4. **Console Errors**
   - Right-click source → Interact
   - Press F12 to open developer tools
   - Check Console tab for errors
   - Common error: File path incorrect

#### Configuration Not Saving

**Symptoms:** Settings reset when refreshing config page

**Solutions:**
1. **Check Browser Storage**
   - Open config.html in browser
   - Press F12 → Application tab → Local Storage
   - Verify entries exist for your file path
   
2. **Try Different Browser**
   - Some browsers block localStorage for local files
   - Chrome/Edge usually work best
   - Firefox may require security setting changes

3. **File Protocol**
   - Open via `file://` protocol
   - Avoid opening through server unless configured

4. **Manual Save**
   - Click "Save Configuration" button explicitly
   - Don't rely only on auto-save

5. **Export/Import Workaround**
   - Export config as JSON
   - Save JSON file
   - Import when needed

#### Twitch Connection Failed

**Symptoms:** "Not connected" or "Authentication failed"

**Solutions:**
1. **Verify Client ID**
   - Must be from Twitch Developer Console
   - Copy/paste exactly (no extra spaces)
   - Check app status (should be active)

2. **Redirect URI Mismatch**
   - Must match EXACTLY in Twitch app settings
   - Include protocol (http:// or https://)
   - Include trailing slash if used in app

3. **Scope Issues**
   - Pet requests specific scopes during auth
   - If denied, re-authenticate and approve all

4. **Token Expired**
   - Twitch tokens expire after ~4 hours
   - Re-authenticate when needed
   - App will prompt if token invalid

5. **EventSub Not Connecting**
   - Requires main account authentication
   - Check browser console for error messages
   - Verify channel name is correct (case-sensitive)

6. **Anonymous Mode**
   - Can read chat but no EventSub
   - No authentication required but limited features

#### Spotify Integration Issues

**Symptoms:** "INVALID_CLIENT" or connection errors

**Solutions:**
1. **Redirect URI Not Added**
   - Most common issue
   - Go to Spotify Dashboard → App → Settings
   - Edit Settings → Redirect URIs
   - Add EXACT URL (including https://)
   - Click "Add" then "Save"
   - Wait 30-60 seconds

2. **URL Mismatch**
   - Config redirect URI must match Spotify Dashboard exactly
   - Check for typos, protocols, trailing slashes
   
3. **Token Expired**
   - Spotify tokens last 1 hour
   - Re-authenticate when expired
   - Error will show in config status

4. **Callback Page Not Loading**
   - Verify callback HTML is uploaded correctly
   - Test by visiting URL directly
   - Check for 404 errors

5. **CORS Issues**
   - If hosting callback page, ensure CORS enabled
   - GitHub Pages handles this automatically

#### Events Not Triggering

**Symptoms:** Pet doesn't react to follows, subs, etc.

**Solutions:**
1. **Event Enabled Check**
   - Config → Events tab
   - Verify specific event is enabled (checkbox)

2. **Animation State Missing**
   - Event may reference non-existent state
   - Check State tab for referenced animation
   - Create state if missing

3. **Sound File Missing**
   - Event with missing sound file may fail silently
   - Verify sound file path is correct
   - Test sound in States tab

4. **EventSub Connection**
   - Must be connected for real-time events
   - Check Twitch tab → Connection Info
   - EventSub status should show "Connected"

5. **Test Events**
   - Use Testing tab to trigger events manually
   - If test works but real doesn't = connection issue
   - If test fails = configuration issue

6. **Browser Console**
   - F12 → Console in OBS browser source
   - Look for error messages
   - Often reveals missing files or syntax errors

#### Pet Size Issues

**Symptoms:** Pet appears too large, too small, distorted, or not visible

**Solutions:**
1. **Check Size Mode**
   - Config → Pet Settings → Basic Settings
   - Verify correct size mode is selected
   - Try different modes to find what works best

2. **Pet Too Large (Exceeds Screen)**
   - **Pixels mode**: Reduce width/height values (try 200-400px)
   - **Percent mode**: Reduce percentage (try 5-15%)
   - **Auto mode**: Image may be very large - switch to Scale mode
   - **Scale mode**: Reduce scale factor (try 0.5-1.0)

3. **Pet Too Small (Hard to See)**
   - **Pixels mode**: Increase width/height values (try 300-500px)
   - **Percent mode**: Increase percentage (try 10-20%)
   - **Auto mode**: Image may be small - switch to Scale mode
   - **Scale mode**: Increase scale factor (try 1.5-3.0)

4. **Pet Appears Distorted/Stretched**
   - Enable "Maintain Aspect Ratio" checkbox
   - This preserves original image proportions
   - Only affects Pixels and Percent modes

5. **Pet Doesn't Resize When Changing Settings**
   - Click "Save Configuration" button
   - Refresh the preview panel
   - Or refresh OBS browser source

6. **Different Size in OBS vs Config**
   - Ensure OBS browser source size matches canvas resolution
   - Percent mode uses viewport size (different in config vs OBS)
   - Use Pixels mode for absolute consistency

7. **Responsive Sizing Recommendations**
   - **1080p Streams**: 200-400px or 10-20% of screen
   - **1440p Streams**: 300-600px or 10-20% of screen
   - **4K Streams**: Use Scale mode (1.0-2.0×) or Percent mode

**Quick Size Mode Guide:**
```
Small pet (corner buddy): 150-250px or 8-12% or 0.5-0.8× scale
Medium pet (noticeable): 250-400px or 12-18% or 1.0-1.5× scale
Large pet (prominent): 400-600px or 18-25% or 1.5-2.5× scale
```

#### Performance Issues

**Symptoms:** Lag, stuttering, high CPU usage

**Solutions:**
1. **Reduce Particle Count**
   - Lower particle count in settings
   - Decrease particle size
   - Shorten particle lifetime

2. **Optimize Images**
   - Use PNG with transparency
   - Compress images (use TinyPNG or similar)
   - Recommended max size: 1MB per image
   - Recommended dimensions: 512x512px or less

3. **Disable Unused Features**
   - Turn off physics if not needed
   - Disable weather effects when not streaming
   - Reduce idle animation frequency

4. **Browser Source FPS**
   - OBS → Browser source properties
   - Reduce FPS to 30 if 60 is too demanding
   - Most animations work fine at 30 FPS

5. **Hardware Acceleration**
   - OBS Settings → Advanced
   - Ensure browser hardware acceleration enabled
   - Restart OBS after changing

6. **Multiple Browser Sources**
   - Each browser source is a separate Chrome instance
   - Minimize number of browser sources if possible

#### Analytics Not Displaying

**Symptoms:** Shows "[object Object]" or blank stats

**Solutions:**
1. **Refresh Analytics**
   - Click "Refresh Analytics" button in Analytics tab
   - Some stats only update on refresh

2. **Clear Data and Restart**
   - If corrupted, may need to reset
   - Export config first as backup
   - Clear localStorage for analytics
   - Restart tracking

3. **Browser Console**
   - Check for JavaScript errors
   - May indicate corrupted data structure

### Debug Mode

Enable detailed logging:

1. Open `index.html` or `config.html` in browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for Stream Pet messages
5. Check for errors (red) or warnings (yellow)

**Useful Console Commands:**
```javascript
// View current config
console.log(localStorage.getItem('streamPetConfig'));

// View analytics
console.log(localStorage.getItem('streamPetAnalytics'));

// Clear all data
localStorage.clear();

// Force save config (in config.html)
configManager.saveConfig();
```

### Reset to Defaults

If all else fails:

1. **Method 1: UI Reset**
   - Open config.html
   - Click "Reset to Defaults" button
   - Confirm when prompted

2. **Method 2: Clear Storage**
   - F12 → Application → Local Storage
   - Delete all entries
   - Refresh page

3. **Method 3: Fresh Install**
   - Backup any custom images/sounds
   - Delete Stream Pet folder
   - Re-extract from zip
   - Reconfigure from scratch

---

## Performance Optimization

### Best Practices

1. **Image Optimization**
   - Use PNG with transparency
   - Compress images before use
   - Limit to 512x512px max for most assets
   - Use sprite sheets for animations (future feature)

2. **Particle Effects**
   - Keep count under 50 for smooth performance
   - Use smaller particle sizes
   - Reduce particle lifetime
   - Disable particles on low-end systems

3. **Event Frequency**
   - Add cooldowns to prevent spam
   - Combine similar events when possible
   - Use global cooldown for chat commands

4. **Browser Source Settings**
   - Set to canvas resolution, not higher
   - Enable "Shutdown source when not visible"
   - Use 30 FPS if 60 is too demanding

5. **Memory Management**
   - Analytics data grows over time
   - Export and clear periodically
   - Restart browser source on scene activation

### Monitoring Performance

**OBS Stats:**
- OBS → View → Stats
- Watch "Rendering lag" and "Encoding lag"
- Browser sources appear under "Sources"

**Browser DevTools:**
- F12 → Performance tab
- Record 10 seconds of activity
- Look for frame drops or long tasks

---

## Development & Customization

### File Modification

The Stream Pet is built with vanilla JavaScript and can be customized:

**Key Files:**
- `js/pet.js` - Main pet logic, event handling
- `js/config.js` - Configuration interface
- `js/storage.js` - Default settings, localStorage management
- `js/twitch.js` - Twitch API, chat, EventSub
- `js/enhancements.js` - Growth, analytics, integrations

**CSS Styling:**
- `css/pet.css` - Pet appearance, animations
- `css/config.css` - Config interface styling

### Adding Custom States

Manually add states via config or edit code:

**Via Config:**
1. States tab → Add Custom State
2. Fill in all fields
3. Save

**Via Code** (advanced):
```javascript
// In storage.js, add to defaultConfig.states array:
{
    name: 'excited',
    displayName: 'Excited',
    image: 'Images/excited.png',
    duration: 3000,
    sound: 'sounds/excited.mp3',
    nextState: 'idle',
    particles: true
}
```

### Custom Animations

Add CSS animations for states:

```css
/* In pet.css */
@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-50px); }
}

.pet.bounce {
    animation: bounce 0.5s ease-in-out;
}
```

Then reference in state:
```javascript
{
    name: 'bounce',
    image: 'Images/default.png',
    animation: 'bounce',
    duration: 500
}
```

### Creating Custom Events

Add new event types to `pet.js`:

```javascript
// Listen for custom event
window.addEventListener('customEvent', (event) => {
    this.triggerState('happy', {
        sound: 'sounds/custom.mp3',
        particles: true
    });
});

// Trigger from elsewhere
window.dispatchEvent(new CustomEvent('customEvent', {
    detail: { data: 'value' }
}));
```

### API Integration

Create custom integrations by adding to `enhancements.js`:

```javascript
class CustomIntegration {
    constructor(config) {
        this.config = config;
        this.connect();
    }
    
    connect() {
        // WebSocket or API connection
        this.socket = new WebSocket('wss://api.example.com');
        this.socket.onmessage = (msg) => this.handleEvent(msg);
    }
    
    handleEvent(msg) {
        const data = JSON.parse(msg.data);
        // Trigger pet reaction
        window.dispatchEvent(new CustomEvent('petTrigger', {
            detail: {
                state: 'happy',
                sound: 'sounds/alert.mp3'
            }
        }));
    }
}
```

### Contributing

If you make improvements:
1. Test thoroughly
2. Document changes
3. Consider backward compatibility
4. Share with community (if open source)

---

## Appendix

### Keyboard Shortcuts (Config Interface)

- **Ctrl+S**: Save configuration
- **Ctrl+Shift+E**: Export config
- **Ctrl+Shift+I**: Import config
- **Ctrl+Shift+T**: Switch to Testing tab
- **F5**: Refresh preview

### Default Keybindings (Development)

Set in OBS → Settings → Hotkeys for browser source:

- **Show/Hide Pet**: Toggle visibility
- **Trigger Happy State**: Quick test
- **Reset Position**: Emergency reset

### File Size Recommendations

| Asset Type | Max Size | Recommended Dimensions |
|------------|----------|----------------------|
| Pet Image | 1 MB | 512x512px |
| Particle Image | 100 KB | 64x64px |
| Sound Effect | 500 KB | Short clips only |
| Background | 2 MB | 1920x1080px |

### Browser Compatibility

**Tested Browsers:**
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+ (with localStorage enabled)
- ✅ Opera 76+
- ⚠️ Safari (limited WebSocket support)
- ❌ Internet Explorer (not supported)

**OBS Browser Source:**
- Uses Chromium Embedded Framework (CEF)
- Equivalent to Chrome 103+
- Full feature support

### Support Resources

**Official Documentation:**
- Twitch API: https://dev.twitch.tv/docs/api/
- Spotify API: https://developer.spotify.com/documentation/web-api/
- OBS Browser Source: https://obsproject.com/wiki/Sources-Guide

**Community:**
- OBS Forums: https://obsproject.com/forum/
- Twitch Developer Forums: https://discuss.dev.twitch.tv/

**Troubleshooting:**
- OBS Log Analyzer: https://obsproject.com/tools/analyzer
- Browser Console: F12 in any browser

---

## Changelog

### Version 1.0.0
- Initial release
- Core pet functionality
- Twitch integration
- Growth system
- Basic animations
- Configuration interface

### Future Roadmap
- [ ] Sprite sheet animation support
- [ ] Multi-pet support
- [ ] Voice command integration
- [ ] Mobile companion app
- [ ] Cloud sync for configs
- [ ] Marketplace for custom pets/animations

---

**Last Updated:** November 10, 2025
**Author:** Hana_Cee
**License:** Personal Use

For questions or support, visit: https://twitch.tv/hana_cee
