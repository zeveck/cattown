# Clara's Cat Town

A browser-based action RPG where you explore a charming town with your customizable cat companion.

![Cat Town Screenshot](screenshot.png)

## Features

- **Exploration**: Walk around town, enter houses, and rescue animal friends from chests
- **Transformation**: Transform between human and cat forms
- **Interior Design**: Decorate your house with furniture from the shop

## How to Play

### Getting Started
1. Open `index.html` in a web browser
2. Customize your character and cat
3. Click "Start Adventure" to begin

### Controls
- **Arrow Keys** - Move your character
- **T** - Transform between human and cat
- **SPACE** - Magic attack
- **E** - Interact with objects and NPCs

### Gameplay
- Explore the town and enter houses
- Shop for furniture to decorate your home
- Click and drag to place or move furniture inside your house
- Find treasures in chests scattered around town

## File Structure

```
cattown/
├── index.html          # Main HTML file
├── game.js            # Game logic and mechanics
├── styles.css         # Styling
├── graphics/          # Game sprites and assets
│   ├── cat.png
│   ├── girl.png
│   ├── houses/
│   ├── house-items/
│   └── ...
└── music/             # Audio files
```

## Recent Updates

- Fixed furniture placement bug where clicking to place new furniture would accidentally select already-placed furniture
- Improved interior furniture shop interaction

## Technical Details

- Pure JavaScript (no frameworks)
- HTML5 Canvas for rendering
- Local storage for save data (planned)

## Development

Simply edit the files and refresh your browser to see changes. No build process required.

---

Made with creativity and code. (And by Claude. Graphics from ChatGPT.)
