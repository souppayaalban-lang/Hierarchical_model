var buffers = {};  // Ici on mettra la liste des buffers
var normalBuffers = {}; // Buffers pour les normales
var vertices = {}; // Ici on mettra les tableaux de sommets pour chaque objet
var normals = {};  // Normales par objet, meme ordre que vertices

var gl;
var canvas;
var vPosition;
var vNormal;

var modelViewMatrixLoc;
var modelViewMatrix;

var projectionMatrixLoc;
var projectionMatrix;

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
var ID_LeftFoot = 12;
var ID_RightFoot = 13;
var numNodes = 14;

var numFigures = 1;
var thetas = [];

var stack = [];
var figures = [];

var torse_height = 0.6;
var head_height = 0.5;
var head_radius = head_height / 2;
var upper_arm_length = 0.6;
var lower_arm_length = 0.8;
var upper_leg_length = 0.8;
var lower_leg_length = 0.6;

var spine_height = 0.6;
var torso_radius = 0.10;
var spine_radius = 0.10;
var limb_radius = 0.08;
var foot_length = 0.35;
var foot_radius = limb_radius;
var foot_base_angle = -90;

var GROUND_Y = 0.0;
var LEG_HEIGHT = (upper_leg_length - 2*limb_radius + lower_leg_length - limb_radius) * Math.cos(20 * Math.PI / 180);
var root_offsets = [[-1.5, GROUND_Y + LEG_HEIGHT, 0.0]];

var mesh_slices = 20;
var mesh_stacks = 20;

var shoulder_offset_x = 0.05;
var hip_offset_x = 0.05;

var torso_offset_y = spine_height - 2 * spine_radius;
var spine_offset_y = 0;
var shoulder_offset_y = torse_height - 2 * torso_radius;
var head_offset_y = shoulder_offset_y + head_height / 2;

// Directional sun light in world space (points toward the letters)
var lightPosition = vec4(-2.5, 2.5, 4.0, 0.0); var lightPositionLoc;
// Light color from the non seen side
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0); var AmbientProductLoc; var AmbientProduct;
// Light color on the seen face (Color diffusion)
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0); var DiffuseProductLoc; var DiffuseProduct;
// Light color of the fixed point illuminated by the light (White reflection)
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0); var SpecularProductLoc; var SpecularProduct;

// Reflectivity coefficient
var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(0.1, 0.1, 1.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 200.0; var ShininessLoc;
var useLightingLoc; var flatColorLoc;

// Camera
var eye = vec3(0.87, 0, 4.92);
var at  = vec3(0, 0, 0);
var up  = vec3(0, 1, 0);
var orbitRadius      = 5.0;
var cameraFollowMouse = false;

function buildSphereSection(radius, slices, stacks, phiStart, phiEnd) {
    var verts = [];
    var phiRange = phiEnd - phiStart;
    for (var stack = 0; stack < stacks; stack++) {
        var phi0 = phiStart + phiRange * stack / stacks;
        var phi1 = phiStart + phiRange * (stack + 1) / stacks;
        var y0 = Math.cos(phi0);
        var y1 = Math.cos(phi1);
        var r0 = Math.sin(phi0);
        var r1 = Math.sin(phi1);

        for (var slice = 0; slice < slices; slice++) {
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
function buildCylinder(radius, height, slices) {
    var verts = [];
    var y0 = -height / 2;
    var y1 = height / 2;
    for (var slice = 0; slice < slices; slice++) {
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

function buildSphereNormals(verts) {
    var norms = [];
    for (var i = 0; i < verts.length; i++) {
        var v = verts[i];
        norms.push(normalize(vec3(v[0], v[1], v[2])));
    }
    return norms;
}

function buildCylinderNormals(verts) {
    var norms = [];
    for (var i = 0; i < verts.length; i++) {
        var v = verts[i];
        norms.push(normalize(vec3(v[0], 0.0, v[2])));
    }
    return norms;
}