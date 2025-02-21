// Game elements
const scoreDisplay = document.getElementById('score');
const bestScoreDisplay = document.getElementById('best-score');
const playerNameInput = document.getElementById('player-name');
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const startGameBtn = document.getElementById('start-game');
const currentPlayerDisplay = document.getElementById('current-player');
const gridContainer = document.querySelector('.grid-container');
const dialogOverlay = document.getElementById('gameOverDialog');
const dialogScore = document.getElementById('dialogScore').querySelector('span');
const dialogMessage = document.getElementById('dialogMessage');
const dialogTitle = document.getElementById('dialogTitle');
const playAgainBtn = document.getElementById('playAgain');
const dialogQuitBtn = document.getElementById('dialogQuit');
const quitBtn = document.getElementById('quit');
const highScoresList = document.getElementById('high-scores-list');
const restartButton = document.getElementById('restart');

// Game state
let score = 0;
let bestScore = 0;
let grid = [];
let playerName = '';
let touchStartX = null;
let touchStartY = null;
let mergedPositions = [];

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    setupWelcomeScreen();
    loadBestScore();
    loadHighScores(); // Load high scores immediately for welcome screen
});

// Event listeners for keyboard and touch
document.addEventListener('keydown', handleKeyPress);
document.addEventListener('touchstart', handleTouchStart);
document.addEventListener('touchmove', handleTouchMove);
document.addEventListener('touchend', handleTouchEnd);

function handleKeyPress(event) {
    if (!gameScreen.style.display || gameScreen.style.display === 'none') return;
    
    switch(event.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            event.preventDefault();
            moveTiles('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            event.preventDefault();
            moveTiles('right');
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            event.preventDefault();
            moveTiles('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            event.preventDefault();
            moveTiles('down');
            break;
    }
}

function handleTouchStart(event) {
    if (!gameScreen.style.display || gameScreen.style.display === 'none') return;
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
}

function handleTouchMove(event) {
    if (!touchStartX || !touchStartY) return;
    event.preventDefault();
}

function handleTouchEnd(event) {
    if (!touchStartX || !touchStartY) return;
    
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    const minSwipeDistance = 30;
    
    if (Math.abs(deltaX) > minSwipeDistance || Math.abs(deltaY) > minSwipeDistance) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            moveTiles(deltaX > 0 ? 'right' : 'left');
        } else {
            moveTiles(deltaY > 0 ? 'down' : 'up');
        }
    }
    
    touchStartX = null;
    touchStartY = null;
}

function initGame() {
    score = 0;
    scoreDisplay.textContent = '0';
    grid = Array(4).fill().map(() => Array(4).fill(0));
    
    // Clear and create grid cells
    gridContainer.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            const span = document.createElement('span');
            tile.appendChild(span);
            gridContainer.appendChild(tile);
        }
    }
    
    // Add initial tiles
    addNewTile();
    addNewTile();
    updateGrid();
}

function addNewTile() {
    const emptyCells = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] === 0) {
                emptyCells.push({i, j});
            }
        }
    }
    
    if (emptyCells.length > 0) {
        const {i, j} = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        grid[i][j] = Math.random() < 0.9 ? 2 : 4;
        
        // Update grid first
        updateGrid();
        
        // Then add the new-tile animation
        setTimeout(() => {
            const tiles = document.querySelectorAll('.tile');
            const newTile = tiles[i * 4 + j];
            if (newTile && grid[i][j] !== 0) {
                newTile.classList.add('new-tile');
            }
        }, 50);
    }
}

function updateGrid() {
    const tiles = document.querySelectorAll('.tile');
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const value = grid[i][j];
            const tile = tiles[i * 4 + j];
            const span = tile.querySelector('span');
            
            // Clear any existing animations
            tile.classList.remove('merge-animation', 'new-tile');
            
            if (value === 0) {
                span.textContent = '';
                tile.className = 'tile';
            } else {
                span.textContent = value;
                tile.className = `tile value-${value}`;
            }
        }
    }
}

function moveTiles(direction) {
    let moved = false;
    mergedPositions = []; // Reset merged positions
    const oldGrid = grid.map(row => [...row]);
    
    // Helper function to move and merge tiles in a row
    function moveRow(row, rowIndex) {
        // Remove zeros and create new array
        let newRow = row.filter(cell => cell !== 0);
        let mergedInThisRow = new Set();
        let mergeInfo = [];
        
        // Merge adjacent equal numbers
        for (let i = 0; i < newRow.length - 1; i++) {
            if (newRow[i] === newRow[i + 1] && !mergedInThisRow.has(i)) {
                const mergedValue = newRow[i] * 2;
                newRow[i] = mergedValue;
                score += mergedValue;
                scoreDisplay.textContent = score;
                mergedInThisRow.add(i);
                mergeInfo.push({pos: i, value: mergedValue});
                newRow.splice(i + 1, 1);
            }
        }
        
        // Add zeros to the end
        while (newRow.length < 4) {
            newRow.push(0);
        }
        
        return { newRow, mergeInfo };
    }
    
    // Process grid based on direction
    if (direction === 'left' || direction === 'right') {
        for (let i = 0; i < 4; i++) {
            let row = [...grid[i]];
            let originalRow = [...row];
            if (direction === 'right') row.reverse();
            
            let { newRow, mergeInfo } = moveRow(row, i);
            
            if (direction === 'right') {
                newRow.reverse();
                // Adjust merge positions for right direction
                mergeInfo = mergeInfo.map(info => ({
                    pos: 3 - info.pos,
                    value: info.value
                }));
            }
            
            // Check if anything moved or merged
            if (!arraysEqual(originalRow, newRow)) {
                moved = true;
                // Record merged positions
                mergeInfo.forEach(({pos, value}) => {
                    mergedPositions.push({
                        row: i,
                        col: pos,
                        value: value
                    });
                });
            }
            
            grid[i] = newRow;
        }
    } else {
        for (let j = 0; j < 4; j++) {
            let column = grid.map(row => row[j]);
            let originalColumn = [...column];
            if (direction === 'down') column.reverse();
            
            let { newRow: newColumn, mergeInfo } = moveRow(column, j);
            
            if (direction === 'down') {
                newColumn.reverse();
                // Adjust merge positions for down direction
                mergeInfo = mergeInfo.map(info => ({
                    pos: 3 - info.pos,
                    value: info.value
                }));
            }
            
            // Check if anything moved or merged
            if (!arraysEqual(originalColumn, newColumn)) {
                moved = true;
                // Record merged positions
                mergeInfo.forEach(({pos, value}) => {
                    mergedPositions.push({
                        row: pos,
                        col: j,
                        value: value
                    });
                });
            }
            
            for (let i = 0; i < 4; i++) {
                grid[i][j] = newColumn[i];
            }
        }
    }
    
    // Update the grid first
    updateGrid();
    
    // Apply merge animations with a delay
    if (moved) {
        setTimeout(() => {
            const tiles = document.querySelectorAll('.tile');
            mergedPositions.forEach(({row, col, value}) => {
                const tileIndex = row * 4 + col;
                const tile = tiles[tileIndex];
                const tileValue = grid[row][col];
                if (tile && tileValue === value && tileValue !== 0) {
                    tile.classList.add('merge-animation');
                    setTimeout(() => {
                        tile.classList.remove('merge-animation');
                    }, 300);
                }
            });
            
            // Add new tile after merge animations
            setTimeout(() => {
                addNewTile();
                saveBestScore();
                
                if (!canMove()) {
                    showGameOverDialog();
                }
            }, 350);
        }, 50);
    }
}

function canMove() {
    // Check for empty cells
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] === 0) return true;
            
            // Check right neighbor
            if (j < 3 && grid[i][j] === grid[i][j + 1]) return true;
            
            // Check bottom neighbor
            if (i < 3 && grid[i][j] === grid[i + 1][j]) return true;
        }
    }
    return false;
}

function arraysEqual(a, b) {
    return a.length === b.length && a.every((val, index) => val === b[index]);
}

function setupWelcomeScreen() {
    // Check for saved player
    const savedPlayerName = localStorage.getItem('playerName');
    if (savedPlayerName) {
        playerName = savedPlayerName;
        playerNameInput.value = playerName;
        loadBestScore(); // Load best score for this player
    }

    // Enable/disable start button based on name
    function updateStartButton() {
        const name = playerNameInput.value.trim();
        startGameBtn.disabled = name.length < 3;
    }
    updateStartButton();

    // Player name input handler
    playerNameInput.addEventListener('input', () => {
        updateStartButton();
    });

    // Start game button handler
    startGameBtn.addEventListener('click', () => {
        playerName = playerNameInput.value.trim();
        localStorage.setItem('playerName', playerName);
        
        // Show current player name
        currentPlayerDisplay.textContent = playerName;
        
        // Switch screens
        welcomeScreen.style.display = 'none';
        gameScreen.style.display = 'flex';
        
        // Load best score for this player
        loadBestScore();
        
        // Initialize game
        initGame();
    }, { once: true });
}

async function displayGameOverDialog(isQuit) {
    dialogOverlay.style.display = 'flex';
    dialogScore.textContent = score;
    
    // Save best score if needed
    saveBestScore();
    
    // Load current high scores to check if player made it to hall of fame
    const scores = await loadHighScores();
    const lowestScore = scores.length >= 3 ? scores[2].score : 0;
    const madeHallOfFame = score > lowestScore || scores.length < 3;
    
    if (isQuit) {
        dialogTitle.textContent = 'Game Over!';
        if (score > 0 && madeHallOfFame) {
            dialogMessage.textContent = '🎉 Congratulations! You made it to the Hall of Fame! Thanks for playing!';
        } else {
            dialogMessage.textContent = 'Thanks for playing!';
        }
    } else {
        dialogTitle.textContent = 'Game Over!';
        if (score > 0 && madeHallOfFame) {
            dialogMessage.textContent = '🎉 Congratulations! You made it to the Hall of Fame!';
        } else {
            dialogMessage.textContent = 'No more moves available.';
        }
    }
    
    // Add animation to dialog
    const dialog = dialogOverlay.querySelector('.dialog');
    dialog.classList.add('animate__animated', 'animate__zoomIn');
}

function loadBestScore() {
    const savedBestScore = localStorage.getItem(`bestScore_${playerName}`);
    if (savedBestScore) {
        bestScore = parseInt(savedBestScore);
        bestScoreDisplay.textContent = bestScore;
    }
}

function saveBestScore() {
    if (score > bestScore) {
        bestScore = score;
        bestScoreDisplay.textContent = bestScore;
        localStorage.setItem(`bestScore_${playerName}`, bestScore);
    }
}

async function loadHighScores() {
    try {
        const response = await fetch('/api/scores');
        if (!response.ok) {
            throw new Error('Failed to fetch high scores');
        }
        const scores = await response.json();
        
        // Update both welcome screen and dialog high scores
        updateHighScoresList(scores, 'welcome-high-scores');
        updateHighScoresList(scores, 'dialog-high-scores');

        // Return scores for checking hall of fame status
        return scores;
    } catch (error) {
        console.error('Error loading high scores:', error);
        const errorMessage = '<li>Unable to load scores</li>';
        document.getElementById('welcome-high-scores').innerHTML = errorMessage;
        document.getElementById('dialog-high-scores').innerHTML = errorMessage;
        return [];
    }
}

function updateHighScoresList(scores, listId) {
    const highScoresList = document.getElementById(listId);
    if (!highScoresList) {
        console.error(`Element with id ${listId} not found`);
        return;
    }
    
    highScoresList.innerHTML = '';
    
    if (!scores || scores.length === 0) {
        highScoresList.innerHTML = '<li>No scores yet - be the first!</li>';
        return;
    }
    
    // Sort scores by highest first
    scores.sort((a, b) => b.score - a.score);
    
    // Take top 3 scores
    const topScores = scores.slice(0, 3);
    
    // Create medal emojis for top 3
    const medals = ['🥇', '🥈', '🥉'];
    
    topScores.forEach((score, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${medals[index]} ${score.player_name}: ${score.score.toLocaleString()}`;
        
        // Add animation class
        li.classList.add('animate__animated', 'animate__fadeIn');
        li.style.animationDelay = `${index * 0.2}s`;
        
        highScoresList.appendChild(li);
    });
}

function handleQuit() {
    showGameOverDialog(true);
}

function handlePlayAgain() {
    dialogOverlay.style.display = 'none';
    initGame();
}

function handleDialogQuit() {
    dialogOverlay.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    loadHighScores(); // Refresh high scores when returning to welcome screen
}

function handleDialogQuit() {
    dialogOverlay.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    loadHighScores(); // Refresh high scores when returning to welcome screen
}

function showGameOverDialog(isQuit = false) {
    if (score > 0) {
        // Save score before showing dialog
        saveScore().then(() => {
            displayGameOverDialog(isQuit);
        });
    } else {
        displayGameOverDialog(isQuit);
    }
}

async function saveScore() {
    if (!playerName || score === 0) return;
    
    try {
        console.log('Saving score:', { player_name: playerName, score: score });
        const response = await fetch('/api/scores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_name: playerName,
                score: score
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save score');
        }

        // Reload high scores after saving
        await loadHighScores();
    } catch (error) {
        console.error('Error saving score:', error);
    }
}

// Button event listeners
playAgainBtn.addEventListener('click', () => {
    dialogOverlay.style.display = 'none';
    initGame();
});

dialogQuitBtn.addEventListener('click', () => {
    dialogOverlay.style.display = 'none';
    welcomeScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    loadHighScores(); // Refresh high scores when returning to welcome screen
});

quitBtn.addEventListener('click', () => {
    // Always save score before quitting if it's greater than 0
    if (score > 0) {
        saveScore().then(() => {
            showGameOverDialog(true);
        });
    } else {
        showGameOverDialog(true);
    }
});

// Restart the game
restartButton.addEventListener('click', initGame);

// Start the game and load high scores
loadHighScores();
