window.onload = function init(){
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if(!gl){
        this.alert("WebGL is not avaiable");
    }
    
    vertices = initVertices(); // Faudra la faire la fonction

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var aspect = 1024/512;
    projectionMatrix = ortho(-aspect*2, aspect*2, -2, 2, -10, 10);
    var eye = vec3(0, 0, 0);
    var at = vec3(0, 0, 0);
    var up = vec3(0.0, 1.0, 0.0);
    modelViewMatrix = lookAt(eye, at, up);

    // Locations
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    // Attribute Location
    vPosition = gl.getAttribLocation(program, "vPosition");
    vNormal = gl.getAttribLocation(program, "vNormal");

    // Store data in Buffers
    initBuffer();

    // Enabling Attributes
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    if(vNormal >= 0){
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vNormal);
    }

    initFigures();

    // Enabling Culling
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    // Rendering
    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var base = modelViewMatrix;
    for(var i=0; i<numFigures; i++){
        var offset = root_offsets[i] || [0.0, 0.0, 0.0];
        modelViewMatrix = mult(base, translate(offset[0], offset[1], offset[2]));
        traverse(ID_Root, figures[i]);
    }
    modelViewMatrix = base;
    requestAnimationFrame(render);
}

// Function to initialize all buffers once
function initBuffer(){
    buffers = {};
    vertexCounts = {};
    var keys = Object.keys(vertices);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var data = vertices[key];
        buffers[key] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers[key]);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(data), gl.STATIC_DRAW);
        vertexCounts[key] = data.length;
    }
}

// Function to set vertices array
function initVertices(){
    var data = {};
    data["sphere"] = buildSphereSection(1, mesh_slices, mesh_stacks, 0, Math.PI);
    data["hemiUp"] = buildSphereSection(1, mesh_slices, mesh_stacks, 0, Math.PI / 2);
    data["hemiDown"] = buildSphereSection(1, mesh_slices, mesh_stacks, Math.PI / 2, Math.PI);
    data["cylinder"] = buildCylinder(1, 1, mesh_slices);
    return data;
}

function drawMesh(key, matrix){
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(matrix));
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[key]);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, vertexCounts[key]);
}

function drawCapsule(length, radius, centered){
    var top = centered ? length / 2 : radius;
    var bottom = centered ? -length / 2 : -length + radius;
    var cylinderLength = length - 2 * radius;

    if(cylinderLength > 0.001){
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

function drawPart(name){
    switch(name){
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
function createNode(transform, render, sibling, child){
    var node = {
        transform : transform,  // 4x4 Homogenous coordinates Matrix
        render : render,        // Which render function we want to use
        sibling : sibling,      // Store right sibling of the node
        child : child};         // Store the leftmost child
    return node;
}

function root(){ }
function spine(){
    var saved = modelViewMatrix;
    modelViewMatrix = mult(modelViewMatrix, translate(0, spine_height / 2 - spine_radius, 0));
    drawPart("spine");
    modelViewMatrix = saved;
}
function torso(){
    var saved = modelViewMatrix;
    modelViewMatrix = mult(modelViewMatrix, translate(0, torse_height / 2 - torso_radius, 0));
    drawPart("torso");
    modelViewMatrix = saved;
}
function head(){
    var m = mult(modelViewMatrix, scalem(head_radius, head_radius, head_radius));
    drawMesh("sphere", m);
}
function leftShoulder(){ drawPart("leftShoulder"); }
function leftElbow(){ drawPart("leftElbow"); }
function rightShoulder(){ drawPart("rightShoulder"); }
function rightElbow(){ drawPart("rightElbow"); }
function leftHip(){ drawPart("leftHip"); }
function leftKnee(){ drawPart("leftKnee"); }
function rightHip(){ drawPart("rightHip"); }
function rightKnee(){ drawPart("rightKnee"); }

function traverse(id, figure){
    if(id == null){
        return;
    }
    // Save the state of the recursivity
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[id].transform);
    figure[id].render();

    // Traverse all childs
    if(figure[id].child != null){
        traverse(figure[id].child, figure);
    }

    // Comeback to initial state
    modelViewMatrix = stack.pop();

    // Traverse all siblings
    if(figure[id].sibling != null){
        traverse(figure[id].sibling, figure);
    }
}

function initFigures(){
    figures = [];
    thetas = [];
    for(var f = 0; f < numFigures; f++){
        figures[f] = [];
        for(var i = 0; i < numNodes; i++){
            figures[f][i] = createNode(null, null, null, null);
        }
        thetas[f] = defaultTheta.slice();
        initFigure(figures[f], thetas[f]);
    }
}

function initFigure(figure, theta){
    for(var i=0; i<numNodes; i++){
        initNodes(i, figure, theta);
    }
}

var defaultTheta = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -45, 0, 0, 0, 45, 0, 0, 0, -20, 0, 0, 0, 20, 0, 0, 0];

// Initialization of the Hierarchical Model
function initNodes(id, figure, theta){
    var m = mat4();
    switch(id){
        case ID_Root:
            m = mult(m, rotate(theta[0], 1, 0, 0));
            m = mult(m, rotate(theta[1], 0, 1, 0));
            m = mult(m, rotate(theta[2], 0, 0, 1));
            figure[ID_Root] = createNode(m, root, null, ID_Spine);
            break;
        case ID_Spine:
            m = translate(0, spine_offset_y, 0);
            m = mult(m, rotate(theta[3], 1, 0, 0));
            m = mult(m, rotate(theta[4], 0, 1, 0));
            m = mult(m, rotate(theta[5], 0, 0, 1));
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
            figure[ID_LeftKnee] = createNode(m, leftKnee, null, null);
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
            figure[ID_RightKnee] = createNode(m, rightKnee, null, null);    
            break;                          
    }
}

// Change animation
function updateAnimation(){

}