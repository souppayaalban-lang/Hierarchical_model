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
        lShoulder[0], lShoulder[1], lShoulder[2],
        v1(p.lElbow),
        rShoulder[0], rShoulder[1], rShoulder[2],
        v1(p.rElbow),
        lHip[0], lHip[1], lHip[2],
        v1(p.lKnee),
        rHip[0], rHip[1], rHip[2],
        v1(p.rKnee),
        v1(p.lFoot),
        v1(p.rFoot),
        v1(p.pelvisY)    // index 28: vertical offset of the pelvis (FK height control)
    ];
}

// Penser à inverser la logique Droite = Gauche et inversement

var IDLE_F0 = pose({
    root: [0, 0, 0],
    spine: [0, 0, 60], torso: 0, head: [0, 0, 0],
    lShoulder: [-10, 0, 0], lElbow: -120,
    rShoulder: [10, 0, 0], rElbow: -150,
    lHip: [-15, 0, -90], lKnee: 20,
    rHip: [10, 0, -90], rKnee: 20,
    lFoot: 0, rFoot: 0,
    pelvisY: 0
});
function registerAnimations() {
    ANIMS["idle"] = {
        frames: [IDLE_F0],
        fps: 6,
        loop: true,
        priority: 0
    };

    // Uncomment when implemented
    // ANIMS["jab"]     = { frames: [...], fps: 18, loop: false, priority: 2 };
    // ANIMS["hi_kick"] = { frames: [...], fps: 18, loop: false, priority: 2 };
    // ANIMS["hit"]     = { frames: [...], fps: 16, loop: false, priority: 3 };
}
