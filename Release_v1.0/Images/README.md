# 📁 Images Folder

## What Goes Here?

This folder is where you put **your pet's images**!

## Included Branding Assets

The following images are included for documentation and branding purposes:
- `Hana Cee.png` - Logo used in user guide
- `hana.png` - Hana chibi character for user guide
- `StreamPet.png` - Example pet image for user guide
- `hana-avatar.png` - Avatar for config header

**Note:** These are just for the guides and callback page. You need to add your own pet images!

## Required: Add Your Pet Images

To make your Stream Pet work, you need to add your own PNG/GIF/WebP files here.

### Recommended Pet Images:

Create images for different states/emotions:

- `default.png` - Idle/resting pose (REQUIRED)
- `happy.png` - Excited expression
- `wave.png` - Greeting wave
- `sit.png` - Sitting pose
- `jump.png` - Jumping
- `sleep.png` - Sleeping
- `dance.png` - Dancing
- `sad.png` - Sad expression
- `excited.png` - Very excited
- `confused.png` - Confused look
- `angry.png` - Angry expression

### Image Guidelines:

✅ **Format:** PNG with transparency (recommended), GIF, or WebP  
✅ **Size:** 512×512px or smaller  
✅ **File Size:** Under 1MB per image  
✅ **Naming:** Use descriptive names (lowercase, no spaces)  
✅ **Transparency:** PNG with alpha channel works best  

### Where to Get Images:

- Commission an artist
- Create your own in Photoshop/Procreate
- Use AI art generators (with proper licensing)
- Use royalty-free sprite assets

### After Adding Images:

1. Open `config.html` in your browser
2. Go to **Pet Settings** tab
3. Set **Default Image** to your main pet image
4. Go to **States** tab
5. Create states for each expression/pose
6. Point each state to its corresponding image

### Example File Structure:
```
Images/
├── Hana Cee.png (included - for guides)
├── hana.png (included - for guides)
├── StreamPet.png (included - for guides)
├── hana-avatar.png (included - for config)
├── default.png (YOUR PET - ADD THIS)
├── happy.png (YOUR PET - ADD THIS)
├── wave.png (YOUR PET - ADD THIS)
├── sit.png (YOUR PET - ADD THIS)
├── sleep.png (YOUR PET - ADD THIS)
└── ... more of your pet images
```

## 💡 Tips

- **Consistent Size:** Keep all your pet images the same dimensions for smooth transitions
- **Test First:** Add one image, test it in OBS, then add the rest
- **Organize:** Use clear, descriptive filenames so you know what each image is
- **Backup:** Keep copies of your images outside this folder
- **Evolution:** Create different versions for your pet's evolution stages (baby → teen → adult)

---

**Need help?** Check `user_guide.html` or `TECHNICAL_GUIDE.md` for detailed setup instructions!
