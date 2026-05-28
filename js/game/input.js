"use strict";

var keys = {};

// hitFlashTimers[f] true while figure f should render white.
var hitFlashTimers = [];

// hitFreeze true while the canvas should be frozen after a hit.
var hitFreeze = false;

// max distance (x axis) between attacker and defender for a hit to land
var HIT_RANGE = 1.25;

// damage values per attack type
var ATTACK_DAMAGE = { jab: 8, hi_kick: 12 };

// delay (ms) before the distance check fires
var ATTACK_DELAY = { jab: 100, hi_kick: 250 };

// stun duration in seconds applied to the defender on hit.
var STUN_DURATION = 0.10;
var HIT_FREEZE_ENABLED = true;

var COMBO_WINDOW = 50;  // ms – time after hit freeze to chain the next attack

// Recovery time (seconds) added AFTER the attack animation finishes.
// Total self-stun = animation_duration + recovery.
var ATTACK_RECOVERY = { jab: 0.35, hi_kick: 0.4 };

// Computes total self-stun: animation duration + recovery time.
function getAttackStun(baseAttack) {
    var anim = ANIMS[baseAttack];
    var animDuration = anim ? (anim.frames.length - 1) / anim.fps : 0;
    var recovery = ATTACK_RECOVERY[baseAttack] || 0.3;
    return animDuration + recovery;
}

// ── Combo Tree ──────────────────────────────────────────────────────
// Each node: { anim: "animation_name", next: { "input": node, ... } }
// "next" maps the NEXT base-attack input to its follow-up node.
// To add a new combo route, just add a branch in the tree.
var COMBO_TREE = {
    "jab": {
        anim: "jab",
        next: {
            "jab": {
                anim: "jab_2", next: {
                    "hi_kick": { anim: "hi_kick", next: {} },
                    "jab": { anim: "hit", next: {} }
                }
            },
            "hi_kick": { anim: "hi_kick", next: {} }
        }
    },
    "hi_kick": {
        anim: "hi_kick",
        next: {
            "jab": { anim: "jab", next: {} },
            "hi_kick": { anim: "hi_kick", next: {} }
        }
    }
};

// Returns true if figure f can combo into baseAttack right now.
function canCombo(f, baseAttack) {
    var combo = comboStates[f];
    return combo.windowOpen && combo.node && combo.node.next[baseAttack];
}

// Returns the correct animation name, navigating the combo tree.
function getComboAnim(f, baseAttack) {
    var combo = comboStates[f];

    if (canCombo(f, baseAttack)) {
        // Follow the tree branch
        combo.node = combo.node.next[baseAttack];
        clearTimeout(combo.windowTimer);
        combo.windowOpen = false;
        return combo.node.anim;
    } else {
        // Fresh attack — start at the tree root
        combo.node = COMBO_TREE[baseAttack] || null;
        combo.windowOpen = false;
        clearTimeout(combo.windowTimer);
        return combo.node ? combo.node.anim : baseAttack;
    }
}

// Opens the combo window for figure f after a successful hit.
// Only opens if the current tree node has at least one follow-up.
function openComboWindow(f) {
    var combo = comboStates[f];
    if (!combo.node || !combo.node.next) { combo.node = null; return; }
    var hasNext = false;
    for (var k in combo.node.next) { hasNext = true; break; }
    if (!hasNext) { combo.node = null; return; }

    combo.windowOpen = true;
    clearTimeout(combo.windowTimer);
    combo.windowTimer = setTimeout(function () {
        combo.windowOpen = false;
        combo.node = null;
    }, COMBO_WINDOW);
}

// apply damage + stun if in range
function tryHit(attackerIdx, animName) {
    if (numFigures < 2) return;
    var defenderIdx = 1 - attackerIdx;
    if (stunTimers[defenderIdx] > 0) return;

    var distance = figurePositions[defenderIdx] - figurePositions[attackerIdx];
    // P1 (idx 0) must hit someone to the right; P2 (idx 1) must hit someone to the left.
    var facingRight = (attackerIdx === 0);
    if (facingRight ? distance <= 0 : distance >= 0) return;
    if (Math.abs(distance) > HIT_RANGE) return;

    takeDamage(defenderIdx + 1, ATTACK_DAMAGE[animName] || 8);
    stunTimers[defenderIdx] = STUN_DURATION;
    setPlayerStunUI(defenderIdx + 1, true);
    hitFlashTimers[defenderIdx] = true;
    requestAnim(defenderIdx, "hit");
    animStates[defenderIdx].blendT = 1;  // snap to hit pose instantly

    setPlayerHitUI(defenderIdx + 1, true);
    var defIdx = defenderIdx;  // capture for closures
    var atkIdx = attackerIdx;
    if (HIT_FREEZE_ENABLED) {
        requestAnimationFrame(function () { hitFreeze = true; });
        setTimeout(function () {
            hitFreeze = false;
            requestAnim(defIdx, "idle");
            openComboWindow(atkIdx);
        }, 250);
    } else {
        setTimeout(function () {
            requestAnim(defIdx, "idle");
            openComboWindow(atkIdx);
        }, 250);
    }
    setTimeout(function () { hitFlashTimers[defIdx] = false; setPlayerHitUI(defIdx + 1, false); }, 250);
}

window.addEventListener("keydown", function (e) {
    var wasDown = keys[e.code];
    keys[e.code] = true;

    if (!wasDown) {
        if (e.code === "KeyQ" && (!stunTimers[0] || canCombo(0, "jab"))) { requestAnim(0, getComboAnim(0, "jab")); setTimeout(function () { tryHit(0, "jab"); }, ATTACK_DELAY.jab); stunTimers[0] = getAttackStun("jab"); }
        if (e.code === "KeyE" && (!stunTimers[0] || canCombo(0, "hi_kick"))) { requestAnim(0, getComboAnim(0, "hi_kick")); setTimeout(function () { tryHit(0, "hi_kick"); }, ATTACK_DELAY.hi_kick); stunTimers[0] = getAttackStun("hi_kick"); }
        if (e.code === "KeyU" && (!stunTimers[1] || canCombo(1, "jab"))) { requestAnim(1, getComboAnim(1, "jab")); setTimeout(function () { tryHit(1, "jab"); }, ATTACK_DELAY.jab); stunTimers[1] = getAttackStun("jab"); }
        if (e.code === "KeyO" && (!stunTimers[1] || canCombo(1, "hi_kick"))) { requestAnim(1, getComboAnim(1, "hi_kick")); setTimeout(function () { tryHit(1, "hi_kick"); }, ATTACK_DELAY.hi_kick); stunTimers[1] = getAttackStun("hi_kick"); }
    }
});

window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
});

// Called every frame from updateAnimation(dt) to process key input
function processInput(dt) {
    if (!game || !game.running) return;

    // decrement stun timers and reset UI when they expire
    for (var f = 0; f < numFigures; f++) {
        if (stunTimers[f] > 0) {
            stunTimers[f] = Math.max(0, stunTimers[f] - dt);
            if (stunTimers[f] === 0) setPlayerStunUI(f + 1, false);
        }
    }

    // P1: A = move left, D = move right (blocked while stunned)
    if (!stunTimers[0]) {
        var p1Left = !!keys["KeyA"];
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
    }

    // P2: J = move left, L = move right (P2 faces -X so left = forward)
    if (!stunTimers[1]) {
        var p2Left = !!keys["KeyJ"];
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
