# Stream Pet Browser Source

A fully customizable browser-based stream pet for Twitch with event reactions, states, and interactive features.

## 🚀 Quick Start

1. **Open Configuration**: Open `config.html` in your browser
2. **Configure Your Pet**: 
   - Set up your pet images in the Images/ folder
   - Configure pet settings, events, and states
   - Click "Save Configuration"
3. **Add to OBS**: 
   - Add a Browser Source in OBS
   - Point it to `index.html` (use file:// path or local server)
   - Set size to 1920x1080 with transparent background
4. **Test**: Use the Testing tab in config.html to simulate events

## 📁 File Structure

```
Stream Pet Browser Source/
├── index.html          # Browser source for OBS
├── config.html         # Configuration interface
├── css/
│   ├── pet.css        # Pet display styles
│   └── config.css     # Config UI styles
├── js/
│   ├── storage.js     # Configuration storage
│   ├── pet.js         # Pet behavior logic
│   ├── twitch.js      # Twitch integration
│   └── config.js      # Config UI logic
├── Images/            # Your pet images
└── PROJECT_PLAN.md    # Detailed development plan
```

## 🎨 Features

### Pet Settings
- **Custom Images**: Set default, blink, and event-specific images
  - **💡 Drag & Drop Support**: Drag image files directly onto any image input field!
  - Images are stored in your browser (localStorage) and work immediately
  - No need to manually copy files to folders
- **Blink Animation**: Configurable interval and duration
- **Positioning**: Place pet anywhere on screen
- **Size**: Adjust width and height
- **Opacity & Flip**: Fine-tune appearance

### Event Reactions
Reacts to Twitch events with custom images and messages:
- **Raids**: Welcome raiders with custom messages
- **Follows**: Thank new followers
- **Subscriptions**: Celebrate new subs
- **Gift Subs**: Recognize gift sub trains
- **Bits/Cheers**: React to bit donations
- **Channel Points**: Respond to redemptions

### Pet States
Random states that change behavior:
- **Sad**: Needs chat to cheer it up with !pet
- **Asleep**: Falls asleep, needs !wake command
- **Excited**: Gets hyped, auto-recovers
- **Custom States**: Add your own states!

### Message System
- **Speech Bubbles**: Text bubbles appear above pet
- **Variable Replacement**: Use {username}, {count}, {amount} in messages
- **Queue System**: Messages queue if overlapping

### Testing Tools
Built-in testing panel to simulate:
- All Twitch events (raid, follow, sub, etc.)
- State transitions
- Recovery commands

No need for live stream to test!

## 🔧 Configuration

### Opening Config Page
1. Open `config.html` in any modern browser
2. Make changes in the UI
3. Click "Save Configuration"
4. Refresh your browser source in OBS

### Pet Images
You have two options for adding images:

**Option 1: Drag & Drop (Recommended)**
1. Open `config.html` in your browser
2. Find any image input field (Default Image, Blink Image, Event Images, etc.)
3. Drag your image file and drop it onto the input field
4. The image is automatically stored and ready to use!
5. You'll see a green notification confirming the upload

**Option 2: Manual File Placement**
Place your pet images in the `Images/` folder:
- **default.png** - Default/idle state
- **blink.png** - Blink animation
- **happy.png** - Happy reactions
- **excited.png** - Excited reactions
- **sad.png** - Sad state
- **asleep.png** - Asleep state
- **curious.png** - Curious state

Supported formats: PNG (with transparency), JPG, GIF

### Event Configuration
Each event can be customized:
- **Enabled**: Toggle on/off
- **Image**: Which image to display
- **Message**: Text to show in bubble
- **Duration**: How long to show (milliseconds)
- **Priority**: Higher priority events override lower

### States Configuration
States are special moods your pet can enter:
- **Trigger Chance**: Probability of entering state (0-1)
- **Check Interval**: How often to check for trigger
- **Recovery Command**: Chat command to exit state (e.g., !pet)
- **Allowed Events**: Which events can trigger during state
- **Required Role**: Who can use recovery command

## 🎮 Twitch Integration

### Option 1: Anonymous Connection (Basic - No Auth)
1. Go to Twitch tab in config
2. Enable "Twitch Integration"
3. Enter your channel name
4. Check "Use Anonymous Connection"
5. Save configuration

**What Works:**
- ✅ Chat commands (!pet, !wake, custom commands)
- ✅ Raids (basic, from chat)
- ✅ Subscriptions (basic, from chat)
- ✅ Gift subs (basic, from chat)
- ✅ Bits/Cheers (basic, from chat)

**What Doesn't Work:**
- ❌ Follow notifications (requires EventSub)
- ❌ Channel Points redemptions (requires EventSub)
- ❌ Advanced event data (requires EventSub)

### Option 2: Full OAuth Authentication (Recommended)
Get access to ALL features including follows, channel points, and real-time EventSub!

#### Step 1: Create Twitch Application
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Click "Register Your Application"
3. Fill in details:
   - **Name**: "Stream Pet" (or your choice)
   - **OAuth Redirect URLs**: Add the full URL to your `config.html`
     - Example: `file:///F:/Hana%20Cee%20stuff/OBS%20Stuff/Stream%20Pet%20Browser%20Source/config.html`
     - Or if using local server: `http://localhost:8000/config.html`
   - **Category**: "Browser Extension"
4. Click "Create"
5. Copy the **Client ID**

#### Step 2: Configure in Stream Pet
1. Open `config.html`
2. Go to **Twitch** tab
3. Paste your **Client ID**
4. Set **Redirect URI** to match what you entered in step 1
5. Uncheck "Use Anonymous Connection"
6. Click **"Authenticate Main Account"**
7. Authorize the app on Twitch
8. You'll be redirected back with a success message
9. Save configuration

**What Works with OAuth:**
- ✅ Everything from anonymous connection
- ✅ **Follow notifications** (EventSub)
- ✅ **Channel Points redemptions** (EventSub)
- ✅ **Accurate subscription events** (EventSub)
- ✅ **Real-time raid notifications** (EventSub)
- ✅ **Accurate bits/cheer events** (EventSub)

**Required Scopes:**
- `chat:read` - Read chat messages
- `chat:edit` - Send chat messages (for bot responses)
- `channel:read:subscriptions` - Subscription events
- `bits:read` - Bits/cheer events
- `channel:read:redemptions` - Channel points
- `moderator:read:followers` - Follow notifications

### Option 3: Bot Account (Advanced)
Use a separate Twitch account for sending chat messages!

**Why use a bot account?**
- Keeps your main account's chat clean
- Dedicated account for automated messages
- Professional appearance

**Setup:**
1. Complete OAuth setup (Option 2) first
2. In Twitch tab, check **"Use Separate Bot Account"**
3. Enter your bot's Twitch username
4. Click **"Authenticate Bot Account"**
5. Log in with your **bot** Twitch account (not your main account!)
6. Authorize the app
7. Save configuration

The pet will now:
- Monitor chat with your main account (receive events)
- Send messages with your bot account

### Adding tmi.js (Required for Chat)
Add this line to `index.html` before the closing `</body>` tag:
```html
<script src="https://cdn.jsdelivr.net/npm/tmi.js@1.8.5/dist/tmi.min.js"></script>
```

### Connection Status
Check the "Connection Info" section in the Twitch tab to see:
- **Chat Client**: Connected to Twitch chat
- **Bot Client**: Bot account connection status
- **EventSub**: EventSub WebSocket connection (OAuth required)

## 📊 Import / Export

### Export Configuration
1. Go to Import/Export tab
2. Click "Export to File"
3. Save JSON file as backup

### Import Configuration
1. Go to Import/Export tab
2. Select a JSON file
3. Click "Import from File"

### Share Configurations
Export your config and share with other streamers!

## 🧪 Testing

### Testing Without Stream
1. Open `config.html`
2. Go to Testing tab
3. Click buttons to simulate events
4. Watch preview panel or refresh browser source

### Test Events
- **Raid**: Enter username and viewer count
- **Follow/Sub**: Enter username
- **Bits**: Enter username and amount
- **States**: Trigger any state instantly
- **Commands**: Test recovery commands

## 🐛 Debug Mode

Enable in Pet Settings → Debug Mode

Shows debug panel with:
- Event triggers
- State changes
- Errors and warnings
- Timestamps

## ⚙️ OBS Setup

### Browser Source Settings
- **Width**: 1920
- **Height**: 1080
- **FPS**: 30 (or 60 for smoother animations)
- **Custom CSS**: (leave blank)
- **Shutdown source when not visible**: Unchecked
- **Refresh browser when scene becomes active**: Optional

### URL
Use local file path:
```
file:///F:/Hana%20Cee%20stuff/OBS%20Stuff/Stream%20Pet%20Browser%20Source/index.html
```

Or use a local server (recommended for Twitch integration):
```
http://localhost:8000/index.html
```

## 🎯 Tips & Tricks

1. **Test Everything**: Use the testing tools extensively before going live
2. **Backup Config**: Export your configuration regularly
3. **Image Size**: Keep images under 500KB for best performance
4. **Message Length**: Keep messages short (under 50 characters)
5. **State Balance**: Don't set trigger chances too high or pet will change too often
6. **Recovery Commands**: Make them memorable and easy to type
7. **OAuth Recommended**: Set up OAuth for full functionality (follows, channel points)
8. **Bot Account**: Use a bot account if you plan to send many automated messages
9. **EventSub Reliability**: EventSub provides more accurate events than chat parsing
10. **Token Security**: Never share your access tokens or Client Secret

## 🔜 Future Enhancements

Ideas for future development:
- Sound effects per event
- Particle effects
- Movement animations
- Multiple pets
- Growth/evolution system
- Analytics dashboard
- Sprite sheet support
- Weather effects

## 📝 Credits

Created for Hana Cee's Twitch stream
Built with vanilla JavaScript, HTML5, and CSS3

## 🆘 Troubleshooting

**Pet not showing in OBS**
- Check file path is correct
- Enable "Refresh browser when scene becomes active"
- Try adding `?v=` + timestamp to URL

**Twitch not connecting**
- Verify tmi.js is loaded (check browser console)
- Check channel name (no # prefix)
- For OAuth: verify Client ID and Redirect URI match exactly
- Check authentication status in Twitch tab
- Try re-authenticating (disconnect then authenticate again)
- EventSub requires OAuth (not anonymous mode)
- Check browser console for WebSocket errors

**OAuth/Authentication Issues**
- Redirect URI must match EXACTLY (including http:// vs https://)
- Client ID must be from a valid Twitch app
- Access tokens expire - re-authenticate if events stop working
- Bot account needs separate authentication
- Check "Connection Info" in Twitch tab for status

**Images not loading**
- Use relative paths (Images/default.png)
- Check file names match exactly (case-sensitive)
- Verify images are in Images/ folder

**Config not saving**
- Check browser console for errors
- Try exporting/importing JSON manually
- Ensure localStorage is enabled

## 📧 Support

For issues or questions, check the PROJECT_PLAN.md for detailed technical information.

---

**Version**: 1.0.0  
**Last Updated**: November 2025
