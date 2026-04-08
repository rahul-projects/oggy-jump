const oggy = document.getElementById('oggy');
const cockroach = document.getElementById('cockroach');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const levelUpScreen = document.getElementById('level-up');

let isJumping = false;
let score = 0;
let level = 1;
let gameLoop;
let isGameOver = false;
let isLevelUp = false;
let obstacleSpeed = 5;
let cockroachPosition = window.innerWidth;

// Handle Jumping
function jump() {
    if (isJumping || isGameOver || isLevelUp) return;

    isJumping = true;
    oggy.classList.add('animate-jump');

    setTimeout(() => {
        oggy.classList.remove('animate-jump');
        isJumping = false;
    }, 600); // Match animation duration in CSS
}

// Event Listeners for Jump
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        if (isGameOver) resetGame();
        else if (isLevelUp) continueLevel();
        else jump();
    }
});

document.addEventListener('touchstart', (event) => {
    if (isGameOver) resetGame();
    else if (isLevelUp) continueLevel();
    else jump();
});

document.addEventListener('mousedown', (event) => {
    if (isGameOver) resetGame();
    else if (isLevelUp) continueLevel();
    else jump();
});

// Main Game Loop
const gameContainer = document.querySelector('.game-container');

function startGame() {
    cockroachPosition = gameContainer.clientWidth;
    cockroach.style.right = '0px';
    cockroach.style.left = cockroachPosition + 'px';

    gameLoop = setInterval(() => {
        if (isGameOver || isLevelUp) return;

        // Move the cockroach
        cockroachPosition -= obstacleSpeed;
        cockroach.style.left = cockroachPosition + 'px';

        // Check if obstacle passed
        if (cockroachPosition < -50) {
            cockroachPosition = gameContainer.clientWidth;
            score += 10;
            updateScore();

            // Check Level Up
            if (score > 0 && score % 100 === 0) {
                triggerLevelUp();
            }
        }

        checkCollision();

    }, 20); // 50 FPS
}

function checkCollision() {
    // Get bounding boxes
    const oggyRect = oggy.getBoundingClientRect();
    const cockroachRect = cockroach.getBoundingClientRect();

    // Adjust collision box to be a bit forgiving for kids
    const collisionToleranceX = 20;
    const collisionToleranceY = 10;

    if (
        oggyRect.right - collisionToleranceX > cockroachRect.left &&
        oggyRect.left + collisionToleranceX < cockroachRect.right &&
        oggyRect.bottom > cockroachRect.top + collisionToleranceY
    ) {
        gameOver();
    }
}

function updateScore() {
    scoreDisplay.innerHTML = `Score: ${score} | Level: ${level}`;
}

function triggerLevelUp() {
    isLevelUp = true;
    levelUpScreen.style.display = 'block';
    cockroach.style.display = 'none'; // hide temporarily
    level++;
    obstacleSpeed += 2; // Increase speed
}

function continueLevel() {
    isLevelUp = false;
    levelUpScreen.style.display = 'none';
    cockroach.style.display = 'block';
    cockroachPosition = gameContainer.clientWidth;
    updateScore();
}

function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    gameOverScreen.style.display = 'block';
}

function resetGame() {
    isGameOver = false;
    score = 0;
    level = 1;
    obstacleSpeed = 5; // Reset speed
    gameOverScreen.style.display = 'none';
    updateScore();
    clearInterval(gameLoop);
    startGame();
}

// Start the game initially
startGame();
