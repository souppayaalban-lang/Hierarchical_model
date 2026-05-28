"use strict";

// flips a p1 pose to p2: reverses facing, swaps left/right limbs.
// lateral (z) angles negate on swap; forward (x) and twist (y) swap as-is.
function mirrorPose(t) {
    var m = t.slice();

    m[1] = 360 - t[1];  // reverse facing direction

    m[4] = -t[4];  // spine lateral
    m[5] = -t[5];  // spine twist

    // arms: rShoulder[10-12] + rElbow[13]  <->  lShoulder[14-16] + lElbow[17]
    m[10] = -t[14]; m[11] = t[15]; m[12] = t[16]; m[13] = t[17];
    m[14] = -t[10]; m[15] = t[11]; m[16] = t[12]; m[17] = t[13];

    // legs: rHip[18-20] + rKnee[21]  <->  lHip[22-24] + lKnee[25]
    m[18] = -t[22]; m[19] = t[23]; m[20] = t[24]; m[21] = t[25];
    m[22] = -t[18]; m[23] = t[19]; m[24] = t[20]; m[25] = t[21];

    return m;
}

// returns linear interpolation between pose a and pose b
function lerpPose(a, b, t) {
    var out = new Array(a.length);
    for (var i = 0; i < a.length; i++) {
        out[i] = a[i] + (b[i] - a[i]) * t;
    }
    return out;
}

// ANIMS: name -> { frames, fps, loop, interruptible }
var ANIMS = {};

var animStates = [];

var BLEND_DURATION = 0.12;

// figurePositions[f] is the world X of figure f, written to root_offsets each frame.
var figurePositions = [];
var WALK_SPEED = 1.5;
var X_MIN = -4.0;
var X_MAX = 4.0;

// stunTimers[f] > 0 means figure f cannot act (seconds remaining).
var stunTimers = [];

var comboStates = [];


function initAnimPlayer() {
    registerAnimations();

    figurePositions = [];
    animStates = [];
    stunTimers = [];
    comboStates = [];
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
        hitFlashTimers.push(false);
        comboStates.push({ count: 0, windowOpen: false, windowTimer: null });

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
