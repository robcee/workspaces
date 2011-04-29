// Enter some JavaScript, select it, right click and choose your weapon.
let win = Services.wm.getMostRecentWindow("navigator:browser");
let gBrowser = win.gBrowser;
let doc = gBrowser.ownerDocument; // xuldocument
let browser = gBrowser.selectedBrowser;
let contentDoc = browser.contentDocument;
let stack = browser.parentNode;
