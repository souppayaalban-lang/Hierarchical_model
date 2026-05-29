"use strict";

var ROUND_TIME = 99;
var MAX_HEALTH = 100;

var game = {
    p1Health: MAX_HEALTH,
    p2Health: MAX_HEALTH,
    timeRemaining: ROUND_TIME,
    running: false,
    timerInterval: null,
};

function startGame() {
    hideGameOver();
    game.p1Health = MAX_HEALTH;
    game.p2Health = MAX_HEALTH;
    game.timeRemaining = ROUND_TIME;
    game.running = true;

    updateHealthUI(1);
    updateHealthUI(2);
    updateTimerUI();

    clearInterval(game.timerInterval);
    game.timerInterval = setInterval(tickTimer, 1000);
}

function stopGame() {
    game.running = false;
    clearInterval(game.timerInterval);
    game.timerInterval = null;

    var winner, message;
    if (game.p1Health <= 0) { winner = 2; message = "PLAYER TWO WINS"; }
    else if (game.p2Health <= 0) { winner = 1; message = "PLAYER ONE WINS"; }
    else if (game.p1Health > game.p2Health) { winner = 1; message = "PLAYER ONE WINS"; }
    else if (game.p2Health > game.p1Health) { winner = 2; message = "PLAYER TWO WINS"; }
    else { winner = 0; message = "DRAW"; }
    showGameOver(message, winner);
}

function tickTimer() {
    if (!game.running) return;
    game.timeRemaining = Math.max(0, game.timeRemaining - 1);
    updateTimerUI();
    if (game.timeRemaining <= 0) stopGame();
}

function takeDamage(player, amount) {
    if (!game.running) return;
    if (player === 1) {
        game.p1Health = Math.max(0, game.p1Health - amount);
        updateHealthUI(1);
        if (game.p1Health <= 0) stopGame();
    } else {
        game.p2Health = Math.max(0, game.p2Health - amount);
        updateHealthUI(2);
        if (game.p2Health <= 0) stopGame();
    }
}

function setHealth(player, value) {
    var clamped = Math.max(0, Math.min(MAX_HEALTH, value));
    if (player === 1) game.p1Health = clamped;
    else game.p2Health = clamped;
    updateHealthUI(player);
}

window.addEventListener('load', startGame);
