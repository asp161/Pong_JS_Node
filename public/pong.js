'use strict'

// Constantes básicas del juego
const FRAME_PER_SECOND = 50;

const NUM_BALLS = 5;

const BG_COLOR = 'BLACK';

const FONT_COLOR = 'WHITE';
const FONT_FAMILY = 'impact';
const FONT_SIZE = '45px';

const NET_COLOR = 'WHITE';
const NET_WIDTH = 4;
const NET_HEIGHT = 10;
const NET_PADDING = 15;

const PADDLE_RIGHT_COLOR = 'WHITE';
const PADDLE_LEFT_COLOR = 'WHITE';
const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 100;

const BALL_COLOR = 'WHITE';
const BALL_RADIUS = 10;
const BALL_DELTA_VELOCITY = 0.5;
const BALL_VELOCITY = 5;

const gameStateEnum = {
    SYNC: 0,
    PLAY: 1,
    PAUSE: 2,
    END: 3,
};


//-----------------------------------------------------------------------------------
// CLIENTE DEL NETWORK ENGINE
//-----------------------------------------------------------------------------------
var socket;

function initServerConnection() {
    // Iniciamos la conexion con el Motor de Red
    socket = io();

    //Solicitamos jugador
    socket.emit('new player');

    // Indicamos cómo atender una nueva conexión
    socket.on('connect', () => {
        console.log(`Conexión de ${socket.id}`);
    });

    // Indicamos cómo actualizar el estado del juego
    socket.on('state', update);
}



//-----------------------------------------------------------------------------------
// MOTOR DE JUEGO
//-----------------------------------------------------------------------------------


const CANVAS_WIDTH = cvs.width;
const CANVAS_HEIGHT = cvs.height;


// Declaramos los objetos del juego
var gameState = gameStateEnum.SYNC;
var players = {};
var ball = {};

// GENERIC HELPERS -------------------------------------------------------------------

function getRandomDirection() {
    return Math.floor(Math.random() * 2) === 0 ? -1 : 1;
}

function update(globalGameState) {
    players = globalGameState.players;
    ball = globalGameState.ball;
    gameState = globalGameState.gameState;
}

function render() {
    if (gameState === gameStateEnum.PAUSE) {
        drawText('PAUSA', CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, 'GREEN');
        return;
    }
    if (gameState === gameStateEnum.SYNC) {
        drawText('Esperando rival...', CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, 'GREEN');
        return;
    }
    drawBoard();
    drawScore(players);
    for (let id in players) {
        drawPaddle(players[id]);
    }
    drawBall(ball);


    // Si ha ganado alguien
    if (gameState === gameStateEnum.END) {
        drawText('GAME OVER', CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2, 'BLUE');
        return;
    }

}

function next() {
    // Si ha terminado la partida
    if (gameState === gameStateEnum.END) {
        console.log('GAME OVER');
        // Detenemos el bucle de juego
        stopGameLoop();
        // Cerramos la conexión con el servidor de juegos
        socket.disconnect();
    }
}


// HELPERS para gestionar el bucle de juego ------------------------------------------
var gameLoopId;         // Identificador del bucle de juego
function gameLoop() {
    render();
    next();
}

function initGameLoop() {
    gameLoopId = setInterval(gameLoop, 1000 / FRAME_PER_SECOND);
}

function stopGameLoop() {
    clearInterval(gameLoopId);
}

//Inicialización del motor de juego ----------------------

//Activacion de las entradas del cliente -----------------------
function initPaddleMovements() {
    cvs.addEventListener("mousemove", (event) => {
        const rect = cvs.getBoundingClientRect();
        const localPlayer = players[socket.id];

        localPlayer.y = event.clientY - rect.top - localPlayer.height / 2;
        socket.emit('move player', localPlayer.y);
    });
}

function init() {
    initServerConnection();
    drawBoard();
    initPaddleMovements();
    initGameLoop();
}

init();