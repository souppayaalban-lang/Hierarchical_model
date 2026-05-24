var buffers = {};  // Ici on mettra la liste des buffers
var vertices = {}; // Ici on mettra les tableaux de sommets pour chaque objet

var gl;
var canvas;
var vPosition; var vNormal;

var modelViewMatrixLoc;       var modelViewMatrix;
var projectionViewMatrixLoc;  var projectionViewMatrix;
var projectionMatrixLoc;      var projectionMatrix;
var vertexCounts = {};

var ID_Root = 0;
var ID_Spine = 1;
var ID_Torso = 2;
var ID_Head = 3;
var ID_LeftShoulder = 4;
var ID_RightShoulder = 5;
var ID_LeftElbow = 6;
var ID_RightElbow = 7;
var ID_LeftHip = 8;
var ID_RightHip = 9;
var ID_LeftKnee = 10;
var ID_RightKnee = 11;
var numNodes = 12;

var theta = new Array(23).fill(0);

var stack = [];
var figure = [];
for(var i=0; i<numNodes; i++){
    figure[i] = createNode(null, null, null, null);
}

var torse_height = 0.6;
var head_height = 0.5;
var head_radius = head_height / 2;
var upper_arm_length = 0.8;
var lower_arm_length = 0.6;
var upper_leg_length = 0.8;
var lower_leg_length = 0.6;

var spine_height = 0.6;
var torso_radius = 0.10;
var spine_radius = 0.10;
var limb_radius = 0.08;

var mesh_slices = 20;
var mesh_stacks = 20;

var shoulder_offset_x = 0.05;
var hip_offset_x = 0.05;

var torso_offset_y = spine_height - 2 * spine_radius;
var spine_offset_y = 0;
var shoulder_offset_y = torse_height - 2 * torso_radius;
var head_offset_y = shoulder_offset_y + head_height / 2;


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
    var eye = vec3(3.0, 1.2, -3);
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

    initFigure();

    // Enabling Culling
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);

    // Rendering
    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    traverse(ID_Root);
    requestAnimationFrame(render);
}

// Function to change Object Buffer
function ChangeObjectTo(buffer, nBuffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    if(vNormal >= 0){
        gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
        gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    }
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

function buildSphereSection(radius, slices, stacks, phiStart, phiEnd){
    var verts = [];
    var phiRange = phiEnd - phiStart;
    for(var stack = 0; stack < stacks; stack++){
        var phi0 = phiStart + phiRange * stack / stacks;
        var phi1 = phiStart + phiRange * (stack + 1) / stacks;
        var y0 = Math.cos(phi0);
        var y1 = Math.cos(phi1);
        var r0 = Math.sin(phi0);
        var r1 = Math.sin(phi1);

        for(var slice = 0; slice < slices; slice++){
            var theta0 = 2 * Math.PI * slice / slices;
            var theta1 = 2 * Math.PI * (slice + 1) / slices;

            var x00 = r0 * Math.cos(theta0);
            var z00 = r0 * Math.sin(theta0);
            var x01 = r0 * Math.cos(theta1);
            var z01 = r0 * Math.sin(theta1);
            var x10 = r1 * Math.cos(theta0);
            var z10 = r1 * Math.sin(theta0);
            var x11 = r1 * Math.cos(theta1);
            var z11 = r1 * Math.sin(theta1);

            verts.push(vec3(radius * x00, radius * y0, radius * z00));
            verts.push(vec3(radius * x11, radius * y1, radius * z11));
            verts.push(vec3(radius * x10, radius * y1, radius * z10));

            verts.push(vec3(radius * x00, radius * y0, radius * z00));
            verts.push(vec3(radius * x01, radius * y0, radius * z01));
            verts.push(vec3(radius * x11, radius * y1, radius * z11));
        }
    }
    return verts;
}

function buildCylinder(radius, height, slices){
    var verts = [];
    var y0 = -height / 2;
    var y1 = height / 2;
    for(var slice = 0; slice < slices; slice++){
        var theta0 = 2 * Math.PI * slice / slices;
        var theta1 = 2 * Math.PI * (slice + 1) / slices;
        var x0 = radius * Math.cos(theta0);
        var z0 = radius * Math.sin(theta0);
        var x1 = radius * Math.cos(theta1);
        var z1 = radius * Math.sin(theta1);

        verts.push(vec3(x0, y0, z0));
        verts.push(vec3(x0, y1, z0));
        verts.push(vec3(x1, y1, z1));

        verts.push(vec3(x0, y0, z0));
        verts.push(vec3(x1, y1, z1));
        verts.push(vec3(x1, y0, z1));
    }
    return verts;
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

function getPartSpec(name){
    switch(name){
        case "spine":
            return { length: spine_height, radius: spine_radius, centered: true};
        case "torso":
            return { length: torse_height, radius: torso_radius, centered: true };
        case "leftShoulder":
        case "rightShoulder":
            return { length: upper_arm_length, radius: limb_radius, centered: false };
        case "leftElbow":
        case "rightElbow":
            return { length: lower_arm_length, radius: limb_radius, centered: false };
        case "leftHip":
        case "rightHip":
            return { length: upper_leg_length, radius: limb_radius, centered: false };
        case "leftKnee":
        case "rightKnee":
            return { length: lower_leg_length, radius: limb_radius, centered: false };
    }
    return null;
}

function drawPart(name){
    var spec = getPartSpec(name);
    if(!spec){
        return;
    }
    drawCapsule(spec.length, spec.radius, spec.centered);
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

function traverse(id){
    if(id == null){
        return;
    }
    // Save the state of the recursivity
    stack.push(modelViewMatrix);
    modelViewMatrix = mult(modelViewMatrix, figure[id].transform);
    figure[id].render();

    // Traverse all childs
    if(figure[id].child != null){
        traverse(figure[id].child);
    }

    // Comeback to initial state
    modelViewMatrix = stack.pop();

    // Traverse all siblings
    if(figure[id].sibling != null){
        traverse(figure[id].sibling);
    }
}

function initFigure(){
    for(var i=0; i<numNodes; i++){
        initNodes(i);
    }
}

theta = [0, 0, 0, 0, 0, 0, 0, -90, 0, 0, -30, 90, 0, 0, -30, -20, 0, 0, 0, 20, 0, 0, 0, 0]

// Initialization of the Hierarchical Model
function initNodes(id){
    var m = mat4();
    switch(id){
        case ID_Root:
            figure[ID_Root] = createNode(m, root, null, ID_Spine);
            break;
        case ID_Spine:
            m = translate(0, spine_offset_y, 0);
            m = mult(m, rotate(theta[0], 1, 0, 0));
            m = mult(m, rotate(theta[1], 0, 1, 0));
            m = mult(m, rotate(theta[2], 0, 0, 1));
            figure[ID_Spine] = createNode(m, spine, ID_LeftHip, ID_Torso);
            break;
        case ID_Torso:
            m = translate(0, torso_offset_y, 0);
            m = mult(m, rotate(theta[3], 1, 0, 0));
            figure[ID_Torso] = createNode(m, torso, null, ID_Head);
            break;
        case ID_Head:
            m = translate(0, head_offset_y, 0);
            m = mult(m, rotate(theta[4], 1, 0, 0));
            m = mult(m, rotate(theta[5], 0, 1, 0));
            m = mult(m, rotate(theta[6], 0, 0, 1));
            figure[ID_Head] = createNode(m, head, ID_LeftShoulder, null);
            break;
        case ID_LeftShoulder:
            m = translate(-shoulder_offset_x, shoulder_offset_y, 0);
            m = mult(m, rotate(theta[7], 0, 0, 1));    // Elevation latérale du bras
            m = mult(m, rotate(theta[8], 1, 0, 0));    // Elevation du bras vers l'avant-arrière
            m = mult(m, rotate(theta[9], 0, 1, 0));    // Torsion
            figure[ID_LeftShoulder] = createNode(m, leftShoulder, ID_RightShoulder, ID_LeftElbow);
            break;
        case ID_LeftElbow:
            m = translate(0, -upper_arm_length + 2 * limb_radius, 0);
            m = mult(m, rotate(theta[10], 1, 0, 0));   // Flexion-Extention
            figure[ID_LeftElbow] = createNode(m, leftElbow, null, null);
            break;
        case ID_RightShoulder:
            m = translate(shoulder_offset_x, shoulder_offset_y, 0);
            m = mult(m, rotate(theta[11], 0, 0, 1));    // Elevation latérale du bras
            m = mult(m, rotate(theta[12], 1, 0, 0));    // Elevation du bras vers l'avant-arrière
            m = mult(m, rotate(theta[13], 0, 1, 0));    // Torsion
            figure[ID_RightShoulder] = createNode(m, rightShoulder, null, ID_RightElbow);
            break;
        case ID_RightElbow:
            m = translate(0, -upper_arm_length + 2 * limb_radius, 0);
            m = mult(m, rotate(theta[14], 1, 0, 0));    // Flexion-Extention
            figure[ID_RightElbow] = createNode(m, rightElbow, null, null);
            break;
        case ID_LeftHip:
            m = translate(-hip_offset_x, 0, 0);
            m = mult(m, rotate(theta[15], 0, 0, 1));    // Elevation latérale du bras
            m = mult(m, rotate(theta[16], 1, 0, 0));    // Elevation du bras vers l'avant-arrière
            m = mult(m, rotate(theta[17], 0, 1, 0));    // Torsion
            figure[ID_LeftHip] = createNode(m, leftHip, ID_RightHip, ID_LeftKnee);
            break;
        case ID_LeftKnee:
            m = translate(0, -upper_leg_length + 2 * limb_radius, 0);
            m = mult(m, rotate(theta[18], 1, 0, 0));    // Flexion-Extention
            figure[ID_LeftKnee] = createNode(m, leftKnee, null, null);
            break;
        case ID_RightHip:
            m = translate(hip_offset_x, 0, 0);
            m = mult(m, rotate(theta[19], 0, 0, 1));    // Elevation latérale du bras
            m = mult(m, rotate(theta[20], 1, 0, 0));    // Elevation du bras vers l'avant-arrière
            m = mult(m, rotate(theta[21], 0, 1, 0));    // Torsion
            figure[ID_RightHip] = createNode(m, rightHip, null, ID_RightKnee);
            break;
        case ID_RightKnee:
            m = translate(0, -upper_leg_length + 2 * limb_radius, 0);
            m = mult(m, rotate(theta[22], 1, 0, 0));    // Flexion-Extention
            figure[ID_RightKnee] = createNode(m, rightKnee, null, null);    
            break;                          
    }
}

// Change animation
function updateAnimation(){

}