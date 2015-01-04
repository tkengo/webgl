var gl;
var modelRadX = 0.0;
var modelRadY = 0.0;
var worldRadX = 0.0;
var worldRadY = 0.5 * Math.PI;
var signX = 0;
var signY = 0;
var loader = new ImageLoader();

var axises = [
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

window.onload = function() {
  // Load the model data.
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      var obj = JSON.parse(xhr.responseText).obj;

      // Collect textures filename.
      var textures = [];
      for (var i in obj.groups) {
        var texture = obj.groups[i].texture;
        if (texture) {
          textures.push(texture);
        }
      }

      // Load textures, and do initialize if loader completed loading all of them.
      if (textures.length > 0) {
        loader.load(textures, function() {
          initialize(obj);
        });
      }
    }
  };

  xhr.open('GET', './model.json', true);
  xhr.send();
};

function initialize(obj) {
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
  var vertexVbo = createVbo(obj.vertices);
  var texVbo    = createVbo(obj.tex_coord);
  var normalVbo = createVbo(obj.normals);
  var axisVbo   = createVbo(axises);

  var textures = {};
  var images = loader.images();
  for (var name in images) {
    textures[name] = createTexture(images[name]);
  }

  var modelIbos     = [];
  var modelTextures = [];
  for (var i in obj.groups) {
    modelIbos[i] = createIbo(obj.groups[i].indices);
    modelTextures[i] = textures[obj.groups[i].texture];
  }

  // Retrieve variable locations in the GL to send vertex data or translation
  // matrix data.
  var positionLocation   = gl.getAttribLocation(program,  'aPosition');
  var texCoordLocation   = gl.getAttribLocation(program,  'aTexCoord');
  var normalLocation     = gl.getAttribLocation(program,  'aNormal');
  var vpLocation         = gl.getUniformLocation(program, 'vpMatrix');
  var mLocation          = gl.getUniformLocation(program, 'mMatrix');
  var textureLocation    = gl.getUniformLocation(program, 'texture');
  var hasTextureLocation = gl.getUniformLocation(program, 'has_texture');
  var kdcolorLocation    = gl.getUniformLocation(program, 'kdcolor');
  var nscolorLocation    = gl.getUniformLocation(program, 'nscolor');

  (function() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Generate identity matrices.
    var m = new matIV();
    var identity  = m.identity(m.create());
    var mMatrix   = m.identity(m.create());
    var vMatrix   = m.identity(m.create());
    var pMatrix   = m.identity(m.create());
    var vpMatrix  = m.identity(m.create());

    // Generate a translation matrix.
    m.rotate(mMatrix, modelRadX, [ 1, 0, 0 ], mMatrix);
    m.rotate(mMatrix, modelRadY, [ 0, 1, 0 ], mMatrix);
    m.translate(mMatrix, [ 0, -5.2, 0 ], mMatrix);

    // Generate a view matrix and a projection matrix.
    m.lookAt([ 0, 2, 6 ], [ 0, 0, 0 ], [ 0, 1, 0 ], vMatrix);
    m.perspective(90, canvas.width / canvas.height, 0.1, 200, pMatrix);
    m.multiply(pMatrix, vMatrix, vpMatrix);

    // Disable vertex array.
    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.enableVertexAttribArray(normalLocation);

    // Draw MIKU.
    gl.uniformMatrix4fv(vpLocation, false, vpMatrix);
    gl.uniformMatrix4fv(mLocation, false, mMatrix);
    gl.uniform1i(textureLocation, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexVbo);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, texVbo);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, normalVbo);
    gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
    for (var i = 0; i < modelIbos.length; i++) {
      if (modelTextures[i]) {
        var kd = obj.groups[i].mtl.Kd;
        var ns = obj.groups[i].mtl.Ns;
        gl.bindTexture(gl.TEXTURE_2D, modelTextures[i]);
        gl.uniform1i(hasTextureLocation, 1);
        gl.uniform1f(nscolorLocation, ns);
        gl.uniform3f(kdcolorLocation, kd[0], kd[1], kd[2]);
      } else {
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.uniform1i(hasTextureLocation, 0);
      }

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, modelIbos[i]);
      gl.drawElements(gl.TRIANGLES, obj.groups[i].indices.length, gl.UNSIGNED_SHORT, 0);
    }

    // Draw axes. This is not translated.
    gl.uniformMatrix4fv(mLocation, false, identity);
    gl.uniform1i(hasTextureLocation, 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, axisVbo);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, 6);

    // Disable vertex array.
    gl.disableVertexAttribArray(positionLocation);
    gl.disableVertexAttribArray(texCoordLocation);
    gl.disableVertexAttribArray(normalLocation);

    // Set the loop.
    setTimeout(arguments.callee, 1000 / 60);
  })();
}

function createVbo(data) {
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return vbo;
}

function createIbo(data) {
  var ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(data), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

  return ibo;
}

function createTexture(img) {
  var texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
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
      worldRadX = worldRadX + signX * 0.05;
      worldRadY = worldRadY + signY * 0.05;
    } else {
      modelRadX = modelRadX + signX * 0.05;
      modelRadY = modelRadY + signY * 0.05;
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
