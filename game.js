// Game Configuration
const CONFIG = {
    TILE_SIZE: 40,
    PLAYER_SPEED: 3,
    ENEMY_SPEED: 1.5,
    NIGHT_ENEMY_SPEED_MULTIPLIER: 1.5,
    MAGIC_COOLDOWN: 500,
    COMPANION_SPEED: 2.5,
    DAY_LENGTH: 60000, // 60 seconds per day
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
    items: [],
    chests: [],
    projectiles: [],
    particles: [],
    village: null,
    camera: { x: 0, y: 0 },
    keys: {},
    mousePos: { x: 0, y: 0 },
    catCash: 0,
    timeOfDay: 0, // 0-1, 0 = dawn, 0.5 = dusk
    isNight: false,
    previousIsNight: false,
    gameTime: 18000, // Start at 0.3 of day cycle (morning, ~7:12am)
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
    ]
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
        if (gameState.keys['ArrowUp']) this.y -= this.speed;
        if (gameState.keys['ArrowDown']) this.y += this.speed;
        if (gameState.keys['ArrowLeft']) this.x -= this.speed;
        if (gameState.keys['ArrowRight']) this.x += this.speed;

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
            // Check for door interaction on ANY house - much larger range
            // Prevent re-entry for 500ms after exiting
            const canEnter = Date.now() - gameState.lastHouseExitTime > 500;
            if (this.isNear(building, 200) && canEnter) {
                if (gameState.keys['e'] || gameState.keys['E']) {
                    enterHouse(building);
                }
            }

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

        // Normal human collision
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
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

        const angle = Math.atan2(targetY - this.y, targetX - this.x);
        gameState.projectiles.push(new Projectile(
            this.x + this.width / 2,
            this.y + this.height / 2,
            angle
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

    drawHuman(ctx, x, y) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 15, y + 42, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw girl sprite
        if (girlImage.complete) {
            ctx.drawImage(girlImage, x, y, this.width, this.height);
        }
    }

    drawCat(ctx, x, y) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + 15, y + 25, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw cat sprite
        if (catImage.complete) {
            ctx.drawImage(catImage, x, y, this.width, this.height);
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
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.type = type; // 'dog', 'cat', 'bird'
        this.speed = CONFIG.COMPANION_SPEED;
        this.targetX = x;
        this.targetY = y;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    update() {
        if (!gameState.player) return;

        // Follow player with some distance
        const targetDist = 50 + gameState.companions.indexOf(this) * 30;
        const dx = gameState.player.x - this.x;
        const dy = gameState.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > targetDist) {
            const angle = Math.atan2(dy, dx);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }

        this.bobOffset += 0.1;
    }

    draw(ctx) {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y + Math.sin(this.bobOffset) * 2;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 20, screenY + 35, 8, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw friend image if loaded
        const image = friendImages[this.type];
        if (image && image.complete) {
            ctx.drawImage(image, screenX, screenY, this.width, this.height);
        }
    }
}

class Projectile {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = 8;
        this.radius = 6;
        this.damage = 15;
        this.lifetime = 2000;
        this.createdAt = Date.now();
    }

    update() {
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
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * (2 + Math.random() * 3);
        this.vy = Math.sin(angle) * (2 + Math.random() * 3);
        this.life = 1;
        this.decay = 0.02;
        this.size = 3 + Math.random() * 3;
        this.color = `hsl(${Math.random() * 60 + 30}, 100%, 50%)`;
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

            // Activate speed boost when eating food
            gameState.player.activateSpeedBoost(5000, 1.5); // 5 seconds, 1.5x speed

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

        if (this.type === 'apple') {
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.arc(screenX + 16, screenY + 16, 13, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#228B22';
            ctx.fillRect(screenX + 14, screenY + 5, 4, 7);
        } else if (this.type === 'orange') {
            ctx.fillStyle = '#FFA500';
            ctx.beginPath();
            ctx.arc(screenX + 16, screenY + 16, 13, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'berry') {
            ctx.fillStyle = '#8B008B';
            ctx.beginPath();
            ctx.arc(screenX + 10, screenY + 16, 7, 0, Math.PI * 2);
            ctx.arc(screenX + 22, screenY + 16, 7, 0, Math.PI * 2);
            ctx.arc(screenX + 16, screenY + 22, 7, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Chest {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 72;
        this.height = 60;
        this.opened = false;
        this.companionTypes = ['kitten1', 'kitten2', 'kitten3', 'frog', 'squirrel', 'puppy', 'bunny'];
    }

    update() {
        if (this.opened) return;

        // Check if player presses E near chest
        if (gameState.player && this.isNear(gameState.player, 60)) {
            if (gameState.keys['e'] || gameState.keys['E']) {
                this.open();
            }
        }
    }

    open() {
        this.opened = true;

        // Spawn a random companion
        const type = this.companionTypes[Math.floor(Math.random() * this.companionTypes.length)];
        gameState.companions.push(new Companion(this.x, this.y, type));

        // Award Cat Cash for freeing a friend
        const cashAmount = 15 + Math.floor(Math.random() * 10);
        gameState.catCash += cashAmount;
        updateUI();

        // Particles
        for (let i = 0; i < 20; i++) {
            gameState.particles.push(new Particle(
                this.x + this.width / 2,
                this.y + this.height / 2,
                Math.random() * Math.PI * 2
            ));
        }
    }

    isNear(player, distance) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < distance;
    }

    draw(ctx) {
        const screenX = this.x - gameState.camera.x;
        const screenY = this.y - gameState.camera.y;

        // Draw chest image based on opened state
        const chestImg = this.opened ? emptyChestImage : fullChestImage;
        if (chestImg && chestImg.complete) {
            ctx.drawImage(chestImg, screenX, screenY, this.width, this.height);
        } else {
            // Fallback to old drawing if image not loaded
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
        }

        // Interaction hint
        if (!this.opened && gameState.player && this.isNear(gameState.player, 60)) {
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Press E', screenX + 24, screenY - 8);
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
        this.generateVillage();
    }

    generateVillage() {
        // Calculate village offset to center it
        const villageOffsetX = this.villageCenterX - this.villageWidth / 2;
        const villageOffsetY = this.villageCenterY - this.villageHeight / 2;

        // Player's house (special) - centered in village
        this.buildings.push({
            id: 'player_house',
            x: villageOffsetX + 400,
            y: villageOffsetY + 300,
            width: 160,
            height: 140,
            type: 'playerHouse',
            houseType: 1 // Player always gets house1
        });

        // Generate other houses - scaled and offset
        const housePositions = [
            {x: 700, y: 200},
            {x: 1000, y: 250},
            {x: 600, y: 500},
            {x: 900, y: 550},
            {x: 1200, y: 400},
            {x: 300, y: 600},
            {x: 1100, y: 800},
            {x: 500, y: 900}
        ];

        for (let i = 0; i < housePositions.length; i++) {
            const pos = housePositions[i];
            this.buildings.push({
                id: `house_${i}`,
                x: villageOffsetX + pos.x,
                y: villageOffsetY + pos.y,
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

                // Check distance from buildings
                for (let building of this.buildings) {
                    const dx = x - (building.x + building.width / 2);
                    const dy = y - (building.y + building.height / 2);
                    if (Math.sqrt(dx * dx + dy * dy) < 120) {
                        validPosition = false;
                        break;
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
                if (Math.sqrt(dx * dx + dy * dy) < 120) {
                    tooCloseToBuilding = true;
                    break;
                }
            }

            if (tooCloseToBuilding) {
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

        // Draw trees (behind buildings)
        for (let tree of this.trees) {
            this.drawTree(ctx, tree);
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

        // Draw house image
        if (houseImg && houseImg.complete) {
            ctx.drawImage(houseImg, screenX, screenY, building.width, building.height);
        } else {
            // Fallback - draw simple colored rectangle if image fails
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(screenX, screenY, building.width, building.height);
        }

        // Show interaction hint for ALL houses
        const canEnter = Date.now() - gameState.lastHouseExitTime > 500;
        if (gameState.player && this.isNear(gameState.player, building, 150) && canEnter) {
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Press E to Enter', screenX + building.width / 2, screenY - 10);
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
const girlImage = new Image();
girlImage.src = 'graphics/girl.png';
const catImage = new Image();
catImage.src = 'graphics/cat.png';

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

// Load chest images
const fullChestImage = new Image();
fullChestImage.src = 'graphics/full-chest.png';
const emptyChestImage = new Image();
emptyChestImage.src = 'graphics/empty-chest.png';

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
grassTileImage.src = 'graphics/grass_tile.png';

let imagesLoaded = 0;
const totalImages = 29; // girl, cat, 8 houses, 7 friends, 6 furniture, 2 chests, 3 trees, 1 grass tile

function checkImagesLoaded() {
    if (imagesLoaded === totalImages) {
        // Start game automatically when images are ready
        startGame();
    }
}

// Helper function to handle both successful loads and errors
function imageLoadHandler() {
    imagesLoaded++;
    console.log(`Images loaded: ${imagesLoaded}/${totalImages}`);
    checkImagesLoaded();
}

girlImage.onload = imageLoadHandler;
girlImage.onerror = () => { console.error('Failed to load girl.png'); imageLoadHandler(); };

catImage.onload = imageLoadHandler;
catImage.onerror = () => { console.error('Failed to load cat.png'); imageLoadHandler(); };

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

fullChestImage.onload = imageLoadHandler;
fullChestImage.onerror = () => { console.error('Failed to load full-chest.png'); imageLoadHandler(); };

emptyChestImage.onload = imageLoadHandler;
emptyChestImage.onerror = () => { console.error('Failed to load empty-chest.png'); imageLoadHandler(); };

treeImages[0].onload = imageLoadHandler;
treeImages[0].onerror = () => { console.error('Failed to load tree1.png'); imageLoadHandler(); };

treeImages[1].onload = imageLoadHandler;
treeImages[1].onerror = () => { console.error('Failed to load tree2.png'); imageLoadHandler(); };

treeImages[2].onload = imageLoadHandler;
treeImages[2].onerror = () => { console.error('Failed to load pinetree.png'); imageLoadHandler(); };

grassTileImage.onload = imageLoadHandler;
grassTileImage.onerror = () => { console.error('Failed to load grass_tile.png'); imageLoadHandler(); };

// Load background music
const bgMusic = new Audio('music/Whiskers and Wonders.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.5;

// Input handling
document.addEventListener('keydown', (e) => {
    gameState.keys[e.key] = true;

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

    // Note: Exit house with E is handled in drawHouseInterior() when player is at the door

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

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (gameState.isInsideHouse) {
        // Inside house, use screen coordinates
        gameState.mousePos.x = e.clientX - rect.left;
        gameState.mousePos.y = e.clientY - rect.top;

        // Handle slider dragging
        if (gameState.isDraggingSlider) {
            const x = gameState.mousePos.x;
            const y = gameState.mousePos.y;
            handleFurnitureShopClick(x, y);
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
    }
});

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (gameState.isInsideHouse) {
        // Check if clicking on a slider
        const shopX = 100;
        const shopY = 100;
        const itemWidth = 120;
        const itemHeight = 120;
        const gap = 10;
        const columns = 2;
        const columnGap = 10;
        const itemsPerColumn = Math.ceil(gameState.furnitureShop.length / columns);

        for (let i = 0; i < gameState.furnitureShop.length; i++) {
            const furniture = gameState.furnitureShop[i];
            const column = Math.floor(i / itemsPerColumn);
            const row = i % itemsPerColumn;
            const itemX = shopX + column * (itemWidth + columnGap);
            const itemY = shopY + row * (itemHeight + gap);
            const sliderWidth = itemWidth - 20;
            const sliderHeight = 8;

            // Check color slider
            const colorSliderX = itemX + 10;
            const colorSliderY = itemY + 65;

            if (clickX >= colorSliderX && clickX <= colorSliderX + sliderWidth &&
                clickY >= colorSliderY - 5 && clickY <= colorSliderY + sliderHeight + 5) {
                gameState.isDraggingSlider = true;
                return;
            }

            // Check size slider
            const sizeSliderX = itemX + 10;
            const sizeSliderY = itemY + 90;

            if (clickX >= sizeSliderX && clickX <= sizeSliderX + sliderWidth &&
                clickY >= sizeSliderY - 5 && clickY <= sizeSliderY + sliderHeight + 5) {
                gameState.isDraggingSlider = true;
                return;
            }
        }

        // Check if clicking on placed furniture (but not on shop)
        // ONLY if we're not currently placing furniture from the shop
        if (!gameState.selectedFurnitureType) {
            const shopWidth = (itemWidth * columns) + columnGap + 20;
            const shopHeight = (itemHeight + gap) * itemsPerColumn + 50;
            if (clickX < shopX - 10 || clickX > shopX + shopWidth ||
                clickY < shopY - 40 || clickY > shopY + shopHeight) {
                const clickedFurniture = checkPlacedFurnitureClick(clickX, clickY);
                if (clickedFurniture) {
                    gameState.selectedPlacedFurniture = clickedFurniture;
                    gameState.isDraggingFurniture = true;
                }
            }
        }
    }
});

canvas.addEventListener('mouseup', (e) => {
    gameState.isDraggingSlider = false;
    gameState.isDraggingFurniture = false;
});

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

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
        // Outside - shoot magic
        if (gameState.player) {
            gameState.player.shootMagic(gameState.mousePos.x, gameState.mousePos.y);
        }
    }
});

// Start Game
function startGame() {
    console.log('Starting game...');

    document.getElementById('characterCreation').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';

    // Initialize game objects FIRST
    gameState.village = new Village();
    console.log('Village created');

    // Start player in center of village
    gameState.player = new Player(gameState.village.villageCenterX, gameState.village.villageCenterY);
    console.log('Player created at', gameState.player.x, gameState.player.y);

    // Start as cat
    gameState.player.isCat = true;

    // Spawn items
    spawnItems(100);

    // Spawn chests (LOTS in the huge forest)
    spawnChests(500);

    console.log('Game objects spawned');

    // Start game loop
    gameLoop();
    console.log('Game loop started');

    // Try to play background music (don't let this break the game)
    try {
        bgMusic.play().then(() => {
            console.log('Music playing');
        }).catch(err => {
            console.log('Music failed:', err);
            // Retry on next click
            canvas.addEventListener('click', function playRetry() {
                bgMusic.play().then(() => {
                    console.log('Music started on retry');
                }).catch(e => {}).finally(() => {
                    canvas.removeEventListener('click', playRetry);
                });
            }, { once: true });
        });
    } catch (e) {
        console.log('Music error:', e);
    }
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
        const x = 300 + Math.random() * (gameState.village.width - 600);
        const y = 300 + Math.random() * (gameState.village.height - 600);

        gameState.chests.push(new Chest(x, y));
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

    // Store player position in house coordinates - centered on canvas
    if (!gameState.playerHousePos) {
        gameState.playerHousePos = { x: canvas.width / 2, y: canvas.height / 2 };
    }
    gameState.player.houseX = gameState.playerHousePos.x;
    gameState.player.houseY = gameState.playerHousePos.y;
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
    // Define interior room dimensions - reduced height by 140px total
    const margin = 10; // Very small margin to maximize room size
    const roomWidth = canvas.width - (margin * 2);  // 1180px (1200 - 20)
    const roomHeight = canvas.height - (margin * 2) - 140; // 640px (800 - 20 - 140)
    const roomX = margin;  // Start at x=10
    const roomY = margin;  // Start at y=10
    const wallThickness = 35;

    // Update player movement in house
    if (gameState.player) {
        const prevX = gameState.player.houseX;
        const prevY = gameState.player.houseY;

        if (gameState.keys['ArrowUp']) gameState.player.houseY -= gameState.player.speed;
        if (gameState.keys['ArrowDown']) gameState.player.houseY += gameState.player.speed;
        if (gameState.keys['ArrowLeft']) gameState.player.houseX -= gameState.player.speed;
        if (gameState.keys['ArrowRight']) gameState.player.houseX += gameState.player.speed;

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

        // Check if player is in the door area at the bottom (exit zone)
        const doorLeft = roomX + roomWidth / 2 - 30;
        const doorRight = roomX + roomWidth / 2 + 30;
        const doorTop = roomY + roomHeight - wallThickness;

        // If player is near the door, show exit hint
        if (gameState.player.houseY + gameState.player.height >= doorTop - 20 &&
            gameState.player.houseX + gameState.player.width / 2 >= doorLeft &&
            gameState.player.houseX + gameState.player.width / 2 <= doorRight) {
            // Player is in door area - pressing E or down will exit
            if (gameState.keys['e'] || gameState.keys['E']) {
                exitHouse();
            }
        }
    }

    // Update companions in house
    for (let companion of gameState.companions) {
        if (!companion.houseX) {
            companion.houseX = gameState.player.houseX + 50;
            companion.houseY = gameState.player.houseY + 50;
        }

        const targetDist = 50 + gameState.companions.indexOf(companion) * 30;
        const dx = gameState.player.houseX - companion.houseX;
        const dy = gameState.player.houseY - companion.houseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > targetDist) {
            const angle = Math.atan2(dy, dx);
            companion.houseX += Math.cos(angle) * companion.speed;
            companion.houseY += Math.sin(angle) * companion.speed;
        }

        companion.bobOffset += 0.1;
    }

    // Clear canvas with dark background
    ctx.fillStyle = '#2d2d2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw room floor
    ctx.fillStyle = '#F5DEB3'; // Wooden floor
    ctx.fillRect(roomX, roomY, roomWidth, roomHeight);

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

    // Draw player
    if (gameState.player) {
        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(gameState.player.houseX + 24, gameState.player.houseY + 60, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw player sprite
        if (gameState.player.isCat) {
            if (catImage.complete) {
                ctx.drawImage(catImage, gameState.player.houseX, gameState.player.houseY, gameState.player.width, gameState.player.height);
            }
        } else {
            if (girlImage.complete) {
                ctx.drawImage(girlImage, gameState.player.houseX, gameState.player.houseY, gameState.player.width, gameState.player.height);
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
    const shopX = 100;
    const shopY = 100;
    const itemWidth = 120;
    const itemHeight = 120; // Increased to fit both sliders
    const gap = 10;
    const columns = 2;
    const columnGap = 10;

    // Calculate shop background size for 2 columns
    const itemsPerColumn = Math.ceil(gameState.furnitureShop.length / columns);
    const shopWidth = (itemWidth * columns) + columnGap + 20;
    const shopHeight = (itemHeight + gap) * itemsPerColumn + 50;

    // Shop background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(shopX - 10, shopY - 40, shopWidth, shopHeight);

    // Shop title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Furniture Shop', shopX, shopY - 15);

    // Draw shop items in 2 columns
    for (let i = 0; i < gameState.furnitureShop.length; i++) {
        const furniture = gameState.furnitureShop[i];
        const column = Math.floor(i / itemsPerColumn);
        const row = i % itemsPerColumn;
        const x = shopX + column * (itemWidth + columnGap);
        const y = shopY + row * (itemHeight + gap);

        // Item background
        const isSelected = gameState.selectedFurnitureType === furniture.type;
        ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x, y, itemWidth, itemHeight);

        // Get current hue for this furniture type
        const currentHue = gameState.furnitureHues[furniture.type] || 0;

        // Furniture preview with image and hue shift
        const furnitureImg = furnitureImages[furniture.type];
        if (furnitureImg && furnitureImg.complete) {
            ctx.save();
            ctx.filter = `hue-rotate(${currentHue}deg)`;
            ctx.drawImage(furnitureImg, x + 10, y + 10, furniture.width / 2, furniture.height / 2);
            ctx.restore();
        } else {
            // Fallback to colored rectangle
            const shiftedColor = shiftHue(furniture.color, currentHue);
            ctx.fillStyle = shiftedColor;
            ctx.fillRect(x + 10, y + 10, furniture.width / 2, furniture.height / 2);
        }

        // Furniture info
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(furniture.name, x + 60, y + 20);

        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('FREE', x + 60, y + 35);

        // Color slider
        const colorSliderX = x + 10;
        const colorSliderY = y + 65;
        const sliderWidth = itemWidth - 20;
        const sliderHeight = 8;

        // Slider track (rainbow gradient)
        const colorGradient = ctx.createLinearGradient(colorSliderX, colorSliderY, colorSliderX + sliderWidth, colorSliderY);
        for (let h = 0; h <= 360; h += 30) {
            colorGradient.addColorStop(h / 360, `hsl(${h}, 80%, 50%)`);
        }
        ctx.fillStyle = colorGradient;
        ctx.fillRect(colorSliderX, colorSliderY, sliderWidth, sliderHeight);

        // Color slider handle
        const colorHandleX = colorSliderX + (currentHue / 360) * sliderWidth;
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(colorHandleX, colorSliderY + sliderHeight / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Color label
        ctx.fillStyle = '#AAA';
        ctx.font = '9px Arial';
        ctx.fillText('Color', x + 10, y + 60);

        // Size slider
        const sizeSliderX = x + 10;
        const sizeSliderY = y + 90;
        const currentSize = gameState.furnitureSizes[furniture.type] || 1.0;

        // Size slider track (gradient from small to large)
        const sizeGradient = ctx.createLinearGradient(sizeSliderX, sizeSliderY, sizeSliderX + sliderWidth, sizeSliderY);
        sizeGradient.addColorStop(0, '#666');
        sizeGradient.addColorStop(1, '#FFF');
        ctx.fillStyle = sizeGradient;
        ctx.fillRect(sizeSliderX, sizeSliderY, sliderWidth, sliderHeight);

        // Size slider handle
        const sizeHandleX = sizeSliderX + ((currentSize - 0.5) / 1.5) * sliderWidth; // 0.5 to 2.0 range
        ctx.fillStyle = '#FFF';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sizeHandleX, sizeSliderY + sliderHeight / 2, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Size label
        ctx.fillStyle = '#AAA';
        ctx.font = '9px Arial';
        ctx.fillText('Size', x + 10, y + 85);
    }
}

// Handle furniture shop clicks
function handleFurnitureShopClick(clickX, clickY) {
    const shopX = 100;
    const shopY = 100;
    const itemWidth = 120;
    const itemHeight = 120;
    const gap = 10;
    const columns = 2;
    const columnGap = 10;
    const itemsPerColumn = Math.ceil(gameState.furnitureShop.length / columns);

    for (let i = 0; i < gameState.furnitureShop.length; i++) {
        const furniture = gameState.furnitureShop[i];
        const column = Math.floor(i / itemsPerColumn);
        const row = i % itemsPerColumn;
        const itemX = shopX + column * (itemWidth + columnGap);
        const itemY = shopY + row * (itemHeight + gap);

        // Check if clicking on color slider
        const colorSliderX = itemX + 10;
        const colorSliderY = itemY + 65;
        const sliderWidth = itemWidth - 20;
        const sliderHeight = 8;

        if (clickX >= colorSliderX && clickX <= colorSliderX + sliderWidth &&
            clickY >= colorSliderY - 5 && clickY <= colorSliderY + sliderHeight + 5) {
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
        const sizeSliderX = itemX + 10;
        const sizeSliderY = itemY + 90;

        if (clickX >= sizeSliderX && clickX <= sizeSliderX + sliderWidth &&
            clickY >= sizeSliderY - 5 && clickY <= sizeSliderY + sliderHeight + 5) {
            // Update size based on slider position (0.5 to 2.0 range)
            const size = 0.5 + ((clickX - sizeSliderX) / sliderWidth) * 1.5;
            gameState.furnitureSizes[furniture.type] = Math.max(0.5, Math.min(2.0, size));

            // If a placed furniture of this type is selected, update it too
            if (gameState.selectedPlacedFurniture && gameState.selectedPlacedFurniture.type === furniture.type) {
                gameState.selectedPlacedFurniture.size = size;
            }
            return true;
        }

        // Check if clicking on furniture item (but not on slider areas)
        // Only the top portion with the preview and name should select the item
        if (clickX >= itemX && clickX <= itemX + itemWidth &&
            clickY >= itemY && clickY <= itemY + 50) { // Only top 50px (preview and name area)
            // Only select from shop if not clicking sliders - and clear placed selection
            gameState.selectedFurnitureType = furniture.type;
            gameState.selectedPlacedFurniture = null;
            gameState.furnitureRotation = 0; // Reset rotation on selection
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

// Day/Night Cycle
function updateDayNightCycle(deltaTime) {
    gameState.gameTime += deltaTime;
    gameState.timeOfDay = (gameState.gameTime % CONFIG.DAY_LENGTH) / CONFIG.DAY_LENGTH;

    // Store previous night state
    gameState.previousIsNight = gameState.isNight;

    // 0-0.25 = Morning, 0.25-0.5 = Day, 0.5-0.75 = Evening, 0.75-1 = Night
    gameState.isNight = gameState.timeOfDay > 0.6 || gameState.timeOfDay < 0.1;

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
    const x = canvas.width - 80;  // Move to top-right area
    const y = 80;  // Lower to avoid UI overlap
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
}

// UI Updates
function updateUI() {
    if (!gameState.player) return;
    // No UI elements to update currently
}

// Game Loop
let lastTime = Date.now();

function gameLoop() {
    const now = Date.now();
    const deltaTime = now - lastTime;
    lastTime = now;

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

        // Apply day/night overlay
        if (gameState.isNight) {
            ctx.fillStyle = 'rgba(0, 0, 50, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw village
        if (gameState.village) {
            gameState.village.draw(ctx);
        }

        // Update and draw items
        for (let item of gameState.items) {
            item.update();
            item.draw(ctx);
        }

        // Update and draw chests
        for (let chest of gameState.chests) {
            chest.update();
            chest.draw(ctx);
        }

        // Update and draw player
        if (gameState.player) {
            gameState.player.update();
            gameState.player.draw(ctx);
        }

        // Update and draw companions
        for (let companion of gameState.companions) {
            companion.update();
            companion.draw(ctx);
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

        // Draw sun/moon indicator
        drawSunMoon(ctx);
    }

    // Update UI
    updateUI();

    requestAnimationFrame(gameLoop);
}
