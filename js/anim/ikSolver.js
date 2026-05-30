"use strict";

var IK_GROUND_DEFAULT = { LeftFoot: true, RightFoot: true };

var IK_L1 = 0;          // Leg length
var IK_L2 = 0;          // Shin length
var IK_MAX_REACH = 0;   // Max reach

function _ikEnsureInit() {
    if (IK_L1 > 0) return;
    IK_L1 = upper_leg_length - 2 * limb_radius;
    IK_L2 = lower_leg_length - 2 * limb_radius;
    IK_MAX_REACH = IK_L1 + IK_L2;
}

function _ikInvRotVec(m, v) {
    return [
        m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2],
        m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2],
        m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2]
    ];
}

function solveFootIK(pose, fIdx, ikConfig) {
    _ikEnsureInit();

    var cfg = ikConfig || IK_GROUND_DEFAULT;
    var doL = cfg.LeftFoot;
    var doR = cfg.RightFoot;
    if (!doL && !doR) return pose;

    var rootOff = root_offsets[fIdx] || [0, GROUND_Y + LEG_HEIGHT, 0];
    var pelY = pose[26] || 0;

    function buildWRoot(pY) {
        var m = mat4();
        if (pY !== 0) m = mult(m, translate(0, pY, 0));
        m = mult(m, rotate(pose[0], 1, 0, 0));
        m = mult(m, rotate(pose[1], 0, 1, 0));
        m = mult(m, rotate(pose[2], 0, 0, 1));
        return mult(translate(rootOff[0], rootOff[1], rootOff[2]), m);
    }

    function legData(wRoot, side) {
        var isL = (side === 0);
        var oX = isL ? hip_offset_x : -hip_offset_x;
        var iHX = isL ? 23 : 19;
        var iKX = isL ? 25 : 21;
        var iHZ = isL ? 22 : 18;
        var iHY = isL ? 24 : 20;

        var hipBase = mult(wRoot, translate(oX, 0, 0));
        var hipPos = mult(hipBase, vec4(0, 0, 0, 1));

        var hipZ = mult(hipBase, rotate(pose[iHZ], 0, 0, 1));
        var hipZ = mult(hipBase, rotate(pose[iHZ], 0, 0, 1));

        var hipFull = mult(hipZ, rotate(pose[iHX], 1, 0, 0));
        hipFull = mult(hipFull, rotate(pose[iHY], 0, 1, 0));
        var kneeM = mult(hipFull, translate(0, -IK_L1, 0));
        kneeM = mult(kneeM, rotate(pose[iKX], 1, 0, 0));
        var footW = mult(kneeM, vec4(0, -IK_L2, 0, 1));

        return {
            hipPos: hipPos,
            footW: footW,
            hipZ: hipZ,
            iHX: iHX,
            iKX: iKX
        };
    }

    function ik2Link(hipZM, hipPos, target) {
        var w = [
            target[0] - hipPos[0],
            target[1] - hipPos[1],
            target[2] - hipPos[2]
        ];

        var loc = _ikInvRotVec(hipZM, w);

        var u = -loc[1];
        var v = -loc[2];

        var D = Math.sqrt(u * u + v * v);

        if (D < 0.001) D = 0.001;
        if (D > IK_MAX_REACH) D = IK_MAX_REACH;
        var minR = Math.abs(IK_L1 - IK_L2) + 0.001;
        if (D < minR) D = minR;
        var cosK = (D * D - IK_L1 * IK_L1 - IK_L2 * IK_L2) / (2 * IK_L1 * IK_L2);
        cosK = Math.max(-1, Math.min(1, cosK));
        var kneeRad = Math.acos(cosK);

        var alpha = Math.atan2(v, u);
        var cosB = (IK_L1 * IK_L1 + D * D - IK_L2 * IK_L2) / (2 * IK_L1 * D);
        cosB = Math.max(-1, Math.min(1, cosB));
        var beta = Math.acos(cosB);
        var hipRad = alpha - beta;

        return {
            hipDeg: hipRad * 180 / Math.PI,
            kneeDeg: kneeRad * 180 / Math.PI
        };
    }

    function ikPlaneDist(data, target) {
        var w = [
            target[0] - data.hipPos[0],
            target[1] - data.hipPos[1],
            target[2] - data.hipPos[2]
        ];
        var loc = _ikInvRotVec(data.hipZ, w);
        return Math.sqrt(loc[1] * loc[1] + loc[2] * loc[2]);
    }

    var wRoot = buildWRoot(pelY);
    var dL = doL ? legData(wRoot, 0) : null;
    var dR = doR ? legData(wRoot, 1) : null;

    var tL = dL ? [dL.footW[0], GROUND_Y, dL.footW[2]] : null;
    var tR = dR ? [dR.footW[0], GROUND_Y, dR.footW[2]] : null;

    // Position-based IK skip: if a foot is already above ground in FK,
    // don't anchor it (e.g., during a jump or kick).
    var IK_SKIP_THRESHOLD = 0.05;
    if (dL && dL.footW[1] > GROUND_Y + IK_SKIP_THRESHOLD) { dL = null; tL = null; }
    if (dR && dR.footW[1] > GROUND_Y + IK_SKIP_THRESHOLD) { dR = null; tR = null; }

    var pelAdj = 0;
    var entries = [];
    if (dL && tL) entries.push({ d: dL, t: tL });
    if (dR && tR) entries.push({ d: dR, t: tR });

    for (var i = 0; i < entries.length; i++) {
        var dist = ikPlaneDist(entries[i].d, entries[i].t);
        if (dist > IK_MAX_REACH) {
            var needed = -(dist - IK_MAX_REACH);
            if (needed < pelAdj) pelAdj = needed;
        }
    }

    if (pelAdj !== 0) {
        pelY += pelAdj;
        pose[26] = pelY;
        wRoot = buildWRoot(pelY);
        if (doL) dL = legData(wRoot, 0);
        if (doR) dR = legData(wRoot, 1);
    }

    if (dL && tL) {
        var solL = ik2Link(dL.hipZ, dL.hipPos, tL);
        pose[dL.iHX] = solL.hipDeg;
        pose[dL.iKX] = solL.kneeDeg;
    }
    if (dR && tR) {
        var solR = ik2Link(dR.hipZ, dR.hipPos, tR);
        pose[dR.iHX] = solR.hipDeg;
        pose[dR.iKX] = solR.kneeDeg;
    }

    return pose;
}
