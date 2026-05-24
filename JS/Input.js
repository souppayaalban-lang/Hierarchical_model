"use strict";

var keys = {};

window.addEventListener("keydown", function(e) {
    var wasDown = keys[e.code];
    keys[e.code] = true;

    // Attacks trigger once on first press, not while held.
    // requestAnim silently ignores names not yet registered.
    if (!wasDown) {
        if (e.code === "KeyQ") requestAnim(0, "jab");
        if (e.code === "KeyE") requestAnim(0, "hi_kick");
        if (e.code === "KeyU") requestAnim(1, "jab");
        if (e.code === "KeyO") requestAnim(1, "hi_kick");
    }
});

window.addEventListener("keyup", function(e) {
    keys[e.code] = false;
});

// Called every frame from updateAnimation(dt).
// Movement keys are sampled continuously; attacks are handled above.
function processInput(dt) {
    if (!game || !game.running) return;

    // P1: A = move left, D = move right
    var p1Left  = !!keys["KeyA"];
    var p1Right = !!keys["KeyD"];

    if (p1Right && !p1Left) {
        figurePositions[0] = Math.min(X_MAX, figurePositions[0] + WALK_SPEED * dt);
        requestAnim(0, "walk_fwd");
    } else if (p1Left && !p1Right) {
        figurePositions[0] = Math.max(X_MIN, figurePositions[0] - WALK_SPEED * dt);
        requestAnim(0, "walk_back");
    } else {
        requestAnim(0, "idle");
    }

    // P2: J = move left, L = move right (P2 faces -X so left = forward)
    if (numFigures > 1 && animStates[1]) {
        var p2Left  = !!keys["KeyJ"];
        var p2Right = !!keys["KeyL"];

        if (p2Left && !p2Right) {
            figurePositions[1] = Math.max(X_MIN, figurePositions[1] - WALK_SPEED * dt);
            requestAnim(1, "walk_fwd");
        } else if (p2Right && !p2Left) {
            figurePositions[1] = Math.min(X_MAX, figurePositions[1] + WALK_SPEED * dt);
            requestAnim(1, "walk_back");
        } else {
            requestAnim(1, "idle");
        }
    }
}
