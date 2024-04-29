//-----------------------------------------------------------------------------------
// MOTOR GRÁFICO (GRAPHICS ENGINE)
//-----------------------------------------------------------------------------------
'use strict'
//Recuperamos el canvas
const cvs = document.getElementById('pong_canvas');
//Obtenemos el contexto de 2D para el canvas
const ctx = cvs.getContext('2d');


// LAYER 0: BASIC CANVAS DRAW HELPERS ----------------------------------------------

function drawRect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
}

function drawText(text, x, y, color = FONT_COLOR, fontSize = FONT_SIZE, fontFamily = FONT_FAMILY) {
    ctx.fillStyle = color;
    ctx.font = `${fontSize} ${fontFamily}`;
    ctx.fillText(text, x, y);
}

// LAYER 1: BASIC PONG HELPERS --------------------------------------------

function clearCanvas() {
    drawRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, BG_COLOR);
}

function drawNet() {
    const net = {
        x: CANVAS_WIDTH / 2 - NET_WIDTH / 2,
        y: 0,
        width: NET_WIDTH,
        height: NET_HEIGHT,
        padding: NET_PADDING,
        color: NET_COLOR,
    }

    for (let i = 0; i <= CANVAS_HEIGHT; i += net.padding) {
        drawRect(net.x, net.y + i, net.width, net.height, net.color);
    }
}

function drawBoard() {
    clearCanvas();
    drawNet();
}

function drawScore(player) {
    for (let id in players) {
        drawText(players[id].score, (players[id].x === 0 ? 1 : 3) * CANVAS_WIDTH / 4, CANVAS_HEIGHT / 5);
    }
}

function drawPaddle(paddle) {
    drawRect(paddle.x, paddle.y, paddle.width, paddle.height, paddle.color);
}

function drawBall(ball) {
    drawCircle(ball.x, ball.y, ball.radius, ball.color);
}
