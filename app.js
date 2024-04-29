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

// ---------------------------------------------------------------------
// SERVIDOR DE JUEGO
// ---------------------------------------------------------------------

// Incluimos las bibliotecas necesarias para los servidores

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const port = process.env.port || 3000;

// SERVIDOR WEB ---------------------------------------------------

// Iniciamos un servidor HTTP para proporcionar la interfaz del juego (FRONT-END)

function initWebServer() {
    // Configuramos el servidor para servir páginas html desde la carpeta public/
    app.use(express.static(__dirname + '/public'));

    // Indicamos cuál será la página por defecto
    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

    // Lanzamos el servidor web
    server.listen(port, () => {
        console.log(`Game Server running on port ${port}`);
    });
}

// SERVIDOR WEBSOCKET ---------------------------------------------------------------

// Iniciamos el servidor WebSocket sobre el Servidor HTTP

function initNetworkEngine() {

    // Definimos la integración con el Motor de juego (en la interfaz del juego)
    io.on('connection', (socket) => {
        console.log(`Nuevo jugador que quiere entrar: ${socket.id}`);

        socket.on('new player', () => {
            //Calculamos el número de jugadores a partir del objeto players
            const numberOfPlayers = Object.keys(players).length;
            onNewPlayer(socket, numberOfPlayers);
        });
        socket.on('move player', (data) => {
            let player = players[socket.id] || {};
            player.y = data;
        });

        socket.on('disconnect', () => {
            console.log(`Player ${socket.id} disconnected`);
            delete players[socket.id];
        });
    });
}

function sendStatus() {
    io.emit('state', { players, ball, gameState });
}


//-----------------------------------------------------------------------------------
// MOTOR DE RED (NETWORK ENGINE)
//-----------------------------------------------------------------------------------


const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;


// Declaramos los objetos del juego
var gameState = gameStateEnum.SYNC;
var players = {};
var ball = {};

// GENERIC HELPERS -------------------------------------------------------------------

function getRandomDirection() {
    return Math.floor(Math.random() * 2) === 0 ? -1 : 1;
}


function getPlayer(index) {
    var whatPlayer = undefined;

    for (let id in players) {
        if (index === 0 && players[id].x === 0) whatPlayer = players[id];
        if (index !== 0 && players[id].x !== 0) whatPlayer = players[id];
    }

    return whatPlayer;

}

//Inicializamos los objetos del juego
function onNewPlayer(socket, numberOfPlayers) {

    console.log(`Solicitud de juego para ${socket.id}`);
    console.log(`Por el momento había ${numberOfPlayers} jugadores registrados`);


    if (numberOfPlayers === 0) {
        players[socket.id] = {
            x: 0,
            y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            color: PADDLE_LEFT_COLOR,
            score: 0,
        };

        console.log(`Dando de alta al jugador A con indice ${numberOfPlayers}: ${socket.id}`);
    }

    if (numberOfPlayers === 1) {
        players[socket.id] = {
            x: CANVAS_WIDTH - PADDLE_WIDTH,
            y: CANVAS_HEIGHT / 2 - PADDLE_HEIGHT / 2,
            width: PADDLE_WIDTH,
            height: PADDLE_HEIGHT,
            color: PADDLE_RIGHT_COLOR,
            score: 0,
        }
        console.log(`Dando de alta al jugador B con indice ${numberOfPlayers}: ${socket.id}`);
        console.log(`Ya hay 2 jugadores...`);
        console.log(`Generando una pelota nueva`);
        newBall(true);

        console.log('Iniciando el bucle de juego');
        initGameLoop();

    }

    if (numberOfPlayers >= 2) {
        console.log('Demasiados jugadores. Espere su turno');
        socket.disconnect();
    }
}


// UPDATE HELPERS -------------------------------------------

function newBall(init = false) {
    // Si la pelota ya estaba definida (es un tanto), cambiamos la direccion
    const directionX = init ? getRandomDirection() : (ball.velocityX > 0 ? -1 : 1);
    ball = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        radius: BALL_RADIUS,
        speed: BALL_VELOCITY,
        velocityX: BALL_VELOCITY * directionX,
        velocityY: BALL_VELOCITY * getRandomDirection(),
        color: BALL_COLOR,
    };
}

function collision(b, p) {
    b.top = b.y - b.radius;
    b.bottom = b.y + b.radius;
    b.left = b.x - b.radius;
    b.right = b.x + b.radius;

    p.top = p.y;
    p.bottom = p.y + p.height;
    p.left = p.x;
    p.right = p.x + p.width;

    return b.right > p.left && b.bottom > p.top && b.left < p.right && b.top < p.bottom;

}
function update() {
    // Si no estamos en modo PLAY, saltamos la actualización
    if (gameState !== gameStateEnum.PLAY) return;

    // Player: Actualizamos la posición de la pelota
    ball.x += ball.velocityX;
    ball.y += ball.velocityY;



    // Si la pelota golpea los laterales, rebotará
    if (ball.y + ball.radius > CANVAS_HEIGHT || ball.y - ball.radius < 0) {
        ball.velocityY = -ball.velocityY;
    }

    // Verificamos si la pelota golpea la pala
    var whatPlayer = (ball.x < CANVAS_WIDTH / 2) ? getPlayer(0) : getPlayer(1);
    if (collision(ball, whatPlayer)) {
        // Calculamos donde golpea la pelota en la pala
        var collidePoint = ball.y - (whatPlayer.y + whatPlayer.height / 2);

        // Normalizamos el punto del golpeo
        collidePoint = collidePoint / (whatPlayer.height / 2);

        // Calculamos el angulo en radianes
        const angleRad = collidePoint * Math.PI / 4;

        // Calculamos la nueva direccion de la pelota
        const direction = (ball.x < CANVAS_WIDTH / 2) ? 1 : -1;

        // Cambiamos la velocidad x e y de la pelota
        ball.velocityX = direction * ball.speed * Math.cos(angleRad);
        ball.velocityY = ball.speed * Math.sin(angleRad);

        // Cada vez que la pelota golpea la pala, se incrementa la velocidad
        ball.speed += BALL_DELTA_VELOCITY;
    }

    // Si la pelota se fue por la izquierda
    if (ball.x - ball.radius < 0) {
        console.log('Tanto para el jugador de la DERECHA!');
        getPlayer(1).score++;
        newBall();
    } else if (ball.x + ball.radius > CANVAS_WIDTH) {
        console.log('Tanto para el jugador de la IZQUIERDA');
        getPlayer(0).score++;
        newBall();
    }
    // Informamos a los jugadores
    sendStatus();
}


function next() {
    // Si ha terminado la partida
    if ((getPlayer(0).score >= NUM_BALLS) || (getPlayer(1).score >= NUM_BALLS)) {
        gameState = gameStateEnum.END;
        // Informamos a los jugadores
        sendStatus();
        console.log('GAME OVER');
        // Detenemos el bucle de juego
        stopGameLoop();
    }
}


// HELPERS para gestionar el bucle de juego ------------------------------------------
var gameLoopId;         // Identificador del bucle de juego
function gameLoop() {
    update();
    next();
}

function initGameLoop() {
    gameLoopId = setInterval(gameLoop, 1000 / FRAME_PER_SECOND);
    gameState = gameStateEnum.PLAY;
}

function stopGameLoop() {
    clearInterval(gameLoopId);
}


// Inicialización del Servidor de Juego -------------------------------------------------
function init() {
    initWebServer();
    initNetworkEngine();
}

// Inicializamos el servidor de juego: servidor web y el motor de red
init();