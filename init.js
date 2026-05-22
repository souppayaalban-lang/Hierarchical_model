var buffers = {};  // Ici on mettra la liste des buffers
var vertices = {}; // Ici on mettra les tableaux de sommets pour chaque objet

var gl;
var canvas;
var vPosition; var vNormal;

var modelViewMatrixLoc; var modelViewMatrix;
var projectionViewMatrixLoc; var projectionViewMatrix;

var stack = [];
var figure = [];
for(var i=0; i<10; i++){
    figure[i] = createNode(null, null, null, null);
}

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

    // Attribute Location
    vPosition = gl.getAttribLocation(program, "vPosition");
    vNormal = gl.getAttribLocation(program, "vNormal");

    // Store data in Buffers
    initBuffer();   // Faudra faire la boucle qui crée tous les buffers pour éviter de saturer cette fonction

    // Enabling Attributes
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    // Enabling Culling
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    // Rendering
    render();
}

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    requestAnimationFrame(render);
}

// Function to change Object Buffer
function ChangeObjectTo(buffer, nBuffer){
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(vPosition, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
}

// Function to initialize all buffers once
function initBuffer(){
    var entries =[
        {},
        {}
    ]
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        Buffer[entry.key] = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, Buffer[entry.key]);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(entry.data), gl.STATIC_DRAW);
    }
}

// Function to set vertices array
function initVertices(){
    
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


// J'ai upload mais ça marche pas encore

// Initialization of the Hierarchical Model
function initNodes(id){
    var m = mat4();
    switch(id){
        case ID_Pelvis:
            figure[ID_Pelvis] = createNote(m, pelvis, null, ID_Torso);
            break;
        case ID_Torso:
            m = rotate(theta[0], 0, 1, 0);  // Parameter : rotate(angle, X, Y, Z)
            figure[ID_Torso] = createNote(m, torso, leftHip, ID_Head);
            break;
        case ID_Head:
            m = translate(0, torse_height, 0);
            m = mult(m, rotate(theta[1], 1, 0, 0));
            m = mult(m, rotate(theta[2], 0, 1, 0));
            m = mult(m, rotate(theta[3], 0, 0, 1));
            figure[ID_Head] = createNode(m, head, ID_LeftShoulder, null);
            break;
        case ID_LeftShoulder:
            m = translate();
            m = mult(m, rotate(theta[4], 1, 0, 0)); // Rotation avant-arrière
            m = mult(m, rotate(theta[5], 0, 1, 0)); // Rotation droite-gauche
            m = mult(m, rotate(theta[6], 0, 0, 1)); // Rotation lever-baisser
            figure[ID_LeftShoulder] = createNode(m, leftShoulder, ID_RightShoulder, ID_LeftElbow);
            break;
        case ID_LeftElbow:
            m = translate();
            figure[ID_LeftElbow] = createNode(m, leftElbow, null, null);
            break;
        case ID_RightShoulder:
            m = translate();
            m = mult(m, rotate(theta[10], 1, 0, 0)); // Rotation avant-arrière
            m = mult(m, rotate(theta[11], 0, 1, 0)); // Rotation droite-gauche
            m = mult(m, rotate(theta[12], 0, 0, 1)); // Rotation lever-baisser
            figure[ID_RightShoulder] = createNode(m, rightShoulder, null, ID_RightElbow);
            break;
        case ID_RightElbow:
            m = translate();
            figure[ID_RightElbow] = createNode(m, rightElbow, null, null);
        case ID_LeftHip:
            m = translate();
            figure[ID_LeftThigh] = createNode(m, leftHip, ID_RightHip, ID_LeftKnee);
        case ID_LeftKnee:
            m = translate();
            m = mult(m, rotate(theta[x], 0, 0, 1));
            figure[ID_LeftKnee] = createNode(m, leftKnee, null, null);
        case ID_RightHip:
            m = translate();
            figure[ID_RightThigh] = createNode(m, rightHip, null, ID_RightKnee);
        case ID_RightKnee:
            m = translate();
            m = mult(m, rotate(theta[x], 0, 0, 1));
            figure[ID_RightKnee] = createNode(m, rightKnee, null, null);                              
    }
}

// Change animation
function updateAnimation(){

}