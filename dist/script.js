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

// Resize canvas to match wrapper
function resize() {
    const wrapper = document.querySelector('.game-wrapper');
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// --- Game Objects ---

// The Ground
const ground = {
    height: 100,
    y: 0,
    draw() {
        this.y = canvas.height - this.height;
        ctx.fillStyle = '#8B4513'; // Brown dirt
        ctx.fillRect(0, this.y, canvas.width, this.height);

        ctx.fillStyle = '#228B22'; // Green grass
        ctx.fillRect(0, this.y, canvas.width, 15);
    }
};

// Oggy Character (Player)
const oggy = {
    width: 60,
    height: 60,
    x: 80,
    y: 0,
    vy: 0,
    jump() {
        if (this.y === ground.y - this.height) { // Only jump if on the ground
            this.vy = JUMP_STRENGTH;
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
        ctx.font = '60px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // Draw emoji centered on logical coordinate
        ctx.fillText('🐱', this.x + this.width/2, this.y + this.height/2);
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
    }

    update() {
        this.x -= gameSpeed;
    }

    draw() {
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🪳', this.x + this.width/2, this.y + this.height/2);
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
    if (frames % Math.floor(100 * (6/gameSpeed)) === 0) {
        // More randomized spacing
        if (Math.random() > 0.3) {
            obstacles.push(new Obstacle());
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


// Initialize Game
oggy.y = canvas.height - 100 - oggy.height; // Set initial Y correctly based on ground
updateScoreUI();
animate();

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