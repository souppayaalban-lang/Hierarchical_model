var buffers = {};  // Ici on mettra la liste des buffers
var vertices = {}; // Ici on mettra les tableaux de sommets pour chaque objet

var gl;
var canvas;
var vPosition; var vNormal;

var modelViewMatrixLoc; var modelViewMatrix;
var projectionViewMatrixLoc; var projectionViewMatrix;

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