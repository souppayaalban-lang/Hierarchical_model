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
    lHip: [0, -20, 0], lKnee: 0,
    rHip: [0, 20, 0], rKnee: 0,
    pelvisY: -0.1
});
var IDLE_F1 = pose({
    root: [0, 90, 0],
    spine: [-20, 0, 0], torso: 60, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, -20, 0], lKnee: 0,
    rHip: [0, 20, 0], rKnee: 0,
    pelvisY: -0.3
});

// Forward SideStep
var WALK_F1 = pose({
    root: [0, 90, 0],
    spine: [10, 0, 0], torso: 40, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, -10, 0], lKnee: 0,
    rHip: [0, 0, 0], rKnee: 0,
    pelvisY: -0.5
});

// Jab Gauche
var JAB_F1 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [0, -110, 90], lElbow: 0,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, -20, 0], lKnee: 0,
    rHip: [0, 20, 0], rKnee: 0,
    pelvisY: -0.1
});
//Jab Droite
var JAB_F2 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [0, -110, 0], rElbow: 0,
    lHip: [0, -20, 0], lKnee: 0,
    rHip: [0, 20, 0], rKnee: 0,
    pelvisY: -0.1
});

// Final stance HighKick
var HIGHKICK_F0 = pose({
    root: [0, -20, 10],
    spine: [0, 40, 20], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [130, 0, 0], lKnee: 0,
    rHip: [0, 0, 30], rKnee: 0,
    pelvisY: -0.02
});
var HIGHKICK_F1 = pose({
    root: [0, -20, 5],
    spine: [0, 40, 40], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [100, 0, 0], lKnee: 120,
    rHip: [0, 0, 30], rKnee: 10,
    pelvisY: -0.02
});

var HIGHKICK_F1 = pose({
    root: [0, -20, 5],
    spine: [0, 40, 40], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [100, 0, 0], lKnee: 120,
    rHip: [0, 0, 30], rKnee: 10,
    pelvisY: -0.02
});

var HIT_F1 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, -80], torso: 30, head: [0, 0, 0],
    lShoulder: [20, 0, 50], lElbow: -120,
    rShoulder: [-20, -10, 0], rElbow: -80,
    lHip: [0, -20, 0], lKnee: 0,
    rHip: [0, 20, 0], rKnee: 0,
    pelvisY: -0.1
});


function registerAnimations() {
    ANIMS["idle"] = {
        frames: [IDLE_F0, IDLE_F1],
        fps: 2,
        loop: true,
        priority: 0,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["walk_fwd"] = {
        frames: [IDLE_F0, WALK_F1],
        fps: 4,
        loop: true,
        priority: 0,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["hit"] = {
        frames: [HIT_F1],
        fps: 1,
        loop: true,
        priority: 3,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["jab"] = {
        frames: [IDLE_F0, JAB_F1],
        fps: 8,
        loop: false,
        priority: 2,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["hi_kick"] = {
        frames: [IDLE_F0, HIGHKICK_F1, HIGHKICK_F0, HIGHKICK_F0, HIGHKICK_F1],
        fps: 8,
        loop: false,
        priority: 2,
        ikGround: { LeftFoot: false, RightFoot: true }  // lHip = kick (libre), rHip = appui (ancré)
    };
}
