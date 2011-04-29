/**
 * SimpleTest, a partial Test.Simple/Test.More API compatible test library.
 *
 * Why?
 *
 * Test.Simple doesn't work on IE < 6.
 * TODO:
 *  * Support the Test.Simple API used by MochiKit, to be able to test MochiKit
 * itself against IE 5.5
 *
 * NOTE: Pay attention to cross-browser compatibility in this file. For
 * instance, do not use const or JS > 1.5 features which are not yet
 * implemented everywhere.
 *
**/

if (typeof(SimpleTest) == "undefined") {
    var SimpleTest = {};
}

var parentRunner = null;
if (typeof(parent) != "undefined" && parent.TestRunner) {
    parentRunner = parent.TestRunner;
} else if (parent && parent.wrappedJSObject &&
           parent.wrappedJSObject.TestRunner) {
    parentRunner = parent.wrappedJSObject.TestRunner;
}

//Simple test to see if we are running in e10s IPC
var ipcMode = false;
if (parentRunner) {
  ipcMode = parentRunner.ipcMode;
}

/**
 * Check for OOP test plugin
**/
SimpleTest.testPluginIsOOP = function () {
    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    var prefservice = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefBranch);

    var testPluginIsOOP = false;
    if (navigator.platform.indexOf("Mac") == 0) {
        var xulRuntime = Components.classes["@mozilla.org/xre/app-info;1"]
                                   .getService(Components.interfaces.nsIXULAppInfo)
                                   .QueryInterface(Components.interfaces.nsIXULRuntime);
        if (xulRuntime.XPCOMABI.match(/x86-/)) {
            try {
                testPluginIsOOP = prefservice.getBoolPref("dom.ipc.plugins.enabled.i386.test.plugin");
            } catch (e) {
                testPluginIsOOP = prefservice.getBoolPref("dom.ipc.plugins.enabled.i386");
            }
        }
        else if (xulRuntime.XPCOMABI.match(/x86_64-/)) {
            try {
                testPluginIsOOP = prefservice.getBoolPref("dom.ipc.plugins.enabled.x86_64.test.plugin");
            } catch (e) {
                testPluginIsOOP = prefservice.getBoolPref("dom.ipc.plugins.enabled.x86_64");
            }
        }
    }
    else {
        testPluginIsOOP = prefservice.getBoolPref("dom.ipc.plugins.enabled");
    }

    return testPluginIsOOP;
};

// Check to see if the TestRunner is present and has logging
if (parentRunner) {
    SimpleTest._logEnabled = parentRunner.logEnabled;
}

SimpleTest._tests = [];
SimpleTest._stopOnLoad = true;

/**
 * Something like assert.
**/
SimpleTest.ok = function (condition, name, diag) {
    var test = {'result': !!condition, 'name': name, 'diag': diag};
    if (SimpleTest._logEnabled)
        SimpleTest._logResult(test, "TEST-PASS", "TEST-UNEXPECTED-FAIL");
    SimpleTest._tests.push(test);
};

/**
 * Roughly equivalent to ok(a==b, name)
**/
SimpleTest.is = function (a, b, name) {
    var repr = MochiKit.Base.repr;
    var pass = (a == b);
    var diag = pass ? repr(a) + " should equal " + repr(b)
                    : "got " + repr(a) + ", expected " + repr(b)
    SimpleTest.ok(pass, name, diag);
};

SimpleTest.isnot = function (a, b, name) {
    var repr = MochiKit.Base.repr;
    var pass = (a != b);
    var diag = pass ? repr(a) + " should not equal " + repr(b)
                    : "didn't expect " + repr(a) + ", but got it";
    SimpleTest.ok(pass, name, diag);
};

//  --------------- Test.Builder/Test.More todo() -----------------

SimpleTest.todo = function(condition, name, diag) {
  var test = {'result': !!condition, 'name': name, 'diag': diag, todo: true};
  if (SimpleTest._logEnabled)
      SimpleTest._logResult(test, "TEST-UNEXPECTED-PASS", "TEST-KNOWN-FAIL");
  SimpleTest._tests.push(test);
};

SimpleTest._logResult = function(test, passString, failString) {
  var msg = test.result ? passString : failString;
  msg += " | ";
  if (parentRunner.currentTestURL)
    msg += parentRunner.currentTestURL;
  msg += " | " + test.name;
  if (test.diag)
    msg += " - " + test.diag;
  if (test.result) {
      if (test.todo)
          parentRunner.logger.error(msg);
      else
          parentRunner.logger.log(msg);
  } else {
      if (test.todo)
          parentRunner.logger.log(msg);
      else
          parentRunner.logger.error(msg);
  }
};

/**
 * Copies of is and isnot with the call to ok replaced by a call to todo.
**/

SimpleTest.todo_is = function (a, b, name) {
    var repr = MochiKit.Base.repr;
    var pass = (a == b);
    var diag = pass ? repr(a) + " should equal " + repr(b)
                    : "got " + repr(a) + ", expected " + repr(b);
    SimpleTest.todo(pass, name, diag);
};

SimpleTest.todo_isnot = function (a, b, name) {
    var repr = MochiKit.Base.repr;
    var pass = (a != b);
    var diag = pass ? repr(a) + " should not equal " + repr(b)
                    : "didn't expect " + repr(a) + ", but got it";
    SimpleTest.todo(pass, name, diag);
};


/**
 * Makes a test report, returns it as a DIV element.
**/
SimpleTest.report = function () {
    var DIV = MochiKit.DOM.DIV;
    var passed = 0;
    var failed = 0;
    var todo = 0;

    // Report tests which did not actually check anything.
    if (SimpleTest._tests.length == 0)
      // ToDo: Do s/todo/ok/ when all the tests are fixed. (Bug 483407)
      SimpleTest.todo(false, "[SimpleTest.report()] No checks actually run.");

    var results = MochiKit.Base.map(
        function (test) {
            var cls, msg;
            var diag = test.diag ? " - " + test.diag : "";
            if (test.todo && !test.result) {
                todo++;
                cls = "test_todo";
                msg = "todo | " + test.name + diag;
            } else if (test.result && !test.todo) {
                passed++;
                cls = "test_ok";
                msg = "passed | " + test.name + diag;
            } else {
                failed++;
                cls = "test_not_ok";
                msg = "failed | " + test.name + diag;
            }
            return DIV({"class": cls}, msg);
        },
        SimpleTest._tests
    );

    var summary_class = failed != 0 ? 'some_fail' :
                          passed == 0 ? 'todo_only' : 'all_pass';

    return DIV({'class': 'tests_report'},
        DIV({'class': 'tests_summary ' + summary_class},
            DIV({'class': 'tests_passed'}, "Passed: " + passed),
            DIV({'class': 'tests_failed'}, "Failed: " + failed),
            DIV({'class': 'tests_todo'}, "Todo: " + todo)),
        results
    );
};

/**
 * Toggle element visibility
**/
SimpleTest.toggle = function(el) {
    if (MochiKit.Style.computedStyle(el, 'display') == 'block') {
        el.style.display = 'none';
    } else {
        el.style.display = 'block';
    }
};

/**
 * Toggle visibility for divs with a specific class.
**/
SimpleTest.toggleByClass = function (cls, evt) {
    var elems = getElementsByTagAndClassName('div', cls);
    MochiKit.Base.map(SimpleTest.toggle, elems);
    if (evt)
        evt.preventDefault();
};

/**
 * Shows the report in the browser
**/

SimpleTest.showReport = function() {
    var togglePassed = A({'href': '#'}, "Toggle passed checks");
    var toggleFailed = A({'href': '#'}, "Toggle failed checks");
    var toggleTodo = A({'href': '#'}, "Toggle todo checks");
    togglePassed.onclick = partial(SimpleTest.toggleByClass, 'test_ok');
    toggleFailed.onclick = partial(SimpleTest.toggleByClass, 'test_not_ok');
    toggleTodo.onclick = partial(SimpleTest.toggleByClass, 'test_todo');
    var body = document.body;  // Handles HTML documents
    if (!body) {
        // Do the XML thing.
        body = document.getElementsByTagNameNS("http://www.w3.org/1999/xhtml",
                                               "body")[0];
    }
    var firstChild = body.childNodes[0];
    var addNode;
    if (firstChild) {
        addNode = function (el) {
            body.insertBefore(el, firstChild);
        };
    } else {
        addNode = function (el) {
            body.appendChild(el)
        };
    }
    addNode(togglePassed);
    addNode(SPAN(null, " "));
    addNode(toggleFailed);
    addNode(SPAN(null, " "));
    addNode(toggleTodo);
    addNode(SimpleTest.report());
    // Add a separator from the test content.
    addNode(HR());
};

/**
 * Tells SimpleTest to don't finish the test when the document is loaded,
 * useful for asynchronous tests.
 *
 * When SimpleTest.waitForExplicitFinish is called,
 * explicit SimpleTest.finish() is required.
**/
SimpleTest.waitForExplicitFinish = function () {
    SimpleTest._stopOnLoad = false;
};

/**
 * Multiply the timeout the parent runner uses for this test by the
 * given factor.
 *
 * For example, in a test that may take a long time to complete, using
 * "SimpleTest.requestLongerTimeout(5)" will give it 5 times as long to
 * finish.
 */
SimpleTest.requestLongerTimeout = function (factor) {
    if (parentRunner) {
        parentRunner.requestLongerTimeout(factor);
    }
}

SimpleTest.waitForFocus_started = false;
SimpleTest.waitForFocus_loaded = false;
SimpleTest.waitForFocus_focused = false;

/**
 * If the page is not yet loaded, waits for the load event. In addition, if
 * the page is not yet focused, focuses and waits for the window to be
 * focused. Calls the callback when completed. If the current page is
 * 'about:blank', then the page is assumed to not yet be loaded. Pass true for
 * expectBlankPage to not make this assumption if you expect a blank page to
 * be present.
 *
 * targetWindow should be specified if it is different than 'window'. The actual
 * focused window may be a descendant of targetWindow.
 *
 * @param callback
 *        function called when load and focus are complete
 * @param targetWindow
 *        optional window to be loaded and focused, defaults to 'window'
 * @param expectBlankPage
 *        true if targetWindow.location is 'about:blank'. Defaults to false
 */
SimpleTest.waitForFocus = function (callback, targetWindow, expectBlankPage) {
    if (!targetWindow)
      targetWindow = window;

    if (ipcMode) {
      var domutils = targetWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor).
                     getInterface(Components.interfaces.nsIDOMWindowUtils);

      //TODO: make this support scenarios where we run test standalone and not inside of TestRunner only
      if (parent && parent.ipcWaitForFocus != undefined) {
        parent.contentAsyncEvent("waitForFocus", {"callback":callback, "targetWindow":domutils.outerWindowID});
      }
      return;
    }

    SimpleTest.waitForFocus_started = false;
    expectBlankPage = !!expectBlankPage;

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
    var fm = Components.classes["@mozilla.org/focus-manager;1"].
                        getService(Components.interfaces.nsIFocusManager);

    var childTargetWindow = { };
    fm.getFocusedElementForWindow(targetWindow, true, childTargetWindow);
    childTargetWindow = childTargetWindow.value;

    function info(msg) {
      if (SimpleTest._logEnabled)
        SimpleTest._logResult({result: true, name: msg}, "TEST-INFO");
      else
        dump("TEST-INFO | " + msg + "\n");
    }

    function debugFocusLog(prefix) {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

        var baseWindow = targetWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor)
                                     .getInterface(Components.interfaces.nsIWebNavigation)
                                     .QueryInterface(Components.interfaces.nsIBaseWindow);
        info(prefix + " -- loaded: " + targetWindow.document.readyState +
           " active window: " +
               (fm.activeWindow ? "(" + fm.activeWindow + ") " + fm.activeWindow.location : "<no window active>") +
           " focused window: " +
               (fm.focusedWindow ? "(" + fm.focusedWindow + ") " + fm.focusedWindow.location : "<no window focused>") +
           " desired window: (" + targetWindow + ") " + targetWindow.location +
           " child window: (" + childTargetWindow + ") " + childTargetWindow.location +
           " docshell visible: " + baseWindow.visibility);
    }

    debugFocusLog("before wait for focus");

    function maybeRunTests() {
        debugFocusLog("maybe run tests <load:" +
                      SimpleTest.waitForFocus_loaded + ", focus:" + SimpleTest.waitForFocus_focused + ">");
        if (SimpleTest.waitForFocus_loaded &&
            SimpleTest.waitForFocus_focused &&
            !SimpleTest.waitForFocus_started) {
            SimpleTest.waitForFocus_started = true;
            setTimeout(callback, 0, targetWindow);
        }
    }

    function waitForEvent(event) {
        try {
            debugFocusLog("waitForEvent called <type:" + event.type + ", target" + event.target + ">");

            // Check to make sure that this isn't a load event for a blank or
            // non-blank page that wasn't desired.
            if (event.type == "load" && (expectBlankPage != (event.target.location == "about:blank")))
                return;

            SimpleTest["waitForFocus_" + event.type + "ed"] = true;
            var win = (event.type == "load") ? targetWindow : childTargetWindow;
            win.removeEventListener(event.type, waitForEvent, true);
            maybeRunTests();
        } catch (e) {
            SimpleTest.ok(false, "Exception caught in waitForEvent: " + e.message +
                ", at: " + e.fileName + " (" + e.lineNumber + ")");
        }
    }

    // If the current document is about:blank and we are not expecting a blank
    // page (or vice versa), and the document has not yet loaded, wait for the
    // page to load. A common situation is to wait for a newly opened window
    // to load its content, and we want to skip over any intermediate blank
    // pages that load. This issue is described in bug 554873.
    SimpleTest.waitForFocus_loaded =
        (expectBlankPage == (targetWindow.location == "about:blank")) &&
        targetWindow.document.readyState == "complete";
    if (!SimpleTest.waitForFocus_loaded) {
        info("must wait for load");
        targetWindow.addEventListener("load", waitForEvent, true);
    }

    // Check if the desired window is already focused.
    var focusedChildWindow = { };
    if (fm.activeWindow) {
        fm.getFocusedElementForWindow(fm.activeWindow, true, focusedChildWindow);
        focusedChildWindow = focusedChildWindow.value;
    }

    // If this is a child frame, ensure that the frame is focused.
    SimpleTest.waitForFocus_focused = (focusedChildWindow == childTargetWindow);
    if (SimpleTest.waitForFocus_focused) {
        info("already focused");
        // If the frame is already focused and loaded, call the callback directly.
        maybeRunTests();
    }
    else {
        info("must wait for focus");
        childTargetWindow.addEventListener("focus", waitForEvent, true);
        childTargetWindow.focus();
    }
};

SimpleTest.waitForClipboard_polls = 0;

/*
 * Polls the clipboard waiting for the expected value. A known value different than
 * the expected value is put on the clipboard first (and also polled for) so we
 * can be sure the value we get isn't just the expected value because it was already
 * on the clipboard. This only uses the global clipboard and only for text/unicode
 * values.
 *
 * @param aExpectedVal
 *        The string value that is expected to be on the clipboard
 * @param aSetupFn
 *        A function responsible for setting the clipboard to the expected value,
 *        called after the known value setting succeeds.
 * @param aSuccessFn
 *        A function called when the expected value is found on the clipboard.
 * @param aFailureFn
 *        A function called if the expected value isn't found on the clipboard
 *        within 5s. It can also be called if the known value can't be found.
 */
SimpleTest.waitForClipboard = function(aExpectedVal, aSetupFn, aSuccessFn, aFailureFn) {
    if (ipcMode) {
      //TODO: support waitForClipboard via events to chrome
      dump("E10S_TODO: bug 573735 addresses adding support for this");
      return;
    }

    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

    var cbSvc = Components.classes["@mozilla.org/widget/clipboard;1"].
                getService(Components.interfaces.nsIClipboard);

    // reset for the next use
    function reset() {
        SimpleTest.waitForClipboard_polls = 0;
    }

    function wait(expectedVal, successFn, failureFn) {
        netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

        if (++SimpleTest.waitForClipboard_polls > 50) {
            // Log the failure.
            SimpleTest.ok(false, "Timed out while polling clipboard for pasted data. " +
                                 "Expected " + expectedVal);
            reset();
            failureFn();
            return;
        }

        var xferable = Components.classes["@mozilla.org/widget/transferable;1"].
                       createInstance(Components.interfaces.nsITransferable);
        xferable.addDataFlavor("text/unicode");
        cbSvc.getData(xferable, cbSvc.kGlobalClipboard);
        var data = {};
        try {
            xferable.getTransferData("text/unicode", data, {});
            data = data.value.QueryInterface(Components.interfaces.nsISupportsString).data;
        } catch (e) {}

        if (data == expectedVal) {
            // Don't show the success message when waiting for preExpectedVal
            if (data != preExpectedVal)
                SimpleTest.ok(true,
                              "Clipboard has the correct value (" + expectedVal + ")");
            reset();
            successFn();
        } else {
            setTimeout(function() wait(expectedVal, successFn, failureFn), 100);
        }
    }

    // First we wait for a known value != aExpectedVal
    var preExpectedVal = aExpectedVal + "-waitForClipboard-known-value";
    var cbHelperSvc = Components.classes["@mozilla.org/widget/clipboardhelper;1"].
                      getService(Components.interfaces.nsIClipboardHelper);
    cbHelperSvc.copyString(preExpectedVal);
    wait(preExpectedVal, function() {
        // Call the original setup fn
        aSetupFn();
        wait(aExpectedVal, aSuccessFn, aFailureFn);
    }, aFailureFn);
}

/**
 * Executes a function shortly after the call, but lets the caller continue
 * working (or finish).
 */
SimpleTest.executeSoon = function(aFunc) {
    if ("Components" in window && "classes" in window.Components) {
        try {
            netscape.security.PrivilegeManager
              .enablePrivilege("UniversalXPConnect");
            var tm = Components.classes["@mozilla.org/thread-manager;1"]
                       .getService(Components.interfaces.nsIThreadManager);

            tm.mainThread.dispatch({
                run: function() {
                    aFunc();
                }
            }, Components.interfaces.nsIThread.DISPATCH_NORMAL);
            return;
        } catch (ex) {
            // If the above fails (most likely because of enablePrivilege
            // failing, fall through to the setTimeout path.
        }
    }
    setTimeout(aFunc, 0);
}

/**
 * Finishes the tests. This is automatically called, except when
 * SimpleTest.waitForExplicitFinish() has been invoked.
**/
SimpleTest.finish = function () {
    if (parentRunner) {
        /* We're running in an iframe, and the parent has a TestRunner */
        parentRunner.testFinished(SimpleTest._tests);
    } else {
        SimpleTest.showReport();
    }
};


addLoadEvent(function() {
    if (SimpleTest._stopOnLoad) {
        SimpleTest.finish();
    }
});

//  --------------- Test.Builder/Test.More isDeeply() -----------------


SimpleTest.DNE = {dne: 'Does not exist'};
SimpleTest.LF = "\r\n";
SimpleTest._isRef = function (object) {
    var type = typeof(object);
    return type == 'object' || type == 'function';
};


SimpleTest._deepCheck = function (e1, e2, stack, seen) {
    var ok = false;
    // Either they're both references or both not.
    var sameRef = !(!SimpleTest._isRef(e1) ^ !SimpleTest._isRef(e2));
    if (e1 == null && e2 == null) {
        ok = true;
    } else if (e1 != null ^ e2 != null) {
        ok = false;
    } else if (e1 == SimpleTest.DNE ^ e2 == SimpleTest.DNE) {
        ok = false;
    } else if (sameRef && e1 == e2) {
        // Handles primitives and any variables that reference the same
        // object, including functions.
        ok = true;
    } else if (SimpleTest.isa(e1, 'Array') && SimpleTest.isa(e2, 'Array')) {
        ok = SimpleTest._eqArray(e1, e2, stack, seen);
    } else if (typeof e1 == "object" && typeof e2 == "object") {
        ok = SimpleTest._eqAssoc(e1, e2, stack, seen);
    } else {
        // If we get here, they're not the same (function references must
        // always simply rererence the same function).
        stack.push({ vals: [e1, e2] });
        ok = false;
    }
    return ok;
};

SimpleTest._eqArray = function (a1, a2, stack, seen) {
    // Return if they're the same object.
    if (a1 == a2) return true;

    // JavaScript objects have no unique identifiers, so we have to store
    // references to them all in an array, and then compare the references
    // directly. It's slow, but probably won't be much of an issue in
    // practice. Start by making a local copy of the array to as to avoid
    // confusing a reference seen more than once (such as [a, a]) for a
    // circular reference.
    for (var j = 0; j < seen.length; j++) {
        if (seen[j][0] == a1) {
            return seen[j][1] == a2;
        }
    }

    // If we get here, we haven't seen a1 before, so store it with reference
    // to a2.
    seen.push([ a1, a2 ]);

    var ok = true;
    // Only examines enumerable attributes. Only works for numeric arrays!
    // Associative arrays return 0. So call _eqAssoc() for them, instead.
    var max = a1.length > a2.length ? a1.length : a2.length;
    if (max == 0) return SimpleTest._eqAssoc(a1, a2, stack, seen);
    for (var i = 0; i < max; i++) {
        var e1 = i > a1.length - 1 ? SimpleTest.DNE : a1[i];
        var e2 = i > a2.length - 1 ? SimpleTest.DNE : a2[i];
        stack.push({ type: 'Array', idx: i, vals: [e1, e2] });
        if (ok = SimpleTest._deepCheck(e1, e2, stack, seen)) {
            stack.pop();
        } else {
            break;
        }
    }
    return ok;
};

SimpleTest._eqAssoc = function (o1, o2, stack, seen) {
    // Return if they're the same object.
    if (o1 == o2) return true;

    // JavaScript objects have no unique identifiers, so we have to store
    // references to them all in an array, and then compare the references
    // directly. It's slow, but probably won't be much of an issue in
    // practice. Start by making a local copy of the array to as to avoid
    // confusing a reference seen more than once (such as [a, a]) for a
    // circular reference.
    seen = seen.slice(0);
    for (var j = 0; j < seen.length; j++) {
        if (seen[j][0] == o1) {
            return seen[j][1] == o2;
        }
    }

    // If we get here, we haven't seen o1 before, so store it with reference
    // to o2.
    seen.push([ o1, o2 ]);

    // They should be of the same class.

    var ok = true;
    // Only examines enumerable attributes.
    var o1Size = 0; for (var i in o1) o1Size++;
    var o2Size = 0; for (var i in o2) o2Size++;
    var bigger = o1Size > o2Size ? o1 : o2;
    for (var i in bigger) {
        var e1 = o1[i] == undefined ? SimpleTest.DNE : o1[i];
        var e2 = o2[i] == undefined ? SimpleTest.DNE : o2[i];
        stack.push({ type: 'Object', idx: i, vals: [e1, e2] });
        if (ok = SimpleTest._deepCheck(e1, e2, stack, seen)) {
            stack.pop();
        } else {
            break;
        }
    }
    return ok;
};

SimpleTest._formatStack = function (stack) {
    var variable = '$Foo';
    for (var i = 0; i < stack.length; i++) {
        var entry = stack[i];
        var type = entry['type'];
        var idx = entry['idx'];
        if (idx != null) {
            if (/^\d+$/.test(idx)) {
                // Numeric array index.
                variable += '[' + idx + ']';
            } else {
                // Associative array index.
                idx = idx.replace("'", "\\'");
                variable += "['" + idx + "']";
            }
        }
    }

    var vals = stack[stack.length-1]['vals'].slice(0, 2);
    var vars = [
        variable.replace('$Foo',     'got'),
        variable.replace('$Foo',     'expected')
    ];

    var out = "Structures begin differing at:" + SimpleTest.LF;
    for (var i = 0; i < vals.length; i++) {
        var val = vals[i];
        if (val == null) {
            val = 'undefined';
        } else {
            val == SimpleTest.DNE ? "Does not exist" : "'" + val + "'";
        }
    }

    out += vars[0] + ' = ' + vals[0] + SimpleTest.LF;
    out += vars[1] + ' = ' + vals[1] + SimpleTest.LF;

    return '    ' + out;
};


SimpleTest.isDeeply = function (it, as, name) {
    var ok;
    // ^ is the XOR operator.
    if (SimpleTest._isRef(it) ^ SimpleTest._isRef(as)) {
        // One's a reference, one isn't.
        ok = false;
    } else if (!SimpleTest._isRef(it) && !SimpleTest._isRef(as)) {
        // Neither is an object.
        ok = SimpleTest.is(it, as, name);
    } else {
        // We have two objects. Do a deep comparison.
        var stack = [], seen = [];
        if ( SimpleTest._deepCheck(it, as, stack, seen)) {
            ok = SimpleTest.ok(true, name);
        } else {
            ok = SimpleTest.ok(false, name, SimpleTest._formatStack(stack));
        }
    }
    return ok;
};

SimpleTest.typeOf = function (object) {
    var c = Object.prototype.toString.apply(object);
    var name = c.substring(8, c.length - 1);
    if (name != 'Object') return name;
    // It may be a non-core class. Try to extract the class name from
    // the constructor function. This may not work in all implementations.
    if (/function ([^(\s]+)/.test(Function.toString.call(object.constructor))) {
        return RegExp.$1;
    }
    // No idea. :-(
    return name;
};

SimpleTest.isa = function (object, clas) {
    return SimpleTest.typeOf(object) == clas;
};

// Global symbols:
var ok = SimpleTest.ok;
var is = SimpleTest.is;
var isnot = SimpleTest.isnot;
var todo = SimpleTest.todo;
var todo_is = SimpleTest.todo_is;
var todo_isnot = SimpleTest.todo_isnot;
var isDeeply = SimpleTest.isDeeply;

var gOldOnError = window.onerror;
window.onerror = function simpletestOnerror(errorMsg, url, lineNumber) {
  var funcIdentifier = "[SimpleTest/SimpleTest.js, window.onerror] ";

  // Log the message.
  ok(false, funcIdentifier + "An error occurred", errorMsg + " at " + url + ":" + lineNumber);
  // There is no Components.stack.caller to log. (See bug 511888.)

  // Call previous handler.
  if (gOldOnError) {
    try {
      // Ignore return value: always run default handler.
      gOldOnError(errorMsg, url, lineNumber);
    } catch (e) {
      // Log the error.
      ok(false, funcIdentifier + "Exception thrown by gOldOnError()", e);
      // Log its stack.
      if (e.stack)
        ok(false, funcIdentifier + "JavaScript error stack:\n" + e.stack);
    }
  }

  if (!SimpleTest._stopOnLoad) {
    // Need to finish() manually here, yet let the test actually end first.
    SimpleTest.executeSoon(SimpleTest.finish);
  }
}

/**
 * EventUtils provides some utility methods for creating and sending DOM events.
 * Current methods:
 *  sendMouseEvent
 *  sendChar
 *  sendString
 *  sendKey
 */

/**
 * Send a mouse event to the node aTarget (aTarget can be an id, or an
 * actual node) . The "event" passed in to aEvent is just a JavaScript
 * object with the properties set that the real mouse event object should
 * have. This includes the type of the mouse event.
 * E.g. to send an click event to the node with id 'node' you might do this:
 *
 * sendMouseEvent({type:'click'}, 'node');
 */
function sendMouseEvent(aEvent, aTarget, aWindow) {
  if (['click', 'mousedown', 'mouseup', 'mouseover', 'mouseout'].indexOf(aEvent.type) == -1) {
    throw new Error("sendMouseEvent doesn't know about event type '"+aEvent.type+"'");
  }

  if (!aWindow) {
    aWindow = window;
  }

  if (!(aTarget instanceof Element)) {
    aTarget = aWindow.document.getElementById(aTarget);
  }

  // For events to trigger the UA's default actions they need to be "trusted"
  netscape.security.PrivilegeManager.enablePrivilege('UniversalBrowserWrite');

  var event = aWindow.document.createEvent('MouseEvent');

  var typeArg          = aEvent.type;
  var canBubbleArg     = true;
  var cancelableArg    = true;
  var viewArg          = aWindow;
  var detailArg        = aEvent.detail        || (aEvent.type == 'click'     ||
                                                  aEvent.type == 'mousedown' ||
                                                  aEvent.type == 'mouseup' ? 1 : 0);
  var screenXArg       = aEvent.screenX       || 0;
  var screenYArg       = aEvent.screenY       || 0;
  var clientXArg       = aEvent.clientX       || 0;
  var clientYArg       = aEvent.clientY       || 0;
  var ctrlKeyArg       = aEvent.ctrlKey       || false;
  var altKeyArg        = aEvent.altKey        || false;
  var shiftKeyArg      = aEvent.shiftKey      || false;
  var metaKeyArg       = aEvent.metaKey       || false;
  var buttonArg        = aEvent.button        || 0;
  var relatedTargetArg = aEvent.relatedTarget || null;

  event.initMouseEvent(typeArg, canBubbleArg, cancelableArg, viewArg, detailArg,
                       screenXArg, screenYArg, clientXArg, clientYArg,
                       ctrlKeyArg, altKeyArg, shiftKeyArg, metaKeyArg,
                       buttonArg, relatedTargetArg);

  aTarget.dispatchEvent(event);
}

/**
 * Send the char aChar to the node with id aTarget.  If aTarget is not
 * provided, use "target".  This method handles casing of chars (sends the
 * right charcode, and sends a shift key for uppercase chars).  No other
 * modifiers are handled at this point.
 *
 * For now this method only works for English letters (lower and upper case)
 * and the digits 0-9.
 *
 * Returns true if the keypress event was accepted (no calls to preventDefault
 * or anything like that), false otherwise.
 */
function sendChar(aChar, aTarget) {
  // DOM event charcodes match ASCII (JS charcodes) for a-zA-Z0-9.
  var hasShift = (aChar == aChar.toUpperCase());
  var charCode = aChar.charCodeAt(0);
  var keyCode = charCode;
  if (!hasShift) {
    // For lowercase letters, the keyCode is actually 32 less than the charCode
    keyCode -= 0x20;
  }

  return __doEventDispatch(aTarget, charCode, keyCode, hasShift);
}

/**
 * Send the string aStr to the node with id aTarget.  If aTarget is not
 * provided, use "target".
 *
 * For now this method only works for English letters (lower and upper case)
 * and the digits 0-9.
 */
function sendString(aStr, aTarget) {
  for (var i = 0; i < aStr.length; ++i) {
    sendChar(aStr.charAt(i), aTarget);
  }
}

/**
 * Send the non-character key aKey to the node with id aTarget. If aTarget is
 * not provided, use "target".  The name of the key should be a lowercase
 * version of the part that comes after "DOM_VK_" in the KeyEvent constant
 * name for this key.  No modifiers are handled at this point.
 *
 * Returns true if the keypress event was accepted (no calls to preventDefault
 * or anything like that), false otherwise.
 */
function sendKey(aKey, aTarget) {
  keyName = "DOM_VK_" + aKey.toUpperCase();

  if (!KeyEvent[keyName]) {
    throw "Unknown key: " + keyName;
  }

  return __doEventDispatch(aTarget, 0, KeyEvent[keyName], false);
}

/**
 * Actually perform event dispatch given a charCode, keyCode, and boolean for
 * whether "shift" was pressed.  Send the event to the node with id aTarget.  If
 * aTarget is not provided, use "target".
 *
 * Returns true if the keypress event was accepted (no calls to preventDefault
 * or anything like that), false otherwise.
 */
function __doEventDispatch(aTarget, aCharCode, aKeyCode, aHasShift) {
  if (aTarget === undefined) {
    aTarget = "target";
  }

  // Make our events trusted
  netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");

  var event = document.createEvent("KeyEvents");
  event.initKeyEvent("keydown", true, true, document.defaultView,
                     false, false, aHasShift, false,
                     aKeyCode, 0);
  var accepted = $(aTarget).dispatchEvent(event);

  // Preventing the default keydown action also prevents the default
  // keypress action.
  event = document.createEvent("KeyEvents");
  if (aCharCode) {
    event.initKeyEvent("keypress", true, true, document.defaultView,
                       false, false, aHasShift, false,
                       0, aCharCode);
  } else {
    event.initKeyEvent("keypress", true, true, document.defaultView,
                       false, false, aHasShift, false,
                       aKeyCode, 0);
  }
  if (!accepted) {
    event.preventDefault();
  }
  accepted = $(aTarget).dispatchEvent(event);

  // Always send keyup
  var event = document.createEvent("KeyEvents");
  event.initKeyEvent("keyup", true, true, document.defaultView,
                     false, false, aHasShift, false,
                     aKeyCode, 0);
  $(aTarget).dispatchEvent(event);
  return accepted;
}

/**
 * Parse the key modifier flags from aEvent. Used to share code between
 * synthesizeMouse and synthesizeKey.
 */
function _parseModifiers(aEvent)
{
  const masks = Components.interfaces.nsIDOMNSEvent;
  var mval = 0;
  if (aEvent.shiftKey)
    mval |= masks.SHIFT_MASK;
  if (aEvent.ctrlKey)
    mval |= masks.CONTROL_MASK;
  if (aEvent.altKey)
    mval |= masks.ALT_MASK;
  if (aEvent.metaKey)
    mval |= masks.META_MASK;
  if (aEvent.accelKey)
    mval |= (navigator.platform.indexOf("Mac") >= 0) ? masks.META_MASK :
                                                       masks.CONTROL_MASK;

  return mval;
}

/**
 * Synthesize a mouse event on a target. The actual client point is determined
 * by taking the aTarget's client box and offseting it by aOffsetX and
 * aOffsetY. This allows mouse clicks to be simulated by calling this method.
 *
 * aEvent is an object which may contain the properties:
 *   shiftKey, ctrlKey, altKey, metaKey, accessKey, clickCount, button, type
 *
 * If the type is specified, an mouse event of that type is fired. Otherwise,
 * a mousedown followed by a mouse up is performed.
 *
 * aWindow is optional, and defaults to the current window object.
 */
function synthesizeMouse(aTarget, aOffsetX, aOffsetY, aEvent, aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  if (!aWindow)
    aWindow = window;

  var utils = aWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor).
                      getInterface(Components.interfaces.nsIDOMWindowUtils);
  if (utils) {
    var button = aEvent.button || 0;
    var clickCount = aEvent.clickCount || 1;
    var modifiers = _parseModifiers(aEvent);

    var rect = aTarget.getBoundingClientRect();

    var left = rect.left + aOffsetX;
    var top = rect.top + aOffsetY;

    if (aEvent.type) {
      utils.sendMouseEvent(aEvent.type, left, top, button, clickCount, modifiers);
    }
    else {
      utils.sendMouseEvent("mousedown", left, top, button, clickCount, modifiers);
      utils.sendMouseEvent("mouseup", left, top, button, clickCount, modifiers);
    }
  }
}

// Call synthesizeMouse with coordinates at the center of aTarget.
function synthesizeMouseAtCenter(aTarget, aEvent, aWindow)
{
  var rect = aTarget.getBoundingClientRect();
  synthesizeMouse(aTarget, rect.width / 2, rect.height / 2, aEvent,
                  aWindow);
}

/**
 * Synthesize a mouse scroll event on a target. The actual client point is determined
 * by taking the aTarget's client box and offseting it by aOffsetX and
 * aOffsetY.
 *
 * aEvent is an object which may contain the properties:
 *   shiftKey, ctrlKey, altKey, metaKey, accessKey, button, type, axis, delta, hasPixels
 *
 * If the type is specified, a mouse scroll event of that type is fired. Otherwise,
 * "DOMMouseScroll" is used.
 *
 * If the axis is specified, it must be one of "horizontal" or "vertical". If not specified,
 * "vertical" is used.
 *
 * 'delta' is the amount to scroll by (can be positive or negative). It must
 * be specified.
 *
 * 'hasPixels' specifies whether kHasPixels should be set in the scrollFlags.
 *
 * 'isMomentum' specifies whether kIsMomentum should be set in the scrollFlags.
 *
 * aWindow is optional, and defaults to the current window object.
 */
function synthesizeMouseScroll(aTarget, aOffsetX, aOffsetY, aEvent, aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  if (!aWindow)
    aWindow = window;

  var utils = aWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor).
                      getInterface(Components.interfaces.nsIDOMWindowUtils);
  if (utils) {
    // See nsMouseScrollFlags in nsGUIEvent.h
    const kIsVertical = 0x02;
    const kIsHorizontal = 0x04;
    const kHasPixels = 0x08;
    const kIsMomentum = 0x40;

    var button = aEvent.button || 0;
    var modifiers = _parseModifiers(aEvent);

    var rect = aTarget.getBoundingClientRect();

    var left = rect.left;
    var top = rect.top;

    var type = aEvent.type || "DOMMouseScroll";
    var axis = aEvent.axis || "vertical";
    var scrollFlags = (axis == "horizontal") ? kIsHorizontal : kIsVertical;
    if (aEvent.hasPixels) {
      scrollFlags |= kHasPixels;
    }
    if (aEvent.isMomentum) {
      scrollFlags |= kIsMomentum;
    }
    utils.sendMouseScrollEvent(type, left + aOffsetX, top + aOffsetY, button,
                               scrollFlags, aEvent.delta, modifiers);
  }
}

function _computeKeyCodeFromChar(aChar)
{
  if (aChar.length != 1) {
    return 0;
  }
  const nsIDOMKeyEvent = Components.interfaces.nsIDOMKeyEvent;
  if (aChar >= 'a' && aChar <= 'z') {
    return nsIDOMKeyEvent.DOM_VK_A + aChar.charCodeAt(0) - 'a'.charCodeAt(0);
  }
  if (aChar >= 'A' && aChar <= 'Z') {
    return nsIDOMKeyEvent.DOM_VK_A + aChar.charCodeAt(0) - 'A'.charCodeAt(0);
  }
  if (aChar >= '0' && aChar <= '9') {
    return nsIDOMKeyEvent.DOM_VK_0 + aChar.charCodeAt(0) - '0'.charCodeAt(0);
  }
  // returns US keyboard layout's keycode
  switch (aChar) {
    case '~':
    case '`':
      return nsIDOMKeyEvent.DOM_VK_BACK_QUOTE;
    case '!':
      return nsIDOMKeyEvent.DOM_VK_1;
    case '@':
      return nsIDOMKeyEvent.DOM_VK_2;
    case '#':
      return nsIDOMKeyEvent.DOM_VK_3;
    case '$':
      return nsIDOMKeyEvent.DOM_VK_4;
    case '%':
      return nsIDOMKeyEvent.DOM_VK_5;
    case '^':
      return nsIDOMKeyEvent.DOM_VK_6;
    case '&':
      return nsIDOMKeyEvent.DOM_VK_7;
    case '*':
      return nsIDOMKeyEvent.DOM_VK_8;
    case '(':
      return nsIDOMKeyEvent.DOM_VK_9;
    case ')':
      return nsIDOMKeyEvent.DOM_VK_0;
    case '-':
    case '_':
      return nsIDOMKeyEvent.DOM_VK_SUBTRACT;
    case '+':
    case '=':
      return nsIDOMKeyEvent.DOM_VK_EQUALS;
    case '{':
    case '[':
      return nsIDOMKeyEvent.DOM_VK_OPEN_BRACKET;
    case '}':
    case ']':
      return nsIDOMKeyEvent.DOM_VK_CLOSE_BRACKET;
    case '|':
    case '\\':
      return nsIDOMKeyEvent.DOM_VK_BACK_SLASH;
    case ':':
    case ';':
      return nsIDOMKeyEvent.DOM_VK_SEMICOLON;
    case '\'':
    case '"':
      return nsIDOMKeyEvent.DOM_VK_QUOTE;
    case '<':
    case ',':
      return nsIDOMKeyEvent.DOM_VK_COMMA;
    case '>':
    case '.':
      return nsIDOMKeyEvent.DOM_VK_PERIOD;
    case '?':
    case '/':
      return nsIDOMKeyEvent.DOM_VK_SLASH;
    default:
      return 0;
  }
}

/**
 * Synthesize a key event. It is targeted at whatever would be targeted by an
 * actual keypress by the user, typically the focused element.
 *
 * aKey should be either a character or a keycode starting with VK_ such as
 * VK_ENTER.
 *
 * aEvent is an object which may contain the properties:
 *   shiftKey, ctrlKey, altKey, metaKey, accessKey, type
 *
 * If the type is specified, a key event of that type is fired. Otherwise,
 * a keydown, a keypress and then a keyup event are fired in sequence.
 *
 * aWindow is optional, and defaults to the current window object.
 */
function synthesizeKey(aKey, aEvent, aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  if (!aWindow)
    aWindow = window;

  var utils = aWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor).
                      getInterface(Components.interfaces.nsIDOMWindowUtils);
  if (utils) {
    var keyCode = 0, charCode = 0;
    if (aKey.indexOf("VK_") == 0)
      keyCode = KeyEvent["DOM_" + aKey];
    else {
      charCode = aKey.charCodeAt(0);
      keyCode = _computeKeyCodeFromChar(aKey.charAt(0));
    }

    var modifiers = _parseModifiers(aEvent);

    if (aEvent.type == "keypress") {
      utils.sendKeyEvent(aEvent.type, charCode ? 0 : keyCode,
                         charCode, modifiers);
    } else if (aEvent.type) {
      utils.sendKeyEvent(aEvent.type, keyCode, 0, modifiers);
    } else {
      var keyDownDefaultHappened =
          utils.sendKeyEvent("keydown", keyCode, 0, modifiers);
      utils.sendKeyEvent("keypress", charCode ? 0 : keyCode, charCode,
                         modifiers, !keyDownDefaultHappened);
      utils.sendKeyEvent("keyup", keyCode, 0, modifiers);
    }
  }
}

var _gSeenEvent = false;

/**
 * Indicate that an event with an original target of aExpectedTarget and
 * a type of aExpectedEvent is expected to be fired, or not expected to
 * be fired.
 */
function _expectEvent(aExpectedTarget, aExpectedEvent, aTestName)
{
  if (!aExpectedTarget || !aExpectedEvent)
    return null;

  _gSeenEvent = false;

  var type = (aExpectedEvent.charAt(0) == "!") ?
             aExpectedEvent.substring(1) : aExpectedEvent;
  var eventHandler = function(event) {
    var epassed = (!_gSeenEvent && event.originalTarget == aExpectedTarget &&
                   event.type == type);
    is(epassed, true, aTestName + " " + type + " event target " + (_gSeenEvent ? "twice" : ""));
    _gSeenEvent = true;
  };

  aExpectedTarget.addEventListener(type, eventHandler, false);
  return eventHandler;
}

/**
 * Check if the event was fired or not. The event handler aEventHandler
 * will be removed.
 */
function _checkExpectedEvent(aExpectedTarget, aExpectedEvent, aEventHandler, aTestName)
{
  if (aEventHandler) {
    var expectEvent = (aExpectedEvent.charAt(0) != "!");
    var type = expectEvent ? aExpectedEvent : aExpectedEvent.substring(1);
    aExpectedTarget.removeEventListener(type, aEventHandler, false);
    var desc = type + " event";
    if (!expectEvent)
      desc += " not";
    is(_gSeenEvent, expectEvent, aTestName + " " + desc + " fired");
  }

  _gSeenEvent = false;
}

/**
 * Similar to synthesizeMouse except that a test is performed to see if an
 * event is fired at the right target as a result.
 *
 * aExpectedTarget - the expected originalTarget of the event.
 * aExpectedEvent - the expected type of the event, such as 'select'.
 * aTestName - the test name when outputing results
 *
 * To test that an event is not fired, use an expected type preceded by an
 * exclamation mark, such as '!select'. This might be used to test that a
 * click on a disabled element doesn't fire certain events for instance.
 *
 * aWindow is optional, and defaults to the current window object.
 */
function synthesizeMouseExpectEvent(aTarget, aOffsetX, aOffsetY, aEvent,
                                    aExpectedTarget, aExpectedEvent, aTestName,
                                    aWindow)
{
  var eventHandler = _expectEvent(aExpectedTarget, aExpectedEvent, aTestName);
  synthesizeMouse(aTarget, aOffsetX, aOffsetY, aEvent, aWindow);
  _checkExpectedEvent(aExpectedTarget, aExpectedEvent, eventHandler, aTestName);
}

/**
 * Similar to synthesizeKey except that a test is performed to see if an
 * event is fired at the right target as a result.
 *
 * aExpectedTarget - the expected originalTarget of the event.
 * aExpectedEvent - the expected type of the event, such as 'select'.
 * aTestName - the test name when outputing results
 *
 * To test that an event is not fired, use an expected type preceded by an
 * exclamation mark, such as '!select'.
 *
 * aWindow is optional, and defaults to the current window object.
 */
function synthesizeKeyExpectEvent(key, aEvent, aExpectedTarget, aExpectedEvent,
                                  aTestName, aWindow)
{
  var eventHandler = _expectEvent(aExpectedTarget, aExpectedEvent, aTestName);
  synthesizeKey(key, aEvent, aWindow);
  _checkExpectedEvent(aExpectedTarget, aExpectedEvent, eventHandler, aTestName);
}

/**
 * Emulate a dragstart event.
 *  element - element to fire the dragstart event on
 *  expectedDragData - the data you expect the data transfer to contain afterwards
 *                      This data is in the format:
 *                         [ [ {type: value, data: value, test: function}, ... ], ... ]
 *                     can be null
 *  aWindow - optional; defaults to the current window object.
 *  x - optional; initial x coordinate
 *  y - optional; initial y coordinate
 * Returns null if data matches.
 * Returns the event.dataTransfer if data does not match
 *
 * eqTest is an optional function if comparison can't be done with x == y;
 *   function (actualData, expectedData) {return boolean}
 *   @param actualData from dataTransfer
 *   @param expectedData from expectedDragData
 * see bug 462172 for example of use
 *
 */
function synthesizeDragStart(element, expectedDragData, aWindow, x, y)
{
  if (!aWindow)
    aWindow = window;
  x = x || 2;
  y = y || 2;
  const step = 9;

  var result = "trapDrag was not called";
  var trapDrag = function(event) {
    try {
      var dataTransfer = event.dataTransfer;
      result = null;
      if (!dataTransfer)
        throw "no dataTransfer";
      if (expectedDragData == null ||
          dataTransfer.mozItemCount != expectedDragData.length)
        throw dataTransfer;
      for (var i = 0; i < dataTransfer.mozItemCount; i++) {
        var dtTypes = dataTransfer.mozTypesAt(i);
        if (dtTypes.length != expectedDragData[i].length)
          throw dataTransfer;
        for (var j = 0; j < dtTypes.length; j++) {
          if (dtTypes[j] != expectedDragData[i][j].type)
            throw dataTransfer;
          var dtData = dataTransfer.mozGetDataAt(dtTypes[j],i);
          if (expectedDragData[i][j].eqTest) {
            if (!expectedDragData[i][j].eqTest(dtData, expectedDragData[i][j].data))
              throw dataTransfer;
          }
          else if (expectedDragData[i][j].data != dtData)
            throw dataTransfer;
        }
      }
    } catch(ex) {
      result = ex;
    }
    event.preventDefault();
    event.stopPropagation();
  }
  aWindow.addEventListener("dragstart", trapDrag, false);
  synthesizeMouse(element, x, y, { type: "mousedown" }, aWindow);
  x += step; y += step;
  synthesizeMouse(element, x, y, { type: "mousemove" }, aWindow);
  x += step; y += step;
  synthesizeMouse(element, x, y, { type: "mousemove" }, aWindow);
  aWindow.removeEventListener("dragstart", trapDrag, false);
  synthesizeMouse(element, x, y, { type: "mouseup" }, aWindow);
  return result;
}

/**
 * Emulate a drop by emulating a dragstart and firing events dragenter, dragover, and drop.
 *  srcElement - the element to use to start the drag, usually the same as destElement
 *               but if destElement isn't suitable to start a drag on pass a suitable
 *               element for srcElement
 *  destElement - the element to fire the dragover, dragleave and drop events
 *  dragData - the data to supply for the data transfer
 *                     This data is in the format:
 *                       [ [ {type: value, data: value}, ...], ... ]
 *  dropEffect - the drop effect to set during the dragstart event, or 'move' if null
 *  aWindow - optional; defaults to the current window object.
 *
 * Returns the drop effect that was desired.
 */
function synthesizeDrop(srcElement, destElement, dragData, dropEffect, aWindow)
{
  if (!aWindow)
    aWindow = window;

  var dataTransfer;
  var trapDrag = function(event) {
    dataTransfer = event.dataTransfer;
    for (var i = 0; i < dragData.length; i++) {
      var item = dragData[i];
      for (var j = 0; j < item.length; j++) {
        dataTransfer.mozSetDataAt(item[j].type, item[j].data, i);
      }
    }
    dataTransfer.dropEffect = dropEffect || "move";
    event.preventDefault();
    event.stopPropagation();
  }

  // need to use real mouse action
  aWindow.addEventListener("dragstart", trapDrag, true);
  synthesizeMouse(srcElement, 2, 2, { type: "mousedown" }, aWindow);
  synthesizeMouse(srcElement, 11, 11, { type: "mousemove" }, aWindow);
  synthesizeMouse(srcElement, 20, 20, { type: "mousemove" }, aWindow);
  aWindow.removeEventListener("dragstart", trapDrag, true);

  event = aWindow.document.createEvent("DragEvents");
  event.initDragEvent("dragenter", true, true, aWindow, 0, 0, 0, 0, 0, false, false, false, false, 0, null, dataTransfer);
  destElement.dispatchEvent(event);

  var event = aWindow.document.createEvent("DragEvents");
  event.initDragEvent("dragover", true, true, aWindow, 0, 0, 0, 0, 0, false, false, false, false, 0, null, dataTransfer);
  if (destElement.dispatchEvent(event)) {
    synthesizeMouse(destElement, 20, 20, { type: "mouseup" }, aWindow);
    return "none";
  }

  if (dataTransfer.dropEffect != "none") {
    event = aWindow.document.createEvent("DragEvents");
    event.initDragEvent("drop", true, true, aWindow, 0, 0, 0, 0, 0, false, false, false, false, 0, null, dataTransfer);
    destElement.dispatchEvent(event);
  }
  synthesizeMouse(destElement, 20, 20, { type: "mouseup" }, aWindow);

  return dataTransfer.dropEffect;
}

function disableNonTestMouseEvents(aDisable)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  var utils =
    window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).
           getInterface(Components.interfaces.nsIDOMWindowUtils);
  if (utils)
    utils.disableNonTestMouseEvents(aDisable);
}

function _getDOMWindowUtils(aWindow)
{
  if (!aWindow) {
    aWindow = window;
  }
  return aWindow.QueryInterface(Components.interfaces.nsIInterfaceRequestor).
                 getInterface(Components.interfaces.nsIDOMWindowUtils);
}

/**
 * Synthesize a composition event.
 *
 * @param aIsCompositionStart  If true, this synthesize compositionstart event.
 *                             Otherwise, compositionend event.
 * @param aWindow              Optional (If null, current |window| will be used)
 */
function synthesizeComposition(aIsCompositionStart, aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  var utils = _getDOMWindowUtils(aWindow);
  if (!utils) {
    return;
  }

  utils.sendCompositionEvent(aIsCompositionStart ?
                               "compositionstart" : "compositionend");
}

/**
 * Synthesize a text event.
 *
 * @param aEvent   The text event's information, this has |composition|
 *                 and |caret| members.  |composition| has |string| and
 *                 |clauses| members.  |clauses| must be array object.  Each
 *                 object has |length| and |attr|.  And |caret| has |start| and
 *                 |length|.  See the following tree image.
 *
 *                 aEvent
 *                   +-- composition
 *                   |     +-- string
 *                   |     +-- clauses[]
 *                   |           +-- length
 *                   |           +-- attr
 *                   +-- caret
 *                         +-- start
 *                         +-- length
 *
 *                 Set the composition string to |composition.string|.  Set its
 *                 clauses information to the |clauses| array.
 *
 *                 When it's composing, set the each clauses' length to the
 *                 |composition.clauses[n].length|.  The sum of the all length
 *                 values must be same as the length of |composition.string|.
 *                 Set nsIDOMWindowUtils.COMPOSITION_ATTR_* to the
 *                 |composition.clauses[n].attr|.
 *
 *                 When it's not composing, set 0 to the
 *                 |composition.clauses[0].length| and
 *                 |composition.clauses[0].attr|.
 *
 *                 Set caret position to the |caret.start|. It's offset from
 *                 the start of the composition string.  Set caret length to
 *                 |caret.length|.  If it's larger than 0, it should be wide
 *                 caret.  However, current nsEditor doesn't support wide
 *                 caret, therefore, you should always set 0 now.
 *
 * @param aWindow  Optional (If null, current |window| will be used)
 */
function synthesizeText(aEvent, aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  var utils = _getDOMWindowUtils(aWindow);
  if (!utils) {
    return;
  }

  if (!aEvent.composition || !aEvent.composition.clauses ||
      !aEvent.composition.clauses[0]) {
    return;
  }

  var firstClauseLength = aEvent.composition.clauses[0].length;
  var firstClauseAttr   = aEvent.composition.clauses[0].attr;
  var secondClauseLength = 0;
  var secondClauseAttr = 0;
  var thirdClauseLength = 0;
  var thirdClauseAttr = 0;
  if (aEvent.composition.clauses[1]) {
    secondClauseLength = aEvent.composition.clauses[1].length;
    secondClauseAttr   = aEvent.composition.clauses[1].attr;
    if (aEvent.composition.clauses[2]) {
      thirdClauseLength = aEvent.composition.clauses[2].length;
      thirdClauseAttr   = aEvent.composition.clauses[2].attr;
    }
  }

  var caretStart = -1;
  var caretLength = 0;
  if (aEvent.caret) {
    caretStart = aEvent.caret.start;
    caretLength = aEvent.caret.length;
  }

  utils.sendTextEvent(aEvent.composition.string,
                      firstClauseLength, firstClauseAttr,
                      secondClauseLength, secondClauseAttr,
                      thirdClauseLength, thirdClauseAttr,
                      caretStart, caretLength);
}

/**
 * Synthesize a query selected text event.
 *
 * @param aWindow  Optional (If null, current |window| will be used)
 * @return         An nsIQueryContentEventResult object.  If this failed,
 *                 the result might be null.
 */
function synthesizeQuerySelectedText(aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  var utils = _getDOMWindowUtils(aWindow);
  if (!utils) {
    return nsnull;
  }
  return utils.sendQueryContentEvent(utils.QUERY_SELECTED_TEXT, 0, 0, 0, 0);
}

/**
 * Synthesize a query text content event.
 *
 * @param aOffset  The character offset.  0 means the first character in the
 *                 selection root.
 * @param aLength  The length of getting text.  If the length is too long,
 *                 the extra length is ignored.
 * @param aWindow  Optional (If null, current |window| will be used)
 * @return         An nsIQueryContentEventResult object.  If this failed,
 *                 the result might be null.
 */
function synthesizeQueryTextContent(aOffset, aLength, aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  var utils = _getDOMWindowUtils(aWindow);
  if (!utils) {
    return nsnull;
  }
  return utils.sendQueryContentEvent(utils.QUERY_TEXT_CONTENT,
                                     aOffset, aLength, 0, 0);
}

/**
 * Synthesize a query caret rect event.
 *
 * @param aOffset  The caret offset.  0 means left side of the first character
 *                 in the selection root.
 * @param aWindow  Optional (If null, current |window| will be used)
 * @return         An nsIQueryContentEventResult object.  If this failed,
 *                 the result might be null.
 */
function synthesizeQueryCaretRect(aOffset, aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  var utils = _getDOMWindowUtils(aWindow);
  if (!utils) {
    return nsnull;
  }
  return utils.sendQueryContentEvent(utils.QUERY_CARET_RECT,
                                     aOffset, 0, 0, 0);
}

/**
 * Synthesize a query text rect event.
 *
 * @param aOffset  The character offset.  0 means the first character in the
 *                 selection root.
 * @param aLength  The length of the text.  If the length is too long,
 *                 the extra length is ignored.
 * @param aWindow  Optional (If null, current |window| will be used)
 * @return         An nsIQueryContentEventResult object.  If this failed,
 *                 the result might be null.
 */
function synthesizeQueryTextRect(aOffset, aLength, aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  var utils = _getDOMWindowUtils(aWindow);
  if (!utils) {
    return nsnull;
  }
  return utils.sendQueryContentEvent(utils.QUERY_TEXT_RECT,
                                     aOffset, aLength, 0, 0);
}

/**
 * Synthesize a query editor rect event.
 *
 * @param aWindow  Optional (If null, current |window| will be used)
 * @return         An nsIQueryContentEventResult object.  If this failed,
 *                 the result might be null.
 */
function synthesizeQueryEditorRect(aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  var utils = _getDOMWindowUtils(aWindow);
  if (!utils) {
    return nsnull;
  }
  return utils.sendQueryContentEvent(utils.QUERY_EDITOR_RECT, 0, 0, 0, 0);
}

/**
 * Synthesize a character at point event.
 *
 * @param aX, aY   The offset in the client area of the DOM window.
 * @param aWindow  Optional (If null, current |window| will be used)
 * @return         An nsIQueryContentEventResult object.  If this failed,
 *                 the result might be null.
 */
function synthesizeCharAtPoint(aX, aY, aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  var utils = _getDOMWindowUtils(aWindow);
  if (!utils) {
    return nsnull;
  }
  return utils.sendQueryContentEvent(utils.QUERY_CHARACTER_AT_POINT,
                                     0, 0, aX, aY);
}

/**
 * Synthesize a selection set event.
 *
 * @param aOffset  The character offset.  0 means the first character in the
 *                 selection root.
 * @param aLength  The length of the text.  If the length is too long,
 *                 the extra length is ignored.
 * @param aReverse If true, the selection is from |aOffset + aLength| to
 *                 |aOffset|.  Otherwise, from |aOffset| to |aOffset + aLength|.
 * @param aWindow  Optional (If null, current |window| will be used)
 * @return         True, if succeeded.  Otherwise false.
 */
function synthesizeSelectionSet(aOffset, aLength, aReverse, aWindow)
{
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');

  var utils = _getDOMWindowUtils(aWindow);
  if (!utils) {
    return false;
  }
  return utils.sendSelectionSetEvent(aOffset, aLength, aReverse);
}


// head.js

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");
Cu.import("resource://gre/modules/XPCOMUtils.jsm");

XPCOMUtils.defineLazyGetter(this, "HUDService", function () {
  Cu.import("resource:///modules/HUDService.jsm");
  try {
    return HUDService;
  }
  catch (ex) {
    dump(ex + "\n");
  }
});

function log(aMsg)
{
  dump("*** WebConsoleTest: " + aMsg + "\n");
}

function pprint(aObj)
{
  for (let prop in aObj) {
    if (typeof aObj[prop] == "function") {
      log("function " + prop);
    }
    else {
      log(prop + ": " + aObj[prop]);
    }
  }
}

let tab, browser, hudId, hud, hudBox, filterBox, outputNode, cs;

let win = gBrowser.selectedBrowser;

function addTab(aURL)
{
  gBrowser.selectedTab = gBrowser.addTab();
  content.location = aURL;
  tab = gBrowser.selectedTab;
  browser = gBrowser.getBrowserForTab(tab);
}

/**
 * Check if a log entry exists in the HUD output node.
 *
 * @param {Element} aOutputNode
 *        the HUD output node.
 * @param {string} aMatchString
 *        the string you want to check if it exists in the output node.
 * @param {string} aMsg
 *        the message describing the test
 * @param {boolean} [aOnlyVisible=false]
 *        find only messages that are visible, not hidden by the filter.
 * @param {boolean} [aFailIfFound=false]
 *        fail the test if the string is found in the output node.
 */
function testLogEntry(aOutputNode, aMatchString, aMsg, aOnlyVisible,
                      aFailIfFound)
{
  let selector = ".hud-msg-node";
  // Skip entries that are hidden by the filter.
  if (aOnlyVisible) {
    selector += ":not(.hud-filtered-by-type)";
  }

  let msgs = aOutputNode.querySelectorAll(selector);
  let found = false;
  for (let i = 0, n = msgs.length; i < n; i++) {
    let message = msgs[i].textContent.indexOf(aMatchString);
    if (message > -1) {
      found = true;
      break;
    }
  }
  is(found, !aFailIfFound, aMsg);
}

function openConsole()
{
  HUDService.activateHUDForContext(tab);
}

function closeConsole()
{
  HUDService.deactivateHUDForContext(tab);
}

function finishTest()
{
  finish();
}

function tearDown()
{
  try {
    HUDService.deactivateHUDForContext(gBrowser.selectedTab);
  }
  catch (ex) {
    log(ex);
  }
  while (gBrowser.tabs.length > 1) {
    gBrowser.removeCurrentTab();
  }
  tab = browser = hudId = hud = filterBox = outputNode = cs = null;
}

registerCleanupFunction(tearDown);

waitForExplicitFinish();

// maintain scroll

function tabLoad(aEvent) {
  browser.removeEventListener(aEvent.type, arguments.callee, true);

  openConsole();

  let hudId = HUDService.getHudIdByWindow(content);
  let hud = HUDService.hudReferences[hudId];
  let outputNode = hud.outputNode;
  let scrollBox = outputNode.scrollBoxObject.element;

  for (let i = 0; i < 150; i++) {
    hud.console.log("test message " + i);
  }

  let oldScrollTop = scrollBox.scrollTop;
  ok(oldScrollTop > 0, "scroll location is not at the top");

  // scroll to the first node
  outputNode.firstChild.focus();

  EventUtils.synthesizeKey("VK_HOME", {});

  let topPosition = scrollBox.scrollTop;
  isnot(topPosition, oldScrollTop, "scroll location updated (moved to top)");

  executeSoon(function() {
    // add a message and make sure scroll doesn't change
    hud.console.log("test message 150");

    is(scrollBox.scrollTop, topPosition, "scroll location is still at the top");

    // scroll back to the bottom
    outputNode.lastChild.focus();
    EventUtils.synthesizeKey("VK_END", {});

    executeSoon(function() {
      oldScrollTop = outputNode.scrollTop;

      hud.console.log("test message 151");

      isnot(scrollBox.scrollTop, oldScrollTop,
            "scroll location updated (moved to bottom)");

      finishTest();
    });
  });
}

function test() {
  addTab("data:text/html,Web Console test for bug 613642: remember scroll location");
  browser.addEventListener("load", tabLoad, true);
}

test();