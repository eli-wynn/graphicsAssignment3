// ==========================================================================
// $Id: Boxes.js,v 1.3 2019/02/27 22:26:54 jlang Exp $
// Texturing of a tetrahedron example based on OpenGL Programming guide
// by Matsuda and Lea, 2013
// ==========================================================================
// (C)opyright:
//
//   This code is heavily based on the WebGL Programming
//   Guide by Kouichi Matsuda and Rodger Lea and is their copyright.
//   See https://sites.google.com/site/webglbook/
//
//   The code posted is re-used with the generours permission by the authors.
//
//   Jochen Lang
//   EECS, University of Ottawa
//   800 King Edward Ave.
//   Ottawa, On., K1N 6N5
//   Canada.
//   http://www.eecs.uottawa.ca
//
// Creator: jlang (Jochen Lang)
// Email:   jlang@eecs.uottawa.ca
// ==========================================================================
// $Log: Boxes.js,v $
// Revision 1.3  2019/02/27 22:26:54  jlang
// Complete example with element-based instanced rendering
//
// Revision 1.2  2019/02/27 03:10:37  jlang
// Element-based drawing
//
// Revision 1.1  2019/02/19 22:17:06  jlang
// Intial (incomplete) boxes laboratory.
// ==========================================================================
// Based on (c) 2012 matsuda
// HelloTriangle.js
// Loadshaderfromfiles.js
// RotateTriangles_withButtons.js
// LookAtTrianglesWithKeys.js
// TexturedQuad.js
// Vertex shader program
var VSHADER_SOURCE = null;
// Fragment shader program
var FSHADER_SOURCE = null;

// Rotation speed (degrees/second)
var SPEED;

// Initialize time of last rotation update
var LAST_FRAME = Date.now();
var VAO;

// Number of boxes
const N_BOXES = 128;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
 setDefault(); // set global variables to default

  // Read shader from file
  readShaderFile(gl, 'shader/boxes.vs', 'v');
  readShaderFile(gl, 'shader/boxes.fs', 'f');
}


// Read shader from file
function readShaderFile(gl, fileName, shader) {
    var request = new XMLHttpRequest();
    request.open('GET', fileName , true);


  request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status !== 404) {
	onReadShader(gl, request.responseText, shader);
  }
  }
  // Create a request to acquire the file

  request.send();                      // Send the request
}


// The shader is loaded from file
function onReadShader(gl, fileString, shader) {
  if (shader == 'v') { // Vertex shader
    VSHADER_SOURCE = fileString;
  } else
  if (shader == 'f') { // Fragment shader
    FSHADER_SOURCE = fileString;
  }
  // When both are available, call start().
  if (VSHADER_SOURCE && FSHADER_SOURCE) start(gl);
}


function start(gl) {

  // Initialize shaders - string now available
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices to a vertex shader
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  // Must enable depth test for proper 3D display
  gl.enable(gl.DEPTH_TEST);
  // Set clear color - state info	
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Specify the rot_matrix as a uniform
  // get the storage location of mvp_matrix
  var u_rot_matrix = gl.getUniformLocation(gl.program, 'rot_matrix');
  if (!u_rot_matrix) {
      console.log('Failed to get the storage location of rot_matrix');
      u_rot_matrix = 0;
    // return;
  }

  // Create the matrix to set the projection matrix
  var projMatrix = glMatrix.mat4.create();
  glMatrix.mat4.ortho(projMatrix,-12.0, 12.0, -12.0, 12.0, -12.0, 12.0);

  var u_proj_matrix = gl.getUniformLocation(gl.program, 'proj_matrix');
  if (u_proj_matrix) {
     gl.uniformMatrix4fv(u_proj_matrix, false, projMatrix );
  } else {
      console.log('Failed to get the storage location of proj_matrix');
      u_proj_matrix = 0;
      // return;
  }
    
  // Current axis angle
  var axisAngle = 0.0;
  // Current rotation angle
  var currentAngle = 0.0;

  // Register the event handler to be called on key press
  document.onkeydown = function(ev){
    keydown(ev, gl, n, currentAngle, u_rot_matrix)};

  // Register the animation callback
  var tick = function() {

    var now = Date.now();
    var elapsed = now - LAST_FRAME;
    currentAngle = animate(currentAngle, SPEED, elapsed );  // Update the rotation angle
    axisAngle = animate(axisAngle, SPEED/7.0, elapsed );  // Update the axis angle
    LAST_FRAME = now;
    draw(gl, n, currentAngle, axisAngle, u_rot_matrix); // Draw the boxes
    requestAnimationFrame(tick);   // Request that the browser calls tick
  };
  tick();
}

function initVertexBuffers(gl) {
  // num. colors and transforms
  let minV = glMatrix.vec3.fromValues(-10.0,-10.0,-10.0);
  let maxV = glMatrix.vec3.fromValues(10.0,10.0,10.0);	
  var attr = new Attributes( N_BOXES, N_BOXES, minV, maxV );
  var box = new BoxShape(attr);
    
  // Get vertices of the box and store in VBO
  VAO = gl.createVertexArray(); // VAO is a global
  gl.bindVertexArray(VAO);

  // Element array buffer object
  elementBuffer = gl.createBuffer(); // element buffer is global
  if (!elementBuffer) {
    console.log('Failed to create the element buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer );
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, box.index, gl.STATIC_DRAW);
    
  // Create a vertex buffer object
  var vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log('Failed to create the vertex buffer object');
    return -1;
  }
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, box.vertex, gl.STATIC_DRAW);

  var a_vertex = gl.getAttribLocation(gl.program, 'a_vertex');
  if (a_vertex < 0) {
    console.log('Failed to get the storage location of a_vertex');
    return -1;
  }
  // 3 entries per vertex: x y z 
  gl.enableVertexAttribArray(a_vertex);
  gl.vertexAttribPointer(a_vertex, 3, gl.FLOAT, false, 0, 0);

  // Create a color buffer object
  var colorBuffer = gl.createBuffer();
  if (!colorBuffer) {
    console.log('Failed to create the color buffer object');
    return -1;
  }
  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  // Write data into the buffer object
  gl.bufferData(gl.ARRAY_BUFFER, box.attrib.colors, gl.STATIC_DRAW);

  // Get the storage location of a_color, assign buffer and enable
  var a_color = gl.getAttribLocation(gl.program, 'a_color');
  if(a_color < 0) {
    console.log('Failed to get the storage location of a_color');
    return -1;
  }
  gl.vertexAttribDivisor(a_color, 1);
  // Colors 4 entries per vertex - r g b a
  gl.enableVertexAttribArray(a_color);
  gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 0, 0);

  // Matrix attribute
  var mmBuffer = gl.createBuffer();
  if (!mmBuffer) {
    console.log('Failed to create the matrix buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, mmBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,box.attrib.tfms,gl.DYNAMIC_DRAW);
  // Figure out how many byte per element
  var sz = box.attrib.tfms.BYTES_PER_ELEMENT;
    
  var locMM = gl.getAttribLocation( gl.program, 'model_matrix');
  // Need to set attribute for each column separately.
  for (let i = 0; i < 4; i++) {
    // Set up the vertex attribute
    gl.vertexAttribPointer(locMM + i,             // Location
			   4, gl.FLOAT, false,    // Column with four floats, no normalization
			   sz * 16,               // Stride for next 4x4 matrix
			   sz * 4 * i);           // Offset for ith column
    gl.enableVertexAttribArray(locMM + i);
    // Matrix per instance
    gl.vertexAttribDivisor(locMM  + i, 1);
  }

  gl.bindVertexArray(null);

  return box.index.length; // number of indicies
}


function draw(gl, n, currentAngle, axisAngle, u_rot_matrix) {
  // Set the rotation matrix
    let rotMatrix = glMatrix.mat4.create();  
  glMatrix.mat4.fromYRotation(rotMatrix, glMatrix.glMatrix.toRadian(axisAngle));
  glMatrix.mat4.rotateX(rotMatrix, rotMatrix, glMatrix.glMatrix.toRadian(currentAngle));
  if ( u_rot_matrix != 0 ) {
     gl.uniformMatrix4fv(u_rot_matrix, false, rotMatrix );
  }
  // Clear <canvas> - both color and depth
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.bindVertexArray(VAO);
  // element array buffer is not part of the VAO - but is still bound
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer );
  // primitive restart cannot be enabled - it is always on
  // gl.enable(gl.PRIMITIVE_RESTART);
  gl.drawElementsInstanced(gl.TRIANGLE_STRIP, n, gl.UNSIGNED_BYTE, 0, N_BOXES);

  // Draw the rectangle
  // gl.drawArrays(gl.TRIANGLES, 0, n);
}


// Make a time based animation to keep things smooth
// Initialize global variable
function animate(angle,speed,elapsed) {
  // Calculate the elapsed time
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (speed * elapsed) / 1000.0;
  return newAngle %= 360;
}

function keydown(ev, n, gl, currentAngle, projMatrix, u_rot_matrix) {
  switch(ev.keyCode) {
  case 38: // up arrow key
    SPEED += 2.0;
    break;
  case 40: // down arrow key
    SPEED -= 2.0;
    break;
  }
  draw(gl, n, currentAngle, projMatrix, u_rot_matrix);
}

function setDefault() {
  SPEED = 20.0;
}

function faster() {
  SPEED += 2;
}

function slower() {
  SPEED -= 2;
}
