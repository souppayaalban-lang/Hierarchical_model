"use strict";

// Converts a P1 pose (authored facing +X) into a P2 pose (facing -X).
// Z (lateral) angles are negated on swap; X (forward) and Y (twist) are swapped as-is.
function mirrorPose(t) {
    var m = t.slice();

    m[1] = t[1] + 180;  // root faces opposite direction

    // Shoulders [10 Z, 11 X, 12 Y] L <-> [14 Z, 15 X, 16 Y] R
    m[10] = -t[14]; m[11] = t[15]; m[12] = t[16];
    m[14] = -t[10]; m[15] = t[11]; m[16] = t[12];

    // Elbows [13] L <-> [17] R
    m[13] = t[17];
    m[17] = t[13];

    // Hips [18 Z, 19 X, 20 Y] L <-> [22 Z, 23 X, 24 Y] R
    m[18] = -t[22]; m[19] = t[23]; m[20] = t[24];
    m[22] = -t[18]; m[23] = t[19]; m[24] = t[20];

    // Knees [21] L <-> [25] R
    m[21] = t[25];
    m[25] = t[21];

    return m;
}

function testMirrorPose() {
    var o = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        10, 20, 30, 45,
        50, 60, 70, 80,
        15, 25, 35, 90,
        55, 65, 75, 100];

    var m = mirrorPose(o);
    var pass = true;

    function check(label, got, expected) {
        if (got !== expected) {
            console.warn("[AnimPlayer] FAIL " + label + ": got " + got + ", expected " + expected);
            pass = false;
        }
    }

    check("root Y", m[1], o[1] + 180);
    check("Lsh Z",  m[10], -o[14]); check("Lsh X", m[11], o[15]); check("Lsh Y", m[12], o[16]);
    check("Rsh Z",  m[14], -o[10]); check("Rsh X", m[15], o[11]); check("Rsh Y", m[16], o[12]);
    check("Lelbow", m[13], o[17]);  check("Relbow", m[17], o[13]);
    check("Lhip Z", m[18], -o[22]); check("Lhip X", m[19], o[23]); check("Lhip Y", m[20], o[24]);
    check("Rhip Z", m[22], -o[18]); check("Rhip X", m[23], o[19]); check("Rhip Y", m[24], o[20]);
    check("Lknee",  m[21], o[25]);  check("Rknee",  m[25], o[21]);

    console.log("[AnimPlayer] mirrorPose: " + (pass ? "PASS" : "FAIL"));
}

window.addEventListener("load", testMirrorPose);

function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
}

function lerpPose(a, b, t) {
    var out = new Array(a.length);
    for (var i = 0; i < a.length; i++) {
        out[i] = a[i] + (b[i] - a[i]) * t;
    }
    return out;
}

// ANIMS: name -> { frames, fps, loop, priority }
var ANIMS = {};

var animStates = [];

var BLEND_DURATION = 0.12;

// figurePositions[f] is the world X of figure f, written to root_offsets each frame.
var figurePositions = [];
var WALK_SPEED = 1.5;
var X_MIN = -4.0;
var X_MAX =  4.0;

function initAnimPlayer() {
    registerAnimations();

    figurePositions = [];
    animStates = [];
    for (var f = 0; f < numFigures; f++) {
        figurePositions.push(root_offsets[f] ? root_offsets[f][0] : 0);
        animStates.push({
            name:          "idle",
            frame:         0,
            blendFrom:     ANIMS["idle"].frames[0].slice(),
            blendT:        1,
            blendDuration: BLEND_DURATION,
            priority:      0
        });
    }
}

// Switch figure f to the named animation if its priority allows.
function requestAnim(f, name) {
    var state = animStates[f];
    var anim  = ANIMS[name];
    if (!anim || !state)          return;
    if (state.name === name)      return;
    if (anim.priority < state.priority) return;

    state.blendFrom     = getCurrentPose(f);
    state.blendT        = 0;
    state.blendDuration = BLEND_DURATION;
    state.name          = name;
    state.frame         = 0;
    state.priority      = anim.priority;
}

function advanceAnimState(f, dt) {
    var state = animStates[f];
    var anim  = ANIMS[state.name];
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
            if (state.name !== "idle") {
                state.blendFrom     = getCurrentPose(f);
                state.blendT        = 0;
                state.blendDuration = BLEND_DURATION;
                state.name          = "idle";
                state.frame         = 0;
                state.priority      = ANIMS["idle"].priority;
            }
        }
    }
}

function getCurrentPose(f) {
    var state = animStates[f];
    var anim  = ANIMS[state.name];
    if (!anim) return ANIMS["idle"].frames[0].slice();

    var frameCount = anim.frames.length;
    var fi  = Math.floor(state.frame) % frameCount;
    var fi1 = (fi + 1) % frameCount;
    var ft  = state.frame - Math.floor(state.frame);

    var pose = lerpPose(anim.frames[fi], anim.frames[fi1], ft);

    if (state.blendT < 1) {
        pose = lerpPose(state.blendFrom, pose, smoothstep(state.blendT));
    }

    return pose;
}
