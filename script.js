var gl;

window.onload = function() {
  var canvas = document.getElementById('canvas');
  canvas.width  = 300;
  canvas.height = 300;

  gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  // Create the vertex shader.
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, document.getElementById('vertex-shader').text);
  gl.compileShader(vertexShader);

  // Also create the fragment shader.
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, document.getElementById('fragment-shader').text);
  gl.compileShader(fragmentShader);

  // Link shaders.
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Initialize clear color and depth.
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);

  // Clear the display with the clear color.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Create a vertex buffer object to draw a square.
  var vertices = [
    0.0, 0.0, -2.0,
    1.0, 0.0, -2.0,
    0.0, 1.0, -2.0,
    1.0, 1.0, -2.0
  ];
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // And forward the vertex data into the memory buffer in the GL.
  var positionLocation = gl.getAttribLocation(program, 'vPosition');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  // Generate the projection matrix.
  var m = new matIV();
  var pMatrix = m.identity(m.create());
  m.perspective(90, canvas.width / canvas.height, 0.1, 100, pMatrix);

  // And forward matrix to our vertex shader.
  var uniLocation = gl.getUniformLocation(program, 'mvpMatrix');
  gl.uniformMatrix4fv(uniLocation, false, pMatrix);

  // Draw square.
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
};
