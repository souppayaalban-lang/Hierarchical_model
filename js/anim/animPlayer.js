"use strict";

// Turns a pose to face the opposite direction (180° on Y).
// Joint angles stay the same so both fighters keep the same stance
// (both right-handed / left-handed) — no left↔right swap.
function mirrorPose(t) {
    var m = t.slice();
    m[1] = t[1] + 180;  // reverse facing direction
    return m;
}

// returns linear interpolation between pose a and pose b
// root Y (index 1) uses shortest-path angular interpolation
function lerpPose(a, b, t) {
    var out = new Array(a.length);
    for (var i = 0; i < a.length; i++) {
        if (i === 1) {
            // Shortest-path angular lerp for root Y
            var diff = ((b[i] - a[i]) % 360 + 540) % 360 - 180;
            out[i] = a[i] + diff * t;
        } else {
            out[i] = a[i] + (b[i] - a[i]) * t;
        }
    }
    return out;
}

// ANIMS: name -> { frames, fps, loop, interruptible }
var ANIMS = {};

var animStates = [];

var BLEND_DURATION = 0.12;

// figurePositions[f] is the world X of figure f, written to root_offsets each frame
var figurePositions = [];
var WALK_SPEED = 1.5;
var X_MIN = -4.0;
var X_MAX = 4.0;

// facingRight[f]: true if figure f faces +X, false if facing -X
var facingRight = [];
// facingBlend[f]: 0 = fully facing right, 1 = fully facing left (smoothly interpolated)
var facingBlend = [];
var TURN_SPEED = 8.0;  // blend speed: full turn in ~0.125s

// Jump state
var jumpVelocity = [];  // current Y velocity per figure
var JUMP_FORCE = 9.0;   // initial upward velocity
var GRAVITY = 18.0;     // gravity acceleration
var LANDING_RECOVERY = 0.25;  // seconds of self-stun after landing

// stunTimers[f] > 0: figure f was hit and cannot act
var stunTimers = [];

// attackCooldown[f] > 0: figure f is in attack recovery and cannot attack again
var attackCooldown = [];

var comboStates = [];

// parryStates[f]: active = currently parrying, cooldown = seconds until can parry again
var parryStates = [];


function initAnimPlayer() {
    registerAnimations();

    figurePositions = [];
    animStates = [];
    stunTimers = [];
    attackCooldown = [];
    comboStates = [];
    parryStates = [];
    facingRight = [];
    facingBlend = [];
    for (var f = 0; f < numFigures; f++) {
        figurePositions.push(root_offsets[f] ? root_offsets[f][0] : 0);
        animStates.push({
            name: "idle",
            frame: 0,
            blendFrom: ANIMS["idle"].frames[0].slice(),
            blendT: 1,
            blendDuration: BLEND_DURATION
        });
        stunTimers.push(0);
        attackCooldown.push(0);
        hitFlashTimers.push(false);
        comboStates.push({ node: null, windowOpen: false, windowTimer: null });
        parryStates.push({ active: false, cooldown: 0, windowTimer: null });
        facingRight.push(f === 0);  // P1 starts facing right, P2 facing left
        facingBlend.push(f === 0 ? 0 : 1);  // match initial facing
        jumpVelocity.push(0);
    }
}

function requestAnim(f, name) {
    var state = animStates[f];
    var anim = ANIMS[name];
    if (!anim || !state) return;
    if (state.name === name) return;

    var current = ANIMS[state.name];
    if (current && !current.interruptible) return;

    state.blendFrom = getCurrentPose(f);
    state.blendT = 0;
    state.blendDuration = BLEND_DURATION;
    state.name = name;
    state.frame = 0;
}

function advanceAnimState(f, dt) {
    var state = animStates[f];
    var anim = ANIMS[state.name];
    if (!anim) return;

    if (state.blendT < 1) {
        state.blendT = Math.min(1, state.blendT + dt / state.blendDuration);
    }

    var frameCount = anim.frames.length;
    state.frame += dt * anim.fps;

    if (anim.loop) {
        state.frame = ((state.frame % frameCount) + frameCount) % frameCount;
    } else {
        if (state.frame >= frameCount - 1) {
            state.frame = frameCount - 1;
            state.blendFrom = getCurrentPose(f);
            state.blendT = 0;
            state.blendDuration = BLEND_DURATION;
            state.name = "idle";
            state.frame = 0;
        }
    }
}

function getCurrentPose(f) {
    var state = animStates[f];
    var anim = ANIMS[state.name];
    if (!anim) return ANIMS["idle"].frames[0].slice();

    var frameCount = anim.frames.length;
    var fi = Math.floor(state.frame) % frameCount;
    var fi1 = (fi + 1) % frameCount;
    var ft = state.frame - Math.floor(state.frame);

    var pose = lerpPose(anim.frames[fi], anim.frames[fi1], ft);

    if (state.blendT < 1) {
        pose = lerpPose(state.blendFrom, pose, state.blendT);
    }

    return pose;
}
