"use strict";

var KEY_MAP = {
    // P1: A/D move, Q/E attack, S parry
    'KeyA': 'p1-key-a',
    'KeyD': 'p1-key-d',
    'KeyQ': 'p1-key-q',
    'KeyE': 'p1-key-e',
    'KeyS': 'p1-key-s',
    // P2: J/L move, U/O attack, K parry
    'KeyJ': 'p2-key-j',
    'KeyL': 'p2-key-l',
    'KeyU': 'p2-key-u',
    'KeyO': 'p2-key-o',
    'KeyK': 'p2-key-k',
};

window.addEventListener('keydown', function (e) {
    var id = KEY_MAP[e.code];
    if (id) {
        e.preventDefault();
        var btn = document.getElementById(id);
        if (btn) btn.classList.add('pressed');
    }
});

window.addEventListener('keyup', function (e) {
    var id = KEY_MAP[e.code];
    if (id) {
        var btn = document.getElementById(id);
        if (btn) btn.classList.remove('pressed');
    }
});

function updateHealthUI(player) {
    var id = player === 1 ? 'p1-health-fill' : 'p2-health-fill';
    var hp = player === 1 ? game.p1Health : game.p2Health;
    var el = document.getElementById(id);
    if (!el) return;

    el.style.width = (hp / MAX_HEALTH * 100) + '%';
    el.className = 'health-fill';
    if (hp <= 25) el.classList.add('low');
    else if (hp <= 50) el.classList.add('medium');
}

function updateTimerUI() {
    var el = document.getElementById('timer-display');
    if (el) el.textContent = game.timeRemaining;
}

// flash the health bar shadow white while the player is being hit
function setPlayerHitUI(player, isHit) {
    var el = document.getElementById(player === 1 ? 'p1-health-shadow' : 'p2-health-shadow');
    if (!el) return;
    if (isHit) el.classList.add('hit');
    else el.classList.remove('hit');
}

// grey out or restore the parry button while the cooldown is active
function setParryCooldownUI(player, isOnCooldown) {
    var btn = document.getElementById(player === 1 ? 'p1-key-s' : 'p2-key-k');
    if (!btn) return;
    if (isOnCooldown) btn.classList.add('stunned');
    else btn.classList.remove('stunned');
}

// grey out or restore all key buttons for a player while they are stunned
function setPlayerStunUI(player, isStunned) {
    var panelId = player === 1 ? 'p1-panel' : 'p2-panel';
    var panel = document.getElementById(panelId);
    if (!panel) return;
    var btns = panel.querySelectorAll('.key-btn');
    for (var i = 0; i < btns.length; i++) {
        if (isStunned) btns[i].classList.add('stunned');
        else btns[i].classList.remove('stunned');
    }
    // re-apply parry cooldown after un-stun so it doesn't disappear early
    if (!isStunned) {
        var f = player - 1;
        if (parryStates && parryStates[f] && parryStates[f].cooldown > 0) {
            setParryCooldownUI(player, true);
        }
    }
}
