"use strict";

var keys = {};

// hitFlashTimers[f] true while figure f should render white.
var hitFlashTimers = [];

// hitFreeze true while the canvas should be frozen after a hit.
var hitFreeze = false;

// max distance (x axis) between attacker and defender for a hit to land
var HIT_RANGE = 1.25;
var HIT_HEIGHT_RANGE = 0.5;  // max Y difference for a hit to land

// damage values per attack type (also checked by combo anim name)
var ATTACK_DAMAGE = { jab: 5, jab_2: 5, elbow_hit: 5, elbow_hit_2: 8, hi_kick: 25, reverse_highkick: 12, low_highkick: 10 };

// delay (ms) before the distance check fires (also checked by combo anim name)
var ATTACK_DELAY = { jab: 100, jab_2: 100, elbow_hit: 100, elbow_hit_2: 100, hi_kick: 250, reverse_highkick: 500, low_highkick: 500 };

// stun duration in seconds applied to the defender on hit.
var STUN_DURATION = 0.30;  // must be >= hit freeze (250ms)
var HIT_FREEZE_ENABLED = true;

var PARRY_STUN = 2.0;
var PARRY_COOLDOWN = 1.0;
var PARRY_WINDOW = 0.3;  // seconds the parry is active after pressing the key

var COMBO_WINDOW = 500;  // ms after hit freeze to chain the next attack

// self stun = animation duration + recovery time
var ATTACK_RECOVERY = { jab: 0.35, hi_kick: 0.4, reverse_highkick: 0.3, low_highkick: 0.3 };

function getAttackStun(baseAttack) {
    var anim = ANIMS[baseAttack];
    var animDuration = anim ? (anim.frames.length - 1) / anim.fps : 0;
    var recovery = ATTACK_RECOVERY[baseAttack] || 0.3;
    return animDuration + recovery;
}

var COMBO_TREE = {
    "jab": {
        anim: "jab",
        next: {
            "jab": {
                anim: "jab_2", next: {
                    "hi_kick": { anim: "reverse_highkick", next: {} },
                    "jab": {
                        anim: "elbow_hit", next: {
                            "jab": { anim: "elbow_hit_2", next: {} }
                        }
                    }
                }
            },
            "hi_kick": { anim: "low_highkick", next: {} }
        }
    },
    "hi_kick": {
        anim: "hi_kick",
        next: {}
    }
};

function canCombo(f, baseAttack) {
    var combo = comboStates[f];
    return combo.windowOpen && combo.node && combo.node.next[baseAttack];
}

function getComboAnim(f, baseAttack) {
    var combo = comboStates[f];

    if (canCombo(f, baseAttack)) {
        combo.node = combo.node.next[baseAttack];
        clearTimeout(combo.windowTimer);
        combo.windowOpen = false;
        return combo.node.anim;
    } else {
        combo.node = COMBO_TREE[baseAttack] || null;
        combo.windowOpen = false;
        clearTimeout(combo.windowTimer);
        return combo.node ? combo.node.anim : baseAttack;
    }
}

function openComboWindow(f) {
    var combo = comboStates[f];
    if (!combo.node || !combo.node.next) { combo.node = null; return; }
    if (Object.keys(combo.node.next).length === 0) { combo.node = null; return; }

    combo.windowOpen = true;
    clearTimeout(combo.windowTimer);
    combo.windowTimer = setTimeout(function () {
        combo.windowOpen = false;
        combo.node = null;
    }, COMBO_WINDOW);
}

function activateParry(f) {
    if (parryStates[f].cooldown > 0 || stunTimers[f] > 0) return;
    parryStates[f].active = true;
    clearTimeout(parryStates[f].windowTimer);
    parryStates[f].windowTimer = setTimeout(function () {
        parryStates[f].active = false;
        parryStates[f].cooldown = PARRY_COOLDOWN;
    }, PARRY_WINDOW * 1000);
}

// apply damage + stun if in range
function tryHit(attackerIdx, animName) {
    if (numFigures < 2) return;
    var defenderIdx = 1 - attackerIdx;

    if (parryStates[defenderIdx].active) {
        stunTimers[attackerIdx] = PARRY_STUN;
        setPlayerStunUI(attackerIdx + 1, true);
        clearTimeout(parryStates[defenderIdx].windowTimer);
        parryStates[defenderIdx].active = false;
        parryStates[defenderIdx].cooldown = PARRY_COOLDOWN;
        if (HIT_FREEZE_ENABLED) {
            requestAnimationFrame(function () { hitFreeze = true; });
            setTimeout(function () { hitFreeze = false; }, 250);
        }
        return;
    }

    var distance = figurePositions[defenderIdx] - figurePositions[attackerIdx];
    var isFacingRight = facingRight[attackerIdx];
    if (isFacingRight ? distance <= 0 : distance >= 0) return;
    if (Math.abs(distance) > HIT_RANGE) return;

    // will miss if too far apart on Y
    var heightDiff = Math.abs(root_offsets[attackerIdx][1] - root_offsets[defenderIdx][1]);
    if (heightDiff > HIT_HEIGHT_RANGE) return;

    takeDamage(defenderIdx + 1, ATTACK_DAMAGE[animName] || 8);
    stunTimers[defenderIdx] = STUN_DURATION;
    setPlayerStunUI(defenderIdx + 1, true);
    hitFlashTimers[defenderIdx] = true;
    requestAnim(defenderIdx, "hit");
    animStates[defenderIdx].blendT = 1;  // snap to hit pose instantly

    setPlayerHitUI(defenderIdx + 1, true);
    var defIdx = defenderIdx;
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
        if (e.code === "KeyR" && !game.running) { initAnimPlayer(); startGame(); return; }
        if (e.code === "KeyQ" && !stunTimers[0] && (!attackCooldown[0] || canCombo(0, "jab"))) { var a = getComboAnim(0, "jab"); requestAnim(0, a); setTimeout(function () { tryHit(0, a); }, ATTACK_DELAY[a] || ATTACK_DELAY.jab); attackCooldown[0] = getAttackStun(a); }
        if (e.code === "KeyE" && !stunTimers[0] && (!attackCooldown[0] || canCombo(0, "hi_kick"))) { var a = getComboAnim(0, "hi_kick"); requestAnim(0, a); setTimeout(function () { tryHit(0, a); }, ATTACK_DELAY[a] || ATTACK_DELAY.hi_kick); attackCooldown[0] = getAttackStun(a); }
        if (e.code === "KeyU" && !stunTimers[1] && (!attackCooldown[1] || canCombo(1, "jab"))) { var a = getComboAnim(1, "jab"); requestAnim(1, a); setTimeout(function () { tryHit(1, a); }, ATTACK_DELAY[a] || ATTACK_DELAY.jab); attackCooldown[1] = getAttackStun(a); }
        if (e.code === "KeyO" && !stunTimers[1] && (!attackCooldown[1] || canCombo(1, "hi_kick"))) { var a = getComboAnim(1, "hi_kick"); requestAnim(1, a); setTimeout(function () { tryHit(1, a); }, ATTACK_DELAY[a] || ATTACK_DELAY.hi_kick); attackCooldown[1] = getAttackStun(a); }
        if (e.code === "KeyS") activateParry(0);
        if (e.code === "KeyK") activateParry(1);
        if (e.code === "KeyW" && jumpVelocity[0] === 0 && root_offsets[0][1] <= GROUND_Y + LEG_HEIGHT + 0.01) { jumpVelocity[0] = JUMP_FORCE; }
        if (e.code === "KeyI" && jumpVelocity[1] === 0 && root_offsets[1][1] <= GROUND_Y + LEG_HEIGHT + 0.01) { jumpVelocity[1] = JUMP_FORCE; }
        if (e.code === "Digit0") { requestAnim(0, "test"); }
    }
});

window.addEventListener("keyup", function (e) {
    keys[e.code] = false;
});

function processInput(dt) {
    if (!game || !game.running) return;

    // Update facing: each player faces the opponent
    if (numFigures > 1) {
        facingRight[0] = figurePositions[0] < figurePositions[1];
        facingRight[1] = figurePositions[1] < figurePositions[0];
    }

    for (var f = 0; f < numFigures; f++) {
        if (stunTimers[f] > 0) {
            stunTimers[f] = Math.max(0, stunTimers[f] - dt);
            if (stunTimers[f] === 0) setPlayerStunUI(f + 1, false);
        }
        if (attackCooldown[f] > 0) {
            attackCooldown[f] = Math.max(0, attackCooldown[f] - dt);
        }
        if (parryStates[f].cooldown > 0) {
            parryStates[f].cooldown = Math.max(0, parryStates[f].cooldown - dt);
        }
        setParryCooldownUI(f + 1, parryStates[f].cooldown > 0);
    }

    // P1 movement
    if (!stunTimers[0] && !attackCooldown[0] && !parryStates[0].active) {
        var p1Left = !!keys["KeyA"];
        var p1Right = !!keys["KeyD"];

        if (p1Right && !p1Left) {
            figurePositions[0] = Math.min(X_MAX, figurePositions[0] + WALK_SPEED * dt);
            requestAnim(0, facingRight[0] ? "walk_fwd" : "walk_back");
        } else if (p1Left && !p1Right) {
            figurePositions[0] = Math.max(X_MIN, figurePositions[0] - WALK_SPEED * dt);
            requestAnim(0, facingRight[0] ? "walk_back" : "walk_fwd");
        } else {
            requestAnim(0, "idle");
        }
    }

    // P2 movement
    if (!stunTimers[1] && !attackCooldown[1] && !parryStates[1].active) {
        var p2Left = !!keys["KeyJ"];
        var p2Right = !!keys["KeyL"];

        if (p2Left && !p2Right) {
            figurePositions[1] = Math.max(X_MIN, figurePositions[1] - WALK_SPEED * dt);
            requestAnim(1, facingRight[1] ? "walk_back" : "walk_fwd");
        } else if (p2Right && !p2Left) {
            figurePositions[1] = Math.min(X_MAX, figurePositions[1] + WALK_SPEED * dt);
            requestAnim(1, facingRight[1] ? "walk_fwd" : "walk_back");
        } else {
            requestAnim(1, "idle");
        }
    }

    // Jump physics
    for (var f = 0; f < numFigures; f++) {
        var groundY = GROUND_Y + LEG_HEIGHT;
        if (jumpVelocity[f] !== 0 || root_offsets[f][1] > groundY + 0.01) {
            jumpVelocity[f] -= GRAVITY * dt;
            root_offsets[f][1] += jumpVelocity[f] * dt;
            if (root_offsets[f][1] <= groundY) {
                root_offsets[f][1] = groundY;
                jumpVelocity[f] = 0;
                attackCooldown[f] = LANDING_RECOVERY;  // landing lag
            } else {
                requestAnim(f, "jump");
            }
        }
    }
}
