"use strict";
function pose(p) {
    function v3(a) { return a || [0, 0, 0]; }
    function v1(a) { return a == null ? 0 : a; }

    var root = v3(p.root);
    var spine = v3(p.spine);
    var head = v3(p.head);
    var lShoulder = v3(p.lShoulder);
    var rShoulder = v3(p.rShoulder);
    var lHip = v3(p.lHip);
    var rHip = v3(p.rHip);

    return [
        root[0], root[1], root[2],
        spine[0], spine[1], spine[2],
        v1(p.torso),
        head[0], head[1], head[2],
        rShoulder[0], rShoulder[1], rShoulder[2],
        v1(p.rElbow),
        lShoulder[0], lShoulder[1], lShoulder[2],
        v1(p.lElbow),
        rHip[0], rHip[1], rHip[2],
        v1(p.rKnee),
        lHip[0], lHip[1], lHip[2],
        v1(p.lKnee),
        v1(p.pelvisY)    // index 26: vertical offset of the pelvis (FK height control)
    ];
}

// Penser à inverser la logique Droite = Gauche et inversement

var IDLE_F0 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, -30, 0], lKnee: 45,
    rHip: [0, 10, 0], rKnee: 30,
    pelvisY: -0.5
});

var WALK_F0 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, -30, 0], lKnee: 45,
    rHip: [0, 10, 0], rKnee: 30,
    pelvisY: -0.5
});

var JAB_F0 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, -30, 0], lKnee: 45,
    rHip: [0, 10, 0], rKnee: 30,
    pelvisY: -0.5
});
// Jab Gauche
var JAB_F1 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [0, -110, 90], lElbow: 0,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, -30, 0], lKnee: 45,
    rHip: [0, 10, 0], rKnee: 30,
    pelvisY: -0.5
});
//Jab Droite
var JAB_F2 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [0, -110, 0], rElbow: 0,
    lHip: [0, -30, 0], lKnee: 45,
    rHip: [0, 10, 0], rKnee: 30,
    pelvisY: -0.5
});
var HIGHKICK_F0 = pose({
    root: [0, 0, 0],
    spine: [0, 40, 10], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [140, 0, 0], lKnee: 0,
    rHip: [0, 0, 30], rKnee: 0,
    pelvisY: -0.5
});
var HIGHKICK_F1 = pose({
    root: [0, 0, 0],
    spine: [0, 40, 5], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [100, 0, 0], lKnee: 120,
    rHip: [0, 0, 30], rKnee: 10,
    pelvisY: -0.5
});


function registerAnimations() {
    ANIMS["idle"] = {
        frames: [IDLE_F0],
        fps: 2,
        loop: true,
        priority: 0
    };
    ANIMS["walk_fwd"] = {
        frames: [WALK_F0],
        fps: 1,
        loop: true,
        priority: 0
    };
    ANIMS["jab"] = {
        frames: [JAB_F0, JAB_F2],
        fps: 8,
        loop: false,
        priority: 2
    };
    ANIMS["hi_kick"] = {
        frames: [IDLE_F0, HIGHKICK_F1, HIGHKICK_F0, HIGHKICK_F0,  HIGHKICK_F1],
        fps: 8,
        loop: false,
        priority: 2
    };

    // Uncomment when implemented
    // ANIMS["jab"]     = { frames: [...], fps: 18, loop: false, priority: 2 };
    // ANIMS["hi_kick"] = { frames: [...], fps: 18, loop: false, priority: 2 };
    // ANIMS["hit"]     = { frames: [...], fps: 16, loop: false, priority: 3 };
}
