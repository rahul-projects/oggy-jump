const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score-display');
const gameOverScreen = document.getElementById('game-over');
const levelUpToast = document.getElementById('level-up-toast');

// Game state
let frames = 0;
let score = 0;
let level = 1;
let isGameOver = false;
let gameSpeed = 6;
let animationId;

// Physics constants
const GRAVITY = 0.8;
const JUMP_STRENGTH = -15;

// Resize canvas to match wrapper safely
function resize() {
    const wrapper = document.querySelector('.game-wrapper');
    // On some desktop browsers, clientWidth might not be immediately available
    // Fallback to window dimensions if wrapper has no height
    canvas.width = wrapper.clientWidth || window.innerWidth || 800;
    canvas.height = wrapper.clientHeight || window.innerHeight || 600;
    
    // Adjust ground position when resizing
    // Make sure ground and oggy are defined before accessing them
    if (typeof ground !== 'undefined') {
        ground.y = canvas.height - ground.height;
    }
    if (typeof oggy !== 'undefined' && typeof ground !== 'undefined' && oggy.y > ground.y - oggy.height) {
        oggy.y = ground.y - oggy.height;
    }
}
window.addEventListener('resize', resize);

// --- Sound Effects (Web Audio API Synthesizer) ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'jump') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    } else if (type === 'score') {
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, now);
        oscillator.frequency.setValueAtTime(1200, now + 0.05);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    } else if (type === 'levelup') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);
        oscillator.frequency.linearRampToValueAtTime(1200, now + 0.2);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
    } else if (type === 'gameover') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
    }
}

// --- Load Assets ---
const oggyImage = new Image();
oggyImage.src = 'oggy.svg';

const cockroachImage = new Image();
cockroachImage.src = 'cockroach.svg';
const ratImage = new Image();
ratImage.src = 'rat.svg';
const spiderImage = new Image();
spiderImage.src = 'spider.svg';
const snakeImage = new Image();
snakeImage.src = 'snake.svg';

const obstacleImages = [cockroachImage, ratImage, spiderImage, snakeImage];

// Handle Character Selection
const charSelect = document.getElementById('char-select');
if (charSelect) {
    charSelect.addEventListener('change', (e) => {
        oggyImage.src = e.target.value;
    });
}

// --- Game Objects ---

// Level themes
const levelThemes = [
    { sky: 'linear-gradient(180deg, #A1C4FD 0%, #C2E9FB 100%)', dirt: '#8B4513', top: '#228B22' }, // Level 1: Day
    { sky: 'linear-gradient(180deg, #FF7E5F 0%, #FEB47B 100%)', dirt: '#5C3A21', top: '#8B4513' }, // Level 2: Sunset
    { sky: 'linear-gradient(180deg, #2B5876 0%, #4E4376 100%)', dirt: '#2F4F4F', top: '#556B2F' }, // Level 3: Twilight
    { sky: 'linear-gradient(180deg, #000428 0%, #004E92 100%)', dirt: '#1A1A1A', top: '#006400' }, // Level 4: Night
    { sky: 'linear-gradient(180deg, #DA4453 0%, #89216B 100%)', dirt: '#4A0E4E', top: '#800080' }  // Level 5: Alien
];

function getTheme() {
    const themeIndex = (level - 1) % levelThemes.length;
    return levelThemes[themeIndex];
}

function updateThemeUI() {
    const theme = getTheme();
    document.querySelector('.game-wrapper').style.background = theme.sky;
}

// The Ground
let ground = {
    height: 100,
    y: 0,
    draw() {
        this.y = canvas.height - this.height;
        const theme = getTheme();

        ctx.fillStyle = theme.dirt; // Dirt color based on theme
        ctx.fillRect(0, this.y, canvas.width, this.height);
        
        ctx.fillStyle = theme.top; // Grass/Top color based on theme
        ctx.fillRect(0, this.y, canvas.width, 15);

        // Add some pattern/lane effect based on frames to show movement
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for(let i=0; i<canvas.width; i+=40) {
            let offset = (i - (frames * gameSpeed * 0.5)) % 40;
            if(offset < 0) offset += 40;
            ctx.fillRect(offset, this.y, 20, 15);
        }
    }
};

// Oggy Character (Player)
let oggy = {
    width: 60,
    height: 60,
    x: 80,
    y: 0,
    vy: 0,
    jump() {
        if (this.y === ground.y - this.height) { // Only jump if on the ground
            this.vy = JUMP_STRENGTH;
            playSound('jump');
        }
    },
    update() {
        // Apply gravity
        this.vy += GRAVITY;
        this.y += this.vy;

        // Ground collision
        if (this.y + this.height >= ground.y) {
            this.y = ground.y - this.height;
            this.vy = 0;
        }
    },
    draw() {
        ctx.drawImage(oggyImage, this.x, this.y, this.width, this.height);
    }
};

// Obstacles Array
let obstacles = [];

class Obstacle {
    constructor() {
        this.width = 40;
        this.height = 40;
        this.x = canvas.width + Math.random() * 200; // Spawn offscreen
        this.y = ground.y - this.height;
        this.passed = false;

        // Pick an obstacle type based on the current level.
        // Higher levels unlock more obstacle types.
        let availableObstacles = Math.min(level, obstacleImages.length);
        let obsIndex = Math.floor(Math.random() * availableObstacles);
        this.image = obstacleImages[obsIndex];
    }

    update() {
        this.x -= gameSpeed;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }
}

// Background Elements (Clouds, Sun)
const backgroundElements = [
    { type: 'sun', x: canvas.width - 150, y: 100, size: 80, speed: 0.1, char: '☀️' },
    { type: 'cloud', x: 200, y: 150, size: 60, speed: 0.5, char: '☁️' },
    { type: 'cloud', x: 600, y: 100, size: 50, speed: 0.3, char: '☁️' },
    { type: 'rainbow', x: 100, y: 100, size: 100, speed: 0.2, char: '🌈' }
];

function drawBackground() {
    backgroundElements.forEach(el => {
        el.x -= el.speed;
        if (el.x < -100) {
            el.x = canvas.width + 100;
        }
        ctx.font = `${el.size}px Arial`;
        ctx.fillText(el.char, el.x, el.y);
    });
}

// --- Main Game Logic ---

function handleObstacles() {
    // Spawn new obstacles
    // Add a grace period at the beginning (e.g., first 100 frames)
    if (frames > 100) {
        // Slow start: base spawn rate is lower initially, speeds up later
        let spawnRate = Math.floor(120 * (6/gameSpeed));

        // Less frequent obstacles initially, getting more frequent as speed increases
        if (frames % spawnRate === 0) {
            // More randomized spacing, easier at start
            let spawnChance = 0.4 + (level * 0.05); // increases with level
            if (spawnChance > 0.8) spawnChance = 0.8; // Cap at 80%

            if (Math.random() < spawnChance) {
                // Ensure min distance between obstacles
                let canSpawn = true;
                if (obstacles.length > 0) {
                    let lastObs = obstacles[obstacles.length - 1];
                    // Make sure there is enough gap (e.g., at least 250px)
                    if (canvas.width - lastObs.x < 250) {
                        canSpawn = false;
                    }
                }

                if (canSpawn) {
                    obstacles.push(new Obstacle());
                }
            }
        }
    }

    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.update();
        obs.draw();

        // Kid-friendly collision logic (bounding box with generous tolerance)
        const toleranceX = 15;
        const toleranceY = 15;

        if (
            oggy.x + toleranceX < obs.x + obs.width - toleranceX &&
            oggy.x + oggy.width - toleranceX > obs.x + toleranceX &&
            oggy.y + toleranceX < obs.y + obs.height - toleranceY &&
            oggy.y + oggy.height - toleranceX > obs.y + toleranceY
        ) {
            triggerGameOver();
        }

        // Scoring
        if (obs.x + obs.width < oggy.x && !obs.passed) {
            score += 10;
            obs.passed = true;
            playSound('score');
            checkLevelUp();
            updateScoreUI();
        }
    }

    // Remove offscreen obstacles
    obstacles = obstacles.filter(obs => obs.x + obs.width > -50);
}

function updateScoreUI() {
    scoreDisplay.innerHTML = `Score: ${score} | Level: ${level}`;
}

function checkLevelUp() {
    if (score > 0 && score % 100 === 0) {
        level++;
        gameSpeed += 1.5; // Increase speed
        updateScoreUI();
        playSound('levelup');
        updateThemeUI();
        
        // Show Toast
        levelUpToast.style.display = 'block';
        levelUpToast.style.animation = 'none';
        levelUpToast.offsetHeight; // reflow
        levelUpToast.style.animation = null; 

        setTimeout(() => {
            levelUpToast.style.display = 'none';
        }, 2000);
    }
}

function triggerGameOver() {
    isGameOver = true;
    playSound('gameover');
    gameOverScreen.style.display = 'block';
}

function resetGame() {
    isGameOver = false;
    score = 0;
    level = 1;
    gameSpeed = 6;
    frames = 0;
    obstacles = [];
    oggy.y = ground.y - oggy.height; // Place on ground
    oggy.vy = 0;
    gameOverScreen.style.display = 'none';
    updateThemeUI();
    updateScoreUI();
    animate(); // Restart loop
}

function animate() {
    if (isGameOver) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    ground.draw();
    
    oggy.update();
    oggy.draw();
    
    handleObstacles();

    frames++;
    animationId = requestAnimationFrame(animate);
}

// --- Input Handling ---

function handleInput() {
    if (isGameOver) {
        resetGame();
    } else {
        oggy.jump();
    }
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault(); // Stop scrolling
        handleInput();
    }
});
document.addEventListener('mousedown', handleInput);
document.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Stop scrolling
    handleInput();
}, { passive: false });


// Initialize Game Safely once DOM is fully loaded and sized
window.addEventListener('load', () => {
    resize(); // Force a resize check when everything is loaded
    oggy.y = canvas.height - 100 - oggy.height; // Set initial Y correctly based on ground
    updateThemeUI();
    updateScoreUI();
    animate();
});

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}