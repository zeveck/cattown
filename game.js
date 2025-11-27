// Clara's Cat Town - Version 0.3.0

// Game Configuration
const CONFIG = {
    PLAYER_SPEED: 3,
    MAGIC_COOLDOWN: 500,
    COMPANION_SPEED: 2.9,
    DAY_LENGTH: 60000, // 60 seconds per day
    CAT_SPEED_MULTIPLIER: 1.3, // Cats move 30% faster than human form
};

// Chest tier configuration (colors, glow effects, minimap display)
const CHEST_CONFIG = {
    purple:  { tier: 0, color: '#9370DB', glow: '#9370DB', minimapSize: 3 },
    green:   { tier: 1, color: '#00FF00', glow: '#FFD700', minimapSize: 4 },
    blue:    { tier: 2, color: '#00FFFF', glow: '#0000FF', minimapSize: 5 },
    red:     { tier: 3, color: '#FF0000', glow: '#FF0000', minimapSize: 6 },
    magenta: { tier: 4, color: '#FF00FF', glow: '#9370DB', minimapSize: 7 }
};

// Interior layout constants (shared across all interior-related functions)
// Cached after first call since canvas size is constant
let cachedInteriorLayout = null;

function getInteriorLayout() {
    if (cachedInteriorLayout) {
        return cachedInteriorLayout;
    }

    const margin = 10;
    const roomWidth = canvas.width - (margin * 2);
    const roomHeight = canvas.height - (margin * 2) - 200;
    const roomX = margin;
    const roomY = margin;
    const wallThickness = 35;
    const shopY = roomY + roomHeight + 40;
    const shopX = margin + 10;
    const itemWidth = 110;
    const gap = 12;

    cachedInteriorLayout = {
        margin,
        roomWidth,
        roomHeight,
        roomX,
        roomY,
        wallThickness,
        shopY,
        shopX,
        itemWidth,
        gap
    };

    return cachedInteriorLayout;
}

// Utility: Calculate distance between two points
function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

// Utility: Check if two objects are within a certain distance
function isNearPoint(x1, y1, x2, y2, distance) {
    return getDistance(x1, y1, x2, y2) < distance;
}

// Utility: Try to start background music (handles user interaction requirement)
function tryStartMusic() {
    if (!gameState.musicStarted) {
        gameState.musicStarted = true;
        bgMusic.play().catch(() => {
            gameState.musicStarted = false; // Allow retry on error
        });
    }
}

// Utility: Apply purple glow effect for night rendering
function applyNightGlow(ctx) {
    if (gameState.isNight) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#9370DB'; // Medium purple
    }
}

// Utility: Draw shadow ellipse under companions
function drawCompanionShadow(ctx, x, y, sizeMultiplier = 1.0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(
        x + 20 * sizeMultiplier,
        y + 35 * sizeMultiplier,
        8 * sizeMultiplier,
        2 * sizeMultiplier,
        0, 0, Math.PI * 2
    );
    ctx.fill();
}

// Utility: Draw a HUD-style popup with text lines
// lines: array of {text, color} objects or simple strings (defaults to white)
// options: { borderColor, font, lineHeight, padding, cornerRadius }
function drawHudPopup(ctx, centerX, bottomY, lines, options = {}) {
    const {
        borderColor = 'rgba(255, 215, 0, 0.8)',
        font = 'bold 14px Arial',
        lineHeight = 14,
        padding = 10,
        cornerRadius = 6
    } = options;

    ctx.font = font;
    ctx.textAlign = 'center';

    // Normalize lines to {text, color} format
    const normalizedLines = lines.map(line =>
        typeof line === 'string' ? { text: line, color: '#FFF' } : line
    );

    // Calculate dimensions
    const textWidths = normalizedLines.map(line => ctx.measureText(line.text).width);
    const maxWidth = Math.max(...textWidths);
    const frameWidth = maxWidth + padding * 2;
    const frameHeight = normalizedLines.length * lineHeight + padding * 2;
    const frameX = centerX - frameWidth / 2;
    const frameY = bottomY - frameHeight - 10;

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameWidth, frameHeight, cornerRadius);
    ctx.fill();

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameWidth, frameHeight, cornerRadius);
    ctx.stroke();

    // Text lines
    normalizedLines.forEach((line, i) => {
        ctx.fillStyle = line.color;
        ctx.fillText(line.text, centerX, frameY + padding + (i + 0.5) * lineHeight);
    });
}

// Utility: Teleport player and companions to the cat fountain
function teleportToFountain() {
    if (!gameState.player || !gameState.village || !gameState.village.catFountain) return;
    if (gameState.isInsideHouse) return;

    const fountain = gameState.village.catFountain;
    const fountainCenterX = fountain.x + fountain.width / 2;
    const fountainBottomY = fountain.y + fountain.height;

    // Position player in front of fountain
    gameState.player.x = fountainCenterX - gameState.player.width / 2;
    gameState.player.y = fountainBottomY + 50;

    // Teleport companions in a ring around the player
    gameState.companions.forEach((companion, index) => {
        const angle = (index / gameState.companions.length) * Math.PI * 2;
        const radius = 80;
        companion.x = gameState.player.x + Math.cos(angle) * radius;
        companion.y = gameState.player.y + Math.sin(angle) * radius;
        companion.targetX = companion.x;
        companion.targetY = companion.y;
    });
}

// Companion Glow Colors (for night rendering)
const COMPANION_GLOW_COLORS = {
    kitten1: '#FFA500',  // Orange
    kitten2: '#FFA500',  // Orange
    kitten3: '#FFA500',  // Orange
    frog: '#32CD32',     // Lime green
    squirrel: '#D2691E', // Chocolate brown
    puppy: '#DAA520',    // Goldenrod
    bunny: '#FFB6C1'     // Light pink
};

// Game State
const gameState = {
    player: null,
    companions: [],
    droppedCompanions: [],
    items: [],
    chests: [],
    projectiles: [],
    particles: [],
    fireflies: [],
    village: null,
    camera: { x: 0, y: 0 },
    keys: {},
    mousePos: { x: 0, y: 0 },
    compassHover: false,
    fireflyCount: 0,
    eKeyWasPressed: false,
    musicStarted: false,
    gameStartTime: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    timeOfDay: 0, // 0-1, 0 = dawn, 0.5 = dusk
    isNight: false,
    previousIsNight: false,
    gameTime: 6000, // Start right at sunrise (timeOfDay: 0.1, just after dawn)
    isInsideHouse: false,
    currentHouseId: null,
    houseFurniture: {}, // Store furniture per house ID
    placedFurniture: [], // Current house's furniture (loaded from houseFurniture)
    selectedFurnitureType: null,
    selectedPlacedFurniture: null,
    isDraggingFurniture: false,
    placementRotation: 0, // Current rotation for furniture being placed
    lastHouseExitTime: 0,
    isDraggingSlider: false,
    draggedSliderType: null, // 'color' or 'size'
    draggedFurnitureType: null, // which furniture item's slider
    lastActivityTime: Date.now(),
    controlsPanelShown: false,
    hasUserInteracted: false, // Track if user has interacted (moved or dismissed help panel)
    furnitureHues: {
        bed: 0,
        table: 0,
        chair: 0,
        rug: 0,
        plant: 0,
        lamp: 0
    },
    furnitureSizes: {
        bed: 1.0,
        table: 1.0,
        chair: 1.0,
        rug: 1.0,
        plant: 1.0,
        lamp: 1.0
    },
    furnitureTypeRotations: { // Per-type default rotations
        bed: 0,
        table: 0,
        chair: 0,
        rug: 0,
        plant: 0,
        lamp: 0
    },
    furnitureShop: [
        { type: 'bed', name: 'Bed', color: '#8B4513', width: 80, height: 100 },
        { type: 'table', name: 'Table', color: '#D2691E', width: 60, height: 60 },
        { type: 'chair', name: 'Chair', color: '#A0522D', width: 40, height: 40 },
        { type: 'rug', name: 'Rug', color: '#DC143C', width: 100, height: 80 },
        { type: 'plant', name: 'Plant', color: '#228B22', width: 30, height: 40 },
        { type: 'lamp', name: 'Lamp', color: '#FFD700', width: 30, height: 50 }
    ],
    notification: {
        message: '',
        visible: false,
        fadeStartTime: 0,
        duration: 3000 // 3 seconds
    },
    showMinimap: false,
    minimapLayers: {
        chestsPurple: true,
        chestsGreen: true,
        chestsBlue: true,
        chestsRed: true,
        chestsMagenta: true,
        companions: true
    },
    minimapLegendBounds: [] // Will store clickable areas for legend items
};

// Furniture lookup by type for O(1) access
const furnitureByType = {};
gameState.furnitureShop.forEach((furniture, index) => {
    furnitureByType[furniture.type] = { furniture, index };
});

// Help button toggle for controls panel
const helpButton = document.getElementById('helpButton');
const controlsPanel = document.getElementById('controlsPanel');
if (helpButton && controlsPanel) {
    helpButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from bubbling to canvas
        e.preventDefault(); // Prevent any default behavior
        const isVisible = controlsPanel.style.display !== 'none';
        controlsPanel.style.display = isVisible ? 'none' : 'block';
        gameState.controlsPanelShown = !isVisible;
        gameState.lastActivityTime = Date.now(); // Reset idle timer
        // Mark as interacted to prevent auto-show from re-triggering
        if (!isVisible) {
            gameState.hasUserInteracted = true;
        }
    });
}

// Close button for controls panel
const closeControlsButton = document.getElementById('closeControlsButton');
if (closeControlsButton && controlsPanel) {
    closeControlsButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent click from bubbling to canvas
        e.preventDefault(); // Prevent any default behavior
        controlsPanel.style.display = 'none';
        gameState.controlsPanelShown = false;
        // Mark as interacted to prevent auto-show from re-triggering
        gameState.hasUserInteracted = true;
    });
}

// Audio controls
const muteButton = document.getElementById('muteButton');
const volumeSlider = document.getElementById('volumeSlider');
const prevButton = document.getElementById('prevButton');
const nextButton = document.getElementById('nextButton');
let isMuted = false;

if (muteButton && volumeSlider) {
    // Mute button click
    muteButton.addEventListener('click', () => {
        isMuted = !isMuted;
        bgMusic.muted = isMuted;
        muteButton.textContent = isMuted ? '🔇' : '🔊';
    });

    // Volume slider change
    volumeSlider.addEventListener('input', (e) => {
        const volume = e.target.value / 100;
        bgMusic.volume = volume;

        // Update mute button if volume is 0
        if (volume === 0) {
            isMuted = true;
            bgMusic.muted = true;
            muteButton.textContent = '🔇';
        } else if (isMuted) {
            isMuted = false;
            bgMusic.muted = false;
            muteButton.textContent = '🔊';
        }
    });

    // Previous track button
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            previousTrack();
        });
    }

    // Next track button
    if (nextButton) {
        nextButton.addEventListener('click', () => {
            nextTrack();
        });
    }
}

// Notification system
function showNotification(message, duration = 3000) {
    gameState.notification.message = message;
    gameState.notification.visible = true;
    gameState.notification.fadeStartTime = Date.now();
    gameState.notification.duration = duration;
}

// Save & Load functionality
function saveGame() {
    try {
        const saveData = {
            version: '0.3.0',
            timestamp: new Date().toISOString(),
            player: gameState.player ? {
                x: gameState.player.x,
                y: gameState.player.y,
                isCat: gameState.player.isCat,
                speed: gameState.player.speed,
                baseSpeed: gameState.player.baseSpeed,
                speedBoostEndTime: gameState.player.speedBoostEndTime,
                facingRight: gameState.player.facingRight
            } : null,
            level: gameState.level,
            xp: gameState.xp,
            xpToNextLevel: gameState.xpToNextLevel,
            fireflyCount: gameState.fireflyCount,
            gameTime: gameState.gameTime,
            timeOfDay: gameState.timeOfDay,
            isNight: gameState.isNight,
            camera: { ...gameState.camera },
            companions: gameState.companions.map(c => ({
                x: c.x,
                y: c.y,
                type: c.type,
                sizeMultiplier: c.sizeMultiplier
            })),
            droppedCompanions: gameState.droppedCompanions.map(dropped => ({
                x: dropped.x,
                y: dropped.y,
                type: dropped.type,
                isInHouse: dropped.isInHouse,
                houseId: dropped.houseId,
                houseX: dropped.houseX,
                houseY: dropped.houseY,
                companion: {
                    x: dropped.companion.x,
                    y: dropped.companion.y,
                    type: dropped.companion.type,
                    sizeMultiplier: dropped.companion.sizeMultiplier
                }
            })),
            items: gameState.items.map(item => ({
                x: item.x,
                y: item.y,
                type: item.type
            })),
            chests: gameState.chests.map(chest => ({
                x: chest.x,
                y: chest.y,
                opened: chest.opened,
                tier: chest.tier,
                color: chest.color,
                sizeMultiplier: chest.sizeMultiplier,
                fireflyCost: chest.fireflyCost
            })),
            fireflies: gameState.fireflies.map(ff => ({
                x: ff.x,
                y: ff.y,
                hue: ff.hue,
                xpValue: ff.xpValue,
                size: ff.size,
                isRainbow: ff.isRainbow
            })),
            houseFurniture: gameState.houseFurniture,
            furnitureHues: { ...gameState.furnitureHues },
            furnitureSizes: { ...gameState.furnitureSizes },
            furnitureRotations: { ...gameState.furnitureTypeRotations },
            isInsideHouse: gameState.isInsideHouse,
            currentHouseId: gameState.currentHouseId,
            audio: {
                currentTrackIndex: currentTrackIndex,
                volume: bgMusic.volume,
                muted: isMuted
            }
        };

        // Create download link
        const dataStr = JSON.stringify(saveData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cattown_save_${new Date().toISOString().slice(0,10)}.json`;
        link.click();
        URL.revokeObjectURL(url);

        showNotification('✓ Game saved successfully!', 3000);
    } catch (error) {
        console.error('Error saving game:', error);
        showNotification('✗ Failed to save game. Please try again.', 4000);
    }
}

function loadGame(saveData) {
    try {
        // Validate save data
        if (!saveData || !saveData.version) {
            throw new Error('Invalid save file');
        }

        // Restore player state
        if (saveData.player && gameState.player) {
            gameState.player.x = saveData.player.x;
            gameState.player.y = saveData.player.y;
            gameState.player.isCat = saveData.player.isCat;
            gameState.player.speed = saveData.player.speed;
            gameState.player.baseSpeed = saveData.player.baseSpeed;
            gameState.player.speedBoostEndTime = saveData.player.speedBoostEndTime;
            gameState.player.facingRight = saveData.player.facingRight;
        }

        // Restore progress
        gameState.level = saveData.level;
        gameState.xp = saveData.xp;
        gameState.xpToNextLevel = saveData.xpToNextLevel;
        gameState.fireflyCount = Math.min(999, saveData.fireflyCount);

        // Restore time and environment
        gameState.gameTime = saveData.gameTime;
        gameState.timeOfDay = saveData.timeOfDay;
        gameState.isNight = saveData.isNight;
        gameState.camera = { ...saveData.camera };

        // Restore companions
        gameState.companions = saveData.companions.map(c =>
            new Companion(c.x, c.y, c.type, c.sizeMultiplier)
        );

        // Restore dropped companions with full structure
        gameState.droppedCompanions = saveData.droppedCompanions.map(dropped => {
            const companion = new Companion(dropped.companion.x, dropped.companion.y, dropped.companion.type, dropped.companion.sizeMultiplier);
            return {
                companion: companion,
                x: dropped.x,
                y: dropped.y,
                type: dropped.type,
                isInHouse: dropped.isInHouse,
                houseId: dropped.houseId,
                houseX: dropped.houseX,
                houseY: dropped.houseY,
                wanderTarget: null,
                wanderCooldown: 0,
                bobOffset: companion.bobOffset // Initialize from companion
            };
        });

        // Restore items
        gameState.items = saveData.items.map(item =>
            new Item(item.x, item.y, item.type)
        );

        // Restore chests
        gameState.chests = saveData.chests.map(chest => {
            const c = new Chest(chest.x, chest.y, 0);
            c.opened = chest.opened;
            c.tier = chest.tier;
            c.color = chest.color;
            c.sizeMultiplier = chest.sizeMultiplier;
            c.fireflyCost = chest.fireflyCost;
            c.width = 72 * c.sizeMultiplier;
            c.height = 60 * c.sizeMultiplier;
            return c;
        });

        // Restore fireflies
        gameState.fireflies = saveData.fireflies.map(ff => ({
            x: ff.x,
            y: ff.y,
            hue: ff.hue,
            xpValue: ff.xpValue,
            size: ff.size,
            isRainbow: ff.isRainbow,
            floatOffset: Math.random() * Math.PI * 2,
            floatSpeed: 0.02 + Math.random() * 0.03,
            driftX: (Math.random() - 0.5) * 0.3,
            driftY: (Math.random() - 0.5) * 0.3
        }));

        // Restore house furniture with defaults for forward compatibility
        // NOTE: Use { ...defaults, ...(saveData.field || {}) } pattern when loading
        // to ensure old saves work when new fields are added to the game.
        const defaultFurnitureSettings = { bed: 0, table: 0, chair: 0, rug: 0, plant: 0, lamp: 0 };
        const defaultFurnitureSizes = { bed: 1.0, table: 1.0, chair: 1.0, rug: 1.0, plant: 1.0, lamp: 1.0 };

        gameState.houseFurniture = saveData.houseFurniture || {};
        gameState.furnitureHues = { ...defaultFurnitureSettings, ...(saveData.furnitureHues || {}) };
        gameState.furnitureSizes = { ...defaultFurnitureSizes, ...(saveData.furnitureSizes || {}) };
        gameState.furnitureTypeRotations = { ...defaultFurnitureSettings, ...(saveData.furnitureRotations || {}) };
        gameState.isInsideHouse = saveData.isInsideHouse || false;
        gameState.currentHouseId = saveData.currentHouseId || null;

        // Restore placed furniture if inside house
        if (gameState.isInsideHouse && gameState.currentHouseId) {
            gameState.placedFurniture = gameState.houseFurniture[gameState.currentHouseId] || [];
        }

        // Restore audio settings
        if (saveData.audio) {
            currentTrackIndex = saveData.audio.currentTrackIndex;
            bgMusic.volume = saveData.audio.volume;
            isMuted = saveData.audio.muted;
            bgMusic.muted = isMuted;
            if (volumeSlider) volumeSlider.value = saveData.audio.volume * 100;
            if (muteButton) muteButton.textContent = isMuted ? '🔇' : '🔊';
        }

        showNotification('✓ Game loaded successfully!', 3000);
    } catch (error) {
        console.error('Error loading game:', error);
        showNotification('✗ Failed to load game. File may be corrupted.', 4000);
    }
}

// Save & Load button event listeners
const saveButton = document.getElementById('saveButton');
const loadButton = document.getElementById('loadButton');
const loadFileInput = document.getElementById('loadFileInput');

if (saveButton) {
    saveButton.addEventListener('click', () => {
        saveGame();
    });
}

if (loadButton && loadFileInput) {
    loadButton.addEventListener('click', () => {
        loadFileInput.click();
    });

    loadFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const saveData = JSON.parse(event.target.result);
                    loadGame(saveData);
                } catch (error) {
                    console.error('Error parsing save file:', error);
                    showNotification('✗ Invalid save file format.', 4000);
                }
            };
            reader.readAsText(file);
        }
        // Reset file input so the same file can be loaded again
        e.target.value = '';
    });
}

// Game Classes
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 64;
        this.speed = CONFIG.PLAYER_SPEED;
        this.baseSpeed = CONFIG.PLAYER_SPEED;
        this.isCat = false;
        this.lastMagicTime = 0;
        this.speedBoostEndTime = 0;
        // Animation state for cat walking
        this.walkingFrame = 0; // 0 or 1
        this.walkingFrameCounter = 0;
        this.isMoving = false;
        this.facingRight = false;
        // Idle animation state (for cat form)
        this.idleTime = 0;
        this.idleAnimationType = null; // 'yawn' or 'lick'
        this.idleAnimationStartTime = 0;
        this.idleAnimationDuration = 1200; // 1.2 seconds for idle animations
        // House interior position (set when entering house)
        this.houseX = 0;
        this.houseY = 0;
    }

    // Shared animation logic for both world and interior movement
    // centerX/Y: player's current position (for companion ring arrangement)
    // isIndoors: if true, uses houseTargetX/Y for companions instead of targetX/Y
    updateAnimation(moved, centerX, centerY, isIndoors = false) {
        const dt = gameState.deltaTime || 16; // Fallback to 16ms if not set

        // Update walking animation for both cat and human
        this.isMoving = moved;
        if (moved) {
            this.walkingFrameCounter += dt;
            // Switch frame every ~167ms (was 10 frames at 60fps)
            if (this.walkingFrameCounter >= 167) {
                this.walkingFrame = (this.walkingFrame + 1) % 2;
                this.walkingFrameCounter = 0;
            }
        } else {
            this.walkingFrameCounter = 0;
            this.walkingFrame = 0;
        }

        // Idle animation logic for cat form
        if (this.isCat && !moved) {
            this.idleTime += dt;

            // After 20 seconds, cat falls asleep
            if (this.idleTime > 20000) {
                if (this.idleAnimationType !== 'sleep') {
                    this.idleAnimationType = 'sleep';

                    // Arrange companions in a ring around the sleeping cat
                    gameState.companions.forEach((companion, index) => {
                        const angle = (index / gameState.companions.length) * Math.PI * 2;
                        const radius = 80;
                        if (isIndoors) {
                            companion.houseTargetX = centerX + Math.cos(angle) * radius;
                            companion.houseTargetY = centerY + Math.sin(angle) * radius;
                        } else {
                            companion.targetX = centerX + Math.cos(angle) * radius;
                            companion.targetY = centerY + Math.sin(angle) * radius;
                        }
                    });
                }
            }
            // Check if current idle animation has finished (but not sleep)
            else if (this.idleAnimationType && this.idleAnimationType !== 'sleep' &&
                     gameState.frameTime - this.idleAnimationStartTime > this.idleAnimationDuration) {
                this.idleAnimationType = null;
            }
            // Randomly trigger a new idle animation
            else if (!this.idleAnimationType && this.idleTime > 6000 && this.idleTime < 20000) {
                if (Math.random() < 0.01) {
                    this.idleAnimationType = Math.random() < 0.5 ? 'yawn' : 'lick';
                    this.idleAnimationStartTime = gameState.frameTime;
                }
            }
        } else {
            // Reset idle state when moving or not a cat
            this.idleTime = 0;
            this.idleAnimationType = null;
        }
    }

    // Check and expire speed boost
    checkSpeedBoost() {
        if (this.speedBoostEndTime > 0 && gameState.frameTime > this.speedBoostEndTime) {
            this.speed = this.baseSpeed;
            this.speedBoostEndTime = 0;
        }
    }

    // Get actual movement speed (with cat multiplier)
    getActualSpeed() {
        return this.speed * (this.isCat ? CONFIG.CAT_SPEED_MULTIPLIER : 1);
    }

    update() {
        const prevX = this.x;
        const prevY = this.y;

        // Check if speed boost has expired
        this.checkSpeedBoost();

        // Movement
        const actualSpeed = this.getActualSpeed();
        let moved = false;
        if (gameState.keys['ArrowUp']) {
            this.y -= actualSpeed;
            moved = true;
        }
        if (gameState.keys['ArrowDown']) {
            this.y += actualSpeed;
            moved = true;
        }
        if (gameState.keys['ArrowLeft']) {
            this.x -= actualSpeed;
            this.facingRight = false;
            moved = true;
        }
        if (gameState.keys['ArrowRight']) {
            this.x += actualSpeed;
            this.facingRight = true;
            moved = true;
        }

        // Update animation state (walking frames, idle animations)
        this.updateAnimation(moved, this.x, this.y, false);

        // Track that player has moved (for idle menu logic)
        if (moved) {
            gameState.hasUserInteracted = true;
        }

        // Start music on first movement
        if (moved) {
            tryStartMusic();
        }

        // Collision detection with buildings
        if (this.checkCollision()) {
            this.x = prevX;
            this.y = prevY;
        }

        // Update camera
        gameState.camera.x = this.x - canvas.width / 2;
        gameState.camera.y = this.y - canvas.height / 2;
    }

    checkCollision() {
        if (!gameState.village) return false;

        // Check building collisions
        for (let building of gameState.village.buildings) {
            // Don't collide with any house near the door (bottom area)
            const playerBottom = this.y + this.height;
            const houseBottom = building.y + building.height;
            const distanceFromBottom = houseBottom - playerBottom;

            // If player is at the bottom part of the house (near door), no collision
            if (Math.abs(distanceFromBottom) < 60 &&
                this.x + this.width > building.x + 40 &&
                this.x < building.x + building.width - 40) {
                continue; // Skip collision for house door area
            }

            if (this.intersects(building)) {
                return true;
            }
        }

        // Check tree collisions - use smaller collision box for trees (just the trunk area)
        for (let tree of gameState.village.trees) {
            // Tree collision box centered on trunk (about 1/3 of tree width for trunk)
            const trunkWidth = tree.width / 3;
            const treeCollision = {
                x: tree.x - trunkWidth / 2,
                y: tree.y - tree.trunkHeight,
                width: trunkWidth,
                height: tree.trunkHeight
            };

            if (this.intersects(treeCollision)) {
                return true;
            }
        }

        return false;
    }

    intersects(obj) {
        // Cat form has much smaller collision box
        if (this.isCat) {
            const catWidth = this.width * 0.3;  // 30% of normal width
            const catHeight = this.height * 0.3; // 30% of normal height
            const offsetX = (this.width - catWidth) / 2;
            const offsetY = (this.height - catHeight) / 2;

            return this.x + offsetX < obj.x + obj.width &&
                   this.x + offsetX + catWidth > obj.x &&
                   this.y + offsetY < obj.y + obj.height &&
                   this.y + offsetY + catHeight > obj.y;
        }

        // Human form - only use lower half for collision
        const humanCollisionHeight = this.height * 0.5; // Lower half only
        const humanCollisionY = this.y + (this.height - humanCollisionHeight); // Start from middle

        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               humanCollisionY < obj.y + obj.height &&
               humanCollisionY + humanCollisionHeight > obj.y;
    }

    isNear(obj, distance) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;
        const objCenterX = obj.x + obj.width / 2;
        const objCenterY = obj.y + obj.height / 2;
        return getDistance(centerX, centerY, objCenterX, objCenterY) < distance;
    }

    shootMagic(targetX, targetY) {
        if (this.isCat) return; // Can't shoot as cat

        const now = Date.now();
        if (now - this.lastMagicTime < CONFIG.MAGIC_COOLDOWN) return;

        this.lastMagicTime = now;

        // Target the closest firefly at night, or closest chest during day
        let finalTargetX = targetX;
        let finalTargetY = targetY;
        let closestTarget = null;
        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;

        if (gameState.isNight && gameState.fireflies.length > 0) {
            // Night: Target closest firefly
            let closestDist = Infinity;

            for (let firefly of gameState.fireflies) {
                const dist = getDistance(firefly.x, firefly.y, playerCenterX, playerCenterY);

                if (dist < closestDist) {
                    closestDist = dist;
                    closestTarget = firefly;
                    finalTargetX = firefly.x;
                    finalTargetY = firefly.y;
                }
            }
        } else if (!gameState.isNight && gameState.chests.length > 0) {
            // Day: Target closest unopened chest
            let closestDist = Infinity;

            for (let chest of gameState.chests) {
                if (chest.opened) continue; // Skip opened chests

                const chestCenterX = chest.x + chest.width / 2;
                const chestCenterY = chest.y + chest.height / 2;
                const dist = getDistance(chestCenterX, chestCenterY, playerCenterX, playerCenterY);

                if (dist < closestDist) {
                    closestDist = dist;
                    closestTarget = chest;
                    finalTargetX = chest.x + chest.width / 2;
                    finalTargetY = chest.y + chest.height / 2;
                }
            }
        }

        const angle = Math.atan2(finalTargetY - this.y, finalTargetX - this.x);
        gameState.projectiles.push(new Projectile(
            this.x + this.width / 2,
            this.y + this.height / 2,
            angle,
            closestTarget // Pass the target (firefly or chest)
        ));
    }

    activateSpeedBoost(duration = 5000, multiplier = 1.5) {
        this.speed = this.baseSpeed * multiplier;
        this.speedBoostEndTime = Date.now() + duration;
    }

    transform() {
        this.isCat = !this.isCat;
    }

    draw(ctx) {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        if (this.isCat) {
            this.drawCat(ctx, screenX, screenY);
        } else {
            this.drawHuman(ctx, screenX, screenY);
        }
    }

    // Get the appropriate cat sprite based on current state
    getCatSprite() {
        if (this.isMoving) {
            return this.walkingFrame === 0 ? catWalking1 : catWalking2;
        } else if (this.idleAnimationType === 'sleep') {
            return catSleeping;
        } else if (this.idleAnimationType === 'yawn') {
            return catYawning;
        } else if (this.idleAnimationType === 'lick') {
            return catLickingPaw;
        }
        return catImage; // Default idle
    }

    // Get the appropriate girl sprite based on current state
    getGirlSprite() {
        if (this.isMoving) {
            return this.walkingFrame === 0 ? girlWalking1 : girlWalking2;
        }
        return girlWalking1; // Default idle uses walking1
    }

    drawHuman(ctx, x, y) {
        // Girl-walking images are 590x1024 (aspect ratio ~0.576)
        // Adjust rendered size to match this ratio to avoid stretching
        const girlWidth = 40;  // Adjusted from 48 to match aspect ratio
        const girlHeight = 70; // Adjusted from 64 to match aspect ratio

        // Shadow (adjusted for new size)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + girlWidth/2, y + girlHeight - 5, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        const girlSprite = this.getGirlSprite();

        // Draw girl sprite with optional flip and purple glow at night
        if (girlSprite.complete) {
            ctx.save();
            applyNightGlow(ctx);

            if (this.facingRight) {
                // Flip horizontally for right-facing
                ctx.translate(x + girlWidth, y);
                ctx.scale(-1, 1);
                ctx.drawImage(girlSprite, 0, 0, girlWidth, girlHeight);
            } else {
                // Normal left-facing
                ctx.drawImage(girlSprite, x, y, girlWidth, girlHeight);
            }

            ctx.restore();
        }
    }

    drawCat(ctx, x, y) {
        // No shadow for cat form (cat sprites have their own shadows or don't need them)
        const catSprite = this.getCatSprite();

        // Draw cat sprite with optional flip and purple glow at night
        if (catSprite.complete) {
            ctx.save();
            applyNightGlow(ctx);

            if (this.facingRight) {
                // Flip horizontally for right-facing
                ctx.translate(x + this.width, y);
                ctx.scale(-1, 1);
                ctx.drawImage(catSprite, 0, 0, this.width, this.height);
            } else {
                // Normal left-facing
                ctx.drawImage(catSprite, x, y, this.width, this.height);
            }

            ctx.restore();
        }
    }
}

class Companion {
    constructor(x, y, type, sizeMultiplier = 1.0, spawnVelocityX = 0, spawnVelocityY = 0, spawnDuration = 1000) {
        this.x = x;
        this.y = y;
        this.sizeMultiplier = sizeMultiplier;
        this.width = 40 * sizeMultiplier;
        this.height = 40 * sizeMultiplier;
        this.type = type; // 'dog', 'cat', 'bird'
        this.speed = CONFIG.COMPANION_SPEED;
        this.targetX = x;
        this.targetY = y;
        this.bobOffset = Math.random() * Math.PI * 2;

        // Spawn animation properties
        this.velocityX = spawnVelocityX;
        this.velocityY = spawnVelocityY;
        this.isSpawning = (spawnVelocityX !== 0 || spawnVelocityY !== 0);
        this.spawnTime = this.isSpawning ? Date.now() : 0;
        this.spawnDuration = spawnDuration; // How long the spawn animation lasts
        this.gravity = 0.3; // Gravity for spawn animation
        this.hasJoinedLine = !this.isSpawning; // False for spawning companions, true for placed/loaded ones
        // House interior position (set when entering house)
        this.houseX = 0;
        this.houseY = 0;
        this.houseTargetX = 0;
        this.houseTargetY = 0;
    }

    update(followPosition = 0) {
        if (!gameState.player) return;

        const dt = gameState.deltaTime || 16; // Fallback to 16ms if not set
        // bobOffset rate: 0.006 rad/ms = ~1 cycle per second (was 0.1 per frame at 60fps)
        const bobRate = 0.006;

        // Handle spawn animation
        if (this.isSpawning) {
            const elapsed = gameState.frameTime - this.spawnTime;

            if (elapsed < this.spawnDuration) {
                // Apply physics: velocity and gravity
                this.x += this.velocityX;
                this.y += this.velocityY;
                this.velocityY += this.gravity; // Gravity pulls down

                // Add some damping/friction
                this.velocityX *= 0.98;
                this.velocityY *= 0.98;
            } else {
                // Spawn animation complete, transition to normal behavior
                this.isSpawning = false;
                this.velocityX = 0;
                this.velocityY = 0;
            }
            this.bobOffset += bobRate * dt;
            return; // Skip normal following behavior during spawn
        }

        // If player is sleeping, companions form a ring around them
        if (gameState.player.isCat && gameState.player.idleAnimationType === 'sleep') {
            // Move toward ring position
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = getDistance(this.targetX, this.targetY, this.x, this.y);

            if (distance > 5) { // Close enough threshold
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * this.speed * 0.5; // Move slowly
                this.y += Math.sin(angle) * this.speed * 0.5;
            }
        } else {
            // Follow player with some distance
            // Determine what to follow: companion 0 follows player, others follow companion ahead
            let targetX, targetY;
            if (followPosition === 0) {
                targetX = gameState.player.x;
                targetY = gameState.player.y;
            } else {
                const ahead = gameState.companions[followPosition - 1];
                targetX = ahead.x;
                targetY = ahead.y;
            }

            const dxTarget = targetX - this.x;
            const dyTarget = targetY - this.y;
            const distToTarget = Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget);
            // First companion stays further from player, others stay closer to each other
            const followDist = (followPosition === 0) ? 50 : 30;

            // Move toward target if too far
            if (distToTarget > followDist + 5) {
                const angle = Math.atan2(dyTarget, dxTarget);
                const speed = this.hasJoinedLine ? this.speed : this.speed * 1.5;
                this.x += Math.cos(angle) * speed;
                this.y += Math.sin(angle) * speed;
            }

            // Mark as joined once close enough to target
            if (!this.hasJoinedLine && distToTarget <= followDist + 20) {
                this.hasJoinedLine = true;
            }
        }

        this.bobOffset += bobRate * dt;
    }

    draw(ctx) {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y + Math.sin(this.bobOffset) * 2;

        // Shadow (scaled with companion size)
        drawCompanionShadow(ctx, screenX, screenY, this.sizeMultiplier);

        // Draw friend image with colored glow at night
        const image = friendImages[this.type];
        if (image && image.complete) {
            if (gameState.isNight) {
                // Apply glow effect at night
                ctx.save();
                ctx.shadowBlur = 15 * this.sizeMultiplier;
                ctx.shadowColor = COMPANION_GLOW_COLORS[this.type] || '#FFFFFF'; // Default white
                ctx.drawImage(image, screenX, screenY, this.width, this.height);
                ctx.restore();
            } else {
                ctx.drawImage(image, screenX, screenY, this.width, this.height);
            }
        }
    }
}

class Projectile {
    constructor(x, y, angle, target = null) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 8;
        this.radius = 6;
        this.lifetime = 2000;
        this.createdAt = Date.now();
        this.target = target; // Can be firefly or chest
    }

    update() {
        // Determine if target is valid (firefly at night or chest during day)
        let hasValidTarget = false;
        let targetX, targetY;

        if (gameState.isNight && this.target && gameState.fireflies.includes(this.target)) {
            // Night: Homing on firefly
            hasValidTarget = true;
            targetX = this.target.x;
            targetY = this.target.y;
        } else if (!gameState.isNight && this.target && gameState.chests.includes(this.target)) {
            // Day: Homing on chest
            hasValidTarget = true;
            targetX = this.target.x + this.target.width / 2;
            targetY = this.target.y + this.target.height / 2;
        }

        // Home in on target if valid
        if (hasValidTarget) {
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            this.angle = Math.atan2(dy, dx);
            const dist = getDistance(targetX, targetY, this.x, this.y);

            // Check collision
            if (dist < 20) {
                if (gameState.isNight && gameState.fireflies.includes(this.target)) {
                    // Hit firefly - change color and grow
                    const newHue = this.target.hue + 60;
                    if (newHue >= 360) {
                        this.target.isRainbow = true;
                        this.target.hue = 0;
                    } else {
                        this.target.hue = newHue;
                    }
                    this.target.size = Math.min((this.target.size || 32) + 4, 64);
                    this.target.xpValue = (this.target.xpValue || 10) + 5;
                } else if (!gameState.isNight && gameState.chests.includes(this.target)) {
                    // Hit chest - increment hit counter
                    this.target.hitCount = (this.target.hitCount || 0) + 1;
                    if (this.target.hitCount >= 3 && this.target.fireflyCost === 0) {
                        // Basic chest - open after 3 hits
                        this.target.open();
                    }
                }
                return true; // Remove projectile
            }
        }

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Remove if lifetime exceeded
        if (gameState.frameTime - this.createdAt > this.lifetime) {
            return true;
        }

        return false;
    }

    draw(ctx) {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        // Draw pre-rendered projectile sprite (includes gradient and glow)
        const halfSize = projectileSprite.width / 2;
        ctx.drawImage(projectileSprite, screenX - halfSize, screenY - halfSize);
    }
}

class Particle {
    constructor(x, y, angle, color = null, speed = null) {
        this.x = x;
        this.y = y;
        // Use custom speed or default to 2-5 range
        const particleSpeed = speed !== null ? speed : (2 + Math.random() * 3);
        this.vx = Math.cos(angle) * particleSpeed;
        this.vy = Math.sin(angle) * particleSpeed;
        this.life = 1;
        this.decay = 0.02;
        this.size = 3 + Math.random() * 3;
        // Use provided color or default to yellow-orange
        this.color = color || `hsl(${Math.random() * 60 + 30}, 100%, 50%)`;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1; // Gravity
        this.life -= this.decay;
        return this.life <= 0;
    }

    draw(ctx) {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.type = type; // 'apple', 'orange', 'berry'
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    update() {
        const dt = gameState.deltaTime || 16;
        // bobOffset rate: 0.003 rad/ms = ~0.5 cycle per second (was 0.05 per frame at 60fps)
        this.bobOffset += 0.003 * dt;

        // Check if player is near
        if (gameState.player && this.isNear(gameState.player, 30)) {
            // Activate speed boost when eating food
            gameState.player.activateSpeedBoost(5000, 1.5); // 5 seconds, 1.5x speed

            // Gain XP for picking up hearts
            const xpAmount = this.type === 'apple' ? 10 : this.type === 'orange' ? 7 : 5;
            gainXP(xpAmount);

            // Remove item
            const index = gameState.items.indexOf(this);
            if (index > -1) {
                gameState.items.splice(index, 1);
            }
        }
    }

    isNear(player, distance) {
        return isNearPoint(this.x, this.y, player.x, player.y, distance);
    }

    draw(ctx) {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y + Math.sin(this.bobOffset) * 4;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(screenX + 16, screenY + 35, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw heart shape (all types are now hearts with different colors/sizes)
        const heartSize = this.type === 'apple' ? 1.0 : this.type === 'orange' ? 0.85 : 0.7;
        const heartColor = this.type === 'apple' ? '#FF1493' : this.type === 'orange' ? '#FF69B4' : '#FFB6C1';

        ctx.save();
        ctx.translate(screenX + 16, screenY + 16);
        ctx.scale(heartSize, heartSize);

        // Add faint glow at night
        if (gameState.isNight) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = heartColor;
        }

        // Draw heart
        ctx.fillStyle = heartColor;
        ctx.beginPath();
        ctx.moveTo(0, -5);
        // Left top curve
        ctx.bezierCurveTo(-8, -12, -15, -8, -15, 0);
        ctx.bezierCurveTo(-15, 5, -10, 10, 0, 15);
        // Right side
        ctx.bezierCurveTo(10, 10, 15, 5, 15, 0);
        ctx.bezierCurveTo(15, -8, 8, -12, 0, -5);
        ctx.closePath();
        ctx.fill();

        // Heart shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-5, -3, 3, 5, -0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Chest {
    constructor(x, y, distanceFromCenter = 0) {
        this.x = x;
        this.y = y;
        this.opened = false;
        this.companionTypes = ['kitten1', 'kitten2', 'kitten3', 'frog', 'squirrel', 'puppy', 'bunny'];

        // Calculate tier based on distance from center (every 2000 units = new tier)
        this.tier = Math.min(Math.floor(distanceFromCenter / 2000), 4); // Max tier 4

        // Assign color based on tier (using CHEST_CONFIG)
        const tierColors = ['purple', 'green', 'blue', 'red', 'magenta'];
        this.color = tierColors[this.tier];
        this.glowColor = CHEST_CONFIG[this.color].glow;

        // Size: basic chests are always size 1.0, firefly chests are always larger
        const baseWidth = 72;
        const baseHeight = 60;

        if (this.tier === 0) {
            // Basic chests - always base size
            this.sizeMultiplier = 1.0;
        } else if (this.tier === 1) {
            // Green chests - 1.5x with ±10% variation
            const baseSize = 1.5;
            const variation = (Math.random() - 0.5) * 0.2 * baseSize;
            this.sizeMultiplier = baseSize + variation;
        } else if (this.tier === 2) {
            // Blue chests - 2.0x with ±10% variation
            const baseSize = 2.0;
            const variation = (Math.random() - 0.5) * 0.2 * baseSize;
            this.sizeMultiplier = baseSize + variation;
        } else if (this.tier === 3) {
            // Red chests - 2.5x with ±10% variation
            const baseSize = 2.5;
            const variation = (Math.random() - 0.5) * 0.2 * baseSize;
            this.sizeMultiplier = baseSize + variation;
        } else {
            // Magenta chests (tier 4) - 3.0x with ±10% variation
            const baseSize = 3.0;
            const variation = (Math.random() - 0.5) * 0.2 * baseSize;
            this.sizeMultiplier = baseSize + variation;
        }

        this.width = baseWidth * this.sizeMultiplier;
        this.height = baseHeight * this.sizeMultiplier;

        // Firefly cost, companion count, and companion size based on tier
        if (this.tier === 0) {
            this.fireflyCost = 0; // Free
            this.companionCount = 1; // 1 companion
            this.companionSizeMultiplier = 1.0; // 1.0x sized companions
        } else if (this.tier === 1) {
            this.fireflyCost = 5; // Green chests
            this.companionCount = 1;
            this.companionSizeMultiplier = 1.25; // 1.25x sized companions
        } else if (this.tier === 2) {
            this.fireflyCost = 10; // Blue chests
            this.companionCount = 1;
            this.companionSizeMultiplier = 1.5; // 1.5x sized companions
        } else if (this.tier === 3) {
            this.fireflyCost = 20; // Red chests
            this.companionCount = Math.floor(Math.random() * 4) + 2; // 2-5 companions
            this.companionSizeMultiplier = 1.5; // 1.5x sized companions
        } else {
            this.fireflyCost = 50; // Magenta chests (tier 4)
            this.companionCount = Math.floor(Math.random() * 5) + 3; // 3-7 companions
            this.companionSizeMultiplier = 2.0; // 2x sized companions
        }
    }

    canOpen() {
        return gameState.fireflyCount >= this.fireflyCost;
    }

    open() {
        // Check if player has enough fireflies
        if (!this.canOpen()) {
            return false;
        }

        this.opened = true;

        // Deduct fireflies
        gameState.fireflyCount -= this.fireflyCost;

        // Spawn multiple companions based on chest tier
        // Calculate chest center for spawning
        const chestCenterX = this.x + this.width / 2;
        const chestCenterY = this.y + this.height / 2;

        for (let i = 0; i < this.companionCount; i++) {
            const type = this.companionTypes[Math.floor(Math.random() * this.companionTypes.length)];
            // Tighter spawn offset (constant 40px, not scaled)
            const offsetX = (Math.random() - 0.5) * 40;
            const offsetY = (Math.random() - 0.5) * 40;

            // All tiers get upward cone animation, narrower cone: -30° to 30° from straight up
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
            let speed;

            // Magenta chests: dramatic fountain arc
            if (this.tier === 4) {
                speed = 15 + Math.random() * 10; // 15-25 units/frame - HIGH arc
            }
            // Red chests: high arc
            else if (this.tier === 3) {
                speed = 10 + Math.random() * 5; // 10-15 units/frame
            }
            // Blue chests: moderate arc
            else if (this.tier === 2) {
                speed = 7 + Math.random() * 3; // 7-10 units/frame
            }
            // Green chests: higher arc (increased from 5-8)
            else if (this.tier === 1) {
                speed = 8 + Math.random() * 4; // 8-12 units/frame
            }
            // Purple chests: subtle arc
            else {
                speed = 6 + Math.random() * 4; // 6-10 units/frame
            }

            const velocityX = Math.cos(angle) * speed;
            const velocityY = Math.sin(angle) * speed; // Negative Y = upward

            // Different spawn durations for each tier
            let spawnDuration;
            if (this.tier === 4) {
                spawnDuration = 1800; // Magenta: 1.8 seconds (dramatic arc)
            } else if (this.tier === 3) {
                spawnDuration = 1400; // Red: 1.4 seconds (snappy arc)
            } else {
                spawnDuration = 1000; // Purple/Green/Blue: 1 second
            }

            gameState.companions.push(new Companion(
                chestCenterX + offsetX,
                chestCenterY + offsetY,
                type,
                this.companionSizeMultiplier,
                velocityX,
                velocityY,
                spawnDuration
            ));
        }

        // Gain XP for freeing friends (more for bigger chests)
        gainXP(25 * this.companionCount);

        // More particles for bigger chests
        const particleCount = 20 * this.sizeMultiplier;

        // MAGENTA CHESTS: DRAMATIC FOUNTAIN PARTICLE EFFECTS
        if (this.tier === 4) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            // Define colorful particle palette for magenta chests
            const colorPalette = [
                'hsl(270, 100%, 60%)',  // Purple
                'hsl(290, 100%, 70%)',  // Bright purple
                'hsl(310, 100%, 65%)',  // Pink
                'hsl(330, 100%, 75%)',  // Light pink
                'hsl(0, 0%, 95%)',      // White
                'hsl(50, 100%, 60%)'    // Gold
            ];

            // WAVE 1: Fountain burst with arcing particles (60 particles)
            for (let i = 0; i < 60; i++) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3); // Narrow upward cone
                const speed = 6 + Math.random() * 6; // 6-12 units/frame - Moderate speed for visible arc
                const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
                gameState.particles.push(new Particle(centerX, centerY, angle, color, speed));
            }

            // WAVE 1: Vertical laser fountain (30 straight-up particles)
            for (let i = 0; i < 30; i++) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.2; // Almost straight up
                const speed = 8 + Math.random() * 7; // 8-15 units/frame - High but not too fast
                const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
                gameState.particles.push(new Particle(
                    centerX + (Math.random() - 0.5) * this.width * 0.5,
                    centerY,
                    angle,
                    color,
                    speed
                ));
            }

            // WAVE 2: Second fountain wave after 150ms (40 particles)
            setTimeout(() => {
                if (gameState.particles) {
                    for (let i = 0; i < 40; i++) {
                        const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
                        const speed = 5 + Math.random() * 5; // 5-10 units/frame - Gentle arc
                        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
                        gameState.particles.push(new Particle(centerX, centerY, angle, color, speed));
                    }
                }
            }, 150);

            // WAVE 3: Third fountain wave after 300ms (30 particles)
            setTimeout(() => {
                if (gameState.particles) {
                    for (let i = 0; i < 30; i++) {
                        const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 3);
                        const speed = 4 + Math.random() * 4; // 4-8 units/frame - Soft arc
                        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
                        gameState.particles.push(new Particle(centerX, centerY, angle, color, speed));
                    }
                }
            }, 300);

            // WAVE 4: Final rainbow sparkle after 500ms (20 particles all directions)
            setTimeout(() => {
                if (gameState.particles) {
                    for (let i = 0; i < 20; i++) {
                        const angle = Math.random() * Math.PI * 2; // All directions
                        const speed = 3 + Math.random() * 3; // 3-6 units/frame - Gentle spread
                        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
                        gameState.particles.push(new Particle(centerX, centerY, angle, color, speed));
                    }
                }
            }, 500);
        }
        // RED CHESTS: Enhanced burst effect
        else if (this.tier === 3) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            // Extra burst particles shooting upward and outward (30 particles)
            for (let i = 0; i < 30; i++) {
                const angle = (Math.random() * Math.PI) - Math.PI / 2; // Upward bias
                gameState.particles.push(new Particle(centerX, centerY, angle));
            }

            // Add sparkle effect - vertical "laser" particles (15 particles)
            for (let i = 0; i < 15; i++) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Mostly straight up
                gameState.particles.push(new Particle(
                    centerX + (Math.random() - 0.5) * this.width,
                    centerY,
                    angle
                ));
            }
        }
        // PURPLE CHESTS: Simple omnidirectional burst for single companion
        else if (this.tier === 0) {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            // Simple burst in all directions (25 particles)
            for (let i = 0; i < 25; i++) {
                const angle = Math.random() * Math.PI * 2; // All directions (omnidirectional)
                gameState.particles.push(new Particle(centerX, centerY, angle));
            }
        }
        // GREEN AND BLUE CHESTS: Normal particle burst
        else {
            const centerX = this.x + this.width / 2;
            const centerY = this.y + this.height / 2;

            for (let i = 0; i < particleCount; i++) {
                gameState.particles.push(new Particle(
                    centerX,
                    centerY,
                    Math.random() * Math.PI * 2
                ));
            }
        }

        return true;
    }

    isNear(player, distance) {
        return isNearPoint(this.x, this.y, player.x, player.y, distance);
    }

    draw(ctx) {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        // Get the appropriate colored chest image based on state and color
        const colorImages = chestImages[this.color];
        if (colorImages) {
            const chestImg = this.opened ? colorImages.empty : colorImages.full;

            if (chestImg && chestImg.complete) {
                ctx.save();

                // Add glow at night for unopened chests
                if (gameState.isNight && !this.opened) {
                    ctx.shadowBlur = 20 * this.sizeMultiplier;
                    ctx.shadowColor = this.glowColor;
                }

                // Draw the colored chest image
                ctx.drawImage(chestImg, screenX, screenY, this.width, this.height);

                ctx.restore();
            } else {
                // Fallback to old drawing if image not loaded
                ctx.save();
                if (this.opened) {
                    // Open chest
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(screenX, screenY + 16, 48, 24);

                    ctx.fillStyle = '#D2691E';
                    ctx.fillRect(screenX + 3, screenY, 42, 20);
                } else {
                    // Closed chest
                    ctx.fillStyle = '#8B4513';
                    ctx.fillRect(screenX, screenY + 16, 48, 24);

                    ctx.fillStyle = '#D2691E';
                    ctx.fillRect(screenX, screenY + 8, 48, 16);

                    // Lock
                    ctx.fillStyle = '#FFD700';
                    ctx.fillRect(screenX + 20, screenY + 19, 8, 10);
                }
                ctx.restore();
            }
        }

    }

    drawMessage(ctx) {
        if (this.opened || !gameState.player || !this.isNear(gameState.player, 80 * this.sizeMultiplier)) {
            return;
        }

        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        const centerX = screenX + this.width / 2;

        if (this.fireflyCost > 0) {
            // Large chest - show firefly requirement
            const canOpen = this.canOpen();
            const borderColor = canOpen ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
            drawHudPopup(ctx, centerX, screenY, [
                { text: `${this.fireflyCost} Fireflies`, color: canOpen ? '#00FF00' : '#FF0000' },
                { text: canOpen ? 'Press E to open' : 'Need more fireflies', color: canOpen ? '#FFF' : '#AAA' }
            ], { borderColor, cornerRadius: 8 });
        } else {
            // Small chest - free to open with E
            drawHudPopup(ctx, centerX, screenY, ['Press E to Open']);
        }
    }
}

class Village {
    constructor() {
        this.width = 16000;  // Much bigger map
        this.height = 12000;
        this.buildings = [];
        this.trees = [];
        this.villageWidth = 1600;
        this.villageHeight = 1200;
        this.villageCenterX = this.width / 2;
        this.villageCenterY = this.height / 2;
        this.catFountain = null; // Will be set in generateVillage
        this.generateVillage();
    }

    generateVillage() {
        // Place the cat fountain FIRST at the center of the village
        this.catFountain = {
            x: this.villageCenterX - 100, // Center the 200x200 fountain
            y: this.villageCenterY - 100,
            width: 200,
            height: 200
        };

        // Calculate village offset to center it around the fountain
        const villageOffsetX = this.villageCenterX - this.villageWidth / 2;
        const villageOffsetY = this.villageCenterY - this.villageHeight / 2;

        // Generate houses around the fountain in a circular pattern
        const numHouses = 9; // Player house + 8 other houses
        const radius = 400; // Distance from fountain
        const angleStep = (Math.PI * 2) / numHouses;

        // Player's house (special) - first in the circle
        this.buildings.push({
            id: 'player_house',
            x: this.catFountain.x + 200 + Math.cos(0) * radius - 80,
            y: this.catFountain.y + 200 + Math.sin(0) * radius - 70,
            width: 160,
            height: 140,
            type: 'playerHouse',
            houseType: 1 // Player always gets house1
        });

        // Generate other houses in a circle around the fountain
        for (let i = 1; i < numHouses; i++) {
            const angle = i * angleStep;
            this.buildings.push({
                id: `house_${i - 1}`,
                x: this.catFountain.x + 100 + Math.cos(angle) * radius - 80,
                y: this.catFountain.y + 100 + Math.sin(angle) * radius - 70,
                width: 160,
                height: 140,
                type: 'house',
                houseType: Math.floor(Math.random() * 4) + 1 // Random house type 1-4
            });
        }

        // Generate trees in village
        for (let i = 0; i < 50; i++) {
            let x, y;
            let validPosition = false;
            let attempts = 0;

            while (!validPosition && attempts < 100) {
                x = villageOffsetX + Math.random() * this.villageWidth;
                y = villageOffsetY + Math.random() * this.villageHeight;
                validPosition = true;

                // Check distance from buildings (prevent tree/house overlap)
                for (let building of this.buildings) {
                    const buildingCenterX = building.x + building.width / 2;
                    const buildingCenterY = building.y + building.height / 2;
                    if (getDistance(x, y, buildingCenterX, buildingCenterY) < 160) {
                        validPosition = false;
                        break;
                    }
                }

                // Check distance from cat fountain
                if (validPosition && this.catFountain) {
                    const fountainCenterX = this.catFountain.x + this.catFountain.width / 2;
                    const fountainCenterY = this.catFountain.y + this.catFountain.height / 2;
                    if (getDistance(x, y, fountainCenterX, fountainCenterY) < 300) {
                        validPosition = false;
                    }
                }

                // Check distance from other trees to prevent overlap
                if (validPosition) {
                    for (let tree of this.trees) {
                        if (getDistance(x, y, tree.x, tree.y) < 80) {
                            validPosition = false;
                            break;
                        }
                    }
                }

                attempts++;
            }

            if (validPosition) {
                this.trees.push({
                    x: x,
                    y: y,
                    width: 120,
                    height: 160,
                    trunkHeight: 30,
                    foliageRadius: 35,
                    treeType: Math.floor(Math.random() * 3) // 0, 1, or 2
                });
            }
        }

        // Generate HUGE forest with increasing density based on distance from village
        // Sample many potential tree positions and use probability based on distance
        const maxDistance = Math.sqrt(Math.pow(this.width / 2, 2) + Math.pow(this.height / 2, 2));

        for (let i = 0; i < 8000; i++) {
            let x = Math.random() * this.width;
            let y = Math.random() * this.height;

            // Skip if in village area
            if (x > villageOffsetX && x < villageOffsetX + this.villageWidth &&
                y > villageOffsetY && y < villageOffsetY + this.villageHeight) {
                continue;
            }

            // Check distance from all buildings to prevent overlap
            let tooCloseToBuilding = false;
            for (let building of this.buildings) {
                const buildingCenterX = building.x + building.width / 2;
                const buildingCenterY = building.y + building.height / 2;
                if (getDistance(x, y, buildingCenterX, buildingCenterY) < 160) {
                    tooCloseToBuilding = true;
                    break;
                }
            }

            if (tooCloseToBuilding) {
                continue;
            }

            // Check distance from cat fountain
            if (this.catFountain) {
                const fountainCenterX = this.catFountain.x + this.catFountain.width / 2;
                const fountainCenterY = this.catFountain.y + this.catFountain.height / 2;
                if (getDistance(x, y, fountainCenterX, fountainCenterY) < 300) {
                    continue;
                }
            }

            // Check distance from other trees to prevent overlap
            let tooCloseToTree = false;
            for (let tree of this.trees) {
                if (getDistance(x, y, tree.x, tree.y) < 80) {
                    tooCloseToTree = true;
                    break;
                }
            }

            if (tooCloseToTree) {
                continue;
            }

            // Calculate distance from village center
            const distanceFromVillage = getDistance(x, y, this.villageCenterX, this.villageCenterY);

            // Calculate spawn probability based on distance
            // Close to village: 15% chance
            // Far from village: 95% chance
            const normalizedDistance = Math.min(distanceFromVillage / (maxDistance * 0.5), 1.0);
            const spawnProbability = 0.15 + (normalizedDistance * 0.8);

            // Only spawn tree based on probability
            if (Math.random() < spawnProbability) {
                this.trees.push({
                    x: x,
                    y: y,
                    width: 120,
                    height: 160,
                    trunkHeight: 30,
                    foliageRadius: 35,
                    treeType: Math.floor(Math.random() * 3) // 0, 1, or 2
                });
            }
        }
    }

    // Rendering is split into separate methods for night overlay layering:
    // - drawGround(ctx): Background grass (darkened at night)
    // - drawBuildings(ctx): Fountain + houses (glow at night)
    // - drawTree(ctx, tree): Individual trees (drawn on top)

    // Draw only the ground (before night overlay)
    drawGround(ctx) {
        const grassPattern = this.createGrassPattern(ctx);
        if (grassPattern) {
            ctx.save();
            // Disable image smoothing to prevent seams between tiles
            ctx.imageSmoothingEnabled = false;

            // Round offsets to integers for pixel-perfect alignment
            const offsetX = Math.floor(-gameState.camera.x % grassTileImage.width);
            const offsetY = Math.floor(-gameState.camera.y % grassTileImage.height);
            ctx.translate(offsetX, offsetY);
            ctx.fillStyle = grassPattern;
            ctx.fillRect(
                -offsetX,
                -offsetY,
                Math.ceil(canvas.width - offsetX + grassTileImage.width),
                Math.ceil(canvas.height - offsetY + grassTileImage.height)
            );
            ctx.restore();
        } else {
            ctx.fillStyle = '#2d5016';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }

    // Draw buildings and fountain (after night overlay to stay bright)
    drawBuildings(ctx) {
        // Draw cat fountain
        if (this.catFountain && catFountainImage.complete) {
            const screenX = this.catFountain.x - gameState.camera.x;
            const screenY = this.catFountain.y - gameState.camera.y;

            // Add light blue glow at night
            if (gameState.isNight) {
                ctx.save();
                ctx.shadowBlur = 30;
                ctx.shadowColor = '#87CEEB'; // Light blue
                ctx.drawImage(catFountainImage, screenX, screenY, this.catFountain.width, this.catFountain.height);
                ctx.restore();
            } else {
                ctx.drawImage(catFountainImage, screenX, screenY, this.catFountain.width, this.catFountain.height);
            }
        }

        // Draw buildings
        for (let building of this.buildings) {
            this.drawBuilding(ctx, building);
        }
    }

    createGrassPattern(ctx) {
        // Return cached pattern if available
        if (cachedGrassPattern) {
            return cachedGrassPattern;
        }

        // Create and cache the pattern (image guaranteed loaded before game starts)
        cachedGrassPattern = ctx.createPattern(grassTileImage, 'repeat');
        return cachedGrassPattern;
    }

    drawTree(ctx, tree) {
        const screenX = tree.x - gameState.camera.x;
        const screenY = tree.y - gameState.camera.y;

        // Use tree image based on tree type
        const treeImg = treeImages[tree.treeType || 0];
        if (treeImg && treeImg.complete) {
            ctx.drawImage(treeImg, screenX - tree.width / 2, screenY - tree.height, tree.width, tree.height);
        } else {
            // Fallback to old drawing if image not loaded
            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(screenX, screenY + tree.height - 5, 15, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Trunk
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX - 8, screenY + tree.height - tree.trunkHeight, 16, tree.trunkHeight);

            // Foliage
            const gradient = ctx.createRadialGradient(
                screenX, screenY + 15, 5,
                screenX, screenY + 15, tree.foliageRadius
            );
            gradient.addColorStop(0, '#90EE90');
            gradient.addColorStop(1, '#228B22');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(screenX, screenY + 15, tree.foliageRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawBuilding(ctx, building) {
        const screenX = building.x - gameState.camera.x;
        const screenY = building.y - gameState.camera.y;

        // Get the correct house image based on type and time of day
        const houseType = building.houseType || 1; // Default to house1 if not set
        let houseImg;

        if (gameState.isNight) {
            houseImg = houseImages[`house${houseType}Lights`];
        } else {
            houseImg = houseImages[`house${houseType}`];
        }

        // Draw house image with glow at night
        if (houseImg && houseImg.complete) {
            if (gameState.isNight) {
                ctx.save();
                ctx.shadowBlur = 25;
                ctx.shadowColor = '#FFA500'; // Light orange
                ctx.drawImage(houseImg, screenX, screenY, building.width, building.height);
                ctx.restore();
            } else {
                ctx.drawImage(houseImg, screenX, screenY, building.width, building.height);
            }
        } else {
            // Fallback - draw simple colored rectangle if image fails
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX, screenY, building.width, building.height);
        }

        // Show interaction hint for ALL houses
        const canEnter = gameState.frameTime - gameState.lastHouseExitTime > 500;
        if (gameState.player && this.isNear(gameState.player, building, 150) && canEnter) {
            drawHudPopup(ctx, screenX + building.width / 2, screenY, ['Press E to Enter'], { font: 'bold 12px Arial' });
        }
    }

    isNear(player, building, distance) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const buildingCenterX = building.x + building.width / 2;
        const buildingCenterY = building.y + building.height / 2;
        return getDistance(centerX, centerY, buildingCenterX, buildingCenterY) < distance;
    }
}

// Game Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load character images
const girlWalking1 = new Image();
girlWalking1.src = 'graphics/girl-walking1.png';
const girlWalking2 = new Image();
girlWalking2.src = 'graphics/girl-walking2.png';
const catImage = new Image();
catImage.src = 'graphics/cat/cat.png';
const catWalking1 = new Image();
catWalking1.src = 'graphics/cat/cat-walking1.png';
const catWalking2 = new Image();
catWalking2.src = 'graphics/cat/cat-walking2.png';
const catYawning = new Image();
catYawning.src = 'graphics/cat/cat-yawning.png';
const catLickingPaw = new Image();
catLickingPaw.src = 'graphics/cat/cat-licking-paw.png';
const catSleeping = new Image();
catSleeping.src = 'graphics/cat/cat-sleeping.png';

// Load house images - 4 types
const houseImages = {
    house1: new Image(),
    house1Lights: new Image(),
    house2: new Image(),
    house2Lights: new Image(),
    house3: new Image(),
    house3Lights: new Image(),
    house4: new Image(),
    house4Lights: new Image()
};

houseImages.house1.src = 'graphics/houses/house1.png';
houseImages.house1Lights.src = 'graphics/houses/house1-with-lights.png';
houseImages.house2.src = 'graphics/houses/house2.png';
houseImages.house2Lights.src = 'graphics/houses/house2-with-lights.png';
houseImages.house3.src = 'graphics/houses/house3.png';
houseImages.house3Lights.src = 'graphics/houses/house3-with-lights.png';
houseImages.house4.src = 'graphics/houses/house4.png';
houseImages.house4Lights.src = 'graphics/houses/house4-with-lights.png';

// Load friend images
const friendImages = {
    kitten1: new Image(),
    kitten2: new Image(),
    kitten3: new Image(),
    frog: new Image(),
    squirrel: new Image(),
    puppy: new Image(),
    bunny: new Image()
};

friendImages.kitten1.src = 'graphics/friends/kitten1.png';
friendImages.kitten2.src = 'graphics/friends/kitten2.png';
friendImages.kitten3.src = 'graphics/friends/kitten3.png';
friendImages.frog.src = 'graphics/friends/frog.png';
friendImages.squirrel.src = 'graphics/friends/squirrel.png';
friendImages.puppy.src = 'graphics/friends/puppy.png';
friendImages.bunny.src = 'graphics/friends/bunny.png';

// Load furniture images
const furnitureImages = {
    bed: new Image(),
    table: new Image(),
    chair: new Image(),
    rug: new Image(),
    plant: new Image(),
    lamp: new Image()
};

furnitureImages.bed.src = 'graphics/house-items/bed.png';
furnitureImages.table.src = 'graphics/house-items/table.png';
furnitureImages.chair.src = 'graphics/house-items/ChatGPT Image Oct 12, 2025, 11_55_14 AM.png';
furnitureImages.rug.src = 'graphics/house-items/rug.png';
furnitureImages.plant.src = 'graphics/house-items/plant.png';
furnitureImages.lamp.src = 'graphics/house-items/lamp.png';

// Load chest images for different tiers/colors
const chestImages = {
    purple: { full: new Image(), empty: new Image() },
    green: { full: new Image(), empty: new Image() },
    blue: { full: new Image(), empty: new Image() },
    red: { full: new Image(), empty: new Image() },
    magenta: { full: new Image(), empty: new Image() }
};

chestImages.purple.full.src = 'graphics/chests/purple-chest-full.png';
chestImages.purple.empty.src = 'graphics/chests/purple-chest-empty.png';
chestImages.green.full.src = 'graphics/chests/green-chest.png';
chestImages.green.empty.src = 'graphics/chests/green-chest-open.png';
chestImages.blue.full.src = 'graphics/chests/blue-chest.png';
chestImages.blue.empty.src = 'graphics/chests/blue-chest-open.png';
chestImages.red.full.src = 'graphics/chests/red-chest.png';
chestImages.red.empty.src = 'graphics/chests/red-chest-open.png';
chestImages.magenta.full.src = 'graphics/chests/magenta-chest.png';
chestImages.magenta.empty.src = 'graphics/chests/magenta-chest-open.png';

// Load tree images
const treeImages = [
    new Image(),
    new Image(),
    new Image()
];
treeImages[0].src = 'graphics/trees/tree1.png';
treeImages[1].src = 'graphics/trees/tree2.png';
treeImages[2].src = 'graphics/trees/pinetree.png';

// Load grass tile
const grassTileImage = new Image();
grassTileImage.src = 'graphics/grass_tile.jpg';

// Load floorboards
const floorboardsImage = new Image();
floorboardsImage.src = 'graphics/floorboards.jpg';

// Load firefly image
const fireflyImage = new Image();
fireflyImage.src = 'graphics/fireflies/ChatGPT Image Nov 14, 2025, 11_25_29 PM.png';

// Cache for hue-rotated firefly images (to avoid expensive filter operations every frame)
const fireflyImageCache = {};

// Cache for grass pattern (to avoid creating new pattern every frame)
let cachedGrassPattern = null;

// Cache for minimap legend bounds (to avoid recreating every frame)
let cachedMinimapLegendBounds = null;

// Get a cached hue-rotated firefly image (creates if doesn't exist)
function getCachedFireflyImage(hue, size) {
    const cacheKey = `${hue}_${size}`;

    // Return cached version if it exists
    if (fireflyImageCache[cacheKey]) {
        return fireflyImageCache[cacheKey];
    }

    // Create new offscreen canvas with the hue-rotated firefly
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const offCtx = offscreen.getContext('2d');

    // Apply hue rotation filter ONCE (expensive operation, but only done when caching)
    if (hue > 0) {
        offCtx.filter = `hue-rotate(${hue}deg)`;
    }

    offCtx.drawImage(fireflyImage, 0, 0, size, size);

    // Reset filter
    offCtx.filter = 'none';

    // Cache the result
    fireflyImageCache[cacheKey] = offscreen;

    return offscreen;
}

// Cache for firefly sprites with pre-rendered glow
const fireflyGlowCache = {};

// Get a cached firefly image WITH glow baked in (avoids per-frame shadowBlur)
// Returns { canvas, padding } where padding is the extra space for the glow
function getCachedFireflyWithGlow(hue, size) {
    const cacheKey = `glow_${hue}_${size}`;

    if (fireflyGlowCache[cacheKey]) {
        return fireflyGlowCache[cacheKey];
    }

    // Glow extends beyond sprite, so canvas needs padding
    const glowPadding = 25; // Enough for shadowBlur of 20
    const canvasSize = size + glowPadding * 2;

    const offscreen = document.createElement('canvas');
    offscreen.width = canvasSize;
    offscreen.height = canvasSize;
    const offCtx = offscreen.getContext('2d');

    // Calculate glow color from hue
    let glowColor = '#FFFF00'; // Default yellow
    if (hue > 0) {
        const totalHue = (60 + hue) % 360;
        const h = totalHue / 60;
        const x = 1 - Math.abs((h % 2) - 1);
        let r, g, b;
        if (h < 1) { r = 1; g = x; b = 0; }
        else if (h < 2) { r = x; g = 1; b = 0; }
        else if (h < 3) { r = 0; g = 1; b = x; }
        else if (h < 4) { r = 0; g = x; b = 1; }
        else if (h < 5) { r = x; g = 0; b = 1; }
        else { r = 1; g = 0; b = x; }
        glowColor = `rgb(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)})`;
    }

    // Get the base firefly image (hue-rotated if needed)
    const baseImg = hue > 0 ? getCachedFireflyImage(hue, size) : fireflyImage;

    // Draw with glow effect baked in (two passes for stronger glow)
    offCtx.shadowBlur = 20;
    offCtx.shadowColor = glowColor;
    offCtx.drawImage(baseImg, glowPadding, glowPadding, size, size);
    offCtx.shadowBlur = 15;
    offCtx.drawImage(baseImg, glowPadding, glowPadding, size, size);

    // Reset shadow
    offCtx.shadowBlur = 0;

    // Cache the result
    fireflyGlowCache[cacheKey] = { canvas: offscreen, padding: glowPadding };

    return fireflyGlowCache[cacheKey];
}

// Load firefly jar images
const emptyJarImage = new Image();
emptyJarImage.src = 'graphics/fireflies/empty-jar.png';

const fullJarImage = new Image();
fullJarImage.src = 'graphics/fireflies/full-jar.png';

// Load cat fountain image
const catFountainImage = new Image();
catFountainImage.src = 'graphics/cat/cat-fountain.png';

// Load title image
const titleImage = new Image();
titleImage.src = 'graphics/title.png';

// Pre-rendered projectile sprite (cached for performance)
let projectileSprite = null;

// Cached HUD gradients (performance optimization)
let cachedRainbowGradient = null;
let cachedXpGradient = null;
let cachedHueSliderGradient = null;
let cachedSizeSliderGradient = null;

let imagesLoaded = 0;
const totalImages = 49; // 2 girl walking + 1 cat + 2 cat walking + 3 cat idle (8), 8 houses (4×2), 7 friends, 6 furniture, 10 chests (5×2), 3 trees, 1 grass, 1 floorboards, 1 firefly, 2 jars, 1 fountain, 1 title = 49

function checkImagesLoaded() {
    if (imagesLoaded === totalImages) {
        // Initialize cached sprites and gradients before starting game
        initProjectileSprite();
        initCachedGradients();
        // Start game automatically when images are ready
        startGame();
    }
}

// Initialize pre-rendered projectile sprite for performance
function initProjectileSprite() {
    const radius = 6;  // Match Projectile.radius
    const glowRadius = radius + 3;
    const size = (glowRadius + 2) * 2;  // Diameter plus padding

    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size;
    const offCtx = offscreen.getContext('2d');

    const centerX = size / 2;
    const centerY = size / 2;

    // Draw outer glow first (behind the main projectile)
    offCtx.fillStyle = 'rgba(0, 200, 255, 0.3)';
    offCtx.beginPath();
    offCtx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    offCtx.fill();

    // Draw gradient core
    const gradient = offCtx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, '#00FFFF');
    gradient.addColorStop(0.5, '#0088FF');
    gradient.addColorStop(1, '#0044FF');
    offCtx.fillStyle = gradient;
    offCtx.beginPath();
    offCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    offCtx.fill();

    projectileSprite = offscreen;
}

// Initialize cached gradients for HUD elements (performance optimization)
function initCachedGradients() {
    // HUD constants (must match values in game loop HUD drawing)
    const hudX = 20, hudY = 20, hudWidth = 100;
    const barX = hudX + 10, barY = hudY + 35, barWidth = 80;

    // Rainbow gradient for HUD border (fixed position)
    cachedRainbowGradient = ctx.createLinearGradient(hudX, hudY, hudX + hudWidth, hudY);
    cachedRainbowGradient.addColorStop(0, '#FF0000');
    cachedRainbowGradient.addColorStop(0.16, '#FF7F00');
    cachedRainbowGradient.addColorStop(0.33, '#FFFF00');
    cachedRainbowGradient.addColorStop(0.5, '#00FF00');
    cachedRainbowGradient.addColorStop(0.66, '#0000FF');
    cachedRainbowGradient.addColorStop(0.83, '#4B0082');
    cachedRainbowGradient.addColorStop(1, '#9400D3');

    // XP bar gradient (full width, will be clipped by fillRect)
    cachedXpGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    cachedXpGradient.addColorStop(0, '#4169E1');
    cachedXpGradient.addColorStop(1, '#1E90FF');

    // Furniture shop hue slider gradient (sliderWidth = itemWidth - 20 = 90)
    // Uses 0-based coordinates; positioned via save/translate/restore
    cachedHueSliderGradient = ctx.createLinearGradient(0, 0, 90, 0);
    for (let h = 0; h <= 360; h += 60) {
        cachedHueSliderGradient.addColorStop(h / 360, `hsl(${h}, 80%, 50%)`);
    }

    // Furniture shop size slider gradient (sliderWidth = 90)
    cachedSizeSliderGradient = ctx.createLinearGradient(0, 0, 90, 0);
    cachedSizeSliderGradient.addColorStop(0, '#666');
    cachedSizeSliderGradient.addColorStop(1, '#FFF');
}

// Helper function to handle both successful loads and errors
function imageLoadHandler() {
    imagesLoaded++;
    checkImagesLoaded();
}

// Setup image load/error handlers with automatic error logging
function setupImageHandlers(image, name) {
    image.onload = imageLoadHandler;
    image.onerror = () => {
        console.error(`Failed to load ${name}`);
        imageLoadHandler();
    };
}

// Player sprites
setupImageHandlers(girlWalking1, 'girl-walking1.png');
setupImageHandlers(girlWalking2, 'girl-walking2.png');
setupImageHandlers(catImage, 'cat.png');
setupImageHandlers(catWalking1, 'cat-walking1.png');
setupImageHandlers(catWalking2, 'cat-walking2.png');
setupImageHandlers(catYawning, 'cat-yawning.png');
setupImageHandlers(catLickingPaw, 'cat-licking-paw.png');
setupImageHandlers(catSleeping, 'cat-sleeping.png');

// House sprites
setupImageHandlers(houseImages.house1, 'house1.png');
setupImageHandlers(houseImages.house1Lights, 'house1-with-lights.png');
setupImageHandlers(houseImages.house2, 'house2.png');
setupImageHandlers(houseImages.house2Lights, 'house2-with-lights.png');
setupImageHandlers(houseImages.house3, 'house3.png');
setupImageHandlers(houseImages.house3Lights, 'house3-with-lights.png');
setupImageHandlers(houseImages.house4, 'house4.png');
setupImageHandlers(houseImages.house4Lights, 'house4-with-lights.png');

// Companion/friend sprites
setupImageHandlers(friendImages.kitten1, 'kitten1.png');
setupImageHandlers(friendImages.kitten2, 'kitten2.png');
setupImageHandlers(friendImages.kitten3, 'kitten3.png');
setupImageHandlers(friendImages.frog, 'frog.png');
setupImageHandlers(friendImages.squirrel, 'squirrel.png');
setupImageHandlers(friendImages.puppy, 'puppy.png');
setupImageHandlers(friendImages.bunny, 'bunny.png');

// Furniture sprites
setupImageHandlers(furnitureImages.bed, 'bed.png');
setupImageHandlers(furnitureImages.table, 'table.png');
setupImageHandlers(furnitureImages.chair, 'chair.png');
setupImageHandlers(furnitureImages.rug, 'rug.png');
setupImageHandlers(furnitureImages.plant, 'plant.png');
setupImageHandlers(furnitureImages.lamp, 'lamp.png');

// Chest sprites
setupImageHandlers(chestImages.purple.full, 'purple-chest-full.png');
setupImageHandlers(chestImages.purple.empty, 'purple-chest-empty.png');
setupImageHandlers(chestImages.green.full, 'green-chest.png');
setupImageHandlers(chestImages.green.empty, 'green-chest-open.png');
setupImageHandlers(chestImages.blue.full, 'blue-chest.png');
setupImageHandlers(chestImages.blue.empty, 'blue-chest-open.png');
setupImageHandlers(chestImages.red.full, 'red-chest.png');
setupImageHandlers(chestImages.red.empty, 'red-chest-open.png');
setupImageHandlers(chestImages.magenta.full, 'magenta-chest.png');
setupImageHandlers(chestImages.magenta.empty, 'magenta-chest-open.png');

// Environment sprites
setupImageHandlers(treeImages[0], 'tree1.png');
setupImageHandlers(treeImages[1], 'tree2.png');
setupImageHandlers(treeImages[2], 'pinetree.png');
setupImageHandlers(grassTileImage, 'grass_tile.jpg');
setupImageHandlers(floorboardsImage, 'floorboards.jpg');

// Misc sprites
setupImageHandlers(fireflyImage, 'firefly.png');
setupImageHandlers(emptyJarImage, 'empty-jar.png');
setupImageHandlers(fullJarImage, 'full-jar.png');
setupImageHandlers(catFountainImage, 'cat-fountain.png');
setupImageHandlers(titleImage, 'title.png');

// Music playlist
const musicPlaylist = [
    'music/Whiskers and Wonders.mp3',
    'music/Moonlight Carousel.mp3',
    'music/Moonlight Carousel (1).mp3',
    'music/Moonlight Whiskers.mp3',
    'music/Moonlight Whiskers (1).mp3',
    'music/Moonlit Paws.mp3'
];
let currentTrackIndex = 0;

// Load background music
const bgMusic = new Audio(musicPlaylist[currentTrackIndex]);
bgMusic.loop = false; // We'll manually advance to next track
bgMusic.volume = 0.5;

// Function to load and play a track
function loadTrack(index) {
    currentTrackIndex = index;
    if (currentTrackIndex < 0) {
        currentTrackIndex = musicPlaylist.length - 1;
    } else if (currentTrackIndex >= musicPlaylist.length) {
        currentTrackIndex = 0;
    }

    const wasPlaying = !bgMusic.paused;
    const currentVolume = bgMusic.volume;
    const wasMuted = bgMusic.muted;

    bgMusic.src = musicPlaylist[currentTrackIndex];
    bgMusic.volume = currentVolume;
    bgMusic.muted = wasMuted;

    if (wasPlaying) {
        bgMusic.play().catch(() => {}); // Silently handle errors
    }
}

// Auto-advance to next track when current one ends
bgMusic.addEventListener('ended', () => {
    currentTrackIndex = (currentTrackIndex + 1) % musicPlaylist.length;
    bgMusic.src = musicPlaylist[currentTrackIndex];
    bgMusic.play().catch(() => {}); // Silently handle errors
});

// Functions to control playlist
function nextTrack() {
    loadTrack(currentTrackIndex + 1);
}

function previousTrack() {
    loadTrack(currentTrackIndex - 1);
}

// Input handling
document.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;

    // Reset idle timer on any key press
    gameState.lastActivityTime = Date.now();

    // ESC key to close controls panel
    if (e.key === 'Escape') {
        if (controlsPanel && controlsPanel.style.display === 'block') {
            controlsPanel.style.display = 'none';
            gameState.controlsPanelShown = false;
            // Mark as interacted to prevent auto-show from re-triggering
            gameState.hasUserInteracted = true;
        }
        e.preventDefault();
        return;
    }

    // "/" or "?" key to toggle controls panel
    if (e.key === '/' || e.key === '?') {
        if (controlsPanel) {
            const isVisible = controlsPanel.style.display === 'block';
            controlsPanel.style.display = isVisible ? 'none' : 'block';
            gameState.controlsPanelShown = !isVisible;
            // Mark as interacted to prevent auto-show from re-triggering when closing
            if (isVisible) {
                gameState.hasUserInteracted = true;
            }
        }
        e.preventDefault();
        return;
    }

    // Prevent default behavior for game controls
    if (e.key === ' ' || e.key === 'Spacebar' ||
        e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
        e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
    }

    // Magic attack with spacebar
    if (e.key === ' ' || e.key === 'Spacebar') {
        if (gameState.player) {
            gameState.player.shootMagic(gameState.mousePos.x, gameState.mousePos.y);
        }
    }

    // Transform with T
    if (e.key === 't' || e.key === 'T') {
        if (gameState.player) {
            gameState.player.transform();
        }
    }

    // Toggle minimap with M
    if (e.key === 'm' || e.key === 'M') {
        gameState.showMinimap = !gameState.showMinimap;
        e.preventDefault();
    }

    // DEBUG: Shift+Plus to add 10 fireflies
    if (e.shiftKey && (e.key === '+' || e.key === '=')) {
        gameState.fireflyCount = Math.min(999, gameState.fireflyCount + 10);
        e.preventDefault();
    }

    // Teleport to fountain with Home key
    if (e.key === 'Home') {
        teleportToFountain();
        e.preventDefault();
    }

    // Drop closest companion with F
    if (e.key === 'f' || e.key === 'F') {
        if (gameState.companions.length > 0) {
            // Find the companion closest to the player (last in line)
            const lastCompanion = gameState.companions[gameState.companions.length - 1];

            // Remove from companions array
            gameState.companions.pop();

            // Add to dropped companions with current position and house status
            const droppedData = {
                companion: lastCompanion,
                x: lastCompanion.x,
                y: lastCompanion.y,
                type: lastCompanion.type,
                isInHouse: gameState.isInsideHouse,
                houseId: gameState.currentHouseId,
                wanderTarget: null,
                wanderCooldown: 0,
                bobOffset: lastCompanion.bobOffset
            };

            // If inside house, set house coordinates instead
            if (gameState.isInsideHouse) {
                droppedData.houseX = lastCompanion.houseX || gameState.player.houseX;
                droppedData.houseY = lastCompanion.houseY || gameState.player.houseY;
            }

            gameState.droppedCompanions.push(droppedData);
        }
    }

    // Note: Exit house with E is handled in handleInteractions()

    // Rotate furniture with R
    if (e.key === 'r' || e.key === 'R') {
        if (gameState.isInsideHouse) {
            // Rotate furniture being placed from shop
            if (gameState.selectedFurnitureType) {
                gameState.placementRotation = (gameState.placementRotation + 90) % 360;
            }
            // Rotate already-placed furniture that's selected
            else if (gameState.selectedPlacedFurniture) {
                const currentRotation = gameState.selectedPlacedFurniture.rotation || 0;
                gameState.selectedPlacedFurniture.rotation = (currentRotation + 90) % 360;
            }
        }
    }

    // Delete selected placed furniture
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (gameState.isInsideHouse && gameState.selectedPlacedFurniture) {
            const index = gameState.placedFurniture.indexOf(gameState.selectedPlacedFurniture);
            if (index > -1) {
                gameState.placedFurniture.splice(index, 1);
                gameState.selectedPlacedFurniture = null;
            }
        }
    }
});

document.addEventListener('keyup', (e) => {
    gameState.keys[e.key] = false;
});

// Auto-hide cursor when idle
let cursorTimeout;
const CURSOR_HIDE_DELAY = 2000; // 2 seconds

function showCursor() {
    document.body.classList.remove('hide-cursor');
    clearTimeout(cursorTimeout);
    cursorTimeout = setTimeout(() => {
        document.body.classList.add('hide-cursor');
    }, CURSOR_HIDE_DELAY);
}

// Show cursor on any mouse movement
document.addEventListener('mousemove', showCursor);

// Initial cursor hide after delay
showCursor();

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (gameState.isInsideHouse) {
        // Inside house, use screen coordinates
        gameState.mousePos.x = e.clientX - rect.left;
        gameState.mousePos.y = e.clientY - rect.top;

        // Handle slider dragging
        if (gameState.isDraggingSlider && gameState.draggedFurnitureType) {
            e.preventDefault(); // Prevent default drag behavior
            updateSliderValue(gameState.mousePos.x);
        } else {
            // Not dragging - ensure default cursor
            canvas.style.cursor = 'default';
        }

        // Handle furniture dragging
        if (gameState.isDraggingFurniture && gameState.selectedPlacedFurniture) {
            gameState.selectedPlacedFurniture.x = gameState.mousePos.x - gameState.selectedPlacedFurniture.width / 2;
            gameState.selectedPlacedFurniture.y = gameState.mousePos.y - gameState.selectedPlacedFurniture.height / 2;
        }
    } else {
        // Outside, use world coordinates
        gameState.mousePos.x = e.clientX - rect.left + gameState.camera.x;
        gameState.mousePos.y = e.clientY - rect.top + gameState.camera.y;

        // Check if hovering over compass and change cursor
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const compassX = canvas.width - 60;
        const compassY = 140;
        const compassRadius = 25;
        const distanceToCompass = getDistance(mouseX, mouseY, compassX, compassY);

        if (distanceToCompass <= compassRadius) {
            canvas.style.cursor = 'pointer';
            gameState.compassHover = true;
        } else {
            canvas.style.cursor = 'default';
            gameState.compassHover = false;
        }
    }
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (gameState.isInsideHouse) {
        // Try handling furniture shop clicks (including sliders)
        if (handleFurnitureShopClick(clickX, clickY, true)) {
            e.preventDefault(); // Prevent default drag behavior
            return; // Click was handled by shop
        }

        // Check if clicking on placed furniture
        // ONLY if we're not currently placing furniture from the shop
        if (!gameState.selectedFurnitureType) {
            const clickedFurniture = checkPlacedFurnitureClick(clickX, clickY);
            if (clickedFurniture) {
                gameState.selectedPlacedFurniture = clickedFurniture;
                gameState.isDraggingFurniture = true;
            }
        }
    }
});

// Reset drag states on any mouseup (document level catches all, including outside canvas)
document.addEventListener('mouseup', () => {
    gameState.isDraggingSlider = false;
    gameState.draggedSliderType = null;
    gameState.draggedFurnitureType = null;
    gameState.isDraggingFurniture = false;
    canvas.style.cursor = 'default';
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Start music on first click
    tryStartMusic();

    // Check for minimap legend clicks
    if (gameState.showMinimap && gameState.minimapLegendBounds.length > 0) {
        for (let bound of gameState.minimapLegendBounds) {
            if (clickX >= bound.x && clickX <= bound.x + bound.width &&
                clickY >= bound.y && clickY <= bound.y + bound.height) {
                // Toggle this layer
                gameState.minimapLayers[bound.toggleKey] = !gameState.minimapLayers[bound.toggleKey];
                return; // Consume the click
            }
        }
    }

    if (gameState.isInsideHouse) {
        // Handle furniture shop clicks
        if (!handleFurnitureShopClick(clickX, clickY)) {
            // If not clicking shop and not dragging
            if (!gameState.isDraggingFurniture) {
                // Priority 1: If placing furniture from shop, always complete placement
                if (gameState.selectedFurnitureType) {
                    placeFurniture(clickX, clickY);
                } else {
                    // Priority 2: Only check for selecting placed furniture when not placing
                    const clickedFurniture = checkPlacedFurnitureClick(clickX, clickY);
                    if (clickedFurniture) {
                        gameState.selectedPlacedFurniture = clickedFurniture;
                    } else {
                        // Clicking empty space - deselect
                        gameState.selectedPlacedFurniture = null;
                    }
                }
            }
        }
    } else {
        // Outside - check for compass click first, then shoot magic

        // Check if clicking compass (top right corner)
        const compassX = canvas.width - 60;
        const compassY = 140; // 60 (sun/moon y) + 30 (sun/moon radius) + 50 (offset)
        const compassRadius = 25;
        const distanceToCompass = getDistance(clickX, clickY, compassX, compassY);

        if (distanceToCompass <= compassRadius) {
            teleportToFountain();
        } else {
            // Not clicking compass - shoot magic
            if (gameState.player) {
                gameState.player.shootMagic(gameState.mousePos.x, gameState.mousePos.y);
            }
        }
    }
});

// Start Game
function startGame() {
    document.getElementById('gameScreen').style.display = 'block';

    // Initialize game objects FIRST
    gameState.village = new Village();

    // Set game start time for title fade effect
    gameState.gameStartTime = Date.now();

    // Start player in front of (below) the cat fountain
    const fountainCenterX = gameState.village.catFountain.x + gameState.village.catFountain.width / 2;
    const fountainBottomY = gameState.village.catFountain.y + gameState.village.catFountain.height;
    gameState.player = new Player(fountainCenterX - 24, fountainBottomY + 50); // Center player in front of fountain

    // Start as cat
    gameState.player.isCat = true;

    // Spawn items
    spawnItems(200); // Increased from 100 for more hearts in forest

    // Spawn chests (LOTS in the huge forest)
    spawnChests(500);

    // Start game loop
    gameLoop();

    // Music will start on first player movement (handled in player update)
}

function spawnItems(count) {
    const itemTypes = ['apple', 'orange', 'berry'];

    for (let i = 0; i < count; i++) {
        const x = Math.random() * gameState.village.width;
        const y = Math.random() * gameState.village.height;
        const type = itemTypes[Math.floor(Math.random() * itemTypes.length)];

        gameState.items.push(new Item(x, y, type));
    }
}

function spawnChests(count) {
    for (let i = 0; i < count; i++) {
        let validPosition = false;
        let x, y, distanceFromCenter = 0;
        let attempts = 0;

        while (!validPosition && attempts < 50) {
            x = 300 + Math.random() * (gameState.village.width - 600);
            y = 300 + Math.random() * (gameState.village.height - 600);
            validPosition = true;
            attempts++;

            // Check distance from buildings - must be at least 120 units away or clearly in front
            for (let building of gameState.village.buildings) {
                const distance = getDistance(x, y, building.x, building.y);

                // If too close (less than 120 units), only allow if chest is clearly in front (below)
                if (distance < 120 && y < building.y + 100) {
                    validPosition = false;
                    break;
                }
            }

            // Check distance from trees - must be at least 60 units away
            if (validPosition) {
                for (let tree of gameState.village.trees) {
                    if (getDistance(x, y, tree.x, tree.y) < 60) {
                        validPosition = false;
                        break;
                    }
                }
            }

            // Check distance from cat fountain - must be at least 300 units away from center
            distanceFromCenter = 0;
            if (validPosition && gameState.village.catFountain) {
                const fountainCenterX = gameState.village.catFountain.x + gameState.village.catFountain.width / 2;
                const fountainCenterY = gameState.village.catFountain.y + gameState.village.catFountain.height / 2;
                distanceFromCenter = getDistance(x, y, fountainCenterX, fountainCenterY);
                if (distanceFromCenter < 300) {
                    validPosition = false;
                }
            }

            // Check distance from other chests (tier-aware minimum distance)
            if (validPosition) {
                // Calculate tier of this new chest position
                const newChestTier = Math.min(Math.floor(distanceFromCenter / 2000), 4);

                for (let chest of gameState.chests) {
                    const distance = getDistance(x, y, chest.x, chest.y);

                    // Purple-to-Purple: 350 units, anything else: 500 units
                    const minDistance = (newChestTier === 0 && chest.tier === 0) ? 350 : 500;

                    if (distance < minDistance) {
                        validPosition = false;
                        break;
                    }
                }
            }
        }

        if (validPosition) {
            // Calculate tier to determine spawn probability
            const tier = Math.min(Math.floor(distanceFromCenter / 2000), 4);

            // Spawn probability based on tier
            let spawnProbability = 1.0; // Default: 100%
            if (tier === 0) {
                spawnProbability = 0.8; // Purple: 80% chance
            } else if (tier === 1) {
                spawnProbability = 0.65; // Green: 65% chance
            } else if (tier === 2) {
                spawnProbability = 0.55; // Blue: 55% chance
            } else if (tier === 3) {
                spawnProbability = 0.4; // Red: 40% chance
            } else if (tier === 4) {
                spawnProbability = 0.3; // Magenta: 30% chance
            }

            // Only spawn if probability check passes
            if (Math.random() < spawnProbability) {
                gameState.chests.push(new Chest(x, y, distanceFromCenter));
            }
        }
    }
}

function enterHouse(building) {
    gameState.isInsideHouse = true;
    gameState.currentHouseId = building.id;
    gameState.selectedFurnitureType = null;

    // Load this house's furniture (or empty array if first time)
    if (!gameState.houseFurniture[building.id]) {
        gameState.houseFurniture[building.id] = [];
    }
    gameState.placedFurniture = gameState.houseFurniture[building.id];

    // Position player near the entrance (bottom center of room)
    const layout = getInteriorLayout();

    // Start player just above the door area (bottom center)
    gameState.player.houseX = layout.roomX + layout.roomWidth / 2 - gameState.player.width / 2;
    gameState.player.houseY = layout.roomY + layout.roomHeight - layout.wallThickness - gameState.player.height - 60;
}

function exitHouse() {
    // Save current furniture back to the house
    if (gameState.currentHouseId) {
        gameState.houseFurniture[gameState.currentHouseId] = gameState.placedFurniture;
    }

    gameState.isInsideHouse = false;
    gameState.currentHouseId = null;
    gameState.selectedFurnitureType = null;
    gameState.lastHouseExitTime = Date.now();
}

// Draw house interior
function drawHouseInterior(ctx) {
    const layout = getInteriorLayout();
    const { roomWidth, roomHeight, roomX, roomY, wallThickness } = layout;

    // Update player movement in house
    if (gameState.player) {
        const prevX = gameState.player.houseX;
        const prevY = gameState.player.houseY;

        // Check if speed boost has expired (same as world movement)
        gameState.player.checkSpeedBoost();

        // Use actual speed with cat multiplier (same as world movement)
        const actualSpeed = gameState.player.getActualSpeed();

        let moved = false;
        if (gameState.keys['ArrowUp']) {
            gameState.player.houseY -= actualSpeed;
            moved = true;
        }
        if (gameState.keys['ArrowDown']) {
            gameState.player.houseY += actualSpeed;
            moved = true;
        }
        if (gameState.keys['ArrowLeft']) {
            gameState.player.houseX -= actualSpeed;
            gameState.player.facingRight = false;
            moved = true;
        }
        if (gameState.keys['ArrowRight']) {
            gameState.player.houseX += actualSpeed;
            gameState.player.facingRight = true;
            moved = true;
        }

        // Update animation state (walking frames, idle animations) - works for both cat and human
        gameState.player.updateAnimation(moved, gameState.player.houseX, gameState.player.houseY, true);

        // Proper collision with walls - keep player fully inside room
        const leftBound = roomX + wallThickness;
        const rightBound = roomX + roomWidth - wallThickness - gameState.player.width;
        const topBound = roomY + wallThickness;
        const bottomBound = roomY + roomHeight - wallThickness - gameState.player.height;

        if (gameState.player.houseX < leftBound || gameState.player.houseX > rightBound ||
            gameState.player.houseY < topBound || gameState.player.houseY > bottomBound) {
            gameState.player.houseX = prevX;
            gameState.player.houseY = prevY;
        }

        // Door area is at the bottom center (no special handling needed - E exits from anywhere)
    }

    // Update companions in house
    const dt = gameState.deltaTime || 16;
    for (let i = 0; i < gameState.companions.length; i++) {
        const companion = gameState.companions[i];
        if (!companion.houseX) {
            companion.houseX = gameState.player.houseX + 50;
            companion.houseY = gameState.player.houseY + 50;
        }

        // If player is sleeping, companions form a ring around them
        if (gameState.player.isCat && gameState.player.idleAnimationType === 'sleep') {
            // Move toward ring position
            if (companion.houseTargetX !== undefined && companion.houseTargetY !== undefined) {
                const dx = companion.houseTargetX - companion.houseX;
                const dy = companion.houseTargetY - companion.houseY;
                const distance = getDistance(companion.houseTargetX, companion.houseTargetY, companion.houseX, companion.houseY);

                if (distance > 5) { // Close enough threshold
                    const angle = Math.atan2(dy, dx);
                    companion.houseX += Math.cos(angle) * companion.speed * 0.5; // Move slowly
                    companion.houseY += Math.sin(angle) * companion.speed * 0.5;
                }
            }
        } else {
            // Follow player normally
            const targetDist = 50 + i * 30;
            const dx = gameState.player.houseX - companion.houseX;
            const dy = gameState.player.houseY - companion.houseY;
            const distance = getDistance(gameState.player.houseX, gameState.player.houseY, companion.houseX, companion.houseY);

            if (distance > targetDist) {
                const angle = Math.atan2(dy, dx);
                companion.houseX += Math.cos(angle) * companion.speed;
                companion.houseY += Math.sin(angle) * companion.speed;
            }
        }

        // 0.006 rad/ms = ~1 cycle per second (was 0.1 per frame at 60fps)
        companion.bobOffset += 0.006 * dt;
    }

    // Clear canvas with dark background
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw room floor with tiled floorboards (scaled down)
    if (floorboardsImage.complete) {
        // Scale down the floorboard tiles for better tiling
        const tileSize = 160; // Tile size for repeating pattern

        // Only tile within the room interior (not the bottom UI area)
        for (let y = roomY; y < roomY + roomHeight; y += tileSize) {
            for (let x = roomX; x < roomX + roomWidth; x += tileSize) {
                // Calculate how much of the tile to draw (crop at edges, don't scale)
                const drawWidth = Math.min(tileSize, roomX + roomWidth - x);
                const drawHeight = Math.min(tileSize, roomY + roomHeight - y);

                // Calculate source crop proportionally
                const sourceWidth = (drawWidth / tileSize) * floorboardsImage.width;
                const sourceHeight = (drawHeight / tileSize) * floorboardsImage.height;

                ctx.drawImage(
                    floorboardsImage,
                    0, 0, sourceWidth, sourceHeight, // Source crop (not full image at edges)
                    x, y, drawWidth, drawHeight // Destination (maintain size, crop instead of scale)
                );
            }
        }
    } else {
        // Fallback to solid color if image not loaded
        ctx.fillStyle = '#F5DEB3';
        ctx.fillRect(roomX, roomY, roomWidth, roomHeight);
    }

    // Draw walls
    ctx.fillStyle = '#D2B48C';
    ctx.fillRect(roomX, roomY, roomWidth, wallThickness); // Top wall
    ctx.fillRect(roomX, roomY, wallThickness, roomHeight); // Left wall
    ctx.fillRect(roomX + roomWidth - wallThickness, roomY, wallThickness, roomHeight); // Right wall
    ctx.fillRect(roomX, roomY + roomHeight - wallThickness, roomWidth, wallThickness); // Bottom wall

    // Draw door
    ctx.fillStyle = '#8B4513';
    const doorWidth = 60;
    const doorX = roomX + roomWidth / 2 - doorWidth / 2;
    const doorY = roomY + roomHeight - wallThickness;
    ctx.fillRect(doorX, doorY, doorWidth, wallThickness);

    // Door text
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press E to Exit', roomX + roomWidth / 2, doorY - 10);

    // Draw placed furniture
    for (let furniture of gameState.placedFurniture) {
        ctx.save();

        // Apply rotation
        const centerX = furniture.x + furniture.width / 2;
        const centerY = furniture.y + furniture.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate((furniture.rotation || 0) * Math.PI / 180);
        ctx.translate(-centerX, -centerY);

        // Draw furniture image or colored rectangle (scaled by furniture.size)
        const furnitureImg = furnitureImages[furniture.type];
        const scale = (furniture.size || 1.0) * 1.5; // Apply custom size on top of base 1.5x scale
        const scaledWidth = furniture.width * scale;
        const scaledHeight = furniture.height * scale;
        const scaledX = furniture.x - (scaledWidth - furniture.width) / 2;
        const scaledY = furniture.y - (scaledHeight - furniture.height) / 2;

        if (furnitureImg && furnitureImg.complete) {
            // Apply hue rotation filter
            if (furniture.hue) {
                ctx.filter = `hue-rotate(${furniture.hue}deg)`;
            }
            ctx.drawImage(furnitureImg, scaledX, scaledY, scaledWidth, scaledHeight);
            if (furniture.hue) {
                ctx.filter = 'none';
            }
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = furniture.color;
            ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);
        }

        // Draw selection highlight
        if (furniture === gameState.selectedPlacedFurniture) {
            ctx.strokeStyle = '#9B59B6';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(scaledX - 2, scaledY - 2, scaledWidth + 4, scaledHeight + 4);
            ctx.setLineDash([]);
        }

        ctx.restore();
    }

    // Draw companions
    for (let companion of gameState.companions) {
        // Shadow
        drawCompanionShadow(ctx, companion.houseX, companion.houseY);

        // Draw friend image
        const image = friendImages[companion.type];
        if (image && image.complete) {
            ctx.drawImage(image, companion.houseX, companion.houseY + Math.sin(companion.bobOffset) * 2, companion.width, companion.height);
        }
    }

    // Update and draw dropped companions in house
    for (let i = gameState.droppedCompanions.length - 1; i >= 0; i--) {
        const dropped = gameState.droppedCompanions[i];

        // Skip if this companion is outside
        if (!dropped.isInHouse || dropped.houseId !== gameState.currentHouseId) continue;

        // Initialize house position if not set
        if (!dropped.houseX) {
            dropped.houseX = dropped.x || roomX + roomWidth / 2;
            dropped.houseY = dropped.y || roomY + roomHeight / 2;
        }

        const dt = gameState.deltaTime || 16;

        // Wandering behavior
        dropped.wanderCooldown = (dropped.wanderCooldown || 0) - dt;
        if (dropped.wanderCooldown <= 0 && (!dropped.wanderTarget || (Math.abs(dropped.houseX - dropped.wanderTarget.x) < 5 && Math.abs(dropped.houseY - dropped.wanderTarget.y) < 5))) {
            // Pick new random wander target
            dropped.wanderTarget = {
                x: roomX + 50 + Math.random() * (roomWidth - 100),
                y: roomY + 50 + Math.random() * (roomHeight - 100)
            };
            dropped.wanderCooldown = 2000 + Math.random() * 3000; // 2-5 seconds
        }

        // Move towards wander target
        if (dropped.wanderTarget) {
            const dx = dropped.wanderTarget.x - dropped.houseX;
            const dy = dropped.wanderTarget.y - dropped.houseY;
            const dist = getDistance(dropped.wanderTarget.x, dropped.wanderTarget.y, dropped.houseX, dropped.houseY);
            if (dist > 1) {
                const speed = 0.5;
                dropped.houseX += (dx / dist) * speed;
                dropped.houseY += (dy / dist) * speed;
            }
        }

        // Check if player touches the dropped companion
        if (gameState.player) {
            const distance = getDistance(dropped.houseX, dropped.houseY, gameState.player.houseX, gameState.player.houseY);

            if (distance < 40) {
                // Pick up the companion and add back to line
                gameState.companions.push(dropped.companion);
                gameState.droppedCompanions.splice(i, 1);
                continue;
            }
        }

        // Draw dropped companion
        const companionSize = dropped.companion.sizeMultiplier || 1.0;

        // Shadow
        drawCompanionShadow(ctx, dropped.houseX, dropped.houseY, companionSize);

        const image = friendImages[dropped.type];
        if (image && image.complete) {
            // 0.006 rad/ms = ~1 cycle per second
            dropped.bobOffset += 0.006 * dt;
            const width = 40 * companionSize;
            const height = 40 * companionSize;
            ctx.drawImage(image, dropped.houseX, dropped.houseY + Math.sin(dropped.bobOffset) * 2, width, height);
        }
    }

    // Draw player
    if (gameState.player) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(gameState.player.houseX + 24, gameState.player.houseY + 60, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw player sprite using shared sprite getters
        const sprite = gameState.player.isCat ? gameState.player.getCatSprite() : gameState.player.getGirlSprite();

        if (sprite.complete) {
            ctx.save();
            if (gameState.player.facingRight) {
                ctx.translate(gameState.player.houseX + gameState.player.width, gameState.player.houseY);
                ctx.scale(-1, 1);
                ctx.drawImage(sprite, 0, 0, gameState.player.width, gameState.player.height);
            } else {
                ctx.drawImage(sprite, gameState.player.houseX, gameState.player.houseY, gameState.player.width, gameState.player.height);
            }
            ctx.restore();
        }
    }

    // Draw furniture shop UI
    drawFurnitureShop(ctx);

    // If furniture is selected, show placement preview
    if (gameState.selectedFurnitureType) {
        const furniture = furnitureByType[gameState.selectedFurnitureType]?.furniture;
        if (furniture) {
            ctx.save();
            ctx.globalAlpha = 0.5;

            // Get current size and apply it
            const currentSize = gameState.furnitureSizes[furniture.type] || 1.0;
            const scale = currentSize * 1.5;
            const scaledWidth = furniture.width * scale;
            const scaledHeight = furniture.height * scale;

            // Apply rotation to preview
            const previewX = gameState.mousePos.x - scaledWidth / 2;
            const previewY = gameState.mousePos.y - scaledHeight / 2;
            const centerX = gameState.mousePos.x;
            const centerY = gameState.mousePos.y;

            ctx.translate(centerX, centerY);
            ctx.rotate(gameState.placementRotation * Math.PI / 180);
            ctx.translate(-centerX, -centerY);

            // Apply hue shift to preview
            const currentHue = gameState.furnitureHues[furniture.type] || 0;
            const furnitureImg = furnitureImages[furniture.type];

            if (furnitureImg && furnitureImg.complete) {
                // Show image with hue rotation
                if (currentHue) {
                    ctx.filter = `hue-rotate(${currentHue}deg)`;
                }
                ctx.drawImage(furnitureImg, previewX, previewY, scaledWidth, scaledHeight);
                if (currentHue) {
                    ctx.filter = 'none';
                }
            } else {
                // Fallback to colored rectangle
                const shiftedColor = shiftHue(furniture.color, currentHue);
                ctx.fillStyle = shiftedColor;
                ctx.fillRect(previewX, previewY, scaledWidth, scaledHeight);
            }

            ctx.restore();

            // Instructions
            ctx.fillStyle = '#FFF';
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.strokeText('Click to place | R to rotate', canvas.width / 2, 100);
            ctx.fillText('Click to place | R to rotate', canvas.width / 2, 100);
        }
    }
}

// Helper function to shift hue of a hex color
function shiftHue(hexColor, hueShift) {
    // Convert hex to RGB
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;

    // Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    // Apply hue shift
    h = (h + hueShift / 360) % 1;

    // Convert HSL back to RGB
    let r2, g2, b2;
    if (s === 0) {
        r2 = g2 = b2 = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r2 = hue2rgb(p, q, h + 1/3);
        g2 = hue2rgb(p, q, h);
        b2 = hue2rgb(p, q, h - 1/3);
    }

    // Convert back to hex
    const toHex = (x) => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r2) + toHex(g2) + toHex(b2);
}

// Draw furniture shop
function drawFurnitureShop(ctx) {
    const layout = getInteriorLayout();
    const { shopY, shopX, itemWidth, gap } = layout;
    const itemHeight = 140; // Item-specific height for shop display

    // Calculate shop background size for horizontal layout
    const shopWidth = (itemWidth + gap) * gameState.furnitureShop.length + 20;
    const shopHeight = itemHeight + 40;

    // Shop background - properly positioned below room
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(shopX - 15, shopY - 30, shopWidth, shopHeight, 10);
    ctx.fill();

    // Shop title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Furniture Shop', shopX, shopY - 15);

    // Draw shop items horizontally
    for (let i = 0; i < gameState.furnitureShop.length; i++) {
        const furniture = gameState.furnitureShop[i];
        const x = shopX + i * (itemWidth + gap);
        const y = shopY;

        // Item background with rounded corners
        const isSelected = gameState.selectedFurnitureType === furniture.type;
        const cornerRadius = 8;
        ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(x, y, itemWidth, itemHeight, cornerRadius);
        ctx.fill();

        // Get current hue and size
        const currentHue = gameState.furnitureHues[furniture.type] || 0;
        const currentSize = gameState.furnitureSizes[furniture.type] || 1.0;

        // Furniture preview with more padding (bigger icon with rotation)
        const previewSize = 65;
        const currentRotation = gameState.furnitureTypeRotations[furniture.type] || 0;
        const furnitureImg = furnitureImages[furniture.type];

        ctx.save();
        // Center the rotation
        ctx.translate(x + 8 + previewSize / 2, y + 8 + previewSize / 2);
        ctx.rotate((currentRotation * Math.PI) / 180);

        if (furnitureImg && furnitureImg.complete) {
            ctx.filter = `hue-rotate(${currentHue}deg)`;
            ctx.drawImage(furnitureImg, -previewSize / 2, -previewSize / 2, previewSize, previewSize);
        } else {
            const shiftedColor = shiftHue(furniture.color, currentHue);
            ctx.fillStyle = shiftedColor;
            ctx.fillRect(-previewSize / 2, -previewSize / 2, previewSize, previewSize);
        }
        ctx.restore();

        // Furniture name (moved down more)
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(furniture.name.substring(0, 9), x + 8, y + 85);

        // Rotate button (circular arrow)
        const rotateButtonX = x + itemWidth - 20;
        const rotateButtonY = y + 15;
        const rotateButtonRadius = 10;

        ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
        ctx.beginPath();
        ctx.arc(rotateButtonX, rotateButtonY, rotateButtonRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(rotateButtonX, rotateButtonY, 6, 0, 1.5 * Math.PI);
        ctx.stroke();

        // Arrow tip
        ctx.beginPath();
        ctx.moveTo(rotateButtonX, rotateButtonY - 6);
        ctx.lineTo(rotateButtonX - 3, rotateButtonY - 9);
        ctx.lineTo(rotateButtonX + 3, rotateButtonY - 9);
        ctx.closePath();
        ctx.fillStyle = '#FFF';
        ctx.fill();

        // Color slider with more space (moved down to fit bigger icon)
        const sliderWidth = itemWidth - 20;
        const sliderHeight = 10; // Increased from 6 for easier interaction
        const colorSliderX = x + 10;
        const colorSliderY = y + 98;

        // Rounded slider background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect(colorSliderX, colorSliderY, sliderWidth, sliderHeight, sliderHeight / 2);
        ctx.fill();

        // Use cached hue gradient with translate for positioning
        ctx.save();
        ctx.translate(colorSliderX, colorSliderY);
        ctx.fillStyle = cachedHueSliderGradient;
        ctx.beginPath();
        ctx.roundRect(0, 0, sliderWidth, sliderHeight, sliderHeight / 2);
        ctx.fill();
        ctx.restore();

        const colorHandleX = colorSliderX + (currentHue / 360) * sliderWidth;
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(colorHandleX, colorSliderY + sliderHeight / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Size slider with more space (moved down to fit bigger icon)
        const sizeSliderX = x + 10;
        const sizeSliderY = y + 118;

        // Rounded slider background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.roundRect(sizeSliderX, sizeSliderY, sliderWidth, sliderHeight, sliderHeight / 2);
        ctx.fill();

        // Use cached size gradient with translate for positioning
        ctx.save();
        ctx.translate(sizeSliderX, sizeSliderY);
        ctx.fillStyle = cachedSizeSliderGradient;
        ctx.beginPath();
        ctx.roundRect(0, 0, sliderWidth, sliderHeight, sliderHeight / 2);
        ctx.fill();
        ctx.restore();

        const sizeHandleX = sizeSliderX + ((currentSize - 0.5) / 1.5) * sliderWidth;
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sizeHandleX, sizeSliderY + sliderHeight / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

// Update slider value during drag
function updateSliderValue(mouseX) {
    if (!gameState.isDraggingSlider || !gameState.draggedFurnitureType) return;

    const layout = getInteriorLayout();
    const { shopX, itemWidth, gap } = layout;

    // Find which furniture item index
    const furnitureIndex = furnitureByType[gameState.draggedFurnitureType]?.index ?? -1;
    if (furnitureIndex === -1) return;

    const x = shopX + furnitureIndex * (itemWidth + gap);
    const sliderWidth = itemWidth - 20;
    const sliderX = x + 10;

    if (gameState.draggedSliderType === 'color') {
        // Clamp mouseX to slider bounds
        const clampedX = Math.max(sliderX, Math.min(mouseX, sliderX + sliderWidth));
        const hue = ((clampedX - sliderX) / sliderWidth) * 360;
        gameState.furnitureHues[gameState.draggedFurnitureType] = Math.max(0, Math.min(360, hue));

        // Update selected furniture if applicable
        if (gameState.selectedPlacedFurniture && gameState.selectedPlacedFurniture.type === gameState.draggedFurnitureType) {
            const furniture = furnitureByType[gameState.draggedFurnitureType]?.furniture;
            gameState.selectedPlacedFurniture.hue = hue;
            gameState.selectedPlacedFurniture.color = shiftHue(furniture.color, hue);
        }
    } else if (gameState.draggedSliderType === 'size') {
        // Clamp mouseX to slider bounds
        const clampedX = Math.max(sliderX, Math.min(mouseX, sliderX + sliderWidth));
        const size = 0.5 + ((clampedX - sliderX) / sliderWidth) * 1.5;
        gameState.furnitureSizes[gameState.draggedFurnitureType] = Math.max(0.5, Math.min(2.0, size));

        // Update selected furniture if applicable
        if (gameState.selectedPlacedFurniture && gameState.selectedPlacedFurniture.type === gameState.draggedFurnitureType) {
            gameState.selectedPlacedFurniture.size = size;
        }
    }
}

// Handle furniture shop clicks
// isMouseDown: true if called from mousedown, false if from click
function handleFurnitureShopClick(clickX, clickY, isMouseDown = false) {
    const layout = getInteriorLayout();
    const { shopY, shopX, itemWidth, gap } = layout;

    for (let i = 0; i < gameState.furnitureShop.length; i++) {
        const furniture = gameState.furnitureShop[i];
        const x = shopX + i * (itemWidth + gap);
        const y = shopY;

        // Check if clicking on rotate button
        const rotateButtonX = x + itemWidth - 20;
        const rotateButtonY = y + 15;
        const rotateButtonRadius = 10;
        const distToRotateButton = getDistance(clickX, clickY, rotateButtonX, rotateButtonY);

        if (distToRotateButton <= rotateButtonRadius) {
            // Rotate this furniture type's rotation by 45 degrees
            const currentRotation = gameState.furnitureTypeRotations[furniture.type] || 0;
            gameState.furnitureTypeRotations[furniture.type] = (currentRotation + 45) % 360;

            // If a placed furniture of this type is selected, update it too
            if (gameState.selectedPlacedFurniture && gameState.selectedPlacedFurniture.type === furniture.type) {
                gameState.selectedPlacedFurniture.rotation = (gameState.selectedPlacedFurniture.rotation + 45) % 360;
            }
            return true;
        }

        // Check slider areas
        const sliderWidth = itemWidth - 20;
        const sliderHeight = 10;
        const colorSliderX = x + 10;
        const colorSliderY = y + 98;
        const sizeSliderX = x + 10;
        const sizeSliderY = y + 118;

        // Check if in color slider area
        if (clickX >= colorSliderX && clickX <= colorSliderX + sliderWidth &&
            clickY >= colorSliderY - 5 && clickY <= colorSliderY + sliderHeight + 5) {
            // Only start drag on mousedown, but always return true to indicate click was in shop
            if (isMouseDown) {
                gameState.isDraggingSlider = true;
                gameState.draggedSliderType = 'color';
                gameState.draggedFurnitureType = furniture.type;

                const hue = ((clickX - colorSliderX) / sliderWidth) * 360;
                gameState.furnitureHues[furniture.type] = Math.max(0, Math.min(360, hue));

                if (gameState.selectedPlacedFurniture && gameState.selectedPlacedFurniture.type === furniture.type) {
                    gameState.selectedPlacedFurniture.hue = hue;
                    gameState.selectedPlacedFurniture.color = shiftHue(furniture.color, hue);
                }
            }
            return true; // Always return true - click was in shop area
        }

        // Check if in size slider area
        if (clickX >= sizeSliderX && clickX <= sizeSliderX + sliderWidth &&
            clickY >= sizeSliderY - 5 && clickY <= sizeSliderY + sliderHeight + 5) {
            // Only start drag on mousedown, but always return true to indicate click was in shop
            if (isMouseDown) {
                gameState.isDraggingSlider = true;
                gameState.draggedSliderType = 'size';
                gameState.draggedFurnitureType = furniture.type;

                const size = 0.5 + ((clickX - sizeSliderX) / sliderWidth) * 1.5;
                gameState.furnitureSizes[furniture.type] = Math.max(0.5, Math.min(2.0, size));

                if (gameState.selectedPlacedFurniture && gameState.selectedPlacedFurniture.type === furniture.type) {
                    gameState.selectedPlacedFurniture.size = size;
                }
            }
            return true; // Always return true - click was in shop area
        }

        // Check if clicking on furniture item preview/name area
        if (clickX >= x && clickX <= x + itemWidth &&
            clickY >= y && clickY <= y + 80) { // Top area with preview and name (increased for bigger icon)
            // Only select from shop if not clicking sliders/buttons - and clear placed selection
            gameState.selectedFurnitureType = furniture.type;
            gameState.selectedPlacedFurniture = null;
            // Use stored rotation for this furniture type
            gameState.placementRotation = gameState.furnitureTypeRotations[furniture.type] || 0;
            return true;
        }
    }
    return false;
}

// Check if click is on placed furniture
function checkPlacedFurnitureClick(x, y) {
    // Check in reverse order (top to bottom)
    for (let i = gameState.placedFurniture.length - 1; i >= 0; i--) {
        const furniture = gameState.placedFurniture[i];
        const scale = (furniture.size || 1.0) * 1.5;
        const scaledWidth = furniture.width * scale;
        const scaledHeight = furniture.height * scale;
        const scaledX = furniture.x - (scaledWidth - furniture.width) / 2;
        const scaledY = furniture.y - (scaledHeight - furniture.height) / 2;

        if (x >= scaledX && x <= scaledX + scaledWidth &&
            y >= scaledY && y <= scaledY + scaledHeight) {
            return furniture;
        }
    }
    return null;
}

// Place furniture
function placeFurniture(x, y) {
    if (!gameState.selectedFurnitureType) return;

    const furnitureTemplate = furnitureByType[gameState.selectedFurnitureType]?.furniture;
    if (!furnitureTemplate) return;

    // Place furniture (free now, no cost check)
    const currentHue = gameState.furnitureHues[furnitureTemplate.type] || 0;
    const currentSize = gameState.furnitureSizes[furnitureTemplate.type] || 1.0;
    const shiftedColor = shiftHue(furnitureTemplate.color, currentHue);

    gameState.placedFurniture.push({
        type: furnitureTemplate.type,
        name: furnitureTemplate.name,
        color: shiftedColor,
        hue: currentHue,
        size: currentSize,
        width: furnitureTemplate.width,
        height: furnitureTemplate.height,
        x: x - furnitureTemplate.width / 2,
        y: y - furnitureTemplate.height / 2,
        rotation: gameState.placementRotation
    });

    // Deselect
    gameState.selectedFurnitureType = null;
    gameState.placementRotation = 0;
}

// Handle player interactions with priority
function handleInteractions() {
    const eKeyPressed = gameState.keys['e'] || gameState.keys['E'];

    // Only trigger on new key press, not when held down
    if (!eKeyPressed) {
        gameState.eKeyWasPressed = false;
        return;
    }

    if (gameState.eKeyWasPressed) {
        return; // Key is being held, don't trigger again
    }

    gameState.eKeyWasPressed = true;

    if (!gameState.player) return;

    // If inside house, E key exits from anywhere
    if (gameState.isInsideHouse) {
        exitHouse();
        return;
    }

    const player = gameState.player;
    const interactions = [];

    // Collect all closed chests in range that can be opened (E key opens both free and firefly chests)
    for (let chest of gameState.chests) {
        if (!chest.opened && chest.canOpen() && chest.isNear(player, 80 * chest.sizeMultiplier)) {
            const distance = getDistance(chest.x, chest.y, player.x, player.y);
            interactions.push({
                type: 'chest',
                target: chest,
                distance: distance,
                priority: 1 // Highest priority
            });
        }
    }

    // Collect all buildings (houses) in range
    if (gameState.village) {
        const canEnter = gameState.frameTime - gameState.lastHouseExitTime > 500;
        if (canEnter) {
            for (let building of gameState.village.buildings) {
                if (player.isNear(building, 200)) {
                    const distance = getDistance(building.x, building.y, player.x, player.y);
                    interactions.push({
                        type: 'building',
                        target: building,
                        distance: distance,
                        priority: 2 // Lower priority than chests
                    });
                }
            }
        }
    }

    // If no interactions available, return
    if (interactions.length === 0) {
        return;
    }

    // Sort by priority first, then by distance
    interactions.sort((a, b) => {
        if (a.priority !== b.priority) {
            return a.priority - b.priority; // Lower number = higher priority
        }
        return a.distance - b.distance; // Closer is better
    });

    // Trigger the highest priority, closest interaction
    const chosen = interactions[0];
    if (chosen.type === 'chest') {
        chosen.target.open();
    } else if (chosen.type === 'building') {
        enterHouse(chosen.target);
    }
}

// Spawn fireflies
function spawnFireflies() {
    gameState.fireflies = [];

    // Spawn many fireflies across the map so they're visible "all over" at night
    // With a 16000x12000 map and 1200x800 viewport, we need ~3000+ to see multiple per screen
    const fireflyCount = 3000;
    for (let i = 0; i < fireflyCount; i++) {
        const x = Math.random() * gameState.village.width;
        const y = Math.random() * gameState.village.height;

        gameState.fireflies.push({
            x: x,
            y: y,
            hue: 0, // Initial hue (no rotation)
            xpValue: 10, // XP value increases by 5 each time hit by magic
            size: 32, // Size in pixels (grows with magic hits)
            isRainbow: false, // After full color cycle, undulates rainbow
            floatOffset: Math.random() * Math.PI * 2, // Random start for floating animation
            floatSpeed: 0.02 + Math.random() * 0.03,
            driftX: (Math.random() - 0.5) * 0.3,
            driftY: (Math.random() - 0.5) * 0.3
        });
    }
}

// Clear fireflies
function clearFireflies() {
    gameState.fireflies = [];
    // Clear the firefly image cache to free memory
    for (const key in fireflyImageCache) {
        delete fireflyImageCache[key];
    }
}

// Day/Night Cycle
function updateDayNightCycle(deltaTime) {
    gameState.gameTime += deltaTime;
    gameState.timeOfDay = (gameState.gameTime % CONFIG.DAY_LENGTH) / CONFIG.DAY_LENGTH;

    // Store previous night state
    gameState.previousIsNight = gameState.isNight;

    // 0-0.25 = Morning, 0.25-0.5 = Day, 0.5-0.75 = Evening, 0.75-1 = Night
    gameState.isNight = gameState.timeOfDay > 0.6 || gameState.timeOfDay < 0.1;

    // Detect transitions
    if (gameState.isNight && !gameState.previousIsNight) {
        // Just became night - spawn fireflies
        spawnFireflies();
    } else if (!gameState.isNight && gameState.previousIsNight) {
        // Just became day - clear fireflies
        clearFireflies();
    }

    // Chests no longer reset at dawn - removed feature
}

// Draw sun/moon indicator
function drawSunMoon(ctx) {
    const x = canvas.width - 60;  // Closer to right corner
    const y = 60;  // Closer to top corner
    const radius = 30;

    if (gameState.isNight) {
        // Draw moon
        ctx.fillStyle = '#F0E68C';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Moon craters
        ctx.fillStyle = '#D3D3A0';
        ctx.beginPath();
        ctx.arc(x - 8, y - 5, 5, 0, Math.PI * 2);
        ctx.arc(x + 6, y + 3, 4, 0, Math.PI * 2);
        ctx.arc(x + 2, y + 10, 3, 0, Math.PI * 2);
        ctx.fill();

        // Moon glow
        ctx.strokeStyle = 'rgba(240, 230, 140, 0.3)';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
    } else {
        // Draw sun
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Sun rays
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI * 2) / 12;
            const x1 = x + Math.cos(angle) * (radius + 5);
            const y1 = y + Math.sin(angle) * (radius + 5);
            const x2 = x + Math.cos(angle) * (radius + 15);
            const y2 = y + Math.sin(angle) * (radius + 15);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        // Sun glow
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.2)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
        ctx.stroke();
    }

    // Draw pie chart timer overlay showing time until next phase
    ctx.save();

    // Calculate time REMAINING until next phase (countdown style)
    // Day: 0.1 to 0.6 (50% of cycle)
    // Night: 0.6 to 1.0, then 0.0 to 0.1 (50% of cycle, wraps around)
    let elapsed;
    if (gameState.isNight) {
        // Night phase: 0.6-1.0 (40% of night) then 0.0-0.1 (10% of night)
        if (gameState.timeOfDay >= 0.6) {
            // First part of night (0.6 to 1.0)
            elapsed = (gameState.timeOfDay - 0.6) / 0.5;
        } else {
            // Second part of night (0.0 to 0.1)
            elapsed = (0.4 + gameState.timeOfDay) / 0.5;
        }
    } else {
        // Day phase: 0.1 to 0.6
        elapsed = (gameState.timeOfDay - 0.1) / 0.5;
    }

    // Invert to show remaining time (starts full, counts down)
    const remaining = 1 - elapsed;

    // Draw pie chart as a filled arc (clockwise from top)
    const startAngle = -Math.PI / 2; // Start at top
    const endAngle = startAngle + (remaining * Math.PI * 2); // Sweep clockwise

    // Semi-transparent overlay
    if (gameState.isNight) {
        ctx.fillStyle = 'rgba(100, 100, 150, 0.4)'; // Bluish for night
    } else {
        ctx.fillStyle = 'rgba(139, 69, 19, 0.5)'; // Dark brown for day (contrasts with yellow sun)
    }

    ctx.beginPath();
    ctx.moveTo(x, y); // Center
    ctx.arc(x, y, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    // Draw outline for the timer
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    // Draw compass below sun/moon (points to cat fountain)
    if (gameState.player && gameState.village && gameState.village.catFountain) {
        const compassX = x;
        const compassY = y + radius + 50;
        const compassRadius = 25;

        // Calculate fountain center position
        const fountainCenterX = gameState.village.catFountain.x + gameState.village.catFountain.width / 2;
        const fountainCenterY = gameState.village.catFountain.y + gameState.village.catFountain.height / 2;

        const dx = fountainCenterX - gameState.player.x;
        const dy = fountainCenterY - gameState.player.y;
        const angle = Math.atan2(dy, dx);

        // Check if fountain is on screen
        const fountainScreenX = gameState.village.catFountain.x - gameState.camera.x;
        const fountainScreenY = gameState.village.catFountain.y - gameState.camera.y;
        const isFountainOnScreen = (
            fountainScreenX + gameState.village.catFountain.width > 0 &&
            fountainScreenX < canvas.width &&
            fountainScreenY + gameState.village.catFountain.height > 0 &&
            fountainScreenY < canvas.height
        );

        if (isFountainOnScreen && catFountainImage.complete) {
            // Show fountain image in compass when on screen (smaller thumbnail)
            const thumbnailSize = compassRadius * 1.4; // Smaller than full compass
            ctx.save();
            ctx.beginPath();
            ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(
                catFountainImage,
                compassX - thumbnailSize / 2,
                compassY - thumbnailSize / 2,
                thumbnailSize,
                thumbnailSize
            );
            ctx.restore();

            // Border (with glow)
            ctx.save();
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        } else {
            // Show compass needle pointing to fountain when off screen

            // Compass outer circle
            ctx.fillStyle = 'rgba(40, 30, 20, 0.8)';
            ctx.beginPath();
            ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2);
            ctx.fill();

            // Compass inner circle
            ctx.fillStyle = 'rgba(60, 50, 40, 0.9)';
            ctx.beginPath();
            ctx.arc(compassX, compassY, compassRadius - 3, 0, Math.PI * 2);
            ctx.fill();

            // Cardinal direction marks
            ctx.strokeStyle = 'rgba(200, 180, 150, 0.6)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                const markAngle = (i * Math.PI) / 2;
                const x1 = compassX + Math.cos(markAngle) * (compassRadius - 8);
                const y1 = compassY + Math.sin(markAngle) * (compassRadius - 8);
                const x2 = compassX + Math.cos(markAngle) * (compassRadius - 3);
                const y2 = compassY + Math.sin(markAngle) * (compassRadius - 3);
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }

            // Compass needle pointing to fountain
            ctx.save();
            ctx.translate(compassX, compassY);
            ctx.rotate(angle - Math.PI / 2); // Subtract 90 degrees to align needle correctly

            // Needle shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(-4, 2);
            ctx.lineTo(4, 2);
            ctx.closePath();
            ctx.fill();

            // Red side (pointing to fountain)
            ctx.fillStyle = '#DC143C';
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, -15);
            ctx.lineTo(-3, 0);
            ctx.lineTo(3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // White side (opposite)
            ctx.fillStyle = '#F5F5DC';
            ctx.strokeStyle = '#8B7355';
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.lineTo(-3, 0);
            ctx.lineTo(3, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Center dot
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // Compass border (with glow)
            ctx.save();
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(218, 165, 32, 0.9)'; // Goldenrod glow
            ctx.strokeStyle = 'rgba(218, 165, 32, 0.95)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(compassX, compassY, compassRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Draw compass tooltip if hovering
        if (gameState.compassHover) {
            const tooltipText = 'Teleport to fountain';
            ctx.save();
            ctx.font = 'bold 12px Arial';
            const textWidth = ctx.measureText(tooltipText).width;
            const tooltipX = compassX - textWidth / 2;
            const tooltipY = compassY + compassRadius + 30;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillRect(tooltipX - 5, tooltipY - 15, textWidth + 10, 20);

            // Text
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.fillText(tooltipText, compassX, tooltipY - 3);
            ctx.restore();
        }
    }
}

// Gain XP and level up
function gainXP(amount) {
    gameState.xp += amount;

    // Check for level up
    while (gameState.xp >= gameState.xpToNextLevel) {
        gameState.xp -= gameState.xpToNextLevel;
        gameState.level++;
        gameState.xpToNextLevel = Math.floor(gameState.xpToNextLevel * 1.5); // Each level requires 50% more XP

        // Spawn particles for level up
        if (gameState.player) {
            for (let i = 0; i < 30; i++) {
                const angle = Math.random() * Math.PI * 2;
                gameState.particles.push(new Particle(
                    gameState.player.x + gameState.player.width / 2,
                    gameState.player.y + gameState.player.height / 2,
                    angle,
                    '#FFD700'
                ));
            }
        }
    }
}

// Minimap rendering
function drawMinimap(ctx) {
    if (!gameState.showMinimap || !gameState.village) return;

    // Calculate scale to fit map on screen with padding
    const padding = 40;
    const availableWidth = canvas.width - (padding * 2);
    const availableHeight = canvas.height - (padding * 2);

    const scaleX = availableWidth / gameState.village.width;
    const scaleY = availableHeight / gameState.village.height;
    const scale = Math.min(scaleX, scaleY);

    const mapWidth = gameState.village.width * scale;
    const mapHeight = gameState.village.height * scale;
    const mapX = (canvas.width - mapWidth) / 2;
    const mapY = (canvas.height - mapHeight) / 2;

    ctx.save();

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw map border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.strokeRect(mapX - 2, mapY - 2, mapWidth + 4, mapHeight + 4);

    // Draw map background
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(mapX, mapY, mapWidth, mapHeight);

    // Draw trees as small dots (always visible)
    ctx.fillStyle = '#1a3010';
    for (let tree of gameState.village.trees) {
        const x = Math.floor(mapX + (tree.x * scale));
        const y = Math.floor(mapY + (tree.y * scale));
        ctx.fillRect(x - 1, y - 1, 2, 2); // Fixed 2x2 pixels
    }

    // Draw buildings with actual images (always visible)
    for (let building of gameState.village.buildings) {
        const x = mapX + (building.x * scale);
        const y = mapY + (building.y * scale);
        const w = building.width * scale;
        const h = building.height * scale;

        // Use actual house image
        const houseKey = `house${building.houseType}`;
        const houseImage = houseImages[houseKey];
        if (houseImage && houseImage.complete) {
            ctx.drawImage(houseImage, x, y, w, h);
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x, y, w, h);
        }
    }

    // Draw fountain with actual image (always visible)
    if (gameState.village.catFountain) {
        const fountain = gameState.village.catFountain;
        const x = mapX + (fountain.x * scale);
        const y = mapY + (fountain.y * scale);
        const w = fountain.width * scale;
        const h = fountain.height * scale;

        if (catFountainImage && catFountainImage.complete) {
            ctx.drawImage(catFountainImage, x, y, w, h);
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = '#00CED1';
            ctx.fillRect(x, y, w, h);
        }
    }

    // Draw chests as colored squares (if enabled)
    for (let chest of gameState.chests) {
        if (chest.opened) continue;

        // Check if this chest tier is enabled
        const tierEnabled = {
            'purple': gameState.minimapLayers.chestsPurple,
            'green': gameState.minimapLayers.chestsGreen,
            'blue': gameState.minimapLayers.chestsBlue,
            'red': gameState.minimapLayers.chestsRed,
            'magenta': gameState.minimapLayers.chestsMagenta
        };

        if (!tierEnabled[chest.color]) continue;

        const x = Math.floor(mapX + (chest.x * scale));
        const y = Math.floor(mapY + (chest.y * scale));

        // Use CHEST_CONFIG for size and color
        const chestConfig = CHEST_CONFIG[chest.color];
        const size = chestConfig ? chestConfig.minimapSize : 3;

        ctx.fillStyle = chestConfig ? chestConfig.color : '#FFFFFF';
        ctx.fillRect(x - Math.floor(size/2), y - Math.floor(size/2), size, size);
    }

    // Draw companions (if enabled) - make them more visible
    if (gameState.minimapLayers.companions) {
        // Draw following companions
        for (let companion of gameState.companions) {
            const x = Math.floor(mapX + (companion.x * scale));
            const y = Math.floor(mapY + (companion.y * scale));

            // Draw glow
            ctx.fillStyle = 'rgba(255, 255, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            // Draw companion
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw dropped companions as 0.75x scaled images
        for (let dropped of gameState.droppedCompanions) {
            if (!dropped.isInHouse) {
                const x = Math.floor(mapX + (dropped.x * scale));
                const y = Math.floor(mapY + (dropped.y * scale));

                // Draw the actual companion image at 0.75x scale
                const image = friendImages[dropped.type];
                if (image && image.complete) {
                    const imgSize = 30; // 0.75x of normal 40px size
                    ctx.drawImage(image, x - imgSize/2, y - imgSize/2, imgSize, imgSize);
                }
            }
        }
    }

    // Draw player with pulsing effect (always visible)
    if (gameState.player) {
        const x = mapX + (gameState.player.x * scale);
        const y = mapY + (gameState.player.y * scale);
        const size = Math.max(3, 5 * scale);
        const pulse = Math.sin(gameState.frameTime / 200) * 0.3 + 1.0;

        // Outer glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, size * pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Player dot
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, size * pulse, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw title and instructions
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('World Map', canvas.width / 2, mapY - 15);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '16px Arial';
    ctx.fillText('Press M to close', canvas.width / 2, canvas.height - 15);

    // Draw legend with actual images and toggles
    const legendX = mapX + 10;
    const legendY = mapY + 10;
    const iconSize = 16;
    const rowHeight = 20;
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';

    const legend = [
        { text: 'Purple', image: chestImages.purple?.full, toggleKey: 'chestsPurple' },
        { text: 'Green', image: chestImages.green?.full, toggleKey: 'chestsGreen' },
        { text: 'Blue', image: chestImages.blue?.full, toggleKey: 'chestsBlue' },
        { text: 'Red', image: chestImages.red?.full, toggleKey: 'chestsRed' },
        { text: 'Magenta', image: chestImages.magenta?.full, toggleKey: 'chestsMagenta' },
        { text: 'Companions', image: friendImages.kitten1, toggleKey: 'companions' }
    ];

    // Cache legend bounds for click detection (only compute once)
    if (!cachedMinimapLegendBounds) {
        cachedMinimapLegendBounds = legend.map((item, i) => ({
            x: legendX,
            y: legendY + (i * rowHeight),
            width: 200,
            height: rowHeight,
            toggleKey: item.toggleKey
        }));
    }
    gameState.minimapLegendBounds = cachedMinimapLegendBounds;

    legend.forEach((item, i) => {
        const y = legendY + (i * rowHeight);
        const isEnabled = gameState.minimapLayers[item.toggleKey];

        // Draw checkbox
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.strokeRect(legendX, y, 14, 14);
        if (isEnabled) {
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(legendX + 3, y + 3, 8, 8);
        }

        // Draw icon/image
        const iconX = legendX + 20;
        if (item.image && item.image.complete) {
            ctx.globalAlpha = isEnabled ? 1.0 : 0.3;
            ctx.drawImage(item.image, iconX, y, iconSize, iconSize);
            ctx.globalAlpha = 1.0;
        }

        // Draw text
        ctx.fillStyle = isEnabled ? '#FFFFFF' : '#888888';
        ctx.fillText(item.text, iconX + iconSize + 5, y + 11);
    });

    ctx.restore();
}

// Game Loop
let lastTime = Date.now();

function gameLoop() {
    const now = Date.now();
    const deltaTime = now - lastTime;
    lastTime = now;

    // Store frame timing in gameState for access by update methods
    gameState.deltaTime = deltaTime;
    gameState.frameTime = now; // Cached Date.now() for this frame

    // Auto-show controls panel after 10 seconds of inactivity (only before user interaction)
    const idleTime = now - gameState.lastActivityTime;
    if (idleTime > 10000 && !gameState.controlsPanelShown && !gameState.hasUserInteracted && controlsPanel) {
        controlsPanel.style.display = 'block';
        gameState.controlsPanelShown = true;
    }

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState.isInsideHouse) {
        // Inside house - draw interior
        drawHouseInterior(ctx);
    } else {
        // Outside - regular game loop
        // Update day/night cycle
        updateDayNightCycle(deltaTime);

        // Draw village ground (before night overlay)
        if (gameState.village) {
            gameState.village.drawGround(ctx);
        }

        // Update items (draw later, after night overlay)
        for (let item of gameState.items) {
            item.update();
        }

        // Update player (draw later, after night overlay)
        if (gameState.player) {
            gameState.player.update();
        }

        // Update companions (drawing happens after night overlay)
        for (let i = 0; i < gameState.companions.length; i++) {
            gameState.companions[i].update(i);
        }

        // Update dropped companions (collision detection only - drawing happens after night overlay)
        for (let i = gameState.droppedCompanions.length - 1; i >= 0; i--) {
            const dropped = gameState.droppedCompanions[i];

            // Skip if this companion is in a house (those are handled in drawHouseInterior)
            if (dropped.isInHouse) continue;

            // Update bob offset for animation (0.006 rad/ms = ~1 cycle per second)
            dropped.bobOffset += 0.006 * deltaTime;

            // Check if player touches the dropped companion
            if (gameState.player) {
                const distance = getDistance(dropped.x, dropped.y, gameState.player.x, gameState.player.y);

                if (distance < 40) {
                    // Pick up the companion and add back to line
                    gameState.companions.push(dropped.companion);
                    gameState.droppedCompanions.splice(i, 1);
                    continue;
                }
            }
        }

        // Update and draw projectiles
        for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
            const projectile = gameState.projectiles[i];
            const shouldRemove = projectile.update();
            if (shouldRemove) {
                gameState.projectiles.splice(i, 1);
            } else {
                projectile.draw(ctx);
            }
        }

        // Update and draw particles
        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const particle = gameState.particles[i];
            const shouldRemove = particle.update();
            if (shouldRemove) {
                gameState.particles.splice(i, 1);
            } else {
                particle.draw(ctx);
            }
        }

        // Apply night overlay to darken everything
        if (gameState.isNight) {
            ctx.fillStyle = 'rgba(0, 0, 30, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw fireflies above the night overlay so they stay bright
        if (gameState.isNight && fireflyImage.complete) {
            for (let i = gameState.fireflies.length - 1; i >= 0; i--) {
                const firefly = gameState.fireflies[i];

                // Update floating animation
                firefly.floatOffset += firefly.floatSpeed;
                firefly.x += firefly.driftX;
                firefly.y += firefly.driftY;

                // Keep fireflies within village bounds
                if (firefly.x < 0) firefly.x = gameState.village.width;
                if (firefly.x > gameState.village.width) firefly.x = 0;
                if (firefly.y < 0) firefly.y = gameState.village.height;
                if (firefly.y > gameState.village.height) firefly.y = 0;

                // Check if player touches firefly
                if (gameState.player) {
                    const playerCenterX = gameState.player.x + gameState.player.width / 2;
                    const playerCenterY = gameState.player.y + gameState.player.height / 2;
                    const distance = getDistance(firefly.x, firefly.y, playerCenterX, playerCenterY);

                    if (distance < 40) {
                        // Player picked up firefly - give XP based on value and increment jar count
                        gainXP(firefly.xpValue || 10);
                        gameState.fireflyCount = Math.min(999, gameState.fireflyCount + 1);
                        gameState.fireflies.splice(i, 1);
                        continue; // Skip to next firefly
                    }
                }

                const screenX = firefly.x - gameState.camera.x;
                const screenY = firefly.y - gameState.camera.y + Math.sin(firefly.floatOffset) * 5;

                // Use dynamic size (grows with magic hits)
                const size = firefly.size || 32;
                const halfSize = size / 2;

                // Viewport culling - skip drawing if off-screen (still update rainbow hue)
                if (screenX < -size || screenX > canvas.width + size ||
                    screenY < -size || screenY > canvas.height + size) {
                    // Still update rainbow hue for off-screen fireflies
                    if (firefly.isRainbow) {
                        firefly.hue = (firefly.hue + 2) % 360;
                    }
                    continue;
                }

                // Rainbow fireflies undulate through colors continuously
                if (firefly.isRainbow) {
                    firefly.hue = (firefly.hue + 2) % 360;
                }

                // Draw firefly with pre-rendered glow (no per-frame shadowBlur)
                const glowData = getCachedFireflyWithGlow(firefly.hue, size);
                ctx.drawImage(
                    glowData.canvas,
                    screenX - halfSize - glowData.padding,
                    screenY - halfSize - glowData.padding
                );
            }
        }

        // Draw buildings and fountain after night overlay to stay bright
        if (gameState.village) {
            gameState.village.drawBuildings(ctx);
        }

        // Draw chests after night overlay to stay bright (with viewport culling)
        for (let chest of gameState.chests) {
            const screenX = chest.x - gameState.camera.x;
            const screenY = chest.y - gameState.camera.y;
            // Skip if off-screen (with margin for chest size)
            if (screenX < -chest.width || screenX > canvas.width + chest.width ||
                screenY < -chest.height || screenY > canvas.height + chest.height) {
                continue;
            }
            chest.draw(ctx);
        }

        // Draw items after night overlay to stay bright (with viewport culling)
        for (let item of gameState.items) {
            const screenX = item.x - gameState.camera.x;
            const screenY = item.y - gameState.camera.y;
            // Skip if off-screen (with margin for item size)
            if (screenX < -50 || screenX > canvas.width + 50 ||
                screenY < -50 || screenY > canvas.height + 50) {
                continue;
            }
            item.draw(ctx);
        }

        // Draw trees above buildings and chests (with viewport culling)
        if (gameState.village) {
            for (let tree of gameState.village.trees) {
                const screenX = tree.x - gameState.camera.x;
                const screenY = tree.y - gameState.camera.y;
                // Skip if off-screen (with margin for tree size)
                if (screenX < -tree.width || screenX > canvas.width + tree.width ||
                    screenY < -tree.height || screenY > canvas.height + tree.height) {
                    continue;
                }
                gameState.village.drawTree(ctx, tree);
            }
        }

        // Draw player and companions after night overlay so they stay bright
        if (gameState.player) {
            gameState.player.draw(ctx);
        }

        // Draw companions
        for (let companion of gameState.companions) {
            companion.draw(ctx);
        }

        // Draw dropped companions after night overlay so they stay bright
        for (let dropped of gameState.droppedCompanions) {
            // Skip if this companion is in a house (those are handled in drawHouseInterior)
            if (dropped.isInHouse) continue;

            const screenX = dropped.x - gameState.camera.x;
            const screenY = dropped.y - gameState.camera.y;

            // Draw shadow (scaled with companion size)
            const companionSize = dropped.companion.sizeMultiplier || 1.0;
            drawCompanionShadow(ctx, screenX, screenY, companionSize);

            // Draw friend image (scaled with companion size) with colored glow at night
            const image = friendImages[dropped.type];
            if (image && image.complete) {
                const width = 40 * companionSize;
                const height = 40 * companionSize;
                const bobY = screenY + Math.sin(dropped.bobOffset) * 2;

                if (gameState.isNight) {
                    // Apply glow effect at night
                    ctx.save();
                    ctx.shadowBlur = 20 * companionSize; // Larger glow for dropped companions
                    ctx.shadowColor = COMPANION_GLOW_COLORS[dropped.type] || '#FFFFFF'; // Default white
                    ctx.drawImage(image, screenX, bobY, width, height);
                    ctx.restore();
                } else {
                    ctx.drawImage(image, screenX, bobY, width, height);
                }
            }
        }

        // Draw fading title image over fountain at game start
        if (gameState.village && gameState.village.catFountain && gameState.gameStartTime > 0 && titleImage.complete) {
            const timeSinceStart = gameState.frameTime - gameState.gameStartTime;
            const fadeDuration = 4000; // 4 seconds

            if (timeSinceStart < fadeDuration) {
                // Calculate opacity (fade from 1 to 0)
                const opacity = 1 - (timeSinceStart / fadeDuration);

                // Position title above the fountain
                const fountainCenterX = gameState.village.catFountain.x + gameState.village.catFountain.width / 2;
                const fountainTopY = gameState.village.catFountain.y - 50; // 50px above fountain

                // Convert to screen coordinates
                const screenX = fountainCenterX - gameState.camera.x;
                const screenY = fountainTopY - gameState.camera.y;

                // Draw title image with fade effect
                ctx.save();
                ctx.globalAlpha = opacity;

                // Size the title image (adjust as needed for your image dimensions)
                const titleWidth = 400; // Adjust based on your image
                const titleHeight = titleWidth * (titleImage.height / titleImage.width); // Maintain aspect ratio

                ctx.drawImage(
                    titleImage,
                    screenX - titleWidth / 2,
                    screenY - titleHeight / 2,
                    titleWidth,
                    titleHeight
                );

                ctx.restore();
            }
        }

        // Draw sun/moon indicator on top of everything
        drawSunMoon(ctx);
    }

    // Handle player interactions (E key) - works both inside and outside houses
    handleInteractions();

    // Draw level and XP HUD in upper left
    if (!gameState.isInsideHouse) {
        const hudX = 20;
        const hudY = 20;
        const hudWidth = 100;
        const hudHeight = 60;
        const cornerRadius = 10;

        // Draw rounded rectangle background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(hudX, hudY, hudWidth, hudHeight, cornerRadius);
        ctx.fill();

        // Rainbow gradient border (uses cached gradient)
        ctx.strokeStyle = cachedRainbowGradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(hudX, hudY, hudWidth, hudHeight, cornerRadius);
        ctx.stroke();

        // Level text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Level ${gameState.level}`, hudX + 10, hudY + 8);

        // XP bar background
        const barX = hudX + 10;
        const barY = hudY + 35;
        const barWidth = 80;
        const barHeight = 15;

        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // XP bar fill (uses cached gradient)
        const xpPercent = gameState.xp / gameState.xpToNextLevel;
        const fillWidth = barWidth * xpPercent;

        ctx.fillStyle = cachedXpGradient;
        ctx.fillRect(barX, barY, fillWidth, barHeight);

        // XP bar border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        // XP text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${gameState.xp} / ${gameState.xpToNextLevel}`, barX + barWidth / 2, barY + barHeight / 2);

        // Draw firefly jar to the right of level HUD
        const jarX = hudX + hudWidth + 15;
        const jarY = hudY;
        // Jar images are 677x874 (aspect ratio ~0.775)
        const jarHeight = 60; // Shorter to match HUD height
        const jarWidth = 46; // Maintains aspect ratio

        // Choose empty or full jar based on firefly count
        const jarImage = gameState.fireflyCount > 0 ? fullJarImage : emptyJarImage;

        if (jarImage && jarImage.complete) {
            ctx.save();

            // Make jar partly transparent
            ctx.globalAlpha = 0.8;

            // Add glow at night if jar has fireflies (brighter with more fireflies)
            if (gameState.isNight && gameState.fireflyCount > 0) {
                const glowIntensity = Math.min(15 + gameState.fireflyCount * 2, 40);
                ctx.shadowBlur = glowIntensity;
                ctx.shadowColor = '#FFFF00'; // Yellow glow
            }

            ctx.drawImage(jarImage, jarX, jarY, jarWidth, jarHeight);
            ctx.restore();

            // Draw firefly count if > 0
            if (gameState.fireflyCount > 0) {
                ctx.save();
                ctx.font = 'bold 20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // Position text lower to center in visible jar area
                const textY = jarY + jarHeight * 0.6;

                // Shadow for text
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillText(gameState.fireflyCount, jarX + jarWidth / 2 + 2, textY + 2);

                // White text
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(gameState.fireflyCount, jarX + jarWidth / 2, textY);

                ctx.restore();
            }
        }
    }

    // Draw version number in lower right corner
    ctx.save();
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('v0.3.0', canvas.width - 5, canvas.height - 5);
    ctx.restore();
    // Draw chest messages on top of everything
    if (!gameState.isInsideHouse) {
        for (let chest of gameState.chests) {
            chest.drawMessage(ctx);
        }
    }

    // Draw notification overlay
    if (gameState.notification.visible) {
        const elapsed = gameState.frameTime - gameState.notification.fadeStartTime;
        const duration = gameState.notification.duration;

        // Calculate alpha for fade in/out
        let alpha = 1;
        if (elapsed < 300) {
            // Fade in (first 300ms)
            alpha = elapsed / 300;
        } else if (elapsed > duration - 500) {
            // Fade out (last 500ms)
            alpha = (duration - elapsed) / 500;
        }

        if (elapsed >= duration) {
            // Hide notification after duration
            gameState.notification.visible = false;
        } else {
            ctx.save();
            ctx.globalAlpha = alpha;

            // Draw notification box
            const boxWidth = 400;
            const boxHeight = 60;
            const boxX = (canvas.width - boxWidth) / 2;
            const boxY = 80;

            // Background with glow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 20;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
            ctx.fill();

            // Border
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
            ctx.stroke();

            // Text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(gameState.notification.message, boxX + boxWidth / 2, boxY + boxHeight / 2);

            ctx.restore();
        }
    }

    // Draw minimap overlay if enabled
    drawMinimap(ctx);

    requestAnimationFrame(gameLoop);
}
