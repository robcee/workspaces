/*
 * Context >> Chrome
 *
 * const Cc = Components.classes;
 * const Ci = Components.interfaces; 
 * const Cu = Components.utils;
 */

Cu.forceGC();

Cu.import("resource://gre/modules/Services.jsm") // Services

let win = Services.wm.getMostRecentWindow("navigator:browser");
let gBrowser = win.gBrowser;
let doc = gBrowser.ownerDocument; // xuldocument
let contentDoc = gBrowser.selectedBrowser.contentDocument;

