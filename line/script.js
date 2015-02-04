window.onload = function() {
  // (1) webglコンテキストの取得
  var canvas = document.getElementById('canvas');
  var gl = canvas.getContext('experimental-webgl'); // これがwebglコンテキスト

  // (2) シェーダのコンパイル

  // バーテックスシェーダのソースコード読み込み
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  var vertexSource = document.getElementById('vertex-shader').text;
  gl.shaderSource(vertexShader, vertexSource);
  gl.compileShader(vertexShader);

  // フラグメントシェーダのソースコード読み込み
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  var fragmentSource = document.getElementById('fragment-shader').text;
  gl.shaderSource(fragmentShader, fragmentSource);
  gl.compileShader(fragmentShader);

  // プログラムの生成とコンパイル
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // 初期カラーの設定(RGBA)
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // (3) ロケーションの取得
  var attrLoc1 = gl.getAttribLocation(program, 'aPosition');
  var uniLoc1  = gl.getUniformLocation(program, 'wMatrix');

  // (4) 頂点座標の準備
  var vertices = [
    -0.5, -0.5, 0.0, // 左下
     0.5, -0.5, 0.0, // 右下
    -0.5,  0.5, 0.0  // 左上
  ];
  var vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // (5) 頂点インデックスの準備
  var indices = [
    0, 1, 2 // 1個目の三角形
  ];
  var ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int16Array(indices), gl.STATIC_DRAW);

  var frameCount = 0;
  (function() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    var identity = mat4.create();
    var rotate = mat4.rotate(identity, identity, frameCount / 50, [ 0, 0.0, 1.0]);

    // (6) ポリゴンの描画
    gl.enableVertexAttribArray(attrLoc1);
    gl.vertexAttribPointer(attrLoc1, 3, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(uniLoc1, false, rotate);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    frameCount++;

    setTimeout(arguments.callee, 1000 / 60);
  })();
}
