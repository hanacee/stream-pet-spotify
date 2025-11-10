# 🐾 Hana_Cee's Stream Pet - Version 1.0

Welcome to **Hana_Cee's Stream Pet**! This is an interactive browser source for OBS Studio that reacts to Twitch events, chat commands, and more.

## 📦 What's Included

### Core Files
- `index.html` - Main pet display (add this to OBS as a Browser Source)
- `config.html` - Configuration interface (open in browser to customize)
- `spotify-callback.html` - Spotify OAuth callback page (upload to GitHub Pages)

### Documentation
- `user_guide.html` - Friendly streamer-focused guide (open in browser)
- `TECHNICAL_GUIDE.md` - In-depth technical documentation
- `README.md` - Quick start guide
- `PROJECT_PLAN.md` - Feature roadmap

### Code
- `css/` - Styling for pet and config interface
- `js/` - All functionality (pet logic, Twitch integration, growth system, etc.)

### Images
- `Images/` - Branding assets for guides and callback page

## 🎨 IMPORTANT: Add Your Own Pet Images!

**This release does NOT include default pet images.** You must add your own!

### Quick Setup:
1. Add your pet PNG/GIF files to the `Images/` folder
2. Open `config.html` in your browser
3. Go to **Pet Settings** → **Appearance**
4. Set **Default Image** to your pet image (e.g., `Images/my-pet.png`)
5. Configure states with different pet expressions/poses

### Recommended Images:
- **default.png** - Your pet's idle/resting pose
- **happy.png** - Excited/happy expression
- **wave.png** - Greeting wave
- **sit.png** - Sitting pose
- **sleep.png** - Sleeping
- **dance.png** - Dancing animation

**Image Tips:**
- Use PNG with transparency
- Recommended size: 512×512px or smaller
- Keep under 1MB per image
- Name them descriptively (e.g., `excited.png`, `confused.png`)

## 🚀 Quick Start

1. **Unzip this folder** to a permanent location (e.g., `C:\StreamAssets\StreamPet\`)
2. **Add your pet images** to the `Images/` folder
3. **Open OBS** → Sources → + → Browser
4. Check **"Local file"** and browse to `index.html`
5. Set dimensions to your canvas size (usually 1920×1080)
6. **Open `config.html`** in Chrome/Edge
7. Configure your pet (name, images, size, position)
8. Set up Twitch integration in the **Twitch** tab
9. Test everything in the **Testing** tab

### 🧪 Optional: Local Testing Setup

For faster development and debugging, run a local web server:

1. **Ensure Python is installed** (usually included in Windows 10/11)
2. **Double-click `START_LOCAL_SERVER.bat`** in the Stream Pet folder
3. **Open browser to:**
   - Config: `http://localhost:8000/config.html`
   - Pet: `http://localhost:8000/index.html`
4. **Press F12** for DevTools - see console errors, test animations
5. **Press Ctrl+C** in command window to stop server

**Why use local server?**
- See JavaScript errors instantly
- Test changes without refreshing OBS
- Use browser DevTools for debugging
- Faster iteration on configuration

## 📖 Documentation

- **New to this?** Start with `user_guide.html` (open in browser)
- **Need details?** Read `TECHNICAL_GUIDE.md`
- **Want to customize code?** Check the JS files in `js/` folder

## 🔧 System Requirements

- **OBS Studio** 28.0 or newer
- **Browser** Chrome, Edge, or Firefox (for config interface)
- **Twitch Account** (for events and chat)
- **Optional:** Spotify account (for music reactions)

## 💜 Credits

Created by **Hana_Cee**
- Twitch: https://twitch.tv/hana_cee
- Custom cyberpunk branding included in callback page

## 📝 Version Info

**Version:** 1.0.0  
**Release Date:** November 10, 2025  
**License:** Personal Use

## 🆘 Need Help?

1. Check `user_guide.html` for common setup questions
2. Check `TECHNICAL_GUIDE.md` troubleshooting section
3. Verify all file paths point to correct locations
4. Open browser console (F12) to check for errors
5. Visit https://twitch.tv/hana_cee for support

---

## 🎯 Next Steps After Setup

1. ✅ Add your pet images to `Images/` folder
2. ✅ Configure pet settings in `config.html`
3. ✅ Set up Twitch integration
4. ✅ Create custom states for different expressions
5. ✅ Test with Testing tab before going live
6. ✅ Export your config as backup (Import/Export tab)

**Enjoy your Stream Pet!** 💜🐾
