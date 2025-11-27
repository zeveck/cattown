# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Clara's Cat Town is a browser-based action RPG built with vanilla JavaScript and HTML5 Canvas. No build process or frameworks are required - just open `index.html` in a browser to play.

**Live Demo**: https://zeveck.github.io/cattown

## Development Workflow

### Running the Game
- **Local Development**: Open `index.html` directly in a web browser
- **With HTTP Server**: `npx http-server -p 8080` (already running in background)
- **Simply refresh browser** to see changes - no build step needed

### Testing
The game has debug controls built-in:
- **Shift + Plus**: Add 10 fireflies (for testing chest unlocks)

## Core Architecture

### Single-File Structure
All game logic lives in `game.js` (~4900 lines). The architecture is organized into sections:

1. **Configuration** (top): `CONFIG` object with game constants
2. **Game State**: Single `gameState` object containing all game data
3. **Character Creation**: Preview system and UI handlers
4. **Audio System**: Background music playlist management
5. **Save/Load System**: JSON-based game state persistence
6. **Core Classes**:
   - `Player`: Character with transform (human/cat) states
   - `Companion`: Follower system with line-following behavior
   - `Projectile`: Magic attack system
   - `Particle`: Visual effects
   - `Item`: Collectibles (hearts for speed boosts)
   - `Chest`: Multi-tier treasure chests requiring fireflies
   - `Village`: Circular town layout with houses
7. **Image Loading**: Preloading all sprites
8. **Music System**: Auto-advancing playlist
9. **Input Handlers**: Keyboard/mouse event listeners
10. **Spawn Functions**: Item and chest generation
11. **House Interior System**: Furniture shop and placement
12. **Day/Night Cycle**: Time-based lighting and firefly spawning
13. **UI/HUD Rendering**: Level, XP, minimap, compass
14. **Game Loop**: Main update/render cycle

### Key Game Systems

#### Transform System
- Player can toggle between human and cat forms (T key)
- Cat form has 1.3x speed multiplier (`CONFIG.CAT_SPEED_MULTIPLIER`)
- Each form has distinct sprites with walking animations

#### Companion System
- Rescued from chests (E key to open)
- Follow player in a line using snake-like movement
- Can be dropped/placed with F key
- Teleport with player to fountain (HOME key)
- Form sleep ring around cat after 20s idle

#### Chest Tiers & Fireflies
- 5 chest colors: Purple (free), Green, Blue, Red, Magenta
- Larger chests spawn farther from town center
- Fireflies spawn at night, collected via magic attacks (SPACE)
- Stored in jar (shown in HUD), used to unlock large chests
- Spawn density varies by tier (Purple 80%, Magenta 30%)

#### Day/Night Cycle
- 60-second cycles (`CONFIG.DAY_LENGTH`)
- Dynamic lighting overlay during night
- Fireflies only appear at night
- Time tracked via `gameState.gameTime` and `gameState.timeOfDay` (0-1 range)

#### House Interior Mode
- Toggle with E key when near house door
- Changes to interior rendering mode (`gameState.isInsideHouse = true`)
- Furniture shop at bottom (click-drag placement system)
- Furniture can be colored (hue slider) and sized
- Stored per-house in `gameState.houseFurniture` object

#### Save/Load System
- Saves to timestamped JSON files via download
- Preserves: player state, level/XP, companions, chests, fireflies, furniture, time, camera, audio settings
- Load via file picker in help menu (? button)
- Save data includes version tracking

#### Minimap/Compass
- Press M to toggle world map overlay
- Compass points to central cat fountain
- Click compass or press HOME to teleport to fountain
- Minimap shows all game objects with color-coded legend

### State Management
Everything is stored in the single `gameState` object:
- `player`: Player instance
- `companions`: Array of active followers
- `droppedCompanions`: Array of placed companions
- `chests`: Array of chest instances
- `fireflies`: Spawned at night
- `items`: Hearts for speed boosts
- `camera`: { x, y } viewport position
- `isInsideHouse`: Boolean for interior mode
- `houseFurniture`: Per-house furniture storage (keyed by house ID)
- `level`, `xp`, `xpToNextLevel`: Leveling system
- `fireflyCount`: Number in jar
- `gameTime`: Elapsed time for day/night cycle

### Graphics Organization
All sprites in `/graphics` directory:
- `cat/`: Cat sprites (walk animations, sleep, idle)
- `girl.png`: Human form sprite
- `houses/`: 4 house types
- `house-items/`: Furniture sprites
- `chests/purple/`, `chests/green/`, etc.: Tiered chest graphics
- `fireflies/`: Animation frames
- `trees/`: Environment sprites

### Audio System
- Background music in `/music` directory (SunoAI generated)
- Playlist defined in `musicPlaylist` array (line 2700)
- Auto-advances on track end
- In-game controls: mute, volume slider, prev/next track

## Important Implementation Notes

### Canvas Rendering
- Main canvas: 1200x800px (`#gameCanvas`)
- Camera system translates canvas for viewport scrolling
- All drawing uses screen-space coordinates after camera translation
- Interior mode renders different scene (no camera translation)

### Collision Detection
- Distance-based for circular objects
- Rectangle overlap for buildings/furniture
- Player-to-house proximity for door interactions

### Animation System
- Sprite-based (no CSS animations)
- Walk cycles alternate frames based on movement
- Idle animations trigger after 6s stationary (yawn/lick)
- Sleep animation after 20s idle

### Chest Spawn Algorithm
- Procedural placement with minimum distance constraints
- Distance from town center determines tier probability
- Prevents overlap with houses, trees, and other chests
- See `spawnChests()` function (line 3161)

### Firefly Collection
- Fireflies change color when hit by magic projectile
- Collected when color reaches target hue
- Uses offscreen canvas for hue rotation (performance optimization)

### Performance Considerations
- Offscreen canvas caching for firefly hue manipulation
- Avoid expensive filter operations during main render loop
- Image preloading before game start
- Particle cleanup when off-screen

## Common Modifications

### Adding New Chest Tier
1. Add color to chest image folders (`graphics/chests/{color}/`)
2. Update chest loading section (line 2452)
3. Modify `spawnChests()` tier selection logic
4. Update minimap legend colors

### Adding New Companion Type
1. Add sprite to `graphics/friends/`
2. Update friend image loading (line 2416)
3. Companion class handles all behavior automatically

### Adjusting Game Balance
- Speed: Edit `CONFIG.PLAYER_SPEED` or `CONFIG.CAT_SPEED_MULTIPLIER`
- Day/Night timing: Change `CONFIG.DAY_LENGTH`
- Chest spawn rates: Modify probabilities in `spawnChests()`
- Firefly costs: Edit chest tier logic in Chest class `interact()` method

### Adding New Furniture
1. Add sprite to `graphics/house-items/`
2. Update furniture loading (line 2435)
3. Add entry to `gameState.furnitureShop` array (line 89)

## Version History
Current version: **v0.3.0**

Major version updates documented in README.md. Recent focus:
- v0.3.0: Major performance overhaul (viewport culling, gradient caching, deltaTime animations), dead code removal, bug fixes
- v0.2.14: Controls panel bug fix (auto-show race condition), code refactoring (hasUserInteracted)
- v0.2.13: SEO & social media meta tags for better sharing on social platforms
- v0.2.12: Chest spawn improvements, companion spawn animations, minimap enhancements
- v0.2.10: Save/load system implementation

## Credits
- Design: Clara and family
- Coding: Claude Code
- Graphics: ChatGPT
- Music: SunoAI
