
// init variables
var canvas = document.getElementById("surface");
var height = canvas.height = innerHeight;
var width = canvas.width = innerWidth;

var context = canvas.getContext("2d");

function clearBackground() {
  context.fillStyle = "#09f";
  context.fillRect(0, 0, width, height);
}

function highlightRectangle(startX, startY, extentX, extentY) {
  clearBackground();
  context.clearRect(startX, startY, extentX, extentY);
}

function randomIntegerTo(max) { return Math.round(Math.random() * max); }

function randomArea() {
  let startX = randomIntegerTo(width);
  let startY = randomIntegerTo(height);
  let extentX = randomIntegerTo(width - startX);
  let extentY = randomIntegerTo(height - startY);
  return [startX, startY, extentX, extentY];
}

function highlightRandomArea() {
  let [startX, startY, extentX, extentY] = randomArea();
  highlightRectangle(startX, startY, extentX, extentY);
}

var start = window.mozAnimationStartTime;
function step(event) {
  var progress = event.timeStamp - start;
  highlightRandomArea();
  if (progress < 2000) {
    window.mozRequestAnimationFrame();
  } else {
    window.removeEventListener("MozBeforePaint", step, false);
  }
}
window.addEventListener("MozBeforePaint", step, false);
window.mozRequestAnimationFrame();

let count = 0;
while (count++ < 1000)
  setTimeout(highlightRandomArea, 50);

// highlightRectangle(50, 60, 600, 200);

Math.random(5)
 0.008198558292617286
 0.1665721679478923
