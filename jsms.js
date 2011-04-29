/*
 * JSM loader
 *
 *
 * All Copyright dedicated to the Public Domain.
 * January 21, 2011
 *
 * Contributors:
 *   David Dahl <ddahl@mozilla.com>, original author
 *
 */

const GRE_PREFIX = "resource://gre/modules/";
const MODULES_PREFIX = "resource:///modules/";

let jsms = [ 'NetUtil.jsm',
             'import_module.jsm',
             'XPCOMUtils.jsm',
             'ISO8601DateUtils.jsm',
             'PluralForm.jsm',
             'PlacesDBUtils.jsm',
             'PlacesUtils.jsm',
             'ctypes.jsm',
             'NetworkHelper.jsm',
             'HUDService.jsm',
             'PropertyPanel.jsm',
             'PerfMeasurement.jsm',
             'CommonDialog.jsm',
             'nsFormAutoCompleteResult.jsm',
             'DownloadPaths.jsm',
             'DownloadTaskbarProgress.jsm',
             'DownloadUtils.jsm',
             'DownloadLastDir.jsm',
             'PluginProvider.jsm',
             'AddonLogging.jsm',
             'XPIProvider.jsm',
             'AddonManager.jsm',
             'AddonUpdateChecker.jsm',
             'AddonRepository.jsm',
             'LightweightThemeManager.jsm',
             'CertUtils.jsm',
             'FileUtils.jsm',
             'Geometry.jsm',
             'WindowDraggingUtils.jsm',
             'Services.jsm',
             'LightweightThemeConsumer.jsm',
             'InlineSpellChecker.jsm',
             'PopupNotifications.jsm',
             'CrashSubmit.jsm',
             'instrument.jsm',
             'PlacesUIUtils.jsm',
             'WindowsJumpLists.jsm',
             'WindowsPreviewPerTab.jsm',
             'NetworkPrioritizer.jsm',
             'stylePanel.jsm',
             'domplate.jsm',
             'openLocationLastURL.jsm',
             'utils.jsm',
             'AllTabs.jsm',
             'CSPUtils.jsm',];

let jsmPaths = [];

let log = function _log(aMsg) {
  // TODO: thios should be global somehow
  Services.console.logStringMessage(aMsg);
};

jsms.forEach(function(aJSM) {
  let scope = {};
  let uri;
  try {
    // try loading the module from gre path first:
    uri = GRE_PREFIX + aJSM;
    Cu.import(uri ,scope);
    if (Object.keys(scope) && Object.keys(scope)[0])
     jsmPaths.push("Cu.import("+uri+");");
  } catch (ex) {
  }

  let lastPath = jsmPaths.slice(-1);
  if (!lastPath && lastPath.search(/JSM/)) {
    // perhaps the jsm is in the modules path instead?
    try {
      uri = MODULES_PREFIX + aJSM;
      Cu.import(uri ,scope);
      if (Object.keys(scope) && Object.keys(scope)[0])
        jsmPaths.push("Cu.import("+uri+");");
    } catch(ex) {
      // not found
      log(ex);
    }
  }
});

jsmPaths.join("\n")


 Cu.import(resource://gre/modules/NetUtil.jsm);
Cu.import(resource://gre/modules/XPCOMUtils.jsm);
Cu.import(resource://gre/modules/ISO8601DateUtils.jsm);
Cu.import(resource://gre/modules/PluralForm.jsm);
Cu.import(resource://gre/modules/PlacesDBUtils.jsm);
Cu.import(resource://gre/modules/PlacesUtils.jsm);
Cu.import(resource://gre/modules/ctypes.jsm);
Cu.import(resource://gre/modules/NetworkHelper.jsm);
Cu.import(resource://gre/modules/HUDService.jsm);
Cu.import(resource://gre/modules/PropertyPanel.jsm);
Cu.import(resource://gre/modules/PerfMeasurement.jsm);
Cu.import(resource://gre/modules/CommonDialog.jsm);
Cu.import(resource://gre/modules/nsFormAutoCompleteResult.jsm);
Cu.import(resource://gre/modules/DownloadPaths.jsm);
Cu.import(resource://gre/modules/DownloadUtils.jsm);
Cu.import(resource://gre/modules/DownloadLastDir.jsm);
Cu.import(resource://gre/modules/AddonLogging.jsm);
Cu.import(resource://gre/modules/AddonManager.jsm);
Cu.import(resource://gre/modules/AddonUpdateChecker.jsm);
Cu.import(resource://gre/modules/AddonRepository.jsm);
Cu.import(resource://gre/modules/LightweightThemeManager.jsm);
Cu.import(resource://gre/modules/CertUtils.jsm);
Cu.import(resource://gre/modules/FileUtils.jsm);
Cu.import(resource://gre/modules/Geometry.jsm);
Cu.import(resource://gre/modules/WindowDraggingUtils.jsm);
Cu.import(resource://gre/modules/Services.jsm);
Cu.import(resource://gre/modules/LightweightThemeConsumer.jsm);
Cu.import(resource://gre/modules/InlineSpellChecker.jsm);
Cu.import(resource://gre/modules/PopupNotifications.jsm);
Cu.import(resource://gre/modules/CrashSubmit.jsm);
Cu.import(resource://gre/modules/PlacesUIUtils.jsm);
Cu.import(resource://gre/modules/NetworkPrioritizer.jsm);
Cu.import(resource://gre/modules/stylePanel.jsm);
Cu.import(resource://gre/modules/domplate.jsm);
Cu.import(resource://gre/modules/openLocationLastURL.jsm);
Cu.import(resource://gre/modules/CSPUtils.jsm);
