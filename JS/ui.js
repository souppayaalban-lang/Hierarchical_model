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

window.addEventListener('keydown', function(e) {
    var id = KEY_MAP[e.code];
    if (id) {
        e.preventDefault();
        var btn = document.getElementById(id);
        if (btn) btn.classList.add('pressed');
    }
});

window.addEventListener('keyup', function(e) {
    var id = KEY_MAP[e.code];
    if (id) {
        var btn = document.getElementById(id);
        if (btn) btn.classList.remove('pressed');
    }
});
