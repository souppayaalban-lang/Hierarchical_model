"use strict";

var KEY_MAP = {
    // P1: A/D move, Q/E attack
    'KeyA': 'p1-key-a',
    'KeyD': 'p1-key-d',
    'KeyQ': 'p1-key-q',
    'KeyE': 'p1-key-e',
    // P2: J/L move, U/O attack
    'KeyJ': 'p2-key-j',
    'KeyL': 'p2-key-l',
    'KeyU': 'p2-key-u',
    'KeyO': 'p2-key-o',
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

// flash the health bar shadow white while the player is being hit
function setPlayerHitUI(player, isHit) {
    var el = document.getElementById(player === 1 ? 'p1-health-shadow' : 'p2-health-shadow');
    if (!el) return;
    if (isHit) el.classList.add('hit');
    else el.classList.remove('hit');
}

// grey out / restore all key buttons for a player while they are stunned
function setPlayerStunUI(player, isStunned) {
    var panelId = player === 1 ? 'p1-panel' : 'p2-panel';
    var panel = document.getElementById(panelId);
    if (!panel) return;
    var btns = panel.querySelectorAll('.key-btn');
    for (var i = 0; i < btns.length; i++) {
        if (isStunned) btns[i].classList.add('stunned');
        else btns[i].classList.remove('stunned');
    }
}
