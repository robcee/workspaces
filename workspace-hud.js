/*
 * Context >> Chrome
 *
 * const Cc = Components.classes;
 * const Ci = Components.interfaces; 
 * const Cu = Components.utils;
 */

Cu.forceGC();

Cu.import("resource://gre/modules/Services.jsm") // Services
Cu.import("resource://gre/modules/HUDService.jsm");

const CATEGORY_CSS = 1;
const SEVERITY_WARNING = 1;

let win = Services.wm.getMostRecentWindow("navigator:browser");
let gBrowser = win.gBrowser;
// gBrowser

let hudId = HUDService.getHudIdByWindow(gBrowser.contentWindow);
// hud_panel130030833885535

let hud = HUDService.hudReferences[hudId]

// create some CSS nodes
for (i = 0; i < 20 + 1; i++) {
  let node = ConsoleUtils.createMessageNode(hud.outputNode.ownerDocument,
                                            CATEGORY_CSS,
                                            SEVERITY_WARNING,
                                              "css log x");
  ConsoleUtils.outputMessageNode(node, hudId);
}