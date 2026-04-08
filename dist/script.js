const oggy = document.getElementById('oggy');
const cockroach = document.getElementById('cockroach');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.getElementById('game-over');
const levelUpToast = document.getElementById('level-up-toast');

let isJumping = false;
let score = 0;
let level = 1;
let gameLoop;
let isGameOver = false;
let obstacleSpeed = 5;
let cockroachPosition = 0; // initialize safely

// Handle Jumping
function jump() {
    if (isJumping || isGameOver) return;

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
        else jump();
    }
});

document.addEventListener('touchstart', (event) => {
    if (isGameOver) resetGame();
    else jump();
});

document.addEventListener('mousedown', (event) => {
    if (isGameOver) resetGame();
    else jump();
});

// Main Game Loop
const gameContainer = document.querySelector('.game-container');

function startGame() {
    cockroachPosition = gameContainer.clientWidth + 100; // spawn further out
    cockroach.style.right = 'auto'; // allow standard left positioning
    cockroach.style.left = cockroachPosition + 'px';

    gameLoop = setInterval(() => {
        if (isGameOver) return;

        // Move the cockroach
        cockroachPosition -= obstacleSpeed;
        cockroach.style.left = cockroachPosition + 'px';

        // Check if obstacle passed
        if (cockroachPosition < -100) { // wait until fully off screen
            cockroachPosition = gameContainer.clientWidth + (Math.random() * 200); // Randomize respawn slightly
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

    // EXTREMELY forgiving collision box for 6-year-old
    // Makes the cockroach "smaller" and oggy "smaller" logically
    const toleranceX = 35;
    const toleranceY = 25;

    if (
        oggyRect.right - toleranceX > cockroachRect.left + toleranceX &&
        oggyRect.left + toleranceX < cockroachRect.right - toleranceX &&
        oggyRect.bottom > cockroachRect.top + toleranceY
    ) {
        gameOver();
    }
}

function updateScore() {
    scoreDisplay.innerHTML = `Score: ${score} | Level: ${level}`;
}

function triggerLevelUp() {
    level++;
    obstacleSpeed += 1.5; // Increase speed slightly less abruptly
    updateScore();

    // Show toast message without pausing game
    levelUpToast.style.display = 'block';

    // Restart animation by re-triggering reflow
    levelUpToast.style.animation = 'none';
    levelUpToast.offsetHeight; /* trigger reflow */
    levelUpToast.style.animation = null;

    setTimeout(() => {
        levelUpToast.style.display = 'none';
    }, 2000);
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
