// Configuración del canvas y del laberinto
const canvas = document.getElementById('mazeCanvas');
const ctx = canvas.getContext('2d');
let mazeSize;
let canvasSize;
let cellSize;
let maze = [];
let player = { x: 1, y: 1 };
let goal = { x: 0, y: 0 };
let animating = false;

// Configuración de las teclas de control
const keys = {
    ArrowUp: { dx: 0, dy: -1 },
    ArrowDown: { dx: 0, dy: 1 },
    ArrowLeft: { dx: -1, dy: 0 },
    ArrowRight: { dx: 1, dy: 0 }
};

// Colores actualizados
const colors = {
    wall: '#4a69bd',
    path: '#f0f8ff',
    player: '#e55039',
    goal: '#78e08f',
    solution: '#82ccdd',
    optimalPath: '#feca57'  // Nuevo color para el camino óptimo
};

function calculateCanvasSize() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    canvasSize = Math.min(screenWidth * 0.9, screenHeight * 0.7);
    canvas.width = canvasSize;
    canvas.height = canvasSize;
}

function resizeCanvas() {
    calculateCanvasSize();
    cellSize = canvasSize / mazeSize;
    drawMaze();
}

// Dibujar el laberinto en el canvas
function drawMaze() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < maze.length; i++) {
        for (let j = 0; j < maze[i].length; j++) {
            ctx.fillStyle = maze[i][j] === 1 ? colors.wall : colors.path;
            ctx.beginPath();
            ctx.roundRect(j * cellSize, i * cellSize, cellSize, cellSize, cellSize / 5);
            ctx.fill();
        }
    }

    drawGoal();
    drawPlayer();
}

// Dibujar al jugador
function drawPlayer() {
    ctx.fillStyle = colors.player;
    ctx.beginPath();
    ctx.arc(player.x * cellSize + cellSize / 2, player.y * cellSize + cellSize / 2, cellSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

// Dibujar la meta
function drawGoal() {
    ctx.fillStyle = colors.goal;
    ctx.beginPath();
    ctx.roundRect(goal.x * cellSize, goal.y * cellSize, cellSize, cellSize, cellSize / 5);
    ctx.fill();
}

// Función para mover al jugador
function movePlayer(dx, dy) {
    const newX = player.x + dx;
    const newY = player.y + dy;

    if (newX >= 0 && newX < mazeSize && newY >= 0 && newY < mazeSize && maze[newY][newX] === 0) {
        player.x = newX;
        player.y = newY;
        drawMaze();

        if (player.x === goal.x && player.y === goal.y) {
            setTimeout(() => {
                alert("¡Felicidades! Has llegado a la meta.");
                showMenu();
            }, 100);
        }
    }
}

// Detectar las teclas de movimiento
document.addEventListener('keydown', (event) => {
    if (keys[event.key]) {
        const { dx, dy } = keys[event.key];
        movePlayer(dx, dy);
    }
});

// Resolver el laberinto con animación (simulación de BFS)
function solveMaze() {
    if (animating) return;
    animating = true;

    let queue = [{ x: 1, y: 1, path: [] }];
    let visited = Array.from(Array(mazeSize), () => Array(mazeSize).fill(false));
    visited[1][1] = true;

    function animateSolutionStep() {
        if (queue.length === 0) {
            animating = false;
            return;
        }

        const { x, y, path } = queue.shift();

        if (x === goal.x && y === goal.y) {
            drawFinalPath([...path, { x, y }]);
            animating = false;
            return;
        }

        ctx.fillStyle = colors.solution;
        ctx.beginPath();
        ctx.roundRect(x * cellSize, y * cellSize, cellSize, cellSize, cellSize / 5);
        ctx.fill();

        for (const { dx, dy } of Object.values(keys)) {
            const nx = x + dx;
            const ny = y + dy;

            if (nx >= 0 && nx < mazeSize && ny >= 0 && ny < mazeSize && maze[ny][nx] === 0 && !visited[ny][nx]) {
                visited[ny][nx] = true;
                queue.push({ x: nx, y: ny, path: [...path, { x, y }] });
            }
        }

        drawPlayer();
        drawGoal();

        setTimeout(animateSolutionStep, 50);
    }

    animateSolutionStep();
}

// Función actualizada para dibujar el camino final
function drawFinalPath(path) {
    // Primero, redibujamos el laberinto para limpiar las celdas exploradas
    drawMaze();

    // Luego, dibujamos el camino óptimo
    for (const { x, y } of path) {
        ctx.fillStyle = colors.optimalPath;
        ctx.beginPath();
        ctx.roundRect(x * cellSize, y * cellSize, cellSize, cellSize, cellSize / 5);
        ctx.fill();
    }

    drawPlayer();
    drawGoal();
}

// Función para generar el laberinto
function generateMaze(size) {
    maze = Array.from({ length: size }, () => Array(size).fill(1));

    function carvePath(x, y) {
        maze[x][y] = 0;

        const directions = [[-2, 0], [2, 0], [0, -2], [0, 2]];
        directions.sort(() => Math.random() - 0.5);

        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const mx = x + dx / 2;
            const my = y + dy / 2;

            if (nx > 0 && ny > 0 && nx < size && ny < size && maze[nx][ny] === 1) {
                maze[mx][my] = 0;
                carvePath(nx, ny);
            }
        }
    }

    carvePath(1, 1);
    maze[1][1] = 0;
    goal = { x: size - 2, y: size - 2 };
    maze[goal.y][goal.x] = 0;
}

// Función para generar un nuevo laberinto sin cambiar el nivel
function generateNewMaze() {
    player = { x: 1, y: 1 };  // Reiniciar la posición del jugador
    generateMaze(mazeSize);   // Generar un nuevo laberinto del mismo tamaño
    resizeCanvas();           // Redimensionar el canvas
    drawMaze();               // Dibujar el nuevo laberinto
}

// Cambiar entre el menú y el juego
function showGame(level) {
    document.getElementById('menu').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    document.getElementById('level-title').textContent = `Nivel: ${level}`;
    generateMaze(mazeSize);
    player = { x: 1, y: 1 };
    resizeCanvas();
    drawMaze();
}

function showMenu() {
    document.getElementById('game').style.display = 'none';
    document.getElementById('menu').style.display = 'block';
}

// Cambiar el tamaño del laberinto dependiendo del nivel
function updateMazeSize(level) {
    switch (level) {
        case 'Fácil':
            mazeSize = 15;
            break;
        case 'Medio':
            mazeSize = 25;
            break;
        case 'Difícil':
            mazeSize = 35;
            break;
    }
    showGame(level);
}

// Detectar el nivel seleccionado en el menú
document.querySelectorAll('.level-btn').forEach(button => {
    button.addEventListener('click', () => updateMazeSize(button.textContent));
});

// Resolver el laberinto
document.getElementById('solve-maze').addEventListener('click', solveMaze);

// Listener para generar un nuevo laberinto
document.getElementById('new-maze').addEventListener('click', generateNewMaze);

// Volver al menú
document.getElementById('back-to-menu').addEventListener('click', showMenu);

// Añadir evento de redimensionamiento de ventana
window.addEventListener('resize', resizeCanvas);

window.addEventListener('load', () => {
    calculateCanvasSize();
    showMenu(); // Mostrar el menú en lugar del laberinto
});
