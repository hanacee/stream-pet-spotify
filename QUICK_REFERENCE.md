# 🎯 Quick Reference Card

**Hana_Cee's Stream Pet - Version 1.0**

---

## 📝 5-Minute Setup Checklist

- [ ] 1. Unzip to permanent location (don't move after!)
- [ ] 2. Add YOUR pet images to `Images/` folder
- [ ] 3. Open `config.html` in Chrome/Edge
- [ ] 4. Pet Settings → Set default image to your pet
- [ ] 5. Set pet size (try 300×300 pixels)
- [ ] 6. Set position (X: 10, Y: 80 = bottom left)
- [ ] 7. OBS → + → Browser → Local file → `index.html`
- [ ] 8. OBS browser size: 1920×1080
- [ ] 9. Test: Click Testing tab → Test Follow
- [ ] 10. Working? Save config and go live! 🎉

### 🚀 Pro Tip: Local Testing
Want to test without OBS? Run `START_LOCAL_SERVER.bat` then open `http://localhost:8000/config.html` in your browser. Use F12 DevTools to debug!

---

## 🔧 Essential Settings

### Pet Settings Tab
| Setting | Recommended | Notes |
|---------|-------------|-------|
| Default Image | `Images/yourpet.png` | Your main pet PNG |
| Size Mode | Pixels | Most reliable |
| Width | 200-400px | Good for 1080p |
| Position X | 10-90% | 10=left, 90=right |
| Position Y | 10-90% | 10=top, 90=bottom |
| Opacity | 1.0 | Fully visible |

### Twitch Tab
1. Create app: https://dev.twitch.tv/console/apps
2. Paste Client ID
3. Set Redirect URI (match exactly!)
4. Click "Authenticate Main Account"
5. Check "EventSub: Connected" ✅

---

## 🎮 Default Commands

### Chat Commands
- `!pet` - Wave/greet
- `!pet sit` - Sit down
- `!pet jump` - Jump
- `!pet sleep` - Sleep
- `!pet dance` - Dance

### Recovery Commands (if pet bugs out)
- `!pet reset` - Reset position
- `!pet show` - Make visible
- `!pet hide` - Make invisible
- `!pet stop` - Stop animations

---

## 🎨 Common Tweaks

### Pet Too Big/Small?
- **Pixels mode:** Change width/height
- **Try Scale mode:** 1.0 = normal, 0.5 = half, 2.0 = double

### Pet Not Reacting to Events?
1. Check Twitch tab → EventSub connected? ✅
2. Check Events tab → Event enabled? ✅
3. Check States tab → Animation exists? ✅
4. Test with Testing tab first!

### Settings Not Saving?
- Use Chrome or Edge (best)
- Click "Save Configuration" button
- Export config as backup (Import/Export tab)

---

## 📂 File Locations

| What | Where |
|------|-------|
| Pet images | `Images/yourpet.png` |
| Config file | Open `config.html` |
| OBS source | Point to `index.html` |
| User guide | Open `user_guide.html` |
| Tech docs | Read `TECHNICAL_GUIDE.md` |

---

## 🔥 Pro Tips

1. **Test before going live** - Use Testing tab
2. **Export your config** - Backup in Import/Export tab
3. **Keep images small** - 512×512px, under 1MB
4. **Use descriptive names** - `happy.png` not `img_001.png`
5. **Set cooldowns** - Prevent chat spam (30s per user)
6. **Enable auto-save** - Settings save after 2 seconds
7. **Check browser console** - F12 to see errors
8. **Match aspect ratio** - Check "Maintain Aspect Ratio"

---

## 🆘 Emergency Fixes

| Problem | Fix |
|---------|-----|
| Blank OBS source | Refresh cache, check file path |
| Pet off-screen | Chat: `!pet reset` |
| Events not working | Check Twitch → EventSub status |
| Lag/stuttering | Reduce particles, disable physics |
| Can't find settings | Press F12, check localStorage |

---

## 📞 Get Help

1. **Read:** `user_guide.html` (friendly version)
2. **Read:** `TECHNICAL_GUIDE.md` (detailed version)
3. **Check:** Troubleshooting sections in guides
4. **Visit:** https://twitch.tv/hana_cee

---

## 🎯 Next Level Features

Once basic setup works:
- ✨ Add growth/leveling (Growth tab)
- 🎨 Create custom states (States tab)
- 🎵 Connect Spotify (Integrations tab)
- 🎃 Set seasonal themes (Seasonal tab)
- ⚡ Add physics/weather (Advanced Animations tab)
- 📊 View analytics (Analytics tab)

---

**Made with 💜 by Hana_Cee**  
https://twitch.tv/hana_cee
