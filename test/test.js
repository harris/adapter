/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

'use strict';

// This is a basic test file for use with testling and webdriver.
// The test script language comes from tape.

var test = require('tape');
var webdriver = require('selenium-webdriver');
var seleniumHelpers = require('./selenium-lib');

// Start of tests.
test('srcObject null setter', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var callback = arguments[arguments.length - 1];

    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
      video.setAttribute('id', 'video');
      video.setAttribute('autoplay', 'true');
      document.body.appendChild(video);
      video.srcObject = stream;
      video.srcObject = null;

      callback(null);
    })
    .catch(function(err) {
      callback(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(3);
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    var gumResult = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + gumResult);
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 3000);
  })
  .then(function() {
    return driver.executeScript(
        'return document.getElementById(\'video\').src');
  })
  .then(function(src) {
    t.ok(src === 'file://' + process.cwd() + '/test/testpage.html' ||
        // kind of... it actually is this page.
        src === '', 'src is the empty string');
  })
  .then(function() {
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Attach mediaStream directly', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var callback = arguments[arguments.length - 1];

    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
      video.setAttribute('id', 'video');
      video.setAttribute('autoplay', 'true');
      // If the srcObject shim works, we should get a video
      // at some point. This will trigger loadedmetadata.
      // Firefox < 38 had issues with this, workaround removed
      // due to 38 being stable now.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
      });

      video.srcObject = stream;
      callback(null);
    })
    .catch(function(err) {
      callback(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(4);
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    var gumResult = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + gumResult);
    // We need to wait due to the stream can take a while to setup.
    driver.wait(function() {
      return driver.executeScript(
        'return typeof window.stream !== \'undefined\'');
    }, 3000);
    return driver.executeScript(
      // Firefox and Chrome have different constructor names.
      'return window.stream.constructor.name.match(\'MediaStream\') !== null');
  })
  .then(function(isMediaStream) {
    t.ok(isMediaStream, 'Stream is a MediaStream');
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 3000);
  })
  .then(function() {
    return driver.wait(function() {
      return driver.executeScript(
          'return document.getElementById("video").readyState === 4');
    }, 3000);
  })
  .then(function() {
    t.pass('Stream attached directly succesfully to a video element');
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

test('Re-attaching mediaStream directly', function(t) {
  var driver = seleniumHelpers.buildDriver();

  // Define test.
  var testDefinition = function() {
    var callback = arguments[arguments.length - 1];

    var constraints = {video: true, fake: true};
    navigator.mediaDevices.getUserMedia(constraints)
    .then(function(stream) {
      window.stream = stream;

      var video = document.createElement('video');
      var video2 = document.createElement('video');
      video.setAttribute('id', 'video');
      video.setAttribute('autoplay', 'true');
      video2.setAttribute('id', 'video2');
      video2.setAttribute('autoplay', 'true');
      // If attachMediaStream works, we should get a video
      // at some point. This will trigger loadedmetadata.
      // This reattaches to the second video which will trigger
      // loadedmetadata there.
      video.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video);
        video2.srcObject = video.srcObject;
      });
      video2.addEventListener('loadedmetadata', function() {
        document.body.appendChild(video2);
      });

      video.srcObject = stream;
      callback(null);
    })
    .catch(function(err) {
      callback(err.name);
    });
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.plan(5);
    t.pass('Page loaded');
    return driver.executeAsyncScript(testDefinition);
  })
  .then(function(error) {
    var gumResult = (error) ? 'error: ' + error : 'no errors';
    t.ok(!error, 'getUserMedia result:  ' + gumResult);
    // We need to wait due to the stream can take a while to setup.
    return driver.wait(function() {
      return driver.executeScript(
        'return typeof window.stream !== \'undefined\'');
    }, 3000)
    .then(function() {
      return driver.executeScript(
      // Firefox and Chrome have different constructor names.
      'return window.stream.constructor.name.match(\'MediaStream\') !== null');
    });
  })
  .then(function(isMediaStream) {
    t.ok(isMediaStream, 'Stream is a MediaStream');
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video')), 3000);
  })
  .then(function(videoElement) {
    return driver.wait(function() {
      return driver.executeScript(
          'return document.querySelector("video").readyState === 4');
    }, 3000);
  })
  .then(function() {
    t.pass('Stream attached directly succesfully to a video element');
    // Wait until loadedmetadata event has fired and appended video element.
    // 5 second timeout in case the event does not fire for some reason.
    return driver.wait(webdriver.until.elementLocated(
      webdriver.By.id('video2')), 3000);
  })
  .then(function() {
    return driver.wait(function() {
      return driver.executeScript(
          'return document.getElementById("video2").readyState === 4');
    }, 3000);
  })
  .then(function() {
    t.pass('Stream re-attached directly succesfully to a video element');
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});

// deactivated in Chrome due to https://github.com/webrtc/adapter/issues/180
test('Call getUserMedia with impossible constraints',
    {skip: process.env.BROWSER === 'chrome'},
    function(t) {
      var driver = seleniumHelpers.buildDriver();

      // Define test.
      var testDefinition = function() {
        var callback = arguments[arguments.length - 1];

        var impossibleConstraints = {
          video: {
            width: 1280,
            height: {min: 200, ideal: 720, max: 1080},
            frameRate: {exact: 0} // to fail
          }
        };
        // TODO: Remove when firefox 42+ accepts impossible constraints
        // on fake devices.
        if (window.adapter.browserDetails.browser === 'firefox') {
          impossibleConstraints.fake = false;
        }
        navigator.mediaDevices.getUserMedia(impossibleConstraints)
        .then(function(stream) {
          window.stream = stream;
          callback(null);
        })
        .catch(function(err) {
          callback(err.name);
        });
      };

      // Run test.
      seleniumHelpers.loadTestPage(driver)
      .then(function() {
        t.plan(2);
        t.pass('Page loaded');
        return driver.executeScript(
          'return adapter.browserDetails.browser === \'firefox\' ' +
          '&& adapter.browserDetails.version < 42');
      })
      .then(function(isFirefoxAndVersionLessThan42) {
        if (isFirefoxAndVersionLessThan42) {
          t.skip('getUserMedia(impossibleConstraints) not supported on < 42');
          throw 'skip-test';
        }
        return driver.executeAsyncScript(testDefinition);
      })
      .then(function(error) {
        t.ok(error, 'getUserMedia(impossibleConstraints) must fail');
      })
      .then(function() {
        t.end();
      })
      .then(null, function(err) {
        if (err !== 'skip-test') {
          t.fail(err);
        }
        t.end();
      });
    });

// This MUST to be the last test since it loads adapter
// again which may result in unintended behaviour.
test('Non-module logging to console still works', function(t) {
  var driver = seleniumHelpers.buildDriver();

  var testDefinition = function() {
    window.testsEqualArray = [];
    window.logCount = 0;
    var saveConsole = console.log.bind(console);
    console.log = function() {
      window.logCount++;
    };

    console.log('log me');
    console.log = saveConsole;

    // Check for existence of variables and functions from public API.
    window.testsEqualArray.push([typeof RTCPeerConnection,'function',
      'RTCPeerConnection is a function']);
    window.testsEqualArray.push([typeof navigator.getUserMedia, 'function',
      'getUserMedia is a function']);
    window.testsEqualArray.push([typeof window.adapter.browserDetails.browser,
      'string', 'browserDetails.browser browser is a string']);
    window.testsEqualArray.push([typeof window.adapter.browserDetails.version,
      'number', 'browserDetails.version is a number']);
  };

  // Run test.
  seleniumHelpers.loadTestPage(driver)
  .then(function() {
    t.pass('Page loaded');
    return driver.executeScript(testDefinition);
  })
  .then(function() {
    return driver.executeScript('return window.testsEqualArray');
  })
  .then(function(testsEqualArray) {
    testsEqualArray.forEach(function(resultEq) {
      // resultEq contains an array of test data,
      // test condition that should be equal and a success message.
      // resultEq[0] = typeof report.
      // resultEq[1] = test condition.
      // resultEq[0] = Success message.
      t.equal(resultEq[0], resultEq[1], resultEq[2]);
    });
  })
  .then(function() {
    return driver.executeScript('return window.logCount');
  })
  .then(function(logCount) {
    t.ok(logCount > 0, 'A log message appeared on the console.');
    t.end();
  })
  .then(null, function(err) {
    if (err !== 'skip-test') {
      t.fail(err);
    }
    t.end();
  });
});
