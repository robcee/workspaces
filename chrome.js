/*
 * const Cc = Components.classes;
 * const Ci = Components.interfaces; 
 * const Cu = Components.utils;
 */

Cu.import("resource://gre/modules/Services.jsm") // Services

Services.wm.getMostRecentWindow("navigator:browser");

Cu.forceGC()
