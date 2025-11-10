# Browser Source Stream Pet - Development Plan

## Project Overview
A browser-based stream pet system for Twitch with configurable animations, event reactions, and interactive states.

## Core Architecture

### Files Structure
```
stream-pet/
├── index.html          # Browser source (what OBS displays)
├── config.html         # Configuration interface
├── css/
│   ├── pet.css        # Pet display styles
│   └── config.css     # Configuration UI styles
├── js/
│   ├── pet.js         # Pet behavior logic
│   ├── config.js      # Configuration logic
│   ├── twitch.js      # Twitch integration
│   └── storage.js     # Local storage management
├── images/            # Pet images folder
└── data/
    └── config.json    # Default configuration
```

## Phase 1: Foundation (Week 1)

### Step 1.1: Basic Display System
- Create `index.html` with canvas or div-based pet display
- Implement image loading and switching system
- Add CSS for positioning and animations

### Step 1.2: Configuration Storage
- Create `storage.js` for localStorage management
- Define configuration schema:
```javascript
{
  pet: {
    defaultImage: "path/to/default.png",
    blinkImage: "path/to/blink.png",
    blinkInterval: 5000,
    blinkDuration: 200,
    position: { x: 50, y: 50 },
    size: { width: 200, height: 200 }
  },
  events: {
    raid: {
      enabled: true,
      image: "path/to/raid.png",
      message: "Welcome {raider} and their {viewers} viewers!",
      duration: 5000,
      sound: "path/to/sound.mp3"
    },
    follow: { ... },
    sub: { ... },
    bits: { ... },
    donation: { ... }
  },
  states: {
    sad: {
      image: "path/to/sad.png",
      triggerChance: 0.1,
      recoveryCommand: "!cheer",
      allowedEvents: ["raid", "sub"],
      message: "I'm feeling sad..."
    },
    asleep: { ... }
  }
}
```

### Step 1.3: Basic Animation System
- Implement blink animation with configurable timing
- Add smooth transitions between images
- Create animation queue system for overlapping events

## Phase 2: Configuration Interface (Week 1-2)

### Step 2.1: Configuration HTML Structure
```html
<!-- config.html sections -->
- Pet Settings (default/blink images, timing)
- Event Configuration (per-event settings)
- State Management (custom states)
- Test Controls (simulate events)
- Import/Export Settings
```

### Step 2.2: Image Selection System
- File picker for local images
- Image preview functionality
- Drag-and-drop support
- URL input option for hosted images

### Step 2.3: Event Configuration Panel
- Toggle enable/disable per event
- Custom message with variable placeholders
- Image selection per event
- Duration and animation settings
- Priority levels for overlapping events

## Phase 3: Twitch Integration (Week 2)

### Step 3.1: Twitch EventSub/PubSub Setup
- Implement Twitch authentication (OAuth)
- Connect to EventSub WebSocket or use tmi.js
- Handle connection states and reconnection

### Step 3.2: Event Handlers
```javascript
// Event types to handle
- channel.raid
- channel.follow  
- channel.subscribe
- channel.cheer (bits)
- channel.channel_points_custom_reward_redemption
- chat messages (for commands)
```

### Step 3.3: Message Bubble System
- Create bubble UI component
- Text formatting with variable replacement
- Positioning relative to pet
- Animation in/out effects
- Queue system for multiple messages

## Phase 4: State System (Week 2-3)

### Step 4.1: State Manager
- Random state trigger system
- Cooldown between state changes
- State persistence during events
- Priority system (some states override others)

### Step 4.2: Command System
- Parse chat for recovery commands
- User permission levels (mod/VIP/all)
- Cooldown on command usage
- Multiple recovery methods per state

### Step 4.3: Event Filtering by State
- Allow/block events during states
- Modified reactions in different states
- State-specific message variations

## Phase 5: Testing & Polish (Week 3)

### Step 5.1: Test Panel in Config
```javascript
// Test controls
- Simulate raid (with custom username/count)
- Simulate follow/sub/bits
- Trigger specific states
- Send test chat commands
- Connection status display
```

### Step 5.2: Advanced Features
- Sound effects per event/state
- Particle effects
- Movement animations
- Click interactions
- Idle animations

### Step 5.3: Performance & Reliability
- Resource optimization
- Error handling and recovery
- Offline mode (works without Twitch connection)
- Auto-save configuration

## Enhancement Suggestions

### 1. **Multi-Pet Support**
- Allow multiple pets on screen
- Pet interaction animations
- Different pets for different events

### 2. **Growth System**
- Pet evolves based on stream metrics
- Levels/experience from events
- Unlockable images/animations

### 3. **Viewer Interaction**
- Channel point redemptions for pet actions
- Voting system for pet decisions
- Pet name customization by chat

### 4. **Seasonal/Holiday Modes**
- Automatic holiday themes
- Special event reactions
- Time-based state changes

### 5. **Analytics Dashboard**
- Track pet interactions
- Most triggered states
- Popular commands
- Event frequency

### 6. **Preset Library**
- Share/import pet configurations
- Community preset marketplace
- Quick theme switching

### 7. **Advanced Animations**
- Sprite sheet support
- Physics-based movement
- Weather effects overlay
- Day/night cycle

### 8. **Integration Extensions**
- StreamElements/Streamlabs alerts
- Discord notifications
- OBS WebSocket control
- Spotify current song reactions

## Technical Implementation Details

### Security Considerations
- Sanitize all user inputs
- Validate image URLs
- Rate limit command processing
- Secure token storage

### Browser Compatibility
- Target modern browsers (Chrome/Firefox/Edge)
- Fallbacks for missing features
- Mobile preview support

### Data Persistence
- Local storage for settings
- Cloud backup option
- Import/export as JSON
- Version migration system

## Development Milestones

**Week 1**: Basic pet display, configuration UI, animation system
**Week 2**: Twitch integration, event handling, message system  
**Week 3**: State system, command handling, testing tools
**Week 4**: Polish, bug fixes, documentation

## Testing Checklist

- [ ] Pet displays correctly in OBS
- [ ] All animations work smoothly
- [ ] Configuration saves/loads properly
- [ ] Twitch events trigger correctly
- [ ] States transition appropriately
- [ ] Commands work from chat
- [ ] Message bubbles display clearly
- [ ] No memory leaks over time
- [ ] Works offline gracefully
- [ ] Handles errors without crashing

This plan provides a solid foundation for your stream pet while leaving room for creativity and expansion. Start with Phase 1 to get the core working, then iterate based on what feels most important for your stream!
