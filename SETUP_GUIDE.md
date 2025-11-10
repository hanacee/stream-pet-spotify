# Stream Pet - Quick Setup Guide

## ⚡ 5-Minute Setup

### Step 1: Add Images (2 minutes)
1. Open `config.html` in your browser
2. Go to **Pet Settings** tab
3. **Drag & drop** your pet images onto the input fields:
   - Default Image: Your pet's normal look
   - Blink Image: Same as default but with closed eyes
4. (Optional) Add images for events and states
5. Click **Save Configuration**

### Step 2: Add to OBS (1 minute)
1. In OBS, add a **Browser Source**
2. Set URL to: `file:///F:/Hana%20Cee%20stuff/OBS%20Stuff/Stream%20Pet%20Browser%20Source/index.html`
   (Use your actual file path)
3. Width: 1920, Height: 1080
4. Check "Shutdown source when not visible"
5. Click OK

### Step 3: Test (1 minute)
1. Back in `config.html`, go to **Testing** tab
2. Click "Test Follow" - does your pet react?
3. If yes, you're done! If no, check troubleshooting below

### Step 4: Twitch Integration (1 minute for basic)
1. Go to **Twitch** tab
2. Check "Enable Twitch Integration"
3. Enter your channel name
4. Keep "Use Anonymous Connection" checked
5. Save configuration
6. Add this to `index.html` before `</body>`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/tmi.js@1.8.5/dist/tmi.min.js"></script>
   ```

## 🎨 Image Requirements

**Minimum Setup** (2 images):
- Default image (normal state)
- Blink image (eyes closed)

**Recommended** (5+ images):
- Default (normal)
- Blink (eyes closed)
- Happy (for follows/subs)
- Excited (for raids/big events)
- Sad (for sad state)

**Image Specs:**
- Format: PNG with transparency (recommended)
- Size: 200-500px square
- File size: Under 500KB each
- Background: Transparent

## 🚀 Advanced Setup (Full OAuth)

**Time Required**: 10 minutes

### Why OAuth?
- Get follow notifications
- Channel points redemptions
- More accurate event timing
- EventSub WebSocket (real-time)

### Setup Steps:

1. **Create Twitch App** (5 min)
   - Visit: https://dev.twitch.tv/console/apps
   - Click "Register Your Application"
   - Name: Stream Pet
   - OAuth Redirect: Full path to your config.html
   - Category: Browser Extension
   - Copy the Client ID

2. **Configure Stream Pet** (2 min)
   - Open config.html → Twitch tab
   - Paste Client ID
   - Set Redirect URI (same as Twitch app)
   - Uncheck "Use Anonymous Connection"
   - Click "Authenticate Main Account"
   - Authorize on Twitch

3. **Test** (1 min)
   - Check "Connection Info" shows EventSub connected
   - Use Testing tab to verify events work

4. **(Optional) Bot Account** (2 min)
   - Check "Use Separate Bot Account"
   - Enter bot username
   - Click "Authenticate Bot Account"
   - Log in with BOT account (not main!)

## 🎯 Common Issues

### "Pet not showing in OBS"
✅ **Fix**: Check file path in browser source URL
- Right-click on index.html → Properties → Copy full path
- In OBS, use `file:///` + that path

### "Images not loading"
✅ **Fix**: Use drag & drop in config.html
- Don't manually type file paths
- Drag images directly onto input fields
- Green notification = success

### "Twitch not connecting"
✅ **Fix**: Add tmi.js to index.html
```html
<script src="https://cdn.jsdelivr.net/npm/tmi.js@1.8.5/dist/tmi.min.js"></script>
```
Add before `</body>` tag

### "Events not triggering"
✅ **Fix**: Use Testing tab first
- Test in config.html before going live
- Check events are enabled
- Verify Twitch connection status

### "OAuth not working"
✅ **Fix**: Check redirect URI
- Must match EXACTLY in both places
- Include `file:///` or `http://` prefix
- Case sensitive!

## 📋 Checklist

Before going live, verify:
- [ ] Pet shows in OBS browser source
- [ ] Blink animation works (watch for 5+ seconds)
- [ ] Test events work in Testing tab
- [ ] Twitch connection shows "Connected" (if using)
- [ ] Messages appear above pet
- [ ] Configuration is saved
- [ ] Backup exported (Import/Export tab)

## 🎬 First Stream Setup

1. **30 min before stream:**
   - Open config.html and verify settings
   - Do a final test of all events
   - Export backup configuration

2. **15 min before:**
   - Add browser source to your scene
   - Position and resize as needed
   - Test in OBS preview

3. **5 min before:**
   - Refresh browser source in OBS
   - Verify pet is visible
   - Do one final test event

4. **During stream:**
   - Monitor for first real event
   - Watch chat for command usage
   - Adjust as needed between scenes

## 🆘 Emergency Quick Fixes

**Pet disappeared mid-stream:**
- Right-click browser source → Refresh

**Events stopped working:**
- Check Twitch tab for disconnection
- Re-authenticate if needed

**Performance issues:**
- Reduce image sizes
- Lower OBS browser source FPS to 30

## 📞 Need More Help?

1. Check README.md for full documentation
2. Open browser console (F12) for error messages
3. Verify all files are in correct locations
4. Try default config (Reset to Defaults button)

## 🎉 You're Ready!

Your stream pet is now configured and ready to entertain your viewers!

**Pro Tips:**
- Start with 2-3 events enabled, add more later
- Keep messages short and readable
- Test during offline streams first
- Have fun with it! 🎮

---

**Made with ❤️ for streamers**
