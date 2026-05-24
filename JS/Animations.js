"use strict";

// All poses authored for P1 (facing +X). P2 gets mirrorPose() applied automatically.
//
// DOF index map (28 values):
//   [0-2]   Root       X/Y/Z
//   [3-5]   Spine      X/Y/Z
//   [6]     Torso      X
//   [7-9]   Head       X/Y/Z
//   [10-12] L Shoulder Z/X/Y
//   [13]    L Elbow    X
//   [14-16] R Shoulder Z/X/Y
//   [17]    R Elbow    X
//   [18-20] L Hip      Z/X/Y
//   [21]    L Knee     X
//   [22-24] R Hip      Z/X/Y
//   [25]    R Knee     X
//   [26]    L Foot     X  (counter-rotates to keep foot flat when hip X is nonzero)
//   [27]    R Foot     X

// Idle : 4-frame looping bob at 6 fps.
// Staggered stance: left leg forward (Hip X +15), right leg back (Hip X -10).
// Only torso and arms carry the bob; legs and feet are constant across frames.
// Foot DOFs counter the hip X tilt so feet stay roughly flat.
//
//              0  1  2  3   4  5   6   7  8  9   10   11  12    13  14  15  16    17   18   19  20  21   22   23  24  25   26   27
var IDLE_F0 = [0, 0, 0, 0, 90, 0, 2, 1, 0, 0, -20, -21, 0, -122, 20, 31, 0, -122, -15, 15, 0, 0, 15, -10, 0, 0, -15, 10];
var IDLE_F1 = [0, 0, 0, 0, 90, 0, -1, 0, 0, 0, -20, -19, 0, -118, 20, 29, 0, -118, -15, 15, 0, 0, 15, -10, 0, 0, -15, 10];
var IDLE_F2 = [0, 0, 0, 0, 90, 0, -5, -2, 0, 0, -20, -16, 0, -113, 20, 26, 0, -113, -15, 15, 0, 0, 15, -10, 0, 0, -15, 10];
var IDLE_F3 = [0, 0, 0, 0, 90, 0, -1, 0, 0, 0, -20, -19, 0, -118, 20, 29, 0, -118, -15, 15, 0, 0, 15, -10, 0, 0, -15, 10];

// Walk forward : 4-frame stride cycle at 8 fps.
// Hip X alternates ±25° for leg swing; shoulders counter-swing ±15° from idle position.
// Foot DOFs are 0 : feet follow the leg freely while moving.
//
//              0  1  2  3   4  5   6  7  8  9   10   11  12    13  14  15  16    17   18   19  20  21   22   23  24  25  26  27
var WALK_F0 = [0, 0, 0, 0, 90, 0, 8, 0, 0, 0, -20, -36, 0, -105, 20, 16, 0, -105, -10, -25, 0, 0, 10, 25, 0, -20, 0, 0]; // R fwd
var WALK_F1 = [0, 0, 0, 0, 90, 0, 5, 0, 0, 0, -20, -21, 0, -120, 20, 31, 0, -120, -10, 0, 0, -15, 10, 0, 0, -20, 0, 0]; // centre
var WALK_F2 = [0, 0, 0, 0, 90, 0, 8, 0, 0, 0, -20, -6, 0, -105, 20, 46, 0, -105, -10, 25, 0, -20, 10, -25, 0, 0, 0, 0]; // L fwd
var WALK_F3 = [0, 0, 0, 0, 90, 0, 5, 0, 0, 0, -20, -21, 0, -120, 20, 31, 0, -120, -10, 0, 0, -20, 10, 0, 0, -15, 0, 0]; // centre

function registerAnimations() {
    ANIMS["idle"] = {
        frames: [IDLE_F0, IDLE_F1, IDLE_F2, IDLE_F3],
        fps: 6,
        loop: true,
        priority: 0
    };

    ANIMS["walk_fwd"] = {
        frames: [WALK_F0, WALK_F1, WALK_F2, WALK_F3],
        fps: 8,
        loop: true,
        priority: 0
    };

    // walk_back reuses the walk_fwd frames for now; the position just moves backward.
    ANIMS["walk_back"] = {
        frames: [WALK_F0, WALK_F1, WALK_F2, WALK_F3],
        fps: 8,
        loop: true,
        priority: 0
    };

    // Uncomment when implemented
    // ANIMS["jab"]     = { frames: [...], fps: 18, loop: false, priority: 2 };
    // ANIMS["hi_kick"] = { frames: [...], fps: 18, loop: false, priority: 2 };
    // ANIMS["hit"]     = { frames: [...], fps: 16, loop: false, priority: 3 };
}
