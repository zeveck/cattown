// Clara's Cat Town - Version 0.2.13

// Game Configuration
const CONFIG = {
    TILE_SIZE: 40,
    PLAYER_SPEED: 3,
    ENEMY_SPEED: 1.5,
    NIGHT_ENEMY_SPEED_MULTIPLIER: 1.5,
    MAGIC_COOLDOWN: 500,
    COMPANION_SPEED: 2.5,
    DAY_LENGTH: 60000, // 60 seconds per day
    CAT_SPEED_MULTIPLIER: 1.3, // Cats move 30% faster than human form
};

// Game State
const gameState = {
    currentScene: 'game',
    playerCustomization: {
        name: 'Hero',
        skinColor: '#ffdbac',
        hairColor: '#8B4513',
        outfitColor: '#4169E1'
    },
    catCustomization: {
        name: 'Whiskers',
        furColor: '#FF8C00',
        pattern: 'solid',
        patternColor: '#8B4513'
    },
    player: null,
    enemies: [],
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
    catCash: 0,
    fireflyCount: 0,
    eKeyWasPressed: false,
    fKeyWasPressed: false,
    musicStarted: false,
    gameStartTime: 0,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    timeOfDay: 0, // 0-1, 0 = dawn, 0.5 = dusk
    isNight: false,
    previousIsNight: false,
    gameTime: 6000, // Start right at sunrise (timeOfDay: 0.1, just after dawn)
    playerHouse: null,
    furnitureList: [],
    isInsideHouse: false,
    currentHouseId: null,
    houseFurniture: {}, // Store furniture per house ID
    placedFurniture: [], // Current house's furniture (loaded from houseFurniture)
    selectedFurnitureType: null,
    selectedPlacedFurniture: null,
    isDraggingFurniture: false,
    furnitureRotation: 0,
    lastHouseExitTime: 0,
    isDraggingSlider: false,
    draggedSliderType: null, // 'color' or 'size'
    draggedFurnitureType: null, // which furniture item's slider
    lastActivityTime: Date.now(),
    controlsPanelShown: false,
    hasPlayerMoved: false, // Track if player has moved since game start
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
    furnitureShop: [
        { type: 'bed', name: 'Bed', cost: 100, color: '#8B4513', width: 80, height: 100 },
        { type: 'table', name: 'Table', cost: 50, color: '#D2691E', width: 60, height: 60 },
        { type: 'chair', name: 'Chair', cost: 30, color: '#A0522D', width: 40, height: 40 },
        { type: 'rug', name: 'Rug', cost: 40, color: '#DC143C', width: 100, height: 80 },
        { type: 'plant', name: 'Plant', cost: 25, color: '#228B22', width: 30, height: 40 },
        { type: 'lamp', name: 'Lamp', cost: 35, color: '#FFD700', width: 30, height: 50 }
    ],
    notification: {
        message: '',
        visible: false,
        fadeStartTime: 0,
        duration: 3000 // 3 seconds
    },
    showMinimap: false,
    minimapLayers: {
        trees: true,
        buildings: true,
        fountain: true,
        chestsPurple: true,
        chestsGreen: true,
        chestsBlue: true,
        chestsRed: true,
        chestsMagenta: true,
        companions: true,
        player: true
    },
    minimapLegendBounds: [] // Will store clickable areas for legend items
};

// Character Creation
const previewCanvas = document.getElementById('previewCanvas');
const previewCtx = previewCanvas.getContext('2d');

function updatePreview() {
    previewCtx.fillStyle = '#ffffff';
    previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);

    // Draw human preview
    drawHumanPreview(100, 100);

    // Draw cat preview
    drawCatPreview(300, 100);
}

function drawHumanPreview(x, y) {
    const custom = gameState.playerCustomization;

    // Head
    previewCtx.fillStyle = custom.skinColor;
    previewCtx.fillRect(x - 15, y - 30, 30, 30);

    // Hair
    previewCtx.fillStyle = custom.hairColor;
    previewCtx.fillRect(x - 18, y - 35, 36, 10);

    // Body
    previewCtx.fillStyle = custom.outfitColor;
    previewCtx.fillRect(x - 20, y, 40, 40);

    // Arms
    previewCtx.fillRect(x - 30, y + 5, 10, 25);
    previewCtx.fillRect(x + 20, y + 5, 10, 25);

    // Legs
    previewCtx.fillRect(x - 15, y + 40, 12, 30);
    previewCtx.fillRect(x + 3, y + 40, 12, 30);

    // Eyes
    previewCtx.fillStyle = '#000';
    previewCtx.fillRect(x - 10, y - 20, 5, 5);
    previewCtx.fillRect(x + 5, y - 20, 5, 5);

    // Name
    previewCtx.fillStyle = '#333';
    previewCtx.font = 'bold 14px Arial';
    previewCtx.textAlign = 'center';
    previewCtx.fillText(custom.name, x, y + 90);
}

function drawCatPreview(x, y) {
    const custom = gameState.catCustomization;

    // Body
    previewCtx.fillStyle = custom.furColor;
    previewCtx.beginPath();
    previewCtx.ellipse(x, y + 10, 25, 20, 0, 0, Math.PI * 2);
    previewCtx.fill();

    // Head
    previewCtx.beginPath();
    previewCtx.ellipse(x, y - 10, 20, 18, 0, 0, Math.PI * 2);
    previewCtx.fill();

    // Ears
    previewCtx.beginPath();
    previewCtx.moveTo(x - 15, y - 20);
    previewCtx.lineTo(x - 10, y - 28);
    previewCtx.lineTo(x - 5, y - 20);
    previewCtx.fill();

    previewCtx.beginPath();
    previewCtx.moveTo(x + 5, y - 20);
    previewCtx.lineTo(x + 10, y - 28);
    previewCtx.lineTo(x + 15, y - 20);
    previewCtx.fill();

    // Tail
    previewCtx.beginPath();
    previewCtx.arc(x + 25, y + 5, 8, 0, Math.PI * 2);
    previewCtx.fill();

    // Pattern
    if (custom.pattern === 'stripes') {
        previewCtx.fillStyle = custom.patternColor;
        for (let i = 0; i < 3; i++) {
            previewCtx.fillRect(x - 20, y + i * 10, 40, 4);
        }
    } else if (custom.pattern === 'spots') {
        previewCtx.fillStyle = custom.patternColor;
        previewCtx.beginPath();
        previewCtx.arc(x - 10, y, 5, 0, Math.PI * 2);
        previewCtx.arc(x + 10, y, 5, 0, Math.PI * 2);
        previewCtx.arc(x, y + 15, 5, 0, Math.PI * 2);
        previewCtx.fill();
    }

    // Eyes
    previewCtx.fillStyle = '#FFD700';
    previewCtx.beginPath();
    previewCtx.ellipse(x - 7, y - 12, 4, 6, 0, 0, Math.PI * 2);
    previewCtx.ellipse(x + 7, y - 12, 4, 6, 0, 0, Math.PI * 2);
    previewCtx.fill();

    // Pupils
    previewCtx.fillStyle = '#000';
    previewCtx.fillRect(x - 8, y - 13, 2, 4);
    previewCtx.fillRect(x + 6, y - 13, 2, 4);

    // Nose
    previewCtx.fillStyle = '#FF69B4';
    previewCtx.beginPath();
    previewCtx.moveTo(x, y - 5);
    previewCtx.lineTo(x - 3, y - 8);
    previewCtx.lineTo(x + 3, y - 8);
    previewCtx.fill();

    // Name
    previewCtx.fillStyle = '#333';
    previewCtx.font = 'bold 14px Arial';
    previewCtx.textAlign = 'center';
    previewCtx.fillText(custom.name, x, y + 50);
}

// Character Creation Event Listeners (only if elements exist)
const playerNameInput = document.getElementById('playerName');
if (playerNameInput) {
    playerNameInput.addEventListener('input', (e) => {
        gameState.playerCustomization.name = e.target.value;
        updatePreview();
    });
}

const skinColorInput = document.getElementById('skinColor');
if (skinColorInput) {
    skinColorInput.addEventListener('input', (e) => {
        gameState.playerCustomization.skinColor = e.target.value;
        updatePreview();
    });
}

const hairColorInput = document.getElementById('hairColor');
if (hairColorInput) {
    hairColorInput.addEventListener('input', (e) => {
        gameState.playerCustomization.hairColor = e.target.value;
        updatePreview();
    });
}

const outfitColorInput = document.getElementById('outfitColor');
if (outfitColorInput) {
    outfitColorInput.addEventListener('input', (e) => {
        gameState.playerCustomization.outfitColor = e.target.value;
        updatePreview();
    });
}

const catNameInput = document.getElementById('catName');
if (catNameInput) {
    catNameInput.addEventListener('input', (e) => {
        gameState.catCustomization.name = e.target.value;
        updatePreview();
    });
}

const catFurColorInput = document.getElementById('catFurColor');
if (catFurColorInput) {
    catFurColorInput.addEventListener('input', (e) => {
        gameState.catCustomization.furColor = e.target.value;
        updatePreview();
    });
}

const catPatternSelect = document.getElementById('catPattern');
if (catPatternSelect) {
    catPatternSelect.addEventListener('change', (e) => {
        gameState.catCustomization.pattern = e.target.value;
        updatePreview();
    });
}

const catPatternColorInput = document.getElementById('catPatternColor');
if (catPatternColorInput) {
    catPatternColorInput.addEventListener('input', (e) => {
        gameState.catCustomization.patternColor = e.target.value;
        updatePreview();
    });
}

const startGameButton = document.getElementById('startGame');
if (startGameButton) {
    startGameButton.addEventListener('click', startGame);
}

// Help button toggle for controls panel
const helpButton = document.getElementById('helpButton');
const controlsPanel = document.getElementById('controlsPanel');
if (helpButton && controlsPanel) {
    helpButton.addEventListener('click', () => {
        const isVisible = controlsPanel.style.display !== 'none';
        controlsPanel.style.display = isVisible ? 'none' : 'block';
        gameState.controlsPanelShown = !isVisible;
        gameState.lastActivityTime = Date.now(); // Reset idle timer
    });
}

// Close button for controls panel
const closeControlsButton = document.getElementById('closeControlsButton');
if (closeControlsButton && controlsPanel) {
    closeControlsButton.addEventListener('click', () => {
        controlsPanel.style.display = 'none';
        gameState.controlsPanelShown = false;
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
            version: '0.2.12',
            timestamp: new Date().toISOString(),
            player: gameState.player ? {
                x: gameState.player.x,
                y: gameState.player.y,
                health: gameState.player.health,
                maxHealth: gameState.player.maxHealth,
                isCat: gameState.player.isCat,
                speed: gameState.player.speed,
                baseSpeed: gameState.player.baseSpeed,
                speedBoostEndTime: gameState.player.speedBoostEndTime,
                facingRight: gameState.player.facingRight
            } : null,
            level: gameState.level,
            xp: gameState.xp,
            xpToNextLevel: gameState.xpToNextLevel,
            catCash: gameState.catCash,
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

        console.log('Game saved successfully!');
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
            gameState.player.health = saveData.player.health;
            gameState.player.maxHealth = saveData.player.maxHealth;
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
        gameState.catCash = saveData.catCash;
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
        gameState.droppedCompanions = saveData.droppedCompanions.map(dropped => ({
            companion: new Companion(dropped.companion.x, dropped.companion.y, dropped.companion.type, dropped.companion.sizeMultiplier),
            x: dropped.x,
            y: dropped.y,
            type: dropped.type,
            isInHouse: dropped.isInHouse,
            houseId: dropped.houseId,
            houseX: dropped.houseX,
            houseY: dropped.houseY,
            wanderTarget: null,
            wanderCooldown: 0
        }));

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

        // Restore house furniture
        gameState.houseFurniture = saveData.houseFurniture;
        gameState.furnitureHues = { ...saveData.furnitureHues };
        gameState.furnitureSizes = { ...saveData.furnitureSizes };
        gameState.isInsideHouse = saveData.isInsideHouse;
        gameState.currentHouseId = saveData.currentHouseId;

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

        // Update UI to reflect loaded state
        updateUI();

        console.log('Game loaded successfully!');
        showNotification('Game loaded successfully!', 3000);
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

// Initialize preview (only if canvas exists)
if (previewCanvas) {
    updatePreview();
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
        this.health = 200;
        this.maxHealth = 200;
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
    }

    update() {
        const prevX = this.x;
        const prevY = this.y;

        // Check if speed boost has expired
        if (this.speedBoostEndTime > 0 && Date.now() > this.speedBoostEndTime) {
            this.speed = this.baseSpeed;
            this.speedBoostEndTime = 0;
        }

        // Movement
        // Calculate actual speed with cat multiplier
        const actualSpeed = this.speed * (this.isCat ? CONFIG.CAT_SPEED_MULTIPLIER : 1);
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

        // Update walking animation for both cat and human
        this.isMoving = moved;
        if (moved) {
            this.walkingFrameCounter++;
            // Switch frame every 10 updates (adjust for speed)
            if (this.walkingFrameCounter >= 10) {
                this.walkingFrame = (this.walkingFrame + 1) % 2;
                this.walkingFrameCounter = 0;
            }
        } else {
            this.walkingFrameCounter = 0;
            this.walkingFrame = 0;
        }

        // Idle animation logic for cat form
        if (this.isCat && !moved) {
            // Increment idle time
            this.idleTime += 16; // Approximate ms per frame at 60 FPS

            // After 20 seconds, cat falls asleep and stays asleep
            if (this.idleTime > 20000) {
                // Only set up sleep state once
                if (this.idleAnimationType !== 'sleep') {
                    this.idleAnimationType = 'sleep';

                    // Arrange companions in a ring around the sleeping cat
                    gameState.companions.forEach((companion, index) => {
                        const angle = (index / gameState.companions.length) * Math.PI * 2;
                        const radius = 80;
                        companion.targetX = this.x + Math.cos(angle) * radius;
                        companion.targetY = this.y + Math.sin(angle) * radius;
                    });
                }
            }
            // Check if current idle animation has finished (but not sleep - sleep persists)
            else if (this.idleAnimationType && this.idleAnimationType !== 'sleep' && Date.now() - this.idleAnimationStartTime > this.idleAnimationDuration) {
                this.idleAnimationType = null;
            }
            // Randomly trigger a new idle animation after being idle for a while (only if not sleeping)
            else if (!this.idleAnimationType && this.idleTime > 6000 && this.idleTime < 20000) {
                // Random chance to trigger animation (about 1% chance per frame when idle > 6s)
                if (Math.random() < 0.01) {
                    // Randomly choose yawn or lick
                    this.idleAnimationType = Math.random() < 0.5 ? 'yawn' : 'lick';
                    this.idleAnimationStartTime = Date.now();
                    // Don't reset idleTime - let it keep accumulating toward sleep threshold
                }
            }
        } else {
            // Reset idle state when moving or not a cat
            this.idleTime = 0;
            this.idleAnimationType = null;
        }

        // Track that player has moved (for idle menu logic)
        if (moved) {
            gameState.hasPlayerMoved = true;
        }

        // Start music on first movement
        if (moved && !gameState.musicStarted) {
            gameState.musicStarted = true;
            bgMusic.play().catch(err => {
                gameState.musicStarted = false; // Allow retry on error
            });
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
        const dist = Math.sqrt((centerX - objCenterX) ** 2 + (centerY - objCenterY) ** 2);
        return dist < distance;
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
                const dx = firefly.x - playerCenterX;
                const dy = firefly.y - playerCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy);

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

                const dx = chest.x + chest.width / 2 - playerCenterX;
                const dy = chest.y + chest.height / 2 - playerCenterY;
                const dist = Math.sqrt(dx * dx + dy * dy);

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

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health === 0) {
            // Game over logic
            alert('Game Over! You were defeated.');
            location.reload();
        }
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    activateSpeedBoost(duration = 5000, multiplier = 1.5, color = '#FFD700') {
        this.speed = this.baseSpeed * multiplier;
        this.speedBoostEndTime = Date.now() + duration;
        this.speedBoostColor = color; // Store the color for HUD pulse
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

        // Always use walking sprites (alternate for idle, animate when moving)
        let girlSprite = girlWalking1; // Default idle uses walking1
        if (this.isMoving) {
            girlSprite = this.walkingFrame === 0 ? girlWalking1 : girlWalking2;
        }

        // Draw girl sprite with optional flip and purple glow at night
        if (girlSprite.complete) {
            ctx.save();

            // Add purple glow at night
            if (gameState.isNight) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#9370DB'; // Medium purple
            }

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

        // Choose the appropriate sprite based on movement and idle animations
        let catSprite = catImage; // Default idle

        if (this.isMoving) {
            // Walking animation
            catSprite = this.walkingFrame === 0 ? catWalking1 : catWalking2;
        } else if (this.idleAnimationType === 'sleep') {
            // Sleeping idle animation
            catSprite = catSleeping;
        } else if (this.idleAnimationType === 'yawn') {
            // Yawning idle animation
            catSprite = catYawning;
        } else if (this.idleAnimationType === 'lick') {
            // Licking paw idle animation
            catSprite = catLickingPaw;
        }

        // Draw cat sprite with optional flip and purple glow at night
        if (catSprite.complete) {
            ctx.save();

            // Add purple glow at night
            if (gameState.isNight) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#9370DB'; // Medium purple
            }

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

class Enemy {
    constructor(x, y, type = 'slime') {
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 48;
        this.type = type;
        this.health = 30;
        this.maxHealth = 30;
        this.speed = CONFIG.ENEMY_SPEED;
        this.detectionRange = 200;
        this.attackRange = 35;
        this.attackCooldown = 2000;
        this.lastAttackTime = 0;
        this.bounceOffset = 0;
    }

    update() {
        if (!gameState.player) return;

        const player = gameState.player;

        // Don't attack if player is a cat
        if (player.isCat) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Chase player if in range
        if (distance < this.detectionRange) {
            const angle = Math.atan2(dy, dx);
            const speed = gameState.isNight ? this.speed * CONFIG.NIGHT_ENEMY_SPEED_MULTIPLIER : this.speed;

            this.x += Math.cos(angle) * speed;
            this.y += Math.sin(angle) * speed;

            // Attack if close enough
            if (distance < this.attackRange) {
                const now = Date.now();
                if (now - this.lastAttackTime > this.attackCooldown) {
                    player.takeDamage(5);
                    this.lastAttackTime = now;
                }
            }
        }

        this.bounceOffset = Math.sin(Date.now() / 200) * 3;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        // Drop Cat Cash
        const cashAmount = 10 + Math.floor(Math.random() * 10);
        gameState.catCash += cashAmount;
        updateUI();

        // Remove from enemies array
        const index = gameState.enemies.indexOf(this);
        if (index > -1) {
            gameState.enemies.splice(index, 1);
        }

        // Spawn particles
        for (let i = 0; i < 10; i++) {
            gameState.particles.push(new Particle(
                this.x + this.width / 2,
                this.y + this.height / 2,
                Math.random() * Math.PI * 2
            ));
        }
    }

    draw(ctx) {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y + this.bounceOffset;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 15, screenY + 32, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body (slime-like enemy)
        const gradient = ctx.createRadialGradient(screenX + 15, screenY + 15, 5, screenX + 15, screenY + 15, 15);

        if (gameState.isNight) {
            gradient.addColorStop(0, '#8B00FF');
            gradient.addColorStop(1, '#4B0082');
        } else {
            gradient.addColorStop(0, '#32CD32');
            gradient.addColorStop(1, '#228B22');
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(screenX + 15, screenY + 15, 15, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + 12, 4, 0, Math.PI * 2);
        ctx.arc(screenX + 20, screenY + 12, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(screenX + 11, screenY + 13, 2, 0, Math.PI * 2);
        ctx.arc(screenX + 21, screenY + 13, 2, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        if (this.health < this.maxHealth) {
            ctx.fillStyle = '#000';
            ctx.fillRect(screenX, screenY - 5, 30, 3);
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(screenX, screenY - 5, 30 * (this.health / this.maxHealth), 3);
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
    }

    update() {
        if (!gameState.player) return;

        // Handle spawn animation
        if (this.isSpawning) {
            const elapsed = Date.now() - this.spawnTime;

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
            this.bobOffset += 0.1;
            return; // Skip normal following behavior during spawn
        }

        // If player is sleeping, companions form a ring around them
        if (gameState.player.isCat && gameState.player.idleAnimationType === 'sleep') {
            // Move toward ring position
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 5) { // Close enough threshold
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * this.speed * 0.5; // Move slowly
                this.y += Math.sin(angle) * this.speed * 0.5;
            }
        } else {
            // Follow player with some distance
            const targetDist = 50 + gameState.companions.indexOf(this) * 30;
            const dx = gameState.player.x - this.x;
            const dy = gameState.player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // If companion hasn't joined the line yet, always move toward player
            // This prevents newly spawned companions from sitting still when line is long
            if (!this.hasJoinedLine) {
                if (distance <= targetDist + 50) {
                    // Close enough to the line, mark as joined
                    this.hasJoinedLine = true;
                } else {
                    // Keep moving toward player at double speed to catch up quickly
                    const angle = Math.atan2(dy, dx);
                    this.x += Math.cos(angle) * this.speed * 1.5;
                    this.y += Math.sin(angle) * this.speed * 1.5;
                }
            } else if (distance > targetDist) {
                // Normal following behavior once in line
                const angle = Math.atan2(dy, dx);
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
            }
        }

        this.bobOffset += 0.1;
    }

    draw(ctx) {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y + Math.sin(this.bobOffset) * 2;

        // Shadow (scaled with companion size)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            screenX + (20 * this.sizeMultiplier),
            screenY + (35 * this.sizeMultiplier),
            8 * this.sizeMultiplier,
            2 * this.sizeMultiplier,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        // Draw friend image with colored glow at night
        const image = friendImages[this.type];
        if (image && image.complete) {
            if (gameState.isNight) {
                // Assign glow color based on companion type
                const glowColors = {
                    kitten1: '#FFA500',  // Orange
                    kitten2: '#FFA500',  // Orange
                    kitten3: '#FFA500',  // Orange
                    frog: '#32CD32',     // Lime green
                    squirrel: '#D2691E', // Chocolate brown
                    puppy: '#DAA520',    // Goldenrod
                    bunny: '#FFB6C1'     // Light pink
                };

                ctx.save();
                ctx.shadowBlur = 15 * this.sizeMultiplier;
                ctx.shadowColor = glowColors[this.type] || '#FFFFFF'; // Default white
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
        this.damage = 15;
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
            const dist = Math.sqrt(dx * dx + dy * dy);

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

        // Check collision with enemies
        for (let enemy of gameState.enemies) {
            if (this.intersects(enemy)) {
                enemy.takeDamage(this.damage);
                return true; // Mark for removal
            }
        }

        // Remove if lifetime exceeded
        if (Date.now() - this.createdAt > this.lifetime) {
            return true;
        }

        return false;
    }

    intersects(enemy) {
        const dx = this.x - (enemy.x + enemy.width / 2);
        const dy = this.y - (enemy.y + enemy.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + enemy.width / 2;
    }

    draw(ctx) {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        // Magic projectile
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.radius);
        gradient.addColorStop(0, '#00FFFF');
        gradient.addColorStop(0.5, '#0088FF');
        gradient.addColorStop(1, '#0044FF');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow effect
        ctx.fillStyle = 'rgba(0, 200, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius + 3, 0, Math.PI * 2);
        ctx.fill();
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
        this.healAmount = type === 'apple' ? 20 : type === 'orange' ? 15 : 10;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    update() {
        this.bobOffset += 0.05;

        // Check if player is near
        if (gameState.player && this.isNear(gameState.player, 30)) {
            gameState.player.heal(this.healAmount);

            // Activate speed boost when eating food with heart color
            const heartColor = this.type === 'apple' ? '#FF1493' : this.type === 'orange' ? '#FF69B4' : '#FFB6C1';
            gameState.player.activateSpeedBoost(5000, 1.5, heartColor); // 5 seconds, 1.5x speed

            // Gain XP for picking up hearts
            const xpAmount = this.type === 'apple' ? 10 : this.type === 'orange' ? 7 : 5;
            gainXP(xpAmount);

            updateUI();

            // Remove item
            const index = gameState.items.indexOf(this);
            if (index > -1) {
                gameState.items.splice(index, 1);
            }
        }
    }

    isNear(player, distance) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < distance;
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

        // Assign color based on tier
        const tierColors = ['purple', 'green', 'blue', 'red', 'magenta'];
        this.color = tierColors[this.tier];

        // Glow colors for each tier (used at night)
        const glowColors = ['#9370DB', '#FFD700', '#0000FF', '#FF0000', '#9370DB'];
        this.glowColor = glowColors[this.tier];

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

    update() {
        // Chest opening is now handled by handleInteractions()
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

        // Award Cat Cash for freeing friends (more for bigger chests)
        const cashAmount = (15 + Math.floor(Math.random() * 10)) * this.companionCount;
        gameState.catCash += cashAmount;

        // Gain XP for freeing friends (more for bigger chests)
        gainXP(25 * this.companionCount);

        updateUI();

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
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < distance;
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

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = 'bold 14px Arial';

        if (this.fireflyCost > 0) {
            // Large chest - show firefly requirement
            const canOpen = this.canOpen();
            const text1 = `${this.fireflyCost} Fireflies`;
            const text2 = canOpen ? 'Press E to open' : 'Need more fireflies';

            // Measure both texts to get max width
            const text1Width = ctx.measureText(text1).width;
            const text2Width = ctx.measureText(text2).width;
            const maxWidth = Math.max(text1Width, text2Width);

            // HUD-style frame
            const frameX = screenX + this.width / 2 - maxWidth / 2 - 10;
            const frameY = screenY - 50;
            const frameWidth = maxWidth + 20;
            const frameHeight = 40;
            const cornerRadius = 8;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.beginPath();
            ctx.roundRect(frameX, frameY, frameWidth, frameHeight, cornerRadius);
            ctx.fill();

            // Border (gold if can open, red if cannot)
            ctx.strokeStyle = canOpen ? 'rgba(255, 215, 0, 0.8)' : 'rgba(255, 0, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(frameX, frameY, frameWidth, frameHeight, cornerRadius);
            ctx.stroke();

            // Firefly count text
            ctx.fillStyle = canOpen ? '#00FF00' : '#FF0000';
            ctx.fillText(text1, screenX + this.width / 2, screenY - 36);

            // Action text
            ctx.fillStyle = canOpen ? '#FFF' : '#AAA';
            ctx.fillText(text2, screenX + this.width / 2, screenY - 24);
        } else {
            // Small chest - free to open with E
            const text = 'Press E to Open';
            const textWidth = ctx.measureText(text).width;

            // HUD-style frame
            const frameX = screenX + this.width / 2 - textWidth / 2 - 10;
            const frameY = screenY - 30;
            const frameWidth = textWidth + 20;
            const frameHeight = 24;
            const cornerRadius = 6;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.beginPath();
            ctx.roundRect(frameX, frameY, frameWidth, frameHeight, cornerRadius);
            ctx.fill();

            // Border (gold)
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(frameX, frameY, frameWidth, frameHeight, cornerRadius);
            ctx.stroke();

            // Text
            ctx.fillStyle = '#FFF';
            ctx.fillText(text, screenX + this.width / 2, screenY - 18);
        }

        ctx.restore();
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
                    const dx = x - (building.x + building.width / 2);
                    const dy = y - (building.y + building.height / 2);
                    if (Math.sqrt(dx * dx + dy * dy) < 160) { // Increased from 120 to prevent overlap
                        validPosition = false;
                        break;
                    }
                }

                // Check distance from cat fountain
                if (validPosition && this.catFountain) {
                    const fountainCenterX = this.catFountain.x + this.catFountain.width / 2;
                    const fountainCenterY = this.catFountain.y + this.catFountain.height / 2;
                    const dx = x - fountainCenterX;
                    const dy = y - fountainCenterY;
                    if (Math.sqrt(dx * dx + dy * dy) < 300) {
                        validPosition = false;
                    }
                }

                // Check distance from other trees to prevent overlap
                if (validPosition) {
                    for (let tree of this.trees) {
                        const dx = x - tree.x;
                        const dy = y - tree.y;
                        if (Math.sqrt(dx * dx + dy * dy) < 80) { // Minimum distance between trees
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
                const dx = x - (building.x + building.width / 2);
                const dy = y - (building.y + building.height / 2);
                if (Math.sqrt(dx * dx + dy * dy) < 160) { // Increased from 120 to prevent overlap
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
                const dx = x - fountainCenterX;
                const dy = y - fountainCenterY;
                if (Math.sqrt(dx * dx + dy * dy) < 300) {
                    continue;
                }
            }

            // Check distance from other trees to prevent overlap
            let tooCloseToTree = false;
            for (let tree of this.trees) {
                const dx = x - tree.x;
                const dy = y - tree.y;
                if (Math.sqrt(dx * dx + dy * dy) < 80) { // Minimum distance between trees
                    tooCloseToTree = true;
                    break;
                }
            }

            if (tooCloseToTree) {
                continue;
            }

            // Calculate distance from village center
            const dx = x - this.villageCenterX;
            const dy = y - this.villageCenterY;
            const distanceFromVillage = Math.sqrt(dx * dx + dy * dy);

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

    draw(ctx) {
        // Draw ground with tiled pattern
        const grassPattern = this.createGrassPattern(ctx);
        if (grassPattern && grassPattern !== '#2d5016') {
            // Draw tiled grass pattern that stays fixed in world space
            ctx.save();
            // Translate to align pattern with world coordinates
            const offsetX = -gameState.camera.x % grassTileImage.width;
            const offsetY = -gameState.camera.y % grassTileImage.height;
            ctx.translate(offsetX, offsetY);
            ctx.fillStyle = grassPattern;
            ctx.fillRect(
                -offsetX,
                -offsetY,
                canvas.width - offsetX + grassTileImage.width,
                canvas.height - offsetY + grassTileImage.height
            );
            ctx.restore();
        } else {
            // Fallback solid color
            ctx.fillStyle = '#2d5016';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw cat fountain
        if (this.catFountain && catFountainImage.complete) {
            const screenX = this.catFountain.x - gameState.camera.x;
            const screenY = this.catFountain.y - gameState.camera.y;
            ctx.drawImage(catFountainImage, screenX, screenY, this.catFountain.width, this.catFountain.height);
        }

        // Draw buildings
        for (let building of this.buildings) {
            this.drawBuilding(ctx, building);
        }
    }

    // Draw only the ground (before night overlay)
    drawGround(ctx) {
        const grassPattern = this.createGrassPattern(ctx);
        if (grassPattern && grassPattern !== '#2d5016') {
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
        // Use grass tile image as repeating pattern
        if (grassTileImage && grassTileImage.complete) {
            return ctx.createPattern(grassTileImage, 'repeat');
        }
        // Fallback to solid color if image not loaded
        return '#2d5016';
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
        const canEnter = Date.now() - gameState.lastHouseExitTime > 500;
        if (gameState.player && this.isNear(gameState.player, building, 150) && canEnter) {
            ctx.save();
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';

            const text = 'Press E to Enter';
            const textWidth = ctx.measureText(text).width;

            // HUD-style frame
            const frameX = screenX + building.width / 2 - textWidth / 2 - 10;
            const frameY = screenY - 30;
            const frameWidth = textWidth + 20;
            const frameHeight = 24;
            const cornerRadius = 6;

            // Background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
            ctx.beginPath();
            ctx.roundRect(frameX, frameY, frameWidth, frameHeight, cornerRadius);
            ctx.fill();

            // Border (gold)
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(frameX, frameY, frameWidth, frameHeight, cornerRadius);
            ctx.stroke();

            // Text
            ctx.fillStyle = '#FFF';
            ctx.fillText(text, screenX + building.width / 2, screenY - 18);

            ctx.restore();
        }
    }

    isNear(player, building, distance) {
        const centerX = player.x + player.width / 2;
        const centerY = player.y + player.height / 2;
        const buildingCenterX = building.x + building.width / 2;
        const buildingCenterY = building.y + building.height / 2;
        const dist = Math.sqrt((centerX - buildingCenterX) ** 2 + (centerY - buildingCenterY) ** 2);
        return dist < distance;
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

let imagesLoaded = 0;
const totalImages = 45; // 2 girl walking, cat, 2 cat walking, 3 cat idle animations (yawn/lick/sleep), 8 houses, 7 friends, 6 furniture, 10 chests (purple/green/blue/red/magenta × 2 states), 3 trees, 1 grass tile, 1 floorboards, 1 firefly, 2 jars, 1 cat fountain, 1 title

function checkImagesLoaded() {
    if (imagesLoaded === totalImages) {
        // Start game automatically when images are ready
        startGame();
    }
}

// Helper function to handle both successful loads and errors
function imageLoadHandler() {
    imagesLoaded++;
    checkImagesLoaded();
}

girlWalking1.onload = imageLoadHandler;
girlWalking1.onerror = () => { console.error('Failed to load girl-walking1.png'); imageLoadHandler(); };

girlWalking2.onload = imageLoadHandler;
girlWalking2.onerror = () => { console.error('Failed to load girl-walking2.png'); imageLoadHandler(); };

catImage.onload = imageLoadHandler;
catImage.onerror = () => { console.error('Failed to load cat.png'); imageLoadHandler(); };

catWalking1.onload = imageLoadHandler;
catWalking1.onerror = () => { console.error('Failed to load cat-walking1.png'); imageLoadHandler(); };

catWalking2.onload = imageLoadHandler;
catWalking2.onerror = () => { console.error('Failed to load cat-walking2.png'); imageLoadHandler(); };

catYawning.onload = imageLoadHandler;
catYawning.onerror = () => { console.error('Failed to load cat-yawning.png'); imageLoadHandler(); };

catLickingPaw.onload = imageLoadHandler;
catLickingPaw.onerror = () => { console.error('Failed to load cat-licking-paw.png'); imageLoadHandler(); };

catSleeping.onload = imageLoadHandler;
catSleeping.onerror = () => { console.error('Failed to load cat-sleeping.png'); imageLoadHandler(); };

houseImages.house1.onload = imageLoadHandler;
houseImages.house1.onerror = () => { console.error('Failed to load house1.png'); imageLoadHandler(); };

houseImages.house1Lights.onload = imageLoadHandler;
houseImages.house1Lights.onerror = () => { console.error('Failed to load house1-with-lights.png'); imageLoadHandler(); };

houseImages.house2.onload = imageLoadHandler;
houseImages.house2.onerror = () => { console.error('Failed to load house2.png'); imageLoadHandler(); };

houseImages.house2Lights.onload = imageLoadHandler;
houseImages.house2Lights.onerror = () => { console.error('Failed to load house2-with-lights.png'); imageLoadHandler(); };

houseImages.house3.onload = imageLoadHandler;
houseImages.house3.onerror = () => { console.error('Failed to load house3.png'); imageLoadHandler(); };

houseImages.house3Lights.onload = imageLoadHandler;
houseImages.house3Lights.onerror = () => { console.error('Failed to load house3-with-lights.png'); imageLoadHandler(); };

houseImages.house4.onload = imageLoadHandler;
houseImages.house4.onerror = () => { console.error('Failed to load house4.png'); imageLoadHandler(); };

houseImages.house4Lights.onload = imageLoadHandler;
houseImages.house4Lights.onerror = () => { console.error('Failed to load house4-with-lights.png'); imageLoadHandler(); };

friendImages.kitten1.onload = imageLoadHandler;
friendImages.kitten1.onerror = () => { console.error('Failed to load kitten1.png'); imageLoadHandler(); };

friendImages.kitten2.onload = imageLoadHandler;
friendImages.kitten2.onerror = () => { console.error('Failed to load kitten2.png'); imageLoadHandler(); };

friendImages.kitten3.onload = imageLoadHandler;
friendImages.kitten3.onerror = () => { console.error('Failed to load kitten3.png'); imageLoadHandler(); };

friendImages.frog.onload = imageLoadHandler;
friendImages.frog.onerror = () => { console.error('Failed to load frog.png'); imageLoadHandler(); };

friendImages.squirrel.onload = imageLoadHandler;
friendImages.squirrel.onerror = () => { console.error('Failed to load squirrel.png'); imageLoadHandler(); };

friendImages.puppy.onload = imageLoadHandler;
friendImages.puppy.onerror = () => { console.error('Failed to load puppy.png'); imageLoadHandler(); };

friendImages.bunny.onload = imageLoadHandler;
friendImages.bunny.onerror = () => { console.error('Failed to load bunny.png'); imageLoadHandler(); };

furnitureImages.bed.onload = imageLoadHandler;
furnitureImages.bed.onerror = () => { console.error('Failed to load bed.png'); imageLoadHandler(); };

furnitureImages.table.onload = imageLoadHandler;
furnitureImages.table.onerror = () => { console.error('Failed to load table.png'); imageLoadHandler(); };

furnitureImages.chair.onload = imageLoadHandler;
furnitureImages.chair.onerror = () => { console.error('Failed to load chair.png'); imageLoadHandler(); };

furnitureImages.rug.onload = imageLoadHandler;
furnitureImages.rug.onerror = () => { console.error('Failed to load rug.png'); imageLoadHandler(); };

furnitureImages.plant.onload = imageLoadHandler;
furnitureImages.plant.onerror = () => { console.error('Failed to load plant.png'); imageLoadHandler(); };

furnitureImages.lamp.onload = imageLoadHandler;
furnitureImages.lamp.onerror = () => { console.error('Failed to load lamp.png'); imageLoadHandler(); };

// Chest image handlers
chestImages.purple.full.onload = imageLoadHandler;
chestImages.purple.full.onerror = () => { console.error('Failed to load purple-chest-full.png'); imageLoadHandler(); };
chestImages.purple.empty.onload = imageLoadHandler;
chestImages.purple.empty.onerror = () => { console.error('Failed to load purple-chest-empty.png'); imageLoadHandler(); };

chestImages.green.full.onload = imageLoadHandler;
chestImages.green.full.onerror = () => { console.error('Failed to load green-chest.png'); imageLoadHandler(); };
chestImages.green.empty.onload = imageLoadHandler;
chestImages.green.empty.onerror = () => { console.error('Failed to load green-chest-open.png'); imageLoadHandler(); };

chestImages.blue.full.onload = imageLoadHandler;
chestImages.blue.full.onerror = () => { console.error('Failed to load blue-chest.png'); imageLoadHandler(); };
chestImages.blue.empty.onload = imageLoadHandler;
chestImages.blue.empty.onerror = () => { console.error('Failed to load blue-chest-open.png'); imageLoadHandler(); };

chestImages.red.full.onload = imageLoadHandler;
chestImages.red.full.onerror = () => { console.error('Failed to load red-chest.png'); imageLoadHandler(); };
chestImages.red.empty.onload = imageLoadHandler;
chestImages.red.empty.onerror = () => { console.error('Failed to load red-chest-open.png'); imageLoadHandler(); };

chestImages.magenta.full.onload = imageLoadHandler;
chestImages.magenta.full.onerror = () => { console.error('Failed to load magenta-chest.png'); imageLoadHandler(); };
chestImages.magenta.empty.onload = imageLoadHandler;
chestImages.magenta.empty.onerror = () => { console.error('Failed to load magenta-chest-open.png'); imageLoadHandler(); };

treeImages[0].onload = imageLoadHandler;
treeImages[0].onerror = () => { console.error('Failed to load tree1.png'); imageLoadHandler(); };

treeImages[1].onload = imageLoadHandler;
treeImages[1].onerror = () => { console.error('Failed to load tree2.png'); imageLoadHandler(); };

treeImages[2].onload = imageLoadHandler;
treeImages[2].onerror = () => { console.error('Failed to load pinetree.png'); imageLoadHandler(); };

grassTileImage.onload = imageLoadHandler;
grassTileImage.onerror = () => { console.error('Failed to load grass_tile.jpg'); imageLoadHandler(); };

floorboardsImage.onload = imageLoadHandler;
floorboardsImage.onerror = () => { console.error('Failed to load floorboards.jpg'); imageLoadHandler(); };

fireflyImage.onload = imageLoadHandler;
fireflyImage.onerror = () => { console.error('Failed to load firefly.png'); imageLoadHandler(); };

emptyJarImage.onload = imageLoadHandler;
emptyJarImage.onerror = () => { console.error('Failed to load empty-jar.png'); imageLoadHandler(); };

fullJarImage.onload = imageLoadHandler;
fullJarImage.onerror = () => { console.error('Failed to load full-jar.png'); imageLoadHandler(); };

catFountainImage.onload = imageLoadHandler;
catFountainImage.onerror = () => { console.error('Failed to load cat-fountain.png'); imageLoadHandler(); };

titleImage.onload = imageLoadHandler;
titleImage.onerror = () => { console.error('Failed to load title.png'); imageLoadHandler(); };

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
        const controlsPanel = document.getElementById('controlsPanel');
        if (controlsPanel.style.display === 'block') {
            controlsPanel.style.display = 'none';
            gameState.controlsPanelShown = false;
        }
        e.preventDefault();
        return;
    }

    // "/" or "?" key to toggle controls panel
    if (e.key === '/' || e.key === '?') {
        const controlsPanel = document.getElementById('controlsPanel');
        if (controlsPanel) {
            const isVisible = controlsPanel.style.display === 'block';
            controlsPanel.style.display = isVisible ? 'none' : 'block';
            gameState.controlsPanelShown = !isVisible;
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
        if (gameState.player && !gameState.isInsideHouse) {
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
        updateUI();
        e.preventDefault();
    }

    // Teleport to fountain with Home key
    if (e.key === 'Home') {
        if (gameState.player && !gameState.isInsideHouse && gameState.village && gameState.village.catFountain) {
            const fountainCenterX = gameState.village.catFountain.x + gameState.village.catFountain.width / 2;
            const fountainBottomY = gameState.village.catFountain.y + gameState.village.catFountain.height;
            gameState.player.x = fountainCenterX - gameState.player.width / 2;
            gameState.player.y = fountainBottomY + 50; // Position in front of fountain

            // Teleport companions around the player
            gameState.companions.forEach((companion, index) => {
                const angle = (index / gameState.companions.length) * Math.PI * 2;
                const radius = 80;
                companion.x = gameState.player.x + Math.cos(angle) * radius;
                companion.y = gameState.player.y + Math.sin(angle) * radius;
                companion.targetX = companion.x;
                companion.targetY = companion.y;
            });
        }
        e.preventDefault(); // Prevent default Home key behavior
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
                wanderCooldown: 0
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
                gameState.furnitureRotation = (gameState.furnitureRotation + 90) % 360;
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
            updateSliderValue(gameState.mousePos.x, gameState.mousePos.y);
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
        const dx = mouseX - compassX;
        const dy = mouseY - compassY;
        const distanceToCompass = Math.sqrt(dx * dx + dy * dy);

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

canvas.addEventListener('mouseup', (e) => {
    // Always reset state and cursor on mouseup
    gameState.isDraggingSlider = false;
    gameState.draggedSliderType = null;
    gameState.draggedFurnitureType = null;
    gameState.isDraggingFurniture = false;
    canvas.style.cursor = 'default';
});

// Also listen for mouseup on document to catch releases outside canvas
document.addEventListener('mouseup', (e) => {
    // Always reset all drag states and cursor on any mouseup
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
    if (!gameState.musicStarted) {
        gameState.musicStarted = true;
        bgMusic.play().catch(err => {
            gameState.musicStarted = false; // Allow retry on error
        });
    }

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
        const dx = clickX - compassX;
        const dy = clickY - compassY;
        const distanceToCompass = Math.sqrt(dx * dx + dy * dy);

        if (distanceToCompass <= compassRadius && gameState.village && gameState.village.catFountain) {
            // Clicked compass - teleport to cat fountain
            const fountainCenterX = gameState.village.catFountain.x + gameState.village.catFountain.width / 2;
            const fountainBottomY = gameState.village.catFountain.y + gameState.village.catFountain.height;
            gameState.player.x = fountainCenterX - gameState.player.width / 2;
            gameState.player.y = fountainBottomY + 50; // Position in front of fountain

            // Teleport companions around the player
            gameState.companions.forEach((companion, index) => {
                const angle = (index / gameState.companions.length) * Math.PI * 2;
                const radius = 80;
                companion.x = gameState.player.x + Math.cos(angle) * radius;
                companion.y = gameState.player.y + Math.sin(angle) * radius;
                companion.targetX = companion.x;
                companion.targetY = companion.y;
            });
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
    document.getElementById('characterCreation').style.display = 'none';
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

function spawnEnemies(count) {
    for (let i = 0; i < count; i++) {
        const x = Math.random() * gameState.village.width;
        const y = Math.random() * gameState.village.height;

        // Check if position is valid (not in building)
        let validPosition = true;
        for (let building of gameState.village.buildings) {
            if (x > building.x && x < building.x + building.width &&
                y > building.y && y < building.y + building.height) {
                validPosition = false;
                break;
            }
        }

        if (validPosition && gameState.player) {
            const dx = x - gameState.player.x;
            const dy = y - gameState.player.y;
            if (Math.sqrt(dx * dx + dy * dy) > 200) {
                gameState.enemies.push(new Enemy(x, y));
            }
        }
    }
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
                const dx = x - building.x;
                const dy = y - building.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // If too close (less than 120 units), only allow if chest is clearly in front (below)
                if (distance < 120 && y < building.y + 100) {
                    validPosition = false;
                    break;
                }
            }

            // Check distance from trees - must be at least 60 units away
            if (validPosition) {
                for (let tree of gameState.village.trees) {
                    const dx = x - tree.x;
                    const dy = y - tree.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 60) {
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
                const dx = x - fountainCenterX;
                const dy = y - fountainCenterY;
                distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
                if (distanceFromCenter < 300) {
                    validPosition = false;
                }
            }

            // Check distance from other chests (tier-aware minimum distance)
            if (validPosition) {
                // Calculate tier of this new chest position
                const newChestTier = Math.min(Math.floor(distanceFromCenter / 2000), 4);

                for (let chest of gameState.chests) {
                    const dx = x - chest.x;
                    const dy = y - chest.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

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
    // Room dimensions match drawHouseInterior
    const margin = 10;
    const roomWidth = canvas.width - (margin * 2);
    const roomHeight = canvas.height - (margin * 2) - 200;
    const roomX = margin;
    const roomY = margin;
    const wallThickness = 35;

    // Start player just above the door area (bottom center)
    gameState.player.houseX = roomX + roomWidth / 2 - gameState.player.width / 2;
    gameState.player.houseY = roomY + roomHeight - wallThickness - gameState.player.height - 60; // 60px above door
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
    // Define interior room dimensions - reduced height by 200px for furniture shop
    const margin = 10; // Very small margin to maximize room size
    const roomWidth = canvas.width - (margin * 2);  // 1180px (1200 - 20)
    const roomHeight = canvas.height - (margin * 2) - 200; // 580px (800 - 20 - 200)
    const roomX = margin;  // Start at x=10
    const roomY = margin;  // Start at y=10
    const wallThickness = 35;

    // Update player movement in house
    if (gameState.player) {
        const prevX = gameState.player.houseX;
        const prevY = gameState.player.houseY;

        let moved = false;
        if (gameState.keys['ArrowUp']) {
            gameState.player.houseY -= gameState.player.speed;
            moved = true;
        }
        if (gameState.keys['ArrowDown']) {
            gameState.player.houseY += gameState.player.speed;
            moved = true;
        }
        if (gameState.keys['ArrowLeft']) {
            gameState.player.houseX -= gameState.player.speed;
            gameState.player.facingRight = false;
            moved = true;
        }
        if (gameState.keys['ArrowRight']) {
            gameState.player.houseX += gameState.player.speed;
            gameState.player.facingRight = true;
            moved = true;
        }

        // Update walking animation for cat
        if (gameState.player.isCat) {
            gameState.player.isMoving = moved;
            if (moved) {
                gameState.player.walkingFrameCounter++;
                if (gameState.player.walkingFrameCounter >= 10) {
                    gameState.player.walkingFrame = (gameState.player.walkingFrame + 1) % 2;
                    gameState.player.walkingFrameCounter = 0;
                }
            } else {
                gameState.player.walkingFrameCounter = 0;
                gameState.player.walkingFrame = 0;
            }

            // Idle animation logic for cat inside house
            if (!moved) {
                // Increment idle time
                gameState.player.idleTime += 16; // Approximate ms per frame at 60 FPS

                // After 20 seconds, cat falls asleep and stays asleep
                if (gameState.player.idleTime > 20000) {
                    // Only set up sleep state once
                    if (gameState.player.idleAnimationType !== 'sleep') {
                        gameState.player.idleAnimationType = 'sleep';

                        // Arrange companions in a ring around the sleeping cat (using house coordinates)
                        gameState.companions.forEach((companion, index) => {
                            const angle = (index / gameState.companions.length) * Math.PI * 2;
                            const radius = 80;
                            companion.houseTargetX = gameState.player.houseX + Math.cos(angle) * radius;
                            companion.houseTargetY = gameState.player.houseY + Math.sin(angle) * radius;
                        });
                    }
                }
                // Check if current idle animation has finished (but not sleep - sleep persists)
                else if (gameState.player.idleAnimationType && gameState.player.idleAnimationType !== 'sleep' && Date.now() - gameState.player.idleAnimationStartTime > gameState.player.idleAnimationDuration) {
                    gameState.player.idleAnimationType = null;
                }
                // Randomly trigger a new idle animation after being idle for a while (only if not sleeping)
                else if (!gameState.player.idleAnimationType && gameState.player.idleTime > 6000 && gameState.player.idleTime < 20000) {
                    // Random chance to trigger animation (about 1% chance per frame when idle > 6s)
                    if (Math.random() < 0.01) {
                        // Randomly choose yawn or lick
                        gameState.player.idleAnimationType = Math.random() < 0.5 ? 'yawn' : 'lick';
                        gameState.player.idleAnimationStartTime = Date.now();
                        // Don't reset idleTime - let it keep accumulating toward sleep threshold
                    }
                }
            } else {
                // Reset idle state when moving
                gameState.player.idleTime = 0;
                gameState.player.idleAnimationType = null;
            }
        }

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
    for (let companion of gameState.companions) {
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
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > 5) { // Close enough threshold
                    const angle = Math.atan2(dy, dx);
                    companion.houseX += Math.cos(angle) * companion.speed * 0.5; // Move slowly
                    companion.houseY += Math.sin(angle) * companion.speed * 0.5;
                }
            }
        } else {
            // Follow player normally
            const targetDist = 50 + gameState.companions.indexOf(companion) * 30;
            const dx = gameState.player.houseX - companion.houseX;
            const dy = gameState.player.houseY - companion.houseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > targetDist) {
                const angle = Math.atan2(dy, dx);
                companion.houseX += Math.cos(angle) * companion.speed;
                companion.houseY += Math.sin(angle) * companion.speed;
            }
        }

        companion.bobOffset += 0.1;
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
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(companion.houseX + 20, companion.houseY + 35, 8, 2, 0, 0, Math.PI * 2);
        ctx.fill();

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

        // Wandering behavior
        dropped.wanderCooldown = (dropped.wanderCooldown || 0) - 16;
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
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 1) {
                const speed = 0.5;
                dropped.houseX += (dx / dist) * speed;
                dropped.houseY += (dy / dist) * speed;
            }
        }

        // Check if player touches the dropped companion
        if (gameState.player) {
            const dx = dropped.houseX - gameState.player.houseX;
            const dy = dropped.houseY - gameState.player.houseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 40) {
                // Pick up the companion and add back to line
                gameState.companions.push(dropped.companion);
                gameState.droppedCompanions.splice(i, 1);
                continue;
            }
        }

        // Draw dropped companion (larger and more visible)
        const companionSize = dropped.companion.sizeMultiplier || 1.0;
        const droppedScale = 1.5; // Make dropped companions 50% larger for visibility

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(
            dropped.houseX + (20 * companionSize * droppedScale),
            dropped.houseY + (35 * companionSize * droppedScale),
            8 * companionSize * droppedScale,
            2 * companionSize * droppedScale,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        const image = friendImages[dropped.type];
        if (image && image.complete) {
            dropped.bobOffset = (dropped.bobOffset || 0) + 0.1;
            const width = 40 * companionSize * droppedScale;  // 1.5x larger
            const height = 40 * companionSize * droppedScale;
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

        // Draw player sprite
        if (gameState.player.isCat) {
            // Select sprite based on movement and idle animation state
            let catSprite = catImage; // Default idle
            if (gameState.player.isMoving) {
                catSprite = gameState.player.walkingFrame === 0 ? catWalking1 : catWalking2;
            } else if (gameState.player.idleAnimationType === 'sleep') {
                catSprite = catSleeping;
            } else if (gameState.player.idleAnimationType === 'yawn') {
                catSprite = catYawning;
            } else if (gameState.player.idleAnimationType === 'lick') {
                catSprite = catLickingPaw;
            }

            if (catSprite.complete) {
                ctx.save();
                if (gameState.player.facingRight) {
                    // Flip horizontally for right movement
                    ctx.translate(gameState.player.houseX + gameState.player.width, gameState.player.houseY);
                    ctx.scale(-1, 1);
                    ctx.drawImage(catSprite, 0, 0, gameState.player.width, gameState.player.height);
                } else {
                    // Normal left-facing sprite
                    ctx.drawImage(catSprite, gameState.player.houseX, gameState.player.houseY, gameState.player.width, gameState.player.height);
                }
                ctx.restore();
            }
        } else {
            // Use walking sprites for girl (girlWalking1 for idle, alternate when moving)
            let girlSprite = girlWalking1; // Default idle
            if (gameState.player.isMoving) {
                girlSprite = gameState.player.walkingFrame === 0 ? girlWalking1 : girlWalking2;
            }

            if (girlSprite.complete) {
                ctx.drawImage(girlSprite, gameState.player.houseX, gameState.player.houseY, gameState.player.width, gameState.player.height);
            }
        }
    }

    // Draw furniture shop UI
    drawFurnitureShop(ctx);

    // If furniture is selected, show placement preview
    if (gameState.selectedFurnitureType) {
        const furniture = gameState.furnitureShop.find(f => f.type === gameState.selectedFurnitureType);
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
            ctx.rotate(gameState.furnitureRotation * Math.PI / 180);
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
    // Position shop horizontally below the room
    const margin = 10;
    const roomWidth = canvas.width - (margin * 2);
    const roomHeight = canvas.height - (margin * 2) - 200;
    const roomY = margin;

    const shopY = roomY + roomHeight + 40; // 40px below room for better spacing
    const shopX = margin + 10;
    const itemWidth = 110; // Increased for better usability
    const itemHeight = 140; // Increased for better usability
    const gap = 12; // Increased gap between items

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
        const currentRotation = gameState.furnitureHues[furniture.type + '_rotation'] || 0;
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

        const colorGradient = ctx.createLinearGradient(colorSliderX, colorSliderY, colorSliderX + sliderWidth, colorSliderY);
        for (let h = 0; h <= 360; h += 60) {
            colorGradient.addColorStop(h / 360, `hsl(${h}, 80%, 50%)`);
        }
        ctx.fillStyle = colorGradient;
        ctx.beginPath();
        ctx.roundRect(colorSliderX, colorSliderY, sliderWidth, sliderHeight, sliderHeight / 2);
        ctx.fill();

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

        const sizeGradient = ctx.createLinearGradient(sizeSliderX, sizeSliderY, sizeSliderX + sliderWidth, sizeSliderY);
        sizeGradient.addColorStop(0, '#666');
        sizeGradient.addColorStop(1, '#FFF');
        ctx.fillStyle = sizeGradient;
        ctx.beginPath();
        ctx.roundRect(sizeSliderX, sizeSliderY, sliderWidth, sliderHeight, sliderHeight / 2);
        ctx.fill();

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
function updateSliderValue(mouseX, mouseY) {
    if (!gameState.isDraggingSlider || !gameState.draggedFurnitureType) return;

    const margin = 10;
    const roomHeight = canvas.height - (margin * 2) - 200;
    const roomY = margin;
    const shopY = roomY + roomHeight + 40;
    const shopX = margin + 10;
    const itemWidth = 110;
    const gap = 12;

    // Find which furniture item index
    const furnitureIndex = gameState.furnitureShop.findIndex(f => f.type === gameState.draggedFurnitureType);
    if (furnitureIndex === -1) return;

    const x = shopX + furnitureIndex * (itemWidth + gap);
    const sliderWidth = itemWidth - 20;
    const sliderX = x + 10;

    if (gameState.draggedSliderType === 'color') {
        const colorSliderY = shopY + 98;
        // Clamp mouseX to slider bounds
        const clampedX = Math.max(sliderX, Math.min(mouseX, sliderX + sliderWidth));
        const hue = ((clampedX - sliderX) / sliderWidth) * 360;
        gameState.furnitureHues[gameState.draggedFurnitureType] = Math.max(0, Math.min(360, hue));

        // Update selected furniture if applicable
        if (gameState.selectedPlacedFurniture && gameState.selectedPlacedFurniture.type === gameState.draggedFurnitureType) {
            const furniture = gameState.furnitureShop.find(f => f.type === gameState.draggedFurnitureType);
            gameState.selectedPlacedFurniture.hue = hue;
            gameState.selectedPlacedFurniture.color = shiftHue(furniture.color, hue);
        }
    } else if (gameState.draggedSliderType === 'size') {
        const sizeSliderY = shopY + 118;
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
    // Match new horizontal layout
    const margin = 10;
    const roomHeight = canvas.height - (margin * 2) - 200;
    const roomY = margin;
    const shopY = roomY + roomHeight + 40; // 40px below room for better spacing
    const shopX = margin + 10;
    const itemWidth = 110; // Increased for better usability
    const itemHeight = 140; // Increased for better usability
    const gap = 12; // Increased gap between items

    for (let i = 0; i < gameState.furnitureShop.length; i++) {
        const furniture = gameState.furnitureShop[i];
        const x = shopX + i * (itemWidth + gap);
        const y = shopY;

        // Check if clicking on rotate button
        const rotateButtonX = x + itemWidth - 20;
        const rotateButtonY = y + 15;
        const rotateButtonRadius = 10;
        const distToRotateButton = Math.sqrt(
            Math.pow(clickX - rotateButtonX, 2) + Math.pow(clickY - rotateButtonY, 2)
        );

        if (distToRotateButton <= rotateButtonRadius) {
            // Rotate this furniture type's rotation by 45 degrees
            const currentRotation = gameState.furnitureHues[furniture.type + '_rotation'] || 0;
            gameState.furnitureHues[furniture.type + '_rotation'] = (currentRotation + 45) % 360;

            // If a placed furniture of this type is selected, update it too
            if (gameState.selectedPlacedFurniture && gameState.selectedPlacedFurniture.type === furniture.type) {
                gameState.selectedPlacedFurniture.rotation = (gameState.selectedPlacedFurniture.rotation + 45) % 360;
            }
            return true;
        }

        // ONLY handle sliders on mousedown, NOT on click
        if (isMouseDown) {
            // Check if clicking on color slider
            const sliderWidth = itemWidth - 20;
            const sliderHeight = 10;
            const colorSliderX = x + 10;
            const colorSliderY = y + 98;

            if (clickX >= colorSliderX && clickX <= colorSliderX + sliderWidth &&
                clickY >= colorSliderY - 5 && clickY <= colorSliderY + sliderHeight + 5) {
                // Start dragging color slider
                gameState.isDraggingSlider = true;
                gameState.draggedSliderType = 'color';
                gameState.draggedFurnitureType = furniture.type;

                // Update hue based on slider position
                const hue = ((clickX - colorSliderX) / sliderWidth) * 360;
                gameState.furnitureHues[furniture.type] = Math.max(0, Math.min(360, hue));

                // If a placed furniture of this type is selected, update it too
                if (gameState.selectedPlacedFurniture && gameState.selectedPlacedFurniture.type === furniture.type) {
                    gameState.selectedPlacedFurniture.hue = hue;
                    gameState.selectedPlacedFurniture.color = shiftHue(furniture.color, hue);
                }
                return true;
            }

            // Check if clicking on size slider
            const sizeSliderX = x + 10;
            const sizeSliderY = y + 118;

            if (clickX >= sizeSliderX && clickX <= sizeSliderX + sliderWidth &&
                clickY >= sizeSliderY - 5 && clickY <= sizeSliderY + sliderHeight + 5) {
                // Start dragging size slider
                gameState.isDraggingSlider = true;
                gameState.draggedSliderType = 'size';
                gameState.draggedFurnitureType = furniture.type;

                // Update size based on slider position (0.5 to 2.0 range)
                const size = 0.5 + ((clickX - sizeSliderX) / sliderWidth) * 1.5;
                gameState.furnitureSizes[furniture.type] = Math.max(0.5, Math.min(2.0, size));

                // If a placed furniture of this type is selected, update it too
                if (gameState.selectedPlacedFurniture && gameState.selectedPlacedFurniture.type === furniture.type) {
                    gameState.selectedPlacedFurniture.size = size;
                }
                return true;
            }
        }

        // Check if clicking on furniture item preview/name area
        if (clickX >= x && clickX <= x + itemWidth &&
            clickY >= y && clickY <= y + 80) { // Top area with preview and name (increased for bigger icon)
            // Only select from shop if not clicking sliders/buttons - and clear placed selection
            gameState.selectedFurnitureType = furniture.type;
            gameState.selectedPlacedFurniture = null;
            // Use stored rotation for this furniture type
            gameState.furnitureRotation = gameState.furnitureHues[furniture.type + '_rotation'] || 0;
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

    const furnitureTemplate = gameState.furnitureShop.find(f => f.type === gameState.selectedFurnitureType);
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
        rotation: gameState.furnitureRotation
    });

    // Deselect
    gameState.selectedFurnitureType = null;
    gameState.furnitureRotation = 0;
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
            const dx = chest.x - player.x;
            const dy = chest.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
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
        const canEnter = Date.now() - gameState.lastHouseExitTime > 500;
        if (canEnter) {
            for (let building of gameState.village.buildings) {
                if (player.isNear(building, 200)) {
                    const dx = building.x - player.x;
                    const dy = building.y - player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
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

// Handle F key for opening large chests (with firefly cost)
function handleFKeyInteractions() {
    const fKeyPressed = gameState.keys['f'] || gameState.keys['F'];

    // Only trigger on new key press, not when held down
    if (!fKeyPressed) {
        gameState.fKeyWasPressed = false;
        return;
    }

    if (gameState.fKeyWasPressed) {
        return; // Key is being held, don't trigger again
    }

    gameState.fKeyWasPressed = true;

    if (!gameState.player || gameState.isInsideHouse) return;

    const player = gameState.player;

    // Find closest large chest (fireflyCost > 0) in range
    let closestChest = null;
    let closestDistance = Infinity;

    for (let chest of gameState.chests) {
        if (!chest.opened && chest.fireflyCost > 0 && chest.isNear(player, 80 * chest.sizeMultiplier)) {
            const dx = chest.x - player.x;
            const dy = chest.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestChest = chest;
            }
        }
    }

    // Try to open the chest
    if (closestChest) {
        closestChest.open(); // The open() method now checks firefly count
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

// Respawn enemies (called at dusk)
function respawnEnemies() {
    // Spawn a wave of enemies at night
    const enemiesToSpawn = 15;
    spawnEnemies(enemiesToSpawn);
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
        const distance = Math.sqrt(dx * dx + dy * dy);
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

        // Level up effects
        gameState.player.maxHealth += 20;
        gameState.player.health = gameState.player.maxHealth;

        // Spawn particles for level up
        for (let i = 0; i < 30; i++) {
            gameState.particles.push(new Particle(
                gameState.player.x + gameState.player.width / 2,
                gameState.player.y + gameState.player.height / 2,
                '#FFD700'
            ));
        }
    }
}

// UI Updates
function updateUI() {
    if (!gameState.player) return;
    // UI is drawn in the game loop on the canvas
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

        // Use fixed size based on tier for visibility
        const tierSizes = {
            'purple': 3,
            'green': 4,
            'blue': 5,
            'red': 6,
            'magenta': 7
        };
        const size = tierSizes[chest.color] || 3;

        // Draw with bright colors for visibility
        const colors = {
            'purple': '#9370DB',
            'green': '#00FF00',
            'blue': '#00FFFF',
            'red': '#FF0000',
            'magenta': '#FF00FF'
        };

        ctx.fillStyle = colors[chest.color] || '#FFFFFF';
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
        const pulse = Math.sin(Date.now() / 200) * 0.3 + 1.0;

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

    // Clear legend bounds for click detection
    gameState.minimapLegendBounds = [];

    const legend = [
        { text: 'Purple', image: chestImages.purple?.full, toggleKey: 'chestsPurple' },
        { text: 'Green', image: chestImages.green?.full, toggleKey: 'chestsGreen' },
        { text: 'Blue', image: chestImages.blue?.full, toggleKey: 'chestsBlue' },
        { text: 'Red', image: chestImages.red?.full, toggleKey: 'chestsRed' },
        { text: 'Magenta', image: chestImages.magenta?.full, toggleKey: 'chestsMagenta' },
        { text: 'Companions', image: friendImages.kitten1, toggleKey: 'companions' }
    ];

    legend.forEach((item, i) => {
        const y = legendY + (i * rowHeight);
        const isEnabled = gameState.minimapLayers[item.toggleKey];

        // Store clickable bounds
        gameState.minimapLegendBounds.push({
            x: legendX,
            y: y,
            width: 200,
            height: rowHeight,
            toggleKey: item.toggleKey
        });

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
        } else if (item.color) {
            ctx.fillStyle = item.color;
            ctx.globalAlpha = isEnabled ? 1.0 : 0.3;
            ctx.fillRect(iconX, y + 2, iconSize, iconSize - 4);
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

    // Auto-show controls panel after 10 seconds of inactivity (only at game start before player moves)
    const idleTime = now - gameState.lastActivityTime;
    const controlsPanel = document.getElementById('controlsPanel');
    if (idleTime > 10000 && !gameState.controlsPanelShown && !gameState.hasPlayerMoved && controlsPanel) {
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

        // Update chests (draw later, after night overlay)
        for (let chest of gameState.chests) {
            chest.update();
        }

        // Update player (draw later, after night overlay)
        if (gameState.player) {
            gameState.player.update();
        }

        // Update and draw companions
        for (let companion of gameState.companions) {
            companion.update();
            companion.draw(ctx);
        }

        // Update dropped companions (collision detection only - drawing happens after night overlay)
        for (let i = gameState.droppedCompanions.length - 1; i >= 0; i--) {
            const dropped = gameState.droppedCompanions[i];

            // Skip if this companion is in a house (those are handled in drawHouseInterior)
            if (dropped.isInHouse) continue;

            // Update bob offset for animation
            dropped.bobOffset = (dropped.bobOffset || 0) + 0.1;

            // Check if player touches the dropped companion
            if (gameState.player) {
                const dx = dropped.x - gameState.player.x;
                const dy = dropped.y - gameState.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 40) {
                    // Pick up the companion and add back to line
                    gameState.companions.push(dropped.companion);
                    gameState.droppedCompanions.splice(i, 1);
                    continue;
                }
            }
        }

        // Update and draw projectiles
        gameState.projectiles = gameState.projectiles.filter(projectile => {
            const shouldRemove = projectile.update();
            if (!shouldRemove) {
                projectile.draw(ctx);
            }
            return !shouldRemove;
        });

        // Update and draw particles
        gameState.particles = gameState.particles.filter(particle => {
            const shouldRemove = particle.update();
            if (!shouldRemove) {
                particle.draw(ctx);
            }
            return !shouldRemove;
        });

        // Apply night overlay to darken everything
        if (gameState.isNight) {
            ctx.fillStyle = 'rgba(0, 0, 30, 0.4)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw fireflies above the night overlay so they stay bright
        if (gameState.isNight && fireflyImage.complete) {
            gameState.fireflies = gameState.fireflies.filter(firefly => {
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
                    const dx = firefly.x - (gameState.player.x + gameState.player.width / 2);
                    const dy = firefly.y - (gameState.player.y + gameState.player.height / 2);
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 40) {
                        // Player picked up firefly - give XP based on value and increment jar count
                        gainXP(firefly.xpValue || 10);
                        gameState.fireflyCount = Math.min(999, gameState.fireflyCount + 1);
                        return false; // Remove firefly
                    }
                }

                const screenX = firefly.x - gameState.camera.x;
                const screenY = firefly.y - gameState.camera.y + Math.sin(firefly.floatOffset) * 5;

                // Use dynamic size (grows with magic hits)
                const size = firefly.size || 32;
                const halfSize = size / 2;

                // Rainbow fireflies undulate through colors continuously
                if (firefly.isRainbow) {
                    firefly.hue = (firefly.hue + 2) % 360;
                }

                // Apply glow effect and draw firefly with hue rotation
                ctx.save();

                // Convert hue to color for glow
                // Fireflies start yellow (60° hue) and rotate through the spectrum
                let glowColor = '#FFFF00'; // Default yellow
                if (firefly.hue > 0 || firefly.isRainbow) {
                    const totalHue = (60 + firefly.hue) % 360; // Start at yellow (60°)
                    // Convert HSL to RGB for glow
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

                ctx.shadowBlur = 20;
                ctx.shadowColor = glowColor;

                // Get cached hue-rotated firefly image (or use original if no hue rotation)
                const fireflyImg = firefly.hue > 0
                    ? getCachedFireflyImage(firefly.hue, size)
                    : fireflyImage;

                // Draw firefly multiple times for stronger glow
                if (firefly.hue > 0) {
                    // Draw cached colored version
                    ctx.drawImage(fireflyImg, screenX - halfSize, screenY - halfSize, size, size);
                    ctx.shadowBlur = 15; // Slightly smaller for second pass
                    ctx.drawImage(fireflyImg, screenX - halfSize, screenY - halfSize, size, size);
                } else {
                    // Draw original yellow firefly
                    ctx.drawImage(fireflyImage, screenX - halfSize, screenY - halfSize, size, size);
                    ctx.shadowBlur = 15; // Slightly smaller for second pass
                    ctx.drawImage(fireflyImage, screenX - halfSize, screenY - halfSize, size, size);
                }

                ctx.restore();

                return true; // Keep firefly
            });
        }

        // Draw buildings and fountain after night overlay to stay bright
        if (gameState.village) {
            gameState.village.drawBuildings(ctx);
        }

        // Draw chests after night overlay to stay bright
        for (let chest of gameState.chests) {
            chest.draw(ctx);
        }

        // Draw items after night overlay to stay bright
        for (let item of gameState.items) {
            item.draw(ctx);
        }

        // Draw trees above buildings and chests
        if (gameState.village) {
            for (let tree of gameState.village.trees) {
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
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.beginPath();
            ctx.ellipse(screenX + (20 * companionSize), screenY + (35 * companionSize), 8 * companionSize, 2 * companionSize, 0, 0, Math.PI * 2);
            ctx.fill();

            // Draw friend image (scaled with companion size) with colored glow at night
            const image = friendImages[dropped.type];
            if (image && image.complete) {
                const width = 40 * companionSize;
                const height = 40 * companionSize;
                const bobY = screenY + Math.sin(dropped.bobOffset) * 2;

                if (gameState.isNight) {
                    // Assign glow color based on companion type (matching Companion class)
                    const glowColors = {
                        kitten1: '#FFA500',  // Orange
                        kitten2: '#FFA500',  // Orange
                        kitten3: '#FFA500',  // Orange
                        frog: '#32CD32',     // Lime green
                        squirrel: '#D2691E', // Chocolate brown
                        puppy: '#DAA520',    // Goldenrod
                        bunny: '#FFB6C1'     // Light pink
                    };

                    ctx.save();
                    ctx.shadowBlur = 20 * companionSize; // Larger glow for dropped companions
                    ctx.shadowColor = glowColors[dropped.type] || '#FFFFFF'; // Default white
                    ctx.drawImage(image, screenX, bobY, width, height);
                    ctx.restore();
                } else {
                    ctx.drawImage(image, screenX, bobY, width, height);
                }
            }
        }

        // Draw fading title image over fountain at game start
        if (gameState.village && gameState.village.catFountain && gameState.gameStartTime > 0 && titleImage.complete) {
            const timeSinceStart = Date.now() - gameState.gameStartTime;
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

        // Rainbow gradient border
        const rainbowGradient = ctx.createLinearGradient(hudX, hudY, hudX + hudWidth, hudY);
        rainbowGradient.addColorStop(0, '#FF0000');
        rainbowGradient.addColorStop(0.16, '#FF7F00');
        rainbowGradient.addColorStop(0.33, '#FFFF00');
        rainbowGradient.addColorStop(0.5, '#00FF00');
        rainbowGradient.addColorStop(0.66, '#0000FF');
        rainbowGradient.addColorStop(0.83, '#4B0082');
        rainbowGradient.addColorStop(1, '#9400D3');

        ctx.strokeStyle = rainbowGradient;
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

        // XP bar fill
        const xpPercent = gameState.xp / gameState.xpToNextLevel;
        const fillWidth = barWidth * xpPercent;

        const gradient = ctx.createLinearGradient(barX, barY, barX + fillWidth, barY);
        gradient.addColorStop(0, '#4169E1');
        gradient.addColorStop(1, '#1E90FF');

        ctx.fillStyle = gradient;
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

    // Update UI
    updateUI();

    // Draw version number in lower right corner
    ctx.save();
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('v0.2.13', canvas.width - 5, canvas.height - 5);
    ctx.restore();
    // Draw chest messages on top of everything
    if (!gameState.isInsideHouse) {
        for (let chest of gameState.chests) {
            chest.drawMessage(ctx);
        }
    }

    // Draw notification overlay
    if (gameState.notification.visible) {
        const elapsed = Date.now() - gameState.notification.fadeStartTime;
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
