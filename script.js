var gl;
var modelRadX = 0.0;
var modelRadY = 0.0;
var worldRadX = 0.0;
var worldRadY = 0.5 * Math.PI;
var signX = 0;
var signY = 0;

window.onload = function() {
  var canvas = document.getElementById('canvas');
  canvas.width  = 600;
  canvas.height = 600;

  // Register event listener in order to rotate the model or the world
  // with user mouse interaction.
  canvas.addEventListener('mouseup',   mouseUpCallback);
  canvas.addEventListener('mousedown', mouseDownCallback);
  canvas.addEventListener('mousemove', mouseMoveCallback);
  window.addEventListener('keydown',   keyDownCallback);
  window.addEventListener('keyup',     keyUpCallback);

  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // Create and compile the vertex shader.
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, document.getElementById('vertex-shader').text);
  gl.compileShader(vertexShader);

  // Also create and compile the fragment shader.
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, document.getElementById('fragment-shader').text);
  gl.compileShader(fragmentShader);

  // Link shaders and make them available.
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Initialize clear color.
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Create vertex buffers.
  var cubicVbo = createVertexBufferForCubic();
  var axisVbo  = createVertexBufferForAxis();
  var whiteColorVbo = createVertexBufferForWhiteColor();

  // Retrieve variable locations in the GL to send vertex data or translation
  // matrix data.
  var positionLocation = gl.getAttribLocation(program,  'aPosition');
  var colorLocation    = gl.getAttribLocation(program,  'aColor');
  var vpLocation       = gl.getUniformLocation(program, 'vpMatrix');
  var mLocation        = gl.getUniformLocation(program, 'mMatrix');

  (function() {
    // Clear the display with the clear color.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Generate identity matrices.
    var m = new matIV();
    var identity  = m.identity(m.create());
    var mMatrix   = m.identity(m.create());
    var vMatrix   = m.identity(m.create());
    var pMatrix   = m.identity(m.create());
    var vpMatrix  = m.identity(m.create());

    // Calculate the camera position.
    var cameraX = 2.0 * Math.cos(worldRadY);
    var cameraY = 2.0 * Math.sin(worldRadX);
    var cameraZ = 2.0 * Math.sin(worldRadY);

    // Generate a translation matrix.
    m.rotate(mMatrix, modelRadX, [ 1, 0, 0 ], mMatrix);
    m.rotate(mMatrix, modelRadY, [ 0, 1, 0 ], mMatrix);
    m.translate(mMatrix, [ -0.5, -0.5, -0.5 ], mMatrix);

    // Generate a view matrix and a projection matrix.
    m.lookAt([ cameraX, cameraY, cameraZ ], [ 0, 0, 0 ], [ 0, 1, 0 ], vMatrix);
    m.perspective(90, canvas.width / canvas.height, 0.1, 200, pMatrix);
    m.multiply(pMatrix, vMatrix, vpMatrix);

    // Disable vertex array.
    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(colorLocation);

    gl.uniformMatrix4fv(vpLocation, false, vpMatrix);

    // Draw a square.
    // This object is translated by translation matrix for placed the center of the world.
    gl.uniformMatrix4fv(mLocation, false, mMatrix);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubicVbo);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 10);

    // Draw axes. This is not translated.
    gl.uniformMatrix4fv(mLocation, false, identity);
    gl.bindBuffer(gl.ARRAY_BUFFER, axisVbo);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, whiteColorVbo);
    gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 6);

    // Disable vertex array.
    gl.disableVertexAttribArray(positionLocation);
    gl.disableVertexAttribArray(colorLocation);

    // Print the model and the world information.
    document.getElementById('model-rad-x').innerText = Math.round(modelRadX * 100) / 100;
    document.getElementById('model-rad-y').innerText = Math.round(modelRadY * 100) / 100;
    document.getElementById('camera-position-x').innerText = Math.round(cameraX * 100) / 100;
    document.getElementById('camera-position-y').innerText = Math.round(cameraY * 100) / 100;
    document.getElementById('camera-position-z').innerText = Math.round(cameraZ * 100) / 100;

    // Set the loop.
    setTimeout(arguments.callee, 1000 / 60);
  })();
};

function createVertexBufferForCubic() {
  // Create a vertex buffer object to draw a square.
  var vertices = [
    // front
    0.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    1.0, 1.0, 0.0,
    // top
    0.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    // back
    0.0, 0.0, 1.0,
    1.0, 0.0, 1.0,
    // bottom
    0.0, 0.0, 0.0,
    1.0, 0.0, 0.0
  ];
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return vbo;
}

function createVertexBufferForAxis() {
  // Create a vertex buffer object to draw a square.
  var vertices = [
    // x-axis
     200.0, 0.0, 0.0,
    -200.0, 0.0, 0.0,
    // y-axis
    0.0,  200.0, 0.0,
    0.0, -200.0, 0.0,
    // z-axis
    0.0, 0.0,  200.0,
    0.0, 0.0, -200.0
  ];
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return vbo;
}

function createVertexBufferForWhiteColor() {
  // Create a vertex buffer object to draw a square.
  var colors = [
    // x-axis
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
  ];
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return vbo;
}

var mouseDownFlag = false;
var x = 0;
var y = 0;

function mouseUpCallback() {
  mouseDownFlag = false;
}

function mouseDownCallback(e) {
  mouseDownFlag = true;
  x = e.offsetX;
  y = e.offsetY;
}

function mouseMoveCallback(e) {
  if (mouseDownFlag) {
    signX = Math.sign(e.offsetY - y);
    signY = Math.sign(e.offsetX - x);

    if (metaFlag) {
      worldRadX = worldRadX + signX * 0.1;
      worldRadY = worldRadY + signY * 0.1;
    } else {
      modelRadX = modelRadX + signX * 0.1;
      modelRadY = modelRadY + signY * 0.1;
    }

    x = e.offsetX;
    y = e.offsetY;
  }
}

var metaFlag = false;

function keyDownCallback(e) {
  metaFlag = e.metaKey;
}

function keyUpCallback(e) {
  metaFlag = false;
}
