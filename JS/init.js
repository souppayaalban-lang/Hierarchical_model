var buffers = {};  // Ici on mettra la liste des buffers
var vertices = {}; // Ici on mettra les tableaux de sommets pour chaque objet

var gl;
var canvas;
var vPosition; var vNormal;

var modelViewMatrixLoc;       var modelViewMatrix;
var projectionViewMatrixLoc;  var projectionViewMatrix;
var projectionMatrixLoc;      var projectionMatrix;
var vertexCounts = {};

var ID_Pelvis = 0;
var ID_Torso = 1;
var ID_Head = 2;
var ID_LeftShoulder = 3;
var ID_RightShoulder = 4;
var ID_LeftElbow = 5;
var ID_RightElbow = 6;
var ID_LeftHip = 7;
var ID_RightHip = 8;
var ID_LeftKnee = 9;
var ID_RightKnee = 10;
var numNodes = 11;

var stack = [];
var figure = [];
for(var i=0; i<numNodes; i++){
    figure[i] = createNode(null, null, null, null);
}

var torse_height = 1.2;
var head_height = 0.5;
var upper_arm_length = 0.6;
var lower_arm_length = 0.5;
var upper_leg_length = 0.8;
var lower_leg_length = 0.6;

var shoulder_offset_x = 0.1;
var hip_offset_x = 0.1;

var pelvis_offset_y = -torse_height / 2;
var shoulder_offset_y = torse_height / 2;
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
    projectionMatrix = ortho(-aspect*2, aspect*2, -2, 2, -1, 1);

    // Locations
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

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
    gl.enable(gl.CULL_FACE);

    // Rendering
    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    modelViewMatrix = mat4();
    traverse(ID_Pelvis);

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
    return {
        torso: [
            vec3(0.0, -torse_height / 2, 0.0), vec3(0.0, torse_height / 2, 0.0)
        ],
        head: [
            vec3(0, 0, 0)
        ],
        leftShoulder: [
            vec3(0.0, 0.0, 0.0), vec3(-0.4, -upper_arm_length, 0.0)
        ],
        leftElbow: [
            vec3(-0.4, 0.0, 0.0), vec3(-0.5, -lower_arm_length, 0.0)
        ],
        rightShoulder: [
            vec3(0.0, 0.0, 0.0), vec3(0.4, -upper_arm_length, 0.0)
        ],
        rightElbow: [
            vec3(0.4, 0.0, 0.0), vec3(0.5, -lower_arm_length, 0.0)
        ],
        leftHip: [
            vec3(0.0, 0.0, 0.0), vec3(-0.1, -upper_leg_length, 0.0)
        ],
        leftKnee: [
            vec3(-0.1, 0.0, 0.0), vec3(-0.1, -lower_leg_length, 0.0)
        ],
        rightHip: [
            vec3(0.0, 0.0, 0.0), vec3(0.1, -upper_leg_length, 0.0)
        ],
        rightKnee: [
            vec3(0.1, 0.0, 0.0), vec3(0.1, -lower_leg_length, 0.0)
        ]
    };
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

function drawPart(key){
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers[key]);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, vertexCounts[key]);
}

function pelvis(){ drawPart("pelvis"); }
function torso(){ drawPart("torso"); }
function head(){
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers["head"]);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINT,0 , 1);
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

// Initialization of the Hierarchical Model
function initNodes(id){
    var m = mat4();
    switch(id){
        case ID_Pelvis:
            m = translate(0, pelvis_offset_y, 0);
            figure[ID_Pelvis] = createNode(m, pelvis, null, ID_Torso);
            break;
        case ID_Torso:
            m = translate(0, torse_height / 2, 0);
            figure[ID_Torso] = createNode(m, torso, ID_LeftHip, ID_Head);
            break;
        case ID_Head:
            m = translate(0, head_offset_y, 0);
            figure[ID_Head] = createNode(m, head, ID_LeftShoulder, null);
            break;
        case ID_LeftShoulder:
            m = translate(-shoulder_offset_x, shoulder_offset_y, 0);
            figure[ID_LeftShoulder] = createNode(m, leftShoulder, ID_RightShoulder, ID_LeftElbow);
            break;
        case ID_LeftElbow:
            m = translate(0, -upper_arm_length, 0);
            figure[ID_LeftElbow] = createNode(m, leftElbow, null, null);
            break;
        case ID_RightShoulder:
            m = translate(shoulder_offset_x, shoulder_offset_y, 0);
            figure[ID_RightShoulder] = createNode(m, rightShoulder, null, ID_RightElbow);
            break;
        case ID_RightElbow:
            m = translate(0, -upper_arm_length, 0);
            figure[ID_RightElbow] = createNode(m, rightElbow, null, null);
            break;
        case ID_LeftHip:
            m = translate(-hip_offset_x, 0, 0);
            figure[ID_LeftHip] = createNode(m, leftHip, ID_RightHip, ID_LeftKnee);
            break;
        case ID_LeftKnee:
            m = translate(0, -upper_leg_length, 0);
            figure[ID_LeftKnee] = createNode(m, leftKnee, null, null);
            break;
        case ID_RightHip:
            m = translate(hip_offset_x, 0, 0);
            figure[ID_RightHip] = createNode(m, rightHip, null, ID_RightKnee);
            break;
        case ID_RightKnee:
            m = translate(0, -upper_leg_length, 0);
            figure[ID_RightKnee] = createNode(m, rightKnee, null, null);    
            break;                          
    }
}

// Change animation
function updateAnimation(){

}