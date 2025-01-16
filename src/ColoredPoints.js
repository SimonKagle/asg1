'use strict';

// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute float a_Size;\n' +
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  gl_PointSize = a_Size;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'uniform vec4 u_FragColor;\n' +  // uniform変数
  'void main() {\n' +
  '  gl_FragColor = u_FragColor;\n' +
  '}\n';

var a_Position, a_Size, u_FragColor;

/**
 * All shapes currently on screen
 * @type {Shape[]}
 */
var g_shapeList = [];
var last_rendered_index = 0;

var redo_stack = [];
var last_shapeLists = [];


var brushInfo = {
  /**
   * 0: triangles
   * 1: squares
   * 2: circles
   */
  shape: 0,
  size: 5,
  r: 1,
  g: 1,
  b: 1,
  segments: 50,
};

/**
 * Draws triangle man
 * @param {WebGLRenderingContext} gl 
 */
function TriangleMan(gl){
  const RED = [1, 0, 0, 1];
  const YELLOW = [1, 1, 0, 1];
  const BLACK = [0, 0, 0, 1];
  const GREEN = [0, 1, 0, 1];
  const TORSO = [205/255, 95/255, 0, 1]; // #cd5f00
  const SLEEVE_TOP = TORSO;
  const SLEEVE_BOT = [0, 0, 0, 1];
  
  // BG
  g_shapeList.push(new Polygon(RED, [-1, 1, -1, -5, 5, 1], gl.TRIANGLES));
  g_shapeList.push(new Polygon(YELLOW, [-1, 1, .4, 1, -1, -2.5], gl.TRIANGLES));
  g_shapeList.push(new Polygon(RED, [-1, 1, .0, 1, -1.4, -2.5], gl.TRIANGLES));
  g_shapeList.push(new Polygon(YELLOW, [-1, 1, -.4, 1, -1.8, -2.5], gl.TRIANGLES));
  g_shapeList.push(new Polygon(YELLOW, [1, 1.5, 1, -1, .1, -1], gl.TRIANGLES));
  g_shapeList.push(new Polygon(RED, [1, .5, 1, -1, .5, -1], gl.TRIANGLES));
  g_shapeList.push(new Polygon(RED, [-1, 1, -.8, 1, -1, .5], gl.TRIANGLES));


  // Head
  g_shapeList.push(new Polygon(BLACK, [-.2, .5, -.3, 0, .2, .5], gl.TRIANGLES));
  g_shapeList.push(new Polygon(BLACK, [-.3, 0, .3, 0, .2, .5], gl.TRIANGLES));
  
  // Eye
  g_shapeList.push(new Polygon(RED, [0, .3, .1, .2, .2, .3], gl.TRIANGLES));
  g_shapeList.push(new Polygon([1, .5, .5, 1], [.05, .3, .1, .25, .15, .3], gl.TRIANGLES));

  // Mohawk
  g_shapeList.push(new Polygon(GREEN, [-.1, .5, .1, .5, 0, .8], gl.TRIANGLES));
  
  // Torso
  g_shapeList.push(new Polygon(TORSO, [0, -3, .6, 0, -.6, 0], gl.TRIANGLES));

  // Left arm
  g_shapeList.push(new Polygon(SLEEVE_TOP, [-.6, 0, -1.1, -0.6, -.7, -.6], gl.TRIANGLES));
  g_shapeList.push(new Polygon(SLEEVE_TOP, [-.6, 0, -.5, -0.4, -.7, -.6], gl.TRIANGLES));
  g_shapeList.push(new Polygon(SLEEVE_BOT, [-.8, -1, -1.1, -0.6, -.7, -.6], gl.TRIANGLES));
  g_shapeList.push(new Polygon(SLEEVE_BOT, [-.8, -1, -.5, -1, -.7, -.6], gl.TRIANGLES));

  // Right arm
  g_shapeList.push(new Polygon(SLEEVE_TOP, [.6, 0, 1.1, -0.6, .7, -.6], gl.TRIANGLES));
  g_shapeList.push(new Polygon(SLEEVE_TOP, [.6, 0, .5, -0.4, .7, -.6], gl.TRIANGLES));
  g_shapeList.push(new Polygon(SLEEVE_BOT, [.8, -1, 1.1, -0.6, .7, -.6], gl.TRIANGLES));
  g_shapeList.push(new Polygon(SLEEVE_BOT, [.8, -1, .5, -1, .7, -.6], gl.TRIANGLES));

  g_shapeList.push(new Polygon(YELLOW, [-.3, -.2, .3, -.2, 0, -.8], gl.TRIANGLES));
  g_shapeList.push(new Polygon(TORSO, [-.3, -.3, -.1, -.3, -.1, -.6], gl.TRIANGLES));
  g_shapeList.push(new Polygon(TORSO, [.3, -.3, .1, -.3, .1, -.6], gl.TRIANGLES));

  
  renderAllShapes(gl);
}

/**
 * Get the canvas and gl context
 * @returns {[WebGLRenderingContext, HTMLCanvasElement]} gl context
 */
function setupWebGL(){
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // var gl = getWebGLContext(canvas);
  var gl = canvas.getContext("webgl", {preserveDrawingBuffer: true});
  if (!gl) {
    throw new Error('Failed to get the rendering context for WebGL');
  }

  return [gl, canvas];
}

/**
 * Compile the shader programs, attach the javascript variables to the GLSL variables
 * @param {WebGLRenderingContext} gl Rendering context
 * @param {string[]} attrs Attributes to locate
 * @param {string[]} unifs Uniforms to locate
 * @returns {[GLint[], WebGLUniformLocation[]]} attribute variables and uniform vairabl
 */
function connectVariablesToGLSL(gl, attrs, unifs){
  var out = [[], []];

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    throw new Error('Failed to intialize shaders.');
  }

  // Get the storage location of attributes
  for (var i = 0; i < attrs.length; i++){
    var attr = gl.getAttribLocation(gl.program, attrs[i]);
    if (attr < 0) {
      throw new Error(`Failed to get the storage location of attribute ${attrs[i]}`);
    }
    out[0].push(attr);
  }

  // Get the storage location of uniforms
  for (var i = 0; i < unifs.length; i++){
    var unif = gl.getUniformLocation(gl.program, unifs[i]);
    if (unif < 0) {
      throw new Error(`Failed to get the storage location of uniform ${unifs[i]}`);
    }
    out[1].push(unif);
  }

  return out;
}

var isMouseDown = false;

/** @type {HTMLButtonElement} */
var undoButton = document.getElementById("undo");
/** @type {HTMLButtonElement} */
var redoButton = document.getElementById("redo");
/** @type {HTMLButtonElement} */
var restoreButton = document.getElementById("restore");

/**
 * Clears canvas
 * @param {WebGLRenderingContext} gl 
 */
function clearCanvas(gl){
  gl.clear(gl.COLOR_BUFFER_BIT);
  if (g_shapeList.length > 0) last_shapeLists.push(g_shapeList);
  redo_stack = [];
  restoreButton.disabled = false;
  redoButton.disabled = true;
  undoButton.disabled = true;
  g_shapeList = [];
}

function main() {

  var [gl, canvas] = setupWebGL();
  [[a_Position, a_Size], [u_FragColor]] = connectVariablesToGLSL(gl, ["a_Position", "a_Size"], ["u_FragColor"]);

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
  
  // Register function (event handler) to be called on a mouse press
  document.onmousedown = function(ev){
    isMouseDown = true;
  }
  canvas.onmousedown = function(ev){
    handleClicks(ev, gl, canvas, a_Position, u_FragColor);
  }
  canvas.onmousemove = function(ev){
    if (isMouseDown) handleClicks(ev, gl, canvas, a_Position, u_FragColor);
  }
  document.onmouseup = function(ev){
    isMouseDown = false;
  }

  // Other event handlers
  var clearButton = document.getElementById("clearCanvas");
  var squareButton = document.getElementById("squareSel");
  var triangleButton = document.getElementById("triangleSel");
  var circleButton = document.getElementById("circleSel");
  var triangleManButton = document.getElementById("manSel");


  var redSlider = document.getElementById("colorR");
  var greenSlider = document.getElementById("colorG");
  var blueSlider = document.getElementById("colorB");
  var sizeSlider = document.getElementById("sizeSlider");
  var segSlider = document.getElementById("segSlider");

  var saveButton = document.getElementById("saveImg");

  undoButton.disabled = true;
  redoButton.disabled = true;
  restoreButton.disabled = true;

  restoreButton.onclick = function(){
    if (last_shapeLists.length == 0){
      restoreButton.disabled = true;
      return;
    }

    g_shapeList = last_shapeLists.pop();
    redo_stack = [];
    redoButton.disabled = true;
    undoButton.disabled = false;
    gl.clear(gl.COLOR_BUFFER_BIT);
    last_rendered_index = 0;
    renderAllShapes(gl);

    if (last_shapeLists.length == 0){
      restoreButton.disabled = true;
    }
  }

  undoButton.onclick = function(){
    if (g_shapeList.length == 0 && last_shapeLists.length == 0){
      undoButton.disabled = true;
      return;
    }

    redo_stack.push(g_shapeList.pop());
    last_rendered_index = 0;
    gl.clear(gl.COLOR_BUFFER_BIT);
    renderAllShapes(gl);
    redoButton.disabled = false;

    if (g_shapeList.length == 0){
      undoButton.disabled = true;
    }
  }

  redoButton.onclick = function(){
    if (redo_stack.length == 0){
      redoButton.disabled = true;
      return;
    }
    g_shapeList.push(redo_stack.pop());
    renderAllShapes(gl);
    undoButton.disabled = false;

    if (redo_stack.length == 0){
      redoButton.disabled = true;
    }
  }

  saveButton.onclick = function(){
    var img = canvas.toDataURL("image/png");
    var link = document.createElement('a');
    link.href = img;
    link.download = "drawing.png";
    link.click();
  }

  clearButton.onclick = () => clearCanvas(gl);

  squareButton.onclick = () => brushInfo.shape = 1;
  triangleButton.onclick = () => brushInfo.shape = 0;
  circleButton.onclick = () => brushInfo.shape = 2;
  triangleManButton.onclick = () => TriangleMan(gl);

  segSlider.onmouseup = () => brushInfo.segments = segSlider.valueAsNumber;
  sizeSlider.onmouseup = () => brushInfo.size = sizeSlider.valueAsNumber;
  redSlider.onmouseup = () => brushInfo.r = redSlider.valueAsNumber;
  greenSlider.onmouseup = () => brushInfo.g = greenSlider.valueAsNumber;
  blueSlider.onmouseup = () => brushInfo.b = blueSlider.valueAsNumber;

}

function renderAllShapes(gl){
  // Clear <canvas>
  // gl.clear(gl.COLOR_BUFFER_BIT);

  var len = g_shapeList.length;
  for(var i = last_rendered_index; i < len; i++) {
    switch (g_shapeList[i].constructor.name){
      case "Point":
        g_shapeList[i].render(gl, a_Position, a_Size, u_FragColor);
        break;
      default:
        g_shapeList[i].render(gl, a_Position, u_FragColor);
        break;
    }
    
  }

  last_rendered_index = g_shapeList.length;
}

function handleClicks(ev, gl, canvas) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  redo_stack = [];
  redoButton.disabled = true;
  undoButton.disabled = false;

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  // Store the coordinates to g_points array
  var basicInfo = [x, y, brushInfo.size, [brushInfo.r, brushInfo.g, brushInfo.b, 1.0]];
  switch (brushInfo.shape){
    case 1:
      g_shapeList.push(new Point(...basicInfo));
      break;
    case 0:
      g_shapeList.push(new Triangle(...basicInfo));
      break;
    case 2:
      g_shapeList.push(new Circle(...basicInfo, brushInfo.segments));
      break;
  }

  renderAllShapes(gl);

}
