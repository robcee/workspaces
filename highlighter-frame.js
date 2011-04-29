/*
 * Context >> Chrome
 *
 * const Cc = Components.classes;
 * const Ci = Components.interfaces; 
 * const Cu = Components.utils;
 */

Cu.forceGC();

let win = Services.wm.getMostRecentWindow("navigator:browser");
let gBrowser = win.gBrowser;
let doc = gBrowser.ownerDocument; // xuldocument
let contentDoc = gBrowser.selectedBrowser.contentDocument;
let browser = gBrowser.selectedBrowser;
let contentWin = browser.contentWindow;
let contentDoc = browser.contentDocument;
let stack = browser.parentNode;

let iframe = doc.createElement("iframe");
iframe.id = "highlighter-frame";
iframe.setAttribute("transparent", "true");
iframe.setAttribute("type", "content");
iframe.flex = 1;

iframe.setAttribute("src", 'data:text/html,<html><body style="margin-top: 0px; margin-left: 0px; overflow: hidden;">' +
    '<canvas id="surface" width="100%" height="100%" style="opacity: 0.2;" ></canvas>' +
    '</body></html>');

stack.appendChild(iframe);
// stack.insertBefore(iframe, browser);

// once created

let win = Services.wm.getMostRecentWindow("navigator:browser");
let gBrowser = win.gBrowser;
let doc = gBrowser.ownerDocument; // xuldocument
let browser = gBrowser.selectedBrowser;
let contentWin = browser.contentWindow;
let contentDoc = browser.contentDocument;
let stack = browser.parentNode;
var iframe = doc.getElementById("highlighter-frame");

stack.removeChild(iframe);

var hlWin = iframe.contentWindow;
var hlDoc = iframe.contentDocument;

// init variables
var canvas = hlDoc.getElementById("surface");

var height = canvas.height = contentWin.innerHeight;
var width = canvas.width = contentWin.innerWidth;

canvas

var context = canvas.getContext("2d");

function clearBackground() {
  context.fillStyle = "#09f";
  context.fillRect(0, 0, width, height);
}

function highlightRectangle(startX, startY, extentX, extentY) {
  clearBackground();
  context.clearRect(startX, startY, extentX, extentY);
}

highlightRectangle(500, 500, 500, 500);

stack.removeChild(iframe);