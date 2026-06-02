window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        this.alert("WebGL is not avaiable");
    }

    vertices = initVertices();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.30, 0.30, 0.30, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var aspect = 1024 / 512;
    projectionMatrix = ortho(-aspect * 3, aspect * 3, -3, 3, -10, 10);
    eye = vec3(0, GROUND_Y + 2.0, 7.0);
    at = vec3(0, GROUND_Y + 1.2, 0);
    up = vec3(0, 1, 0);
    orbitRadius = Math.sqrt(eye[0] * eye[0] + eye[1] * eye[1] + eye[2] * eye[2]);
    modelViewMatrix = lookAt(eye, at, up);

    canvas.addEventListener("mousemove", function (e) {
        if (!cameraFollowMouse) return;
        var rect = canvas.getBoundingClientRect();
        var mx = e.clientX - rect.left;
        var my = e.clientY - rect.top;
        var phi = (mx / canvas.width) * 2.0 * Math.PI;
        var theta = 0.15 + (my / canvas.height) * (Math.PI - 0.3);
        eye[0] = orbitRadius * Math.sin(theta) * Math.cos(phi);
        eye[1] = orbitRadius * Math.cos(theta);
        eye[2] = orbitRadius * Math.sin(theta) * Math.sin(phi);
    });

    window.addEventListener("keydown", function (e) {
        if (e.code === "Space") {
            e.preventDefault();
            cameraFollowMouse = !cameraFollowMouse;
        }
    });

    // Locations
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    lightPositionLoc = gl.getUniformLocation(program, "lightPosition");
    AmbientProductLoc = gl.getUniformLocation(program, "ambientProduct");
    DiffuseProductLoc = gl.getUniformLocation(program, "diffuseProduct");
    SpecularProductLoc = gl.getUniformLocation(program, "specularProduct");
    ShininessLoc = gl.getUniformLocation(program, "shininess");
    useLightingLoc = gl.getUniformLocation(program, "useLighting");
    flatColorLoc = gl.getUniformLocation(program, "flatColor");
    tintColorLoc = gl.getUniformLocation(program, "tintColor");
    gl.uniform4fv(tintColorLoc, flatten(vec4(1.0, 1.0, 1.0, 1.0)));

    AmbientProduct = mult(lightAmbient, materialAmbient);
    DiffuseProduct = mult(lightDiffuse, materialDiffuse);
    SpecularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(lightPositionLoc, flatten(lightPosition));
    gl.uniform4fv(AmbientProductLoc, flatten(AmbientProduct));
    gl.uniform4fv(DiffuseProductLoc, flatten(DiffuseProduct));
    gl.uniform4fv(SpecularProductLoc, flatten(SpecularProduct));
    gl.uniform1f(ShininessLoc, materialShininess);
    gl.uniform1f(useLightingLoc, 1.0);
    gl.uniform4fv(flatColorLoc, flatten(materialDiffuse));
    // Attribute Location
    vPosition = gl.getAttribLocation(program, "vPosition");
    vNormal = gl.getAttribLocation(program, "vNormal");

    // Store data in Buffers
    initBuffer();

    // Enabling Attributes
    gl.enableVertexAttribArray(vPosition);

    if (vNormal >= 0) {
        gl.enableVertexAttribArray(vNormal);
    }

    initFigures();
    initAnimPlayer();
    initBackground();

    // Enabling Culling
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    // Rendering
    requestAnimationFrame(render);
}

var _lastRenderTime = null;

function render(now) {
    var dt = 0;
    if (_lastRenderTime !== null) dt = Math.min((now - _lastRenderTime) / 1000, 0.1);
    _lastRenderTime = now;

    var frozen = hitFreeze;
    if (!frozen) {
        updateAnimation(dt);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        modelViewMatrix = lookAt(eye, at, up);
        drawBackground();
        var base = modelViewMatrix;
        for (var i = 0; i < numFigures; i++) {
            var offset = root_offsets[i] || [0.0, 0.0, 0.0];
            modelViewMatrix = mult(base, translate(offset[0], offset[1], offset[2]));
            gl.uniform4fv(tintColorLoc, flatten(PLAYER_DIFFUSE[i] || PLAYER_DIFFUSE[0]));
            var isParrying = parryStates && parryStates[i] && parryStates[i].active;
            var isFlashing = hitFlashTimers && hitFlashTimers[i];
            if (isParrying) {
                gl.uniform1f(useLightingLoc, 0.0);
                gl.uniform4fv(flatColorLoc, flatten(vec4(0.0, 0.0, 0.0, 1.0)));
            } else if (isFlashing) {
                gl.uniform1f(useLightingLoc, 0.0);
                gl.uniform4fv(flatColorLoc, flatten(vec4(1.0, 1.0, 1.0, 1.0)));
            }
            traverse(ID_Root, figures[i]);
            if (isParrying || isFlashing) {
                gl.uniform1f(useLightingLoc, 1.0);
            }
        }
        modelViewMatrix = base;
    }
    requestAnimationFrame(render);
}

// Function to initialize all buffers once
function initBuffer() {
    buffers = {};
    normalBuffers = {};
    vertexCounts = {};
    var keys = Object.keys(vertices);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var data = vertices[key];
        buffers[key] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[key]);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);

        if (normals && normals[key]) {
            normalBuffers[key] = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[key]);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(normals[key]), gl.STATIC_DRAW);
        }
        vertexCounts[key] = data.length;
    }
}

var bgGroundBuffer, bgGroundCount;
var bgGridBuffer, bgGridCount;
var bgAxisBuffer, bgAxisCount;

function initBackground() {
    // 3D Ground: horizontal XZ plane at y=0
    var gy = 0.0;
    var gs = 24.0;
    var groundVerts = [
        vec3(-gs, gy, -gs), vec3(gs, gy, -gs), vec3(gs, gy, gs),
        vec3(-gs, gy, -gs), vec3(gs, gy, gs), vec3(-gs, gy, gs),
    ];
    bgGroundCount = groundVerts.length;
    bgGroundBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bgGroundBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(groundVerts), gl.STATIC_DRAW);

    // 2D Grid: screen-aligned (drawn with identity MV), dense, oversized to hide borders
    var gridVerts = [];
    var step = 0.25;
    for (var x = -6.0; x <= 6.01; x += step) {
        gridVerts.push(vec3(x, -4.0, 0.0));
        gridVerts.push(vec3(x, 4.0, 0.0));
    }
    for (var y = -4.0; y <= 4.01; y += step) {
        gridVerts.push(vec3(-6.0, y, 0.0));
        gridVerts.push(vec3(6.0, y, 0.0));
    }
    bgGridCount = gridVerts.length;
    bgGridBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bgGridBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(gridVerts), gl.STATIC_DRAW);

    // 3D axis line on the ground: X axis through origin
    var axisVerts = [
        vec3(-12, GROUND_Y, 0), vec3(12, GROUND_Y, 0),  // X axis
    ];
    bgAxisCount = axisVerts.length;
    bgAxisBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bgAxisBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(axisVerts), gl.STATIC_DRAW);

}

function drawBackground() {
    gl.uniform1f(useLightingLoc, 0.0);

    // 2D Grid
    gl.depthMask(false);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(mat4()));
    gl.uniform4fv(flatColorLoc, flatten(vec4(0.36, 0.36, 0.36, 1.0)));
    gl.bindBuffer(gl.ARRAY_BUFFER, bgGridBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, bgGridCount);

    // 3D Ground
    gl.depthMask(true);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniform4fv(flatColorLoc, flatten(vec4(0.16, 0.16, 0.16, 1.0)));
    gl.bindBuffer(gl.ARRAY_BUFFER, bgGroundBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, bgGroundCount);

    // Red line
    gl.uniform4fv(flatColorLoc, flatten(vec4(1.0, 0.0, 0.0, 1.0)));
    gl.bindBuffer(gl.ARRAY_BUFFER, bgAxisBuffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, bgAxisCount);

    gl.uniform1f(useLightingLoc, 1.0);
}

// Function to set vertices array
function initVertices() {
    var data = {};
    var normalData = {};
    data["sphere"] = buildSphereSection(1, mesh_slices, mesh_stacks, 0, Math.PI);
    normalData["sphere"] = buildSphereNormals(data["sphere"]);
    data["hemiUp"] = buildSphereSection(1, mesh_slices, mesh_stacks, 0, Math.PI / 2);
    normalData["hemiUp"] = buildSphereNormals(data["hemiUp"]);
    data["hemiDown"] = buildSphereSection(1, mesh_slices, mesh_stacks, Math.PI / 2, Math.PI);
    normalData["hemiDown"] = buildSphereNormals(data["hemiDown"]);
    data["cylinder"] = buildCylinder(1, 1, mesh_slices);
    normalData["cylinder"] = buildCylinderNormals(data["cylinder"]);
    normals = normalData;
    return data;
}

function drawMesh(key, matrix) {
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(matrix));
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[key]);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    if (vNormal >= 0 && normalBuffers[key]) {
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffers[key]);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    }
    gl.drawArrays(gl.TRIANGLES, 0, vertexCounts[key]);
}

function drawCapsule(length, radius, centered) {
    var top = centered ? length / 2 : radius;
    var bottom = centered ? -length / 2 : -length + radius;
    var cylinderLength = length - 2 * radius;

    if (cylinderLength > 0.001) {
        var center = (top + bottom) / 2;
        var m = mult(modelViewMatrix, translate(0, center, 0));
        m = mult(m, scalem(radius, cylinderLength, radius));
        drawMesh("cylinder", m);
    }

    var mTop = mult(modelViewMatrix, translate(0, top - radius, 0));
    mTop = mult(mTop, scalem(radius, radius, radius));
    drawMesh("hemiUp", mTop);

    var mBottom = mult(modelViewMatrix, translate(0, bottom + radius, 0));
    mBottom = mult(mBottom, scalem(radius, radius, radius));
    drawMesh("hemiDown", mBottom);
}

function drawPart(name) {
    switch (name) {
        case "spine":
            drawCapsule(spine_height, spine_radius, true);
            return;
        case "torso":
            drawCapsule(torse_height, torso_radius, true);
            return;
        case "leftShoulder":
        case "rightShoulder":
            drawCapsule(upper_arm_length, limb_radius, false);
            return;
        case "leftElbow":
        case "rightElbow":
            drawCapsule(lower_arm_length, limb_radius, false);
            return;
        case "leftHip":
        case "rightHip":
            drawCapsule(upper_leg_length, limb_radius, false);
            return;
        case "leftKnee":
        case "rightKnee":
            drawCapsule(lower_leg_length, limb_radius, false);
            return;

    }
}

// Create a node
function createNode(transform, render, sibling, child) {
    var node = {
        transform: transform,  // 4x4 Homogenous coordinates Matrix
        render: render,        // Which render function we want to use
        sibling: sibling,      // Store right sibling of the node
        child: child
    };         // Store the leftmost child
    return node;
}

function root() { }
function spine() {
    var saved = modelViewMatrix;
    modelViewMatrix = mult(modelViewMatrix, translate(0, spine_height / 2 - spine_radius, 0));
    drawPart("spine");
    modelViewMatrix = saved;
}
function torso() {
    var saved = modelViewMatrix;
    modelViewMatrix = mult(modelViewMatrix, translate(0, torse_height / 2 - torso_radius, 0));
    drawPart("torso");
    modelViewMatrix = saved;
}
function head() {
    var m = mult(modelViewMatrix, scalem(head_radius, head_radius, head_radius));
    drawMesh("sphere", m);
}
function leftShoulder() { drawPart("leftShoulder"); }
function leftElbow() { drawPart("leftElbow"); }
function rightShoulder() { drawPart("rightShoulder"); }
function rightElbow() { drawPart("rightElbow"); }
function leftHip() { drawPart("leftHip"); }
function leftKnee() { drawPart("leftKnee"); }
function rightHip() { drawPart("rightHip"); }
function rightKnee() { drawPart("rightKnee"); }

function traverse(id, figure) {
    if (id == null) {
        return;
    }
    // Save the state of the recursivity
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[id].transform);
    if (figure[id].render) {
        figure[id].render();
    }

    // Traverse all childs
    if (figure[id].child != null) {
        traverse(figure[id].child, figure);
    }

    // Comeback to initial state
    modelViewMatrix = stack.pop();

    // Traverse all siblings
    if (figure[id].sibling != null) {
        traverse(figure[id].sibling, figure);
    }
}

function initFigures() {
    figures = [];
    thetas = [];
    for (var f = 0; f < numFigures; f++) {
        figures[f] = [];
        for (var i = 0; i < numNodes; i++) {
            figures[f][i] = createNode(null, null, null, null);
        }
        thetas[f] = defaultTheta.slice();
        initFigure(figures[f], thetas[f]);
    }
}

function initFigure(figure, theta) {
    for (var i = 0; i < numNodes; i++) {
        initNodes(i, figure, theta);
    }
}

var defaultTheta = new Array(26).fill(0);

// Initialization of the Hierarchical Model
function initNodes(id, figure, theta) {
    var m = mat4();
    var pelvisY = theta[26] || 0;
    switch (id) {
        case ID_Root:
            if (pelvisY !== 0) {
                m = mult(m, translate(0, pelvisY, 0));
            }
            m = mult(m, rotate(theta[0], 1, 0, 0));
            m = mult(m, rotate(theta[1], 0, 1, 0));
            m = mult(m, rotate(theta[2], 0, 0, 1));
            figure[ID_Root] = createNode(m, root, null, ID_Spine);
            break;
        case ID_Spine:
            m = translate(0, spine_offset_y, 0);
            m = mult(m, rotate(theta[3], 1, 0, 0));
            m = mult(m, rotate(theta[4], 0, 0, 1));
            m = mult(m, rotate(theta[5], 0, 1, 0));
            figure[ID_Spine] = createNode(m, spine, ID_LeftHip, ID_Torso);
            break;
        case ID_Torso:
            m = translate(0, torso_offset_y, 0);
            m = mult(m, rotate(theta[6], 1, 0, 0));
            figure[ID_Torso] = createNode(m, torso, null, ID_Head);
            break;
        case ID_Head:
            m = translate(0, head_offset_y, 0);
            m = mult(m, rotate(theta[7], 1, 0, 0));
            m = mult(m, rotate(theta[8], 0, 1, 0));
            m = mult(m, rotate(theta[9], 0, 0, 1));
            figure[ID_Head] = createNode(m, head, ID_LeftShoulder, null);
            break;
        case ID_LeftShoulder:
            m = translate(-shoulder_offset_x, shoulder_offset_y, 0);
            m = mult(m, rotate(theta[10], 0, 0, 1));    // Elevation latérale du bras
            m = mult(m, rotate(theta[11], 1, 0, 0));    // Elevation du bras vers l'avant-arrière
            m = mult(m, rotate(theta[12], 0, 1, 0));    // Torsion
            figure[ID_LeftShoulder] = createNode(m, leftShoulder, ID_RightShoulder, ID_LeftElbow);
            break;
        case ID_LeftElbow:
            m = translate(0, -upper_arm_length + 2 * limb_radius, 0);
            m = mult(m, rotate(theta[13], 1, 0, 0));   // Flexion-Extention
            figure[ID_LeftElbow] = createNode(m, leftElbow, null, null);
            break;
        case ID_RightShoulder:
            m = translate(shoulder_offset_x, shoulder_offset_y, 0);
            m = mult(m, rotate(theta[14], 0, 0, 1));    // Elevation latérale du bras
            m = mult(m, rotate(theta[15], 1, 0, 0));    // Elevation du bras vers l'avant-arrière
            m = mult(m, rotate(theta[16], 0, 1, 0));    // Torsion
            figure[ID_RightShoulder] = createNode(m, rightShoulder, null, ID_RightElbow);
            break;
        case ID_RightElbow:
            m = translate(0, -upper_arm_length + 2 * limb_radius, 0);
            m = mult(m, rotate(theta[17], 1, 0, 0));    // Flexion-Extention
            figure[ID_RightElbow] = createNode(m, rightElbow, null, null);
            break;
        case ID_LeftHip:
            m = translate(-hip_offset_x, 0, 0);
            m = mult(m, rotate(theta[18], 0, 0, 1));    // Elevation latérale du bras
            m = mult(m, rotate(theta[19], 1, 0, 0));    // Elevation du bras vers l'avant-arrière
            m = mult(m, rotate(theta[20], 0, 1, 0));    // Torsion
            figure[ID_LeftHip] = createNode(m, leftHip, ID_RightHip, ID_LeftKnee);
            break;
        case ID_LeftKnee:
            m = translate(0, -upper_leg_length + 2 * limb_radius, 0);
            m = mult(m, rotate(theta[21], 1, 0, 0));    // Flexion-Extention
            figure[ID_LeftKnee] = createNode(m, leftKnee, null, ID_LeftFoot);
            break;
        case ID_RightHip:
            m = translate(hip_offset_x, 0, 0);
            m = mult(m, rotate(theta[22], 0, 0, 1));    // Elevation latérale du bras
            m = mult(m, rotate(theta[23], 1, 0, 0));    // Elevation du bras vers l'avant-arrière
            m = mult(m, rotate(theta[24], 0, 1, 0));    // Torsion
            figure[ID_RightHip] = createNode(m, rightHip, null, ID_RightKnee);
            break;
        case ID_RightKnee:
            m = translate(0, -upper_leg_length + 2 * limb_radius, 0);
            m = mult(m, rotate(theta[25], 1, 0, 0));    // Flexion-Extention
            figure[ID_RightKnee] = createNode(m, rightKnee, null, ID_RightFoot);
            break;
        case ID_LeftFoot:
            // Keep only the joint transform (no foot rotation or drawing).
            m = translate(0, -lower_leg_length + 2 * limb_radius, 0);
            figure[ID_LeftFoot] = createNode(m, null, null, null);
            break;
        case ID_RightFoot:
            // Keep only the joint transform (no foot rotation or drawing).
            m = translate(0, -lower_leg_length + 2 * limb_radius, 0);
            figure[ID_RightFoot] = createNode(m, null, null, null);
            break;
    }
}

// Tick all figures: advance state machine, compute pose, rebuild skeleton
function clampPoseToGround(f, pose) {
    if (!pose) return pose;

    var rootOffset = root_offsets[f] || [0.0, GROUND_Y + LEG_HEIGHT, 0.0];
    var pelvisY = pose[26] || 0;

    // Estimate the character's lowest point from pelvis height and nominal leg reach.
    var minY = rootOffset[1] + pelvisY - LEG_HEIGHT;
    if (minY < GROUND_Y) {
        pose[26] = pelvisY + (GROUND_Y - minY);
    }

    return pose;
}

function updateAnimation(dt) {
    processInput(dt);
    for (var f = 0; f < numFigures; f++) {
        if (root_offsets[f]) root_offsets[f][0] = figurePositions[f];
        advanceAnimState(f, dt);
        var pose = getCurrentPose(f);

        // Lire le ikGround de l'animation courante (défaut : les deux pieds ancrés)
        var animName = animStates[f].name;
        var anim = ANIMS[animName];
        var ikCfg = (anim && anim.ikGround) ? anim.ikGround : null;

        // Smooth facing blend: 0 = facing right, 1 = facing left
        var facingTarget = facingRight[f] ? 0 : 1;
        if (facingBlend[f] < facingTarget) {
            facingBlend[f] = Math.min(facingTarget, facingBlend[f] + TURN_SPEED * dt);
        } else if (facingBlend[f] > facingTarget) {
            facingBlend[f] = Math.max(facingTarget, facingBlend[f] - TURN_SPEED * dt);
        }

        var fb = facingBlend[f];
        if (fb > 0.999) {
            // apply mirror if fully facing left
            pose = mirrorPose(pose);
        } else if (fb > 0.001) {
            // blend between normal and mirrored pose
            var mirrored = mirrorPose(pose);
            pose = lerpPose(pose, mirrored, fb);
            ikCfg = { LeftFoot: true, RightFoot: true };  // ground both feet during turn
        }

        pose = solveFootIK(pose, f, ikCfg);
        initFigure(figures[f], pose);
    }
}