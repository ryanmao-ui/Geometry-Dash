const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const restartBtn = document.getElementById('restart-btn');

const GRAVITY = 0.8;
const JUMP_VELOCITY = -11;
const PLAYER_SIZE = 40;
const OBSTACLE_WIDTH = 30;
const OBSTACLE_HEIGHT = 60;
const SPIKE_SIZE = 30;
const GROUND_HEIGHT = 60;
const GAME_SPEED = 6;

let player, obstacles, spikes, score, isGameOver, animationId;

// Player object
function createPlayer() {
    return {
        x: 100,
        y: canvas.height - GROUND_HEIGHT - PLAYER_SIZE,
        width: PLAYER_SIZE,
        height: PLAYER_SIZE,
        velocityY: 0,
        isJumping: false
    };
}

// Obstacle factory
function createObstacle(x) {
    return {
        x: x,
        y: canvas.height - GROUND_HEIGHT - OBSTACLE_HEIGHT,
        width: OBSTACLE_WIDTH,
        height: OBSTACLE_HEIGHT,
        type: 'block'
    };
}

// Spike factory
function createSpike(x) {
    return {
        x: x,
        y: canvas.height - GROUND_HEIGHT - SPIKE_SIZE,
        size: SPIKE_SIZE,
        type: 'spike'
    };
}

// Reset game
function resetGame() {
    player = createPlayer();
    obstacles = [];
    spikes = [];
    score = 0;
    isGameOver = false;
    restartBtn.style.display = 'none';
    scoreDisplay.textContent = 'Score: 0';
    spawnInitialObstacles();
    gameLoop();
}

// Initial obstacles
function spawnInitialObstacles() {
    let x = 800;
    for (let i = 0; i < 5; i++) {
        if (i % 2 === 0) {
            obstacles.push(createObstacle(x));
        } else {
            spikes.push(createSpike(x));
        }
        x += 300 + Math.random() * 100;
    }
}

// Game loop
function gameLoop() {
    animationId = requestAnimationFrame(gameLoop);
    update();
    draw();
}

// Update game objects
function update() {
    // Player movement
    if (!isGameOver) {
        player.velocityY += GRAVITY;
        player.y += player.velocityY;
        if (player.y > canvas.height - GROUND_HEIGHT - PLAYER_SIZE) {
            player.y = canvas.height - GROUND_HEIGHT - PLAYER_SIZE;
            player.velocityY = 0;
            player.isJumping = false;
        }

        // Move obstacles and spikes
        obstacles.forEach(ob => ob.x -= GAME_SPEED);
        spikes.forEach(sp => sp.x -= GAME_SPEED);

        // Remove off-screen
        obstacles = obstacles.filter(ob => ob.x + ob.width > 0);
        spikes = spikes.filter(sp => sp.x + sp.size > 0);

        // Spawn new obstacles/spikes
        let lastX = Math.max(
            obstacles.length ? obstacles[obstacles.length - 1].x : 0,
            spikes.length ? spikes[spikes.length - 1].x : 0
        );
        if (lastX < 600) {
            const rand = Math.random();
            const newX = 800 + Math.random() * 100;
            if (rand < 0.5) {
                obstacles.push(createObstacle(newX));
            } else {
                spikes.push(createSpike(newX));
            }
        }

        // Collision Detection
        obstacles.forEach(ob => {
            if (checkCollision(player, ob)) endGame();
        });

        spikes.forEach(sp => {
            if (checkSpikeCollision(player, sp)) endGame();
        });

        // Score
        obstacles.forEach(ob => {
            if (!ob.passed && ob.x + ob.width < player.x) {
                score += 5;
                ob.passed = true;
            }
        });
        spikes.forEach(sp => {
            if (!sp.passed && sp.x + sp.size < player.x) {
                score += 10;
                sp.passed = true;
            }
        });
        scoreDisplay.textContent = 'Score: ' + score;
    }
}

// Draw game objects
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    ctx.fillStyle = '#222';
    ctx.fillRect(0, canvas.height - GROUND_HEIGHT, canvas.width, GROUND_HEIGHT);

    // Draw player (square with glow)
    ctx.save();
    ctx.shadowColor = '#43cea2';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#f7b731';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.restore();

    // Draw obstacles
    ctx.fillStyle = '#2c5364';
    obstacles.forEach(ob => {
        ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
        // Add a top highlight
        ctx.fillStyle = '#43cea2';
        ctx.fillRect(ob.x, ob.y, ob.width, 5);
        ctx.fillStyle = '#2c5364';
    });

    // Draw spikes (triangles)
    spikes.forEach(sp => {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sp.x, sp.y + sp.size);
        ctx.lineTo(sp.x + sp.size / 2, sp.y);
        ctx.lineTo(sp.x + sp.size, sp.y + sp.size);
        ctx.closePath();
        ctx.fillStyle = '#e74c3c';
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();
    });

    // Game Over
    if (isGameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '48px Segoe UI, Arial';
        ctx.fillText('Game Over!', canvas.width / 2 - 140, canvas.height / 2 - 30);
        ctx.font = '32px Segoe UI, Arial';
        ctx.fillText('Score: ' + score, canvas.width / 2 - 60, canvas.height / 2 + 20);
        ctx.font = '24px Segoe UI, Arial';
        ctx.fillText('Press Restart to play again', canvas.width / 2 - 110, canvas.height / 2 + 60);
    }
}

// Collision detection (rectangle)
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// Collision detection (triangle spike)
function checkSpikeCollision(player, spike) {
    // Approximate using bounding box for simplicity
    return player.x < spike.x + spike.size &&
           player.x + player.width > spike.x &&
           player.y < spike.y + spike.size &&
           player.y + player.height > spike.y;
}

// Game over
function endGame() {
    isGameOver = true;
    cancelAnimationFrame(animationId);
    restartBtn.style.display = 'inline-block';
}

// Controls
document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.key === 'ArrowUp') {
        if (!player.isJumping && !isGameOver) {
            player.velocityY = JUMP_VELOCITY;
            player.isJumping = true;
        }
    }
});

restartBtn.addEventListener('click', resetGame);

// Initial start
resetGame();
