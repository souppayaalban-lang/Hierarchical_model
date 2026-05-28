"use strict";
// ============================================================
//  IK Ground Solver — Ancrage simultané des pieds au sol
// ============================================================
//  Résout une IK analytique 2 segments (cuisse + tibia) dans le
//  plan sagittal pour chaque pied activé, en forçant la position
//  du bout du pied à GROUND_Y.
//
//  Les deux jambes sont traitées SIMULTANÉMENT : elles partagent
//  le même pelvisY (ajusté si nécessaire pour que les deux cibles
//  soient atteignables).
//
//  Seuls les angles d'élévation de la hanche (X-rotation) et de
//  flexion du genou (X-rotation) sont modifiés — pas d'élévation
//  latérale ni de torsion (contrainte plan sagittal).
// ============================================================

// --- Valeur par défaut si l'animation ne définit pas de ikGround ---
var IK_GROUND_DEFAULT = { LeftFoot: true, RightFoot: true };

// --- Constantes IK (calculées à la première utilisation) ---
var IK_L1 = 0;          // longueur cuisse (joint hanche → joint genou)
var IK_L2 = 0;          // longueur tibia  (joint genou → bout du pied)
var IK_MAX_REACH = 0;   // portée maximale de la jambe (jambe tendue)

function _ikEnsureInit() {
    if (IK_L1 > 0) return;
    // Distances articulaires effectives, identiques à celles de initNodes
    IK_L1 = upper_leg_length - 2 * limb_radius;   // 0.7 - 0.16 = 0.54
    IK_L2 = lower_leg_length - 2 * limb_radius;   // 0.6 - 0.16 = 0.44
    IK_MAX_REACH = IK_L1 + IK_L2;                 // 0.98
}

// ---------------------------------------------------------------
//  Helper : rotation inverse (R^T) d'un vecteur 3D
//  R = partie rotationnelle 3×3 de la matrice m (MV.js row-major)
//  Utile pour convertir un vecteur monde en vecteur local.
// ---------------------------------------------------------------
function _ikInvRotVec(m, v) {
    // (R^T * v)[i] = sum_j  m[j][i] * v[j]
    return [
        m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2],
        m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2],
        m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2]
    ];
}

// ---------------------------------------------------------------
//  Solveur principal
// ---------------------------------------------------------------

/**
 * Applique l'IK d'ancrage au sol sur le pose array d'une figure.
 * Modifie pose[] en place et le retourne.
 *
 * Pipeline :
 *   1. Construire le repère monde du Root
 *   2. Calculer les positions FK des pieds ancrés
 *   3. Définir les cibles (FK.x, GROUND_Y, FK.z)
 *   4. Ajuster pelvisY si une cible est hors de portée (simultané)
 *   5. Résoudre l'IK 2-segments pour chaque jambe
 *
 * @param {number[]} pose     - Tableau d'angles FK (27 entrées)
 * @param {number}   fIdx     - Index de la figure (0 = P1, 1 = P2)
 * @param {Object}  [ikConfig] - { LeftFoot: bool, RightFoot: bool }
 *                               Si omis, utilise IK_GROUND_DEFAULT.
 * @returns {number[]} Le pose modifié
 */
function solveFootIK(pose, fIdx, ikConfig) {
    _ikEnsureInit();

    var cfg = ikConfig || IK_GROUND_DEFAULT;
    var doL = cfg.LeftFoot;
    var doR = cfg.RightFoot;
    if (!doL && !doR) return pose;

    var rootOff = root_offsets[fIdx] || [0, GROUND_Y + LEG_HEIGHT, 0];
    var pelY = pose[26] || 0;

    // ---- Construit la matrice monde du Root pour un pelvisY donné ----
    // Reproduit exactement la logique de initNodes(ID_Root) + l'offset monde
    function buildWRoot(pY) {
        var m = mat4();
        if (pY !== 0) m = mult(m, translate(0, pY, 0));
        m = mult(m, rotate(pose[0], 1, 0, 0));
        m = mult(m, rotate(pose[1], 0, 1, 0));
        m = mult(m, rotate(pose[2], 0, 0, 1));
        return mult(translate(rootOff[0], rootOff[1], rootOff[2]), m);
    }

    // ---- Données FK d'une jambe (position monde de la hanche et du pied) ----
    // Reproduit la chaîne de transforms de initNodes pour Hip → Knee → Foot.
    // side : 0 = left (= lHip dans pose()), 1 = right (= rHip dans pose())
    //
    // ATTENTION convention pose() : lHip → theta[22-25] (skeleton RightHip)
    //                                rHip → theta[18-21] (skeleton LeftHip)
    // On suit la convention de l'animation (lHip/rHip), pas celle du squelette.
    function legData(wRoot, side) {
        var isL  = (side === 0);
        var oX   = isL ? hip_offset_x : -hip_offset_x;
        var iHX  = isL ? 23 : 19;   // indice theta hanche X-élévation
        var iKX  = isL ? 25 : 21;   // indice theta genou  X-flexion
        var iHZ  = isL ? 22 : 18;   // indice theta hanche Z-latéral
        var iHY  = isL ? 24 : 20;   // indice theta hanche Y-twist

        // Position monde du joint de la hanche (avant rotations de hanche)
        var hipBase = mult(wRoot, translate(oX, 0, 0));
        var hipPos  = mult(hipBase, vec4(0, 0, 0, 1));  // MV.js: mat * vec4

        // Applique la rotation Z-latérale (précède le X dans la chaîne de transforms).
        // L'IK résout l'angle X dans ce repère déjà tourné en Z.
        var hipZ = mult(hipBase, rotate(pose[iHZ], 0, 0, 1));

        // Chaîne FK complète pour obtenir la position monde du pied
        var hipFull = mult(hipZ, rotate(pose[iHX], 1, 0, 0));
        hipFull = mult(hipFull, rotate(pose[iHY], 0, 1, 0));
        var kneeM = mult(hipFull, translate(0, -IK_L1, 0));
        kneeM = mult(kneeM, rotate(pose[iKX], 1, 0, 0));
        var footW = mult(kneeM, vec4(0, -IK_L2, 0, 1));

        return {
            hipPos: hipPos,   // vec4, position monde de la hanche
            footW:  footW,    // vec4, position monde du pied FK
            hipZ:   hipZ,     // mat4, repère hanche après Z-rotation (plan IK)
            iHX:    iHX,
            iKX:    iKX
        };
    }

    // ---- IK analytique 2 segments dans le plan sagittal ----
    //
    // Système de coordonnées (u, v) dans le plan Y-Z du repère de la hanche :
    //   u = direction -Y locale (vers le bas, le long de la jambe droite)
    //   v = direction -Z locale (vers l'arrière, sens naturel de flexion du genou)
    //
    // L'angle de rotation X de la hanche correspond directement à l'angle
    // mesuré depuis u vers v dans ce plan.
    //
    // Retourne { hipDeg, kneeDeg } en degrés.
    function ik2Link(hipZM, hipPos, target) {
        // Vecteur monde hanche → cible
        var w = [
            target[0] - hipPos[0],
            target[1] - hipPos[1],
            target[2] - hipPos[2]
        ];

        // Projeter dans le repère local (après Z-rotation de la hanche)
        var loc = _ikInvRotVec(hipZM, w);

        // Plan de rotation X = Y-Z local
        // u = -localY (bas), v = -localZ (arrière / sens de flexion du genou)
        var u = -loc[1];
        var v = -loc[2];

        var D = Math.sqrt(u * u + v * v);

        // Sécurité : borner D pour éviter les cas dégénérés
        if (D < 0.001) D = 0.001;
        if (D > IK_MAX_REACH) D = IK_MAX_REACH;
        var minR = Math.abs(IK_L1 - IK_L2) + 0.001;
        if (D < minR) D = minR;

        // --- Angle du genou (loi des cosinus) ---
        // D² = L1² + L2² + 2·L1·L2·cos(θk)
        var cosK = (D * D - IK_L1 * IK_L1 - IK_L2 * IK_L2) / (2 * IK_L1 * IK_L2);
        cosK = Math.max(-1, Math.min(1, cosK));
        var kneeRad = Math.acos(cosK);   // ≥ 0 (genou fléchi vers l'arrière)

        // --- Angle de la hanche ---
        // alpha = angle du vecteur cible depuis u (bas) vers v (arrière)
        var alpha = Math.atan2(v, u);
        // beta  = angle entre la cuisse et la droite hanche → cible
        var cosB = (IK_L1 * IK_L1 + D * D - IK_L2 * IK_L2) / (2 * IK_L1 * D);
        cosB = Math.max(-1, Math.min(1, cosB));
        var beta = Math.acos(cosB);
        // Le genou fléchit dans la direction +v → solution alpha - beta
        var hipRad = alpha - beta;

        return {
            hipDeg:  hipRad  * 180 / Math.PI,
            kneeDeg: kneeRad * 180 / Math.PI
        };
    }

    // ---- Distance dans le plan IK (pour vérifier l'atteignabilité) ----
    function ikPlaneDist(data, target) {
        var w = [
            target[0] - data.hipPos[0],
            target[1] - data.hipPos[1],
            target[2] - data.hipPos[2]
        ];
        var loc = _ikInvRotVec(data.hipZ, w);
        return Math.sqrt(loc[1] * loc[1] + loc[2] * loc[2]);
    }

    // ================ PIPELINE IK SIMULTANÉ ================

    // 1. Construire le repère monde avec le pelvisY courant
    var wRoot = buildWRoot(pelY);

    // 2. Calculer les données FK des jambes ancrées
    var dL = doL ? legData(wRoot, 0) : null;
    var dR = doR ? legData(wRoot, 1) : null;

    // 3. Définir les cibles : conserver le X/Z du FK, forcer Y = GROUND_Y
    var tL = dL ? [dL.footW[0], GROUND_Y, dL.footW[2]] : null;
    var tR = dR ? [dR.footW[0], GROUND_Y, dR.footW[2]] : null;

    // 4. Ajustement SIMULTANÉ du pelvisY si une cible est hors de portée.
    //    On prend l'ajustement le plus contraignant (le plus négatif = bassin
    //    le plus bas) pour satisfaire les deux jambes.
    var pelAdj = 0;
    var entries = [];
    if (dL && tL) entries.push({ d: dL, t: tL });
    if (dR && tR) entries.push({ d: dR, t: tR });

    for (var i = 0; i < entries.length; i++) {
        var dist = ikPlaneDist(entries[i].d, entries[i].t);
        if (dist > IK_MAX_REACH) {
            // Besoin de descendre le bassin. Approximation : la descente
            // nécessaire est la différence entre D et la portée maximale.
            var needed = -(dist - IK_MAX_REACH);   // négatif = descendre
            if (needed < pelAdj) pelAdj = needed;
        }
    }

    if (pelAdj !== 0) {
        pelY += pelAdj;
        pose[26] = pelY;

        // Recalculer avec le nouveau pelvisY.
        // Les cibles X/Z restent inchangées (on garde les positions FK originales).
        wRoot = buildWRoot(pelY);
        if (doL) dL = legData(wRoot, 0);
        if (doR) dR = legData(wRoot, 1);
    }

    // 5. Résoudre l'IK pour chaque jambe ancrée.
    //    Les deux utilisent le même pelvisY → traitement SIMULTANÉ.
    if (dL && tL) {
        var solL = ik2Link(dL.hipZ, dL.hipPos, tL);
        pose[dL.iHX] = solL.hipDeg;    // hanche gauche X-élévation
        pose[dL.iKX] = solL.kneeDeg;   // genou gauche  X-flexion
    }
    if (dR && tR) {
        var solR = ik2Link(dR.hipZ, dR.hipPos, tR);
        pose[dR.iHX] = solR.hipDeg;    // hanche droite X-élévation
        pose[dR.iKX] = solR.kneeDeg;   // genou droit   X-flexion
    }

    return pose;
}
