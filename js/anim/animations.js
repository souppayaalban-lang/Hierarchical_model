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
        v1(p.pelvisY)
    ];
}

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

// Forward sidestep
var WALK_F1 = pose({
    root: [0, 90, 0],
    spine: [10, 0, 0], torso: 40, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, -10, 0], lKnee: 0,
    rHip: [0, 0, 0], rKnee: 0,
    pelvisY: -0.5
});

// Backward sidestep
var WALK_F2 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, 0, 0], lKnee: 0,
    rHip: [0, -20, 0], rKnee: 0,
    pelvisY: -0.3
});

// Left Jab
var JAB_F1 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [0, -110, 90], lElbow: 0,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, -20, 0], lKnee: 0,
    rHip: [0, 20, 0], rKnee: 0,
    pelvisY: -0.1
});
// Right Jab
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
    root: [0, 170, -10],
    spine: [0, -40, -20], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, 0, -30], lKnee: 10,
    rHip: [-110, 0, 0], rKnee: 0,
    pelvisY: -0.05
});
var HIGHKICK_F1 = pose({
    root: [0, 170, -10],
    spine: [0, -40, -20], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, 0, -30], lKnee: 10,
    rHip: [-90, 0, 0], rKnee: 120,
    pelvisY: -0.05
});



// Hit frame
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
        interruptible: true,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["walk_fwd"] = {
        frames: [IDLE_F0, WALK_F1],
        fps: 4,
        loop: true,
        interruptible: true,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["walk_back"] = {
        frames: [IDLE_F0, WALK_F2],
        fps: 4,
        loop: true,
        interruptible: true,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["hit"] = {
        frames: [HIT_F1],
        fps: 1,
        loop: true,
        interruptible: true,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["jab"] = {
        frames: [IDLE_F0, JAB_F1],
        fps: 8,
        loop: false,
        interruptible: false,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["jab_2"] = {
        frames: [IDLE_F0, JAB_F2],
        fps: 8,
        loop: false,
        interruptible: false,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["hi_kick"] = {
        frames: [IDLE_F0, HIGHKICK_F1, HIGHKICK_F0, HIGHKICK_F0, HIGHKICK_F1],
        fps: 8,
        loop: false,
        interruptible: false,
        ikGround: { LeftFoot: true, RightFoot: false }
    };
    ANIMS["reverse_highkick"] = {
        frames: [IDLE_F0, REVERSEHIGHKICK_F0, REVERSEHIGHKICK_F1, REVERSEHIGHKICK_F2, REVERSEHIGHKICK_F3, REVERSEHIGHKICK_F4, REVERSEHIGHKICK_F5],
        fps: 8,
        loop: false,
        interruptible: false,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["low_highkick"] = {
        frames: [IDLE_F0, LOWHIGHKICK_F1, LOWHIGHKICK_F2, LOWHIGHKICK_F1],
        fps: 4,
        loop: false,
        interruptible: false,
        ikGround: { LeftFoot: false, RightFoot: true }
    };
    ANIMS["test"] = {
        frames: [ELBOWHIT_F0, ELBOWHIT_F1, ELBOWHIT_F2],
        fps: 1,
        loop: true,
        interruptible: false,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["elbow_hit"] = {
        frames: [ELBOWHIT_F0, ELBOWHIT_F1],
        fps: 8,
        loop: false,
        interruptible: false,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["elbow_hit_2"] = {
        frames: [ELBOWHIT_F1, ELBOWHIT_F2],
        fps: 8,
        loop: false,
        interruptible: false,
        ikGround: { LeftFoot: true, RightFoot: true }
    };
    ANIMS["jump"] = {
        frames: [JUMP_F0],
        fps: 1,
        loop: true,
        interruptible: true,
        ikGround: { LeftFoot: false, RightFoot: false }
    };
}

var JUMP_F0 = pose({
    root: [0, 90, 0],
    spine: [0, 0, 0], torso: 10, head: [0, 0, 0],
    lShoulder: [130, 0, 0], lElbow: 0,
    rShoulder: [-130, 0, 0], rElbow: 0,
    lHip: [0, -10, 0], lKnee: 10,
    rHip: [0, 10, 0], rKnee: 10,
    pelvisY: 0.2
});

var REVERSEHIGHKICK_F0 = pose({
    root: [0, 135, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, -20, 0], lKnee: 0,
    rHip: [-30, -10, 0], rKnee: 50,
    pelvisY: -0.1
});

var REVERSEHIGHKICK_F1 = pose({
    root: [0, 180, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -120,
    rShoulder: [-20, -10, 0], rElbow: -90,
    lHip: [15, 0, 0], lKnee: 0,
    rHip: [0, 0, 0], rKnee: 0,
    pelvisY: -0.1
});

var REVERSEHIGHKICK_F2 = pose({
    root: [0, 240, 0],
    spine: [-10, 30, 0], torso: 40, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -30,
    rShoulder: [-20, -10, 0], rElbow: -90,
    lHip: [80, 0, 0], lKnee: 30,
    rHip: [-5, 0, 0], rKnee: 30,
    pelvisY: 0.1
});

var REVERSEHIGHKICK_F3 = pose({
    root: [0, 360, 0],
    spine: [-10, 60, 0], torso: 50, head: [0, 0, 0],
    lShoulder: [60, -10, 0], lElbow: 0,
    rShoulder: [-20, -10, 0], rElbow: -90,
    lHip: [130, 0, 0], lKnee: 0,
    rHip: [-5, 0, 0], rKnee: 30,
    pelvisY: 0.3
});

var REVERSEHIGHKICK_F4 = pose({
    root: [0, 405, 0],
    spine: [-10, 30, 0], torso: 40, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -60,
    rShoulder: [-20, -10, 0], rElbow: -90,
    lHip: [110, 0, 0], lKnee: 30,
    rHip: [-5, 0, 0], rKnee: 30,
    pelvisY: 0.1
});

var REVERSEHIGHKICK_F5 = pose({
    root: [0, 450, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, 20, 0], lKnee: 0,
    rHip: [0, -20, 0], rKnee: 0,
    pelvisY: -0.1
});

var LOWHIGHKICK_F2 = pose({
    root: [0, 0, 0],
    spine: [-10, 90, 0], torso: 60, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [150, 0, 0], lKnee: 0,
    rHip: [-10, 0, 0], rKnee: 0,
    pelvisY: -0.3
});


var LOWHIGHKICK_F1 = pose({
    root: [0, 0, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, 45, 0], lKnee: 60,
    rHip: [15, 0, 0], rKnee: 0,
    pelvisY: 0
});

var LOWHIGHKICK_F0 = pose({
    root: [0, 0, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-20, -10, 0], rElbow: -120,
    lHip: [0, 0, 0], lKnee: 0,
    rHip: [15, 0, 0], rKnee: 0,
    pelvisY: 0
});

var ELBOWHIT_F0 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-90, -10, 0], rElbow: -120,
    lHip: [0, -20, 0], lKnee: 0,
    rHip: [0, 20, 0], rKnee: 0,
    pelvisY: -0.1
});
var ELBOWHIT_F1 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-90, -100, 0], rElbow: -120,
    lHip: [0, -20, 0], lKnee: 0,
    rHip: [0, 20, 0], rKnee: 0,
    pelvisY: -0.1
});

var ELBOWHIT_F2 = pose({
    root: [0, 90, 0],
    spine: [-10, 0, 0], torso: 30, head: [0, 0, 0],
    lShoulder: [20, -10, 0], lElbow: -150,
    rShoulder: [-90, -50, 0], rElbow: 0,
    lHip: [0, -20, 0], lKnee: 0,
    rHip: [0, 20, 0], rKnee: 0,
    pelvisY: -0.1
});
