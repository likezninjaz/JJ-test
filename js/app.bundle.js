(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Modernizr = require('./lib/Modernizr'),
    ModernizrProto = require('./lib/ModernizrProto'),
    classes = require('./lib/classes'),
    testRunner = require('./lib/testRunner'),
    setClasses = require('./lib/setClasses');

// Run each test
testRunner();

// Remove the "no-js" class if it exists
setClasses(classes);

delete ModernizrProto.addTest;
delete ModernizrProto.addAsyncTest;

// Run the things that are supposed to run after the tests
for (var i = 0; i < Modernizr._q.length; i++) {
  Modernizr._q[i]();
}

module.exports = Modernizr;

},{"./lib/Modernizr":2,"./lib/ModernizrProto":3,"./lib/classes":5,"./lib/setClasses":10,"./lib/testRunner":11}],2:[function(require,module,exports){
var ModernizrProto = require('./ModernizrProto.js');
  // Fake some of Object.create so we can force non test results to be non "own" properties.
  var Modernizr = function() {};
  Modernizr.prototype = ModernizrProto;

  // Leak modernizr globally when you `require` it rather than force it here.
  // Overwrite name so constructor name is nicer :D
  Modernizr = new Modernizr();

  module.exports = Modernizr;


},{"./ModernizrProto.js":3}],3:[function(require,module,exports){
var tests = require('./tests.js');
  /**
   *
   * ModernizrProto is the constructor for Modernizr
   *
   * @class
   * @access public
   */

  var ModernizrProto = {
    // The current version, dummy
    _version: '3.3.1 (browsernizr 2.1.0)',

    // Any settings that don't work as separate modules
    // can go in here as configuration.
    _config: {
      'classPrefix': '',
      'enableClasses': true,
      'enableJSClass': true,
      'usePrefixes': true
    },

    // Queue of tests
    _q: [],

    // Stub these for people who are listening
    on: function(test, cb) {
      // I don't really think people should do this, but we can
      // safe guard it a bit.
      // -- NOTE:: this gets WAY overridden in src/addTest for actual async tests.
      // This is in case people listen to synchronous tests. I would leave it out,
      // but the code to *disallow* sync tests in the real version of this
      // function is actually larger than this.
      var self = this;
      setTimeout(function() {
        cb(self[test]);
      }, 0);
    },

    addTest: function(name, fn, options) {
      tests.push({name: name, fn: fn, options: options});
    },

    addAsyncTest: function(fn) {
      tests.push({name: null, fn: fn});
    }
  };

  module.exports = ModernizrProto;


},{"./tests.js":12}],4:[function(require,module,exports){
var ModernizrProto = require('./ModernizrProto.js');
var Modernizr = require('./Modernizr.js');
var hasOwnProp = require('./hasOwnProp.js');
var setClasses = require('./setClasses.js');

   // _l tracks listeners for async tests, as well as tests that execute after the initial run
  ModernizrProto._l = {};

  /**
   * Modernizr.on is a way to listen for the completion of async tests. Being
   * asynchronous, they may not finish before your scripts run. As a result you
   * will get a possibly false negative `undefined` value.
   *
   * @memberof Modernizr
   * @name Modernizr.on
   * @access public
   * @function on
   * @param {string} feature - String name of the feature detect
   * @param {function} cb - Callback function returning a Boolean - true if feature is supported, false if not
   * @example
   *
   * ```js
   * Modernizr.on('flash', function( result ) {
   *   if (result) {
   *    // the browser has flash
   *   } else {
   *     // the browser does not have flash
   *   }
   * });
   * ```
   */

  ModernizrProto.on = function(feature, cb) {
    // Create the list of listeners if it doesn't exist
    if (!this._l[feature]) {
      this._l[feature] = [];
    }

    // Push this test on to the listener list
    this._l[feature].push(cb);

    // If it's already been resolved, trigger it on next tick
    if (Modernizr.hasOwnProperty(feature)) {
      // Next Tick
      setTimeout(function() {
        Modernizr._trigger(feature, Modernizr[feature]);
      }, 0);
    }
  };

  /**
   * _trigger is the private function used to signal test completion and run any
   * callbacks registered through [Modernizr.on](#modernizr-on)
   *
   * @memberof Modernizr
   * @name Modernizr._trigger
   * @access private
   * @function _trigger
   * @param {string} feature - string name of the feature detect
   * @param {function|boolean} [res] - A feature detection function, or the boolean =
   * result of a feature detection function
   */

  ModernizrProto._trigger = function(feature, res) {
    if (!this._l[feature]) {
      return;
    }

    var cbs = this._l[feature];

    // Force async
    setTimeout(function() {
      var i, cb;
      for (i = 0; i < cbs.length; i++) {
        cb = cbs[i];
        cb(res);
      }
    }, 0);

    // Don't trigger these again
    delete this._l[feature];
  };

  /**
   * addTest allows you to define your own feature detects that are not currently
   * included in Modernizr (under the covers it's the exact same code Modernizr
   * uses for its own [feature detections](https://github.com/Modernizr/Modernizr/tree/master/feature-detects)). Just like the offical detects, the result
   * will be added onto the Modernizr object, as well as an appropriate className set on
   * the html element when configured to do so
   *
   * @memberof Modernizr
   * @name Modernizr.addTest
   * @optionName Modernizr.addTest()
   * @optionProp addTest
   * @access public
   * @function addTest
   * @param {string|object} feature - The string name of the feature detect, or an
   * object of feature detect names and test
   * @param {function|boolean} test - Function returning true if feature is supported,
   * false if not. Otherwise a boolean representing the results of a feature detection
   * @example
   *
   * The most common way of creating your own feature detects is by calling
   * `Modernizr.addTest` with a string (preferably just lowercase, without any
   * punctuation), and a function you want executed that will return a boolean result
   *
   * ```js
   * Modernizr.addTest('itsTuesday', function() {
   *  var d = new Date();
   *  return d.getDay() === 2;
   * });
   * ```
   *
   * When the above is run, it will set Modernizr.itstuesday to `true` when it is tuesday,
   * and to `false` every other day of the week. One thing to notice is that the names of
   * feature detect functions are always lowercased when added to the Modernizr object. That
   * means that `Modernizr.itsTuesday` will not exist, but `Modernizr.itstuesday` will.
   *
   *
   *  Since we only look at the returned value from any feature detection function,
   *  you do not need to actually use a function. For simple detections, just passing
   *  in a statement that will return a boolean value works just fine.
   *
   * ```js
   * Modernizr.addTest('hasJquery', 'jQuery' in window);
   * ```
   *
   * Just like before, when the above runs `Modernizr.hasjquery` will be true if
   * jQuery has been included on the page. Not using a function saves a small amount
   * of overhead for the browser, as well as making your code much more readable.
   *
   * Finally, you also have the ability to pass in an object of feature names and
   * their tests. This is handy if you want to add multiple detections in one go.
   * The keys should always be a string, and the value can be either a boolean or
   * function that returns a boolean.
   *
   * ```js
   * var detects = {
   *  'hasjquery': 'jQuery' in window,
   *  'itstuesday': function() {
   *    var d = new Date();
   *    return d.getDay() === 2;
   *  }
   * }
   *
   * Modernizr.addTest(detects);
   * ```
   *
   * There is really no difference between the first methods and this one, it is
   * just a convenience to let you write more readable code.
   */

  function addTest(feature, test) {

    if (typeof feature == 'object') {
      for (var key in feature) {
        if (hasOwnProp(feature, key)) {
          addTest(key, feature[ key ]);
        }
      }
    } else {

      feature = feature.toLowerCase();
      var featureNameSplit = feature.split('.');
      var last = Modernizr[featureNameSplit[0]];

      // Again, we don't check for parent test existence. Get that right, though.
      if (featureNameSplit.length == 2) {
        last = last[featureNameSplit[1]];
      }

      if (typeof last != 'undefined') {
        // we're going to quit if you're trying to overwrite an existing test
        // if we were to allow it, we'd do this:
        //   var re = new RegExp("\\b(no-)?" + feature + "\\b");
        //   docElement.className = docElement.className.replace( re, '' );
        // but, no rly, stuff 'em.
        return Modernizr;
      }

      test = typeof test == 'function' ? test() : test;

      // Set the value (this is the magic, right here).
      if (featureNameSplit.length == 1) {
        Modernizr[featureNameSplit[0]] = test;
      } else {
        // cast to a Boolean, if not one already
        /* jshint -W053 */
        if (Modernizr[featureNameSplit[0]] && !(Modernizr[featureNameSplit[0]] instanceof Boolean)) {
          Modernizr[featureNameSplit[0]] = new Boolean(Modernizr[featureNameSplit[0]]);
        }

        Modernizr[featureNameSplit[0]][featureNameSplit[1]] = test;
      }

      // Set a single class (either `feature` or `no-feature`)
      /* jshint -W041 */
      setClasses([(!!test && test != false ? '' : 'no-') + featureNameSplit.join('-')]);
      /* jshint +W041 */

      // Trigger the event
      Modernizr._trigger(feature, test);
    }

    return Modernizr; // allow chaining.
  }

  // After all the tests are run, add self to the Modernizr prototype
  Modernizr._q.push(function() {
    ModernizrProto.addTest = addTest;
  });

  module.exports = addTest;


},{"./Modernizr.js":2,"./ModernizrProto.js":3,"./hasOwnProp.js":7,"./setClasses.js":10}],5:[function(require,module,exports){

  var classes = [];
  module.exports = classes;


},{}],6:[function(require,module,exports){

  /**
   * docElement is a convenience wrapper to grab the root element of the document
   *
   * @access private
   * @returns {HTMLElement|SVGElement} The root element of the document
   */

  var docElement = document.documentElement;
  module.exports = docElement;


},{}],7:[function(require,module,exports){
var is = require('./is.js');
  /**
   * hasOwnProp is a shim for hasOwnProperty that is needed for Safari 2.0 support
   *
   * @author kangax
   * @access private
   * @function hasOwnProp
   * @param {object} object - The object to check for a property
   * @param {string} property - The property to check for
   * @returns {boolean}
   */

  // hasOwnProperty shim by kangax needed for Safari 2.0 support
  var hasOwnProp;

  (function() {
    var _hasOwnProperty = ({}).hasOwnProperty;
    /* istanbul ignore else */
    /* we have no way of testing IE 5.5 or safari 2,
     * so just assume the else gets hit */
    if (!is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined')) {
      hasOwnProp = function(object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function(object, property) { /* yes, this can give false positives/negatives, but most of the time we don't care about those */
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }
  })();

  module.exports = hasOwnProp;


},{"./is.js":8}],8:[function(require,module,exports){

  /**
   * is returns a boolean if the typeof an obj is exactly type.
   *
   * @access private
   * @function is
   * @param {*} obj - A thing we want to check the type of
   * @param {string} type - A string to compare the typeof against
   * @returns {boolean}
   */

  function is(obj, type) {
    return typeof obj === type;
  }
  module.exports = is;


},{}],9:[function(require,module,exports){
var docElement = require('./docElement.js');
  /**
   * A convenience helper to check if the document we are running in is an SVG document
   *
   * @access private
   * @returns {boolean}
   */

  var isSVG = docElement.nodeName.toLowerCase() === 'svg';
  module.exports = isSVG;


},{"./docElement.js":6}],10:[function(require,module,exports){
var Modernizr = require('./Modernizr.js');
var docElement = require('./docElement.js');
var isSVG = require('./isSVG.js');
  /**
   * setClasses takes an array of class names and adds them to the root element
   *
   * @access private
   * @function setClasses
   * @param {string[]} classes - Array of class names
   */

  // Pass in an and array of class names, e.g.:
  //  ['no-webp', 'borderradius', ...]
  function setClasses(classes) {
    var className = docElement.className;
    var classPrefix = Modernizr._config.classPrefix || '';

    if (isSVG) {
      className = className.baseVal;
    }

    // Change `no-js` to `js` (independently of the `enableClasses` option)
    // Handle classPrefix on this too
    if (Modernizr._config.enableJSClass) {
      var reJS = new RegExp('(^|\\s)' + classPrefix + 'no-js(\\s|$)');
      className = className.replace(reJS, '$1' + classPrefix + 'js$2');
    }

    if (Modernizr._config.enableClasses) {
      // Add the new classes
      className += ' ' + classPrefix + classes.join(' ' + classPrefix);
      isSVG ? docElement.className.baseVal = className : docElement.className = className;
    }

  }

  module.exports = setClasses;


},{"./Modernizr.js":2,"./docElement.js":6,"./isSVG.js":9}],11:[function(require,module,exports){
var tests = require('./tests.js');
var Modernizr = require('./Modernizr.js');
var classes = require('./classes.js');
var is = require('./is.js');
  /**
   * Run through all tests and detect their support in the current UA.
   *
   * @access private
   */

  function testRunner() {
    var featureNames;
    var feature;
    var aliasIdx;
    var result;
    var nameIdx;
    var featureName;
    var featureNameSplit;

    for (var featureIdx in tests) {
      if (tests.hasOwnProperty(featureIdx)) {
        featureNames = [];
        feature = tests[featureIdx];
        // run the test, throw the return value into the Modernizr,
        // then based on that boolean, define an appropriate className
        // and push it into an array of classes we'll join later.
        //
        // If there is no name, it's an 'async' test that is run,
        // but not directly added to the object. That should
        // be done with a post-run addTest call.
        if (feature.name) {
          featureNames.push(feature.name.toLowerCase());

          if (feature.options && feature.options.aliases && feature.options.aliases.length) {
            // Add all the aliases into the names list
            for (aliasIdx = 0; aliasIdx < feature.options.aliases.length; aliasIdx++) {
              featureNames.push(feature.options.aliases[aliasIdx].toLowerCase());
            }
          }
        }

        // Run the test, or use the raw value if it's not a function
        result = is(feature.fn, 'function') ? feature.fn() : feature.fn;


        // Set each of the names on the Modernizr object
        for (nameIdx = 0; nameIdx < featureNames.length; nameIdx++) {
          featureName = featureNames[nameIdx];
          // Support dot properties as sub tests. We don't do checking to make sure
          // that the implied parent tests have been added. You must call them in
          // order (either in the test, or make the parent test a dependency).
          //
          // Cap it to TWO to make the logic simple and because who needs that kind of subtesting
          // hashtag famous last words
          featureNameSplit = featureName.split('.');

          if (featureNameSplit.length === 1) {
            Modernizr[featureNameSplit[0]] = result;
          } else {
            // cast to a Boolean, if not one already
            /* jshint -W053 */
            if (Modernizr[featureNameSplit[0]] && !(Modernizr[featureNameSplit[0]] instanceof Boolean)) {
              Modernizr[featureNameSplit[0]] = new Boolean(Modernizr[featureNameSplit[0]]);
            }

            Modernizr[featureNameSplit[0]][featureNameSplit[1]] = result;
          }

          classes.push((result ? '' : 'no-') + featureNameSplit.join('-'));
        }
      }
    }
  }
  module.exports = testRunner;


},{"./Modernizr.js":2,"./classes.js":5,"./is.js":8,"./tests.js":12}],12:[function(require,module,exports){

  var tests = [];
  module.exports = tests;


},{}],13:[function(require,module,exports){
/*!
{
  "name": "Webp",
  "async": true,
  "property": "webp",
  "tags": ["image"],
  "builderAliases": ["img_webp"],
  "authors": ["Krister Kari", "@amandeep", "Rich Bradshaw", "Ryan Seddon", "Paul Irish"],
  "notes": [{
    "name": "Webp Info",
    "href": "https://developers.google.com/speed/webp/"
  }, {
    "name": "Chormium blog - Chrome 32 Beta: Animated WebP images and faster Chrome for Android touch input",
    "href": "https://blog.chromium.org/2013/11/chrome-32-beta-animated-webp-images-and.html"
  }, {
    "name": "Webp Lossless Spec",
    "href": "https://developers.google.com/speed/webp/docs/webp_lossless_bitstream_specification"
  }, {
    "name": "Article about WebP support on Android browsers",
    "href": "http://www.wope-framework.com/en/2013/06/24/webp-support-on-android-browsers/"
  }, {
    "name": "Chormium WebP announcement",
    "href": "https://blog.chromium.org/2011/11/lossless-and-transparency-encoding-in.html?m=1"
  }]
}
!*/
/* DOC
Tests for lossy, non-alpha webp support.

Tests for all forms of webp support (lossless, lossy, alpha, and animated)..

  Modernizr.webp              // Basic support (lossy)
  Modernizr.webp.lossless     // Lossless
  Modernizr.webp.alpha        // Alpha (both lossy and lossless)
  Modernizr.webp.animation    // Animated WebP

*/
var Modernizr = require('./../../lib/Modernizr.js');
var addTest = require('./../../lib/addTest.js');

  Modernizr.addAsyncTest(function() {

    var webpTests = [{
      'uri': 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=',
      'name': 'webp'
    }, {
      'uri': 'data:image/webp;base64,UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAABBxAR/Q9ERP8DAABWUDggGAAAADABAJ0BKgEAAQADADQlpAADcAD++/1QAA==',
      'name': 'webp.alpha'
    }, {
      'uri': 'data:image/webp;base64,UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA',
      'name': 'webp.animation'
    }, {
      'uri': 'data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=',
      'name': 'webp.lossless'
    }];

    var webp = webpTests.shift();
    function test(name, uri, cb) {

      var image = new Image();

      function addResult(event) {
        // if the event is from 'onload', check the see if the image's width is
        // 1 pixel (which indiciates support). otherwise, it fails

        var result = event && event.type === 'load' ? image.width == 1 : false;
        var baseTest = name === 'webp';

        /* jshint -W053 */
        addTest(name, baseTest ? new Boolean(result) : result);

        if (cb) {
          cb(event);
        }
      }

      image.onerror = addResult;
      image.onload = addResult;

      image.src = uri;
    }

    // test for webp support in general
    test(webp.name, webp.uri, function(e) {
      // if the webp test loaded, test everything else.
      if (e && e.type === 'load') {
        for (var i = 0; i < webpTests.length; i++) {
          test(webpTests[i].name, webpTests[i].uri);
        }
      }
    });

  });



},{"./../../lib/Modernizr.js":2,"./../../lib/addTest.js":4}],14:[function(require,module,exports){
'use strict';

require('browsernizr/test/img/webp');

require('browsernizr');

var _main = require('./modules/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_main2.default.init(); // modernizr (webp support check only)

},{"./modules/main":15,"browsernizr":1,"browsernizr/test/img/webp":13}],15:[function(require,module,exports){
'use strict';

$(document).ready(function () {
	$('.main-carousel').flickity({
		// options
		cellAlign: 'left',
		contain: false,
		autoPlay: 4000,
		initialIndex: 0,
		arrows: true
	});

	$('.slick-slider').slick({
		centerMode: true,
		centerPadding: '70px',
		slidesToShow: 1,
		responsive: [{
			breakpoint: 768,
			settings: {
				arrows: false,
				centerMode: true,
				centerPadding: '40px',
				slidesToShow: 3
			}
		}, {
			breakpoint: 480,
			settings: {
				arrows: false,
				centerMode: true,
				centerPadding: '40px',
				slidesToShow: 1
			}
		}]
	});
});

},{}]},{},[14])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlcm5penIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlcm5penIvbGliL01vZGVybml6ci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2Vybml6ci9saWIvTW9kZXJuaXpyUHJvdG8uanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlcm5penIvbGliL2FkZFRlc3QuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlcm5penIvbGliL2NsYXNzZXMuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlcm5penIvbGliL2RvY0VsZW1lbnQuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlcm5penIvbGliL2hhc093blByb3AuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlcm5penIvbGliL2lzLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJuaXpyL2xpYi9pc1NWRy5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2Vybml6ci9saWIvc2V0Q2xhc3Nlcy5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2Vybml6ci9saWIvdGVzdFJ1bm5lci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2Vybml6ci9saWIvdGVzdHMuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlcm5penIvdGVzdC9pbWcvd2VicC5qcyIsInNyYy9qcy9hcHAuanMiLCJzcmMvanMvbW9kdWxlcy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzlGQTs7QUFDQTs7QUFFQTs7Ozs7O0FBRUEsZUFBVyxJQUFYLEcsQ0FOQTs7Ozs7QUNBQSxFQUFFLFFBQUYsRUFBWSxLQUFaLENBQWtCLFlBQVU7QUFDM0IsR0FBRSxnQkFBRixFQUFvQixRQUFwQixDQUE2QjtBQUMzQjtBQUNBLGFBQVcsTUFGZ0I7QUFHM0IsV0FBUyxLQUhrQjtBQUkzQixZQUFVLElBSmlCO0FBSzNCLGdCQUFjLENBTGE7QUFNM0IsVUFBUTtBQU5tQixFQUE3Qjs7QUFTQSxHQUFFLGVBQUYsRUFBbUIsS0FBbkIsQ0FBeUI7QUFDdkIsY0FBWSxJQURXO0FBRXZCLGlCQUFlLE1BRlE7QUFHdkIsZ0JBQWMsQ0FIUztBQUl2QixjQUFZLENBQ1Y7QUFDRSxlQUFZLEdBRGQ7QUFFRSxhQUFVO0FBQ1IsWUFBUSxLQURBO0FBRVIsZ0JBQVksSUFGSjtBQUdSLG1CQUFlLE1BSFA7QUFJUixrQkFBYztBQUpOO0FBRlosR0FEVSxFQVVWO0FBQ0UsZUFBWSxHQURkO0FBRUUsYUFBVTtBQUNSLFlBQVEsS0FEQTtBQUVSLGdCQUFZLElBRko7QUFHUixtQkFBZSxNQUhQO0FBSVIsa0JBQWM7QUFKTjtBQUZaLEdBVlU7QUFKVyxFQUF6QjtBQXlCQSxDQW5DRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnLi9saWIvTW9kZXJuaXpyJyksXG4gICAgTW9kZXJuaXpyUHJvdG8gPSByZXF1aXJlKCcuL2xpYi9Nb2Rlcm5penJQcm90bycpLFxuICAgIGNsYXNzZXMgPSByZXF1aXJlKCcuL2xpYi9jbGFzc2VzJyksXG4gICAgdGVzdFJ1bm5lciA9IHJlcXVpcmUoJy4vbGliL3Rlc3RSdW5uZXInKSxcbiAgICBzZXRDbGFzc2VzID0gcmVxdWlyZSgnLi9saWIvc2V0Q2xhc3NlcycpO1xuXG4vLyBSdW4gZWFjaCB0ZXN0XG50ZXN0UnVubmVyKCk7XG5cbi8vIFJlbW92ZSB0aGUgXCJuby1qc1wiIGNsYXNzIGlmIGl0IGV4aXN0c1xuc2V0Q2xhc3NlcyhjbGFzc2VzKTtcblxuZGVsZXRlIE1vZGVybml6clByb3RvLmFkZFRlc3Q7XG5kZWxldGUgTW9kZXJuaXpyUHJvdG8uYWRkQXN5bmNUZXN0O1xuXG4vLyBSdW4gdGhlIHRoaW5ncyB0aGF0IGFyZSBzdXBwb3NlZCB0byBydW4gYWZ0ZXIgdGhlIHRlc3RzXG5mb3IgKHZhciBpID0gMDsgaSA8IE1vZGVybml6ci5fcS5sZW5ndGg7IGkrKykge1xuICBNb2Rlcm5penIuX3FbaV0oKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb2Rlcm5penI7XG4iLCJ2YXIgTW9kZXJuaXpyUHJvdG8gPSByZXF1aXJlKCcuL01vZGVybml6clByb3RvLmpzJyk7XG4gIC8vIEZha2Ugc29tZSBvZiBPYmplY3QuY3JlYXRlIHNvIHdlIGNhbiBmb3JjZSBub24gdGVzdCByZXN1bHRzIHRvIGJlIG5vbiBcIm93blwiIHByb3BlcnRpZXMuXG4gIHZhciBNb2Rlcm5penIgPSBmdW5jdGlvbigpIHt9O1xuICBNb2Rlcm5penIucHJvdG90eXBlID0gTW9kZXJuaXpyUHJvdG87XG5cbiAgLy8gTGVhayBtb2Rlcm5penIgZ2xvYmFsbHkgd2hlbiB5b3UgYHJlcXVpcmVgIGl0IHJhdGhlciB0aGFuIGZvcmNlIGl0IGhlcmUuXG4gIC8vIE92ZXJ3cml0ZSBuYW1lIHNvIGNvbnN0cnVjdG9yIG5hbWUgaXMgbmljZXIgOkRcbiAgTW9kZXJuaXpyID0gbmV3IE1vZGVybml6cigpO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gTW9kZXJuaXpyO1xuXG4iLCJ2YXIgdGVzdHMgPSByZXF1aXJlKCcuL3Rlc3RzLmpzJyk7XG4gIC8qKlxuICAgKlxuICAgKiBNb2Rlcm5penJQcm90byBpcyB0aGUgY29uc3RydWN0b3IgZm9yIE1vZGVybml6clxuICAgKlxuICAgKiBAY2xhc3NcbiAgICogQGFjY2VzcyBwdWJsaWNcbiAgICovXG5cbiAgdmFyIE1vZGVybml6clByb3RvID0ge1xuICAgIC8vIFRoZSBjdXJyZW50IHZlcnNpb24sIGR1bW15XG4gICAgX3ZlcnNpb246ICczLjMuMSAoYnJvd3Nlcm5penIgMi4xLjApJyxcblxuICAgIC8vIEFueSBzZXR0aW5ncyB0aGF0IGRvbid0IHdvcmsgYXMgc2VwYXJhdGUgbW9kdWxlc1xuICAgIC8vIGNhbiBnbyBpbiBoZXJlIGFzIGNvbmZpZ3VyYXRpb24uXG4gICAgX2NvbmZpZzoge1xuICAgICAgJ2NsYXNzUHJlZml4JzogJycsXG4gICAgICAnZW5hYmxlQ2xhc3Nlcyc6IHRydWUsXG4gICAgICAnZW5hYmxlSlNDbGFzcyc6IHRydWUsXG4gICAgICAndXNlUHJlZml4ZXMnOiB0cnVlXG4gICAgfSxcblxuICAgIC8vIFF1ZXVlIG9mIHRlc3RzXG4gICAgX3E6IFtdLFxuXG4gICAgLy8gU3R1YiB0aGVzZSBmb3IgcGVvcGxlIHdobyBhcmUgbGlzdGVuaW5nXG4gICAgb246IGZ1bmN0aW9uKHRlc3QsIGNiKSB7XG4gICAgICAvLyBJIGRvbid0IHJlYWxseSB0aGluayBwZW9wbGUgc2hvdWxkIGRvIHRoaXMsIGJ1dCB3ZSBjYW5cbiAgICAgIC8vIHNhZmUgZ3VhcmQgaXQgYSBiaXQuXG4gICAgICAvLyAtLSBOT1RFOjogdGhpcyBnZXRzIFdBWSBvdmVycmlkZGVuIGluIHNyYy9hZGRUZXN0IGZvciBhY3R1YWwgYXN5bmMgdGVzdHMuXG4gICAgICAvLyBUaGlzIGlzIGluIGNhc2UgcGVvcGxlIGxpc3RlbiB0byBzeW5jaHJvbm91cyB0ZXN0cy4gSSB3b3VsZCBsZWF2ZSBpdCBvdXQsXG4gICAgICAvLyBidXQgdGhlIGNvZGUgdG8gKmRpc2FsbG93KiBzeW5jIHRlc3RzIGluIHRoZSByZWFsIHZlcnNpb24gb2YgdGhpc1xuICAgICAgLy8gZnVuY3Rpb24gaXMgYWN0dWFsbHkgbGFyZ2VyIHRoYW4gdGhpcy5cbiAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNiKHNlbGZbdGVzdF0pO1xuICAgICAgfSwgMCk7XG4gICAgfSxcblxuICAgIGFkZFRlc3Q6IGZ1bmN0aW9uKG5hbWUsIGZuLCBvcHRpb25zKSB7XG4gICAgICB0ZXN0cy5wdXNoKHtuYW1lOiBuYW1lLCBmbjogZm4sIG9wdGlvbnM6IG9wdGlvbnN9KTtcbiAgICB9LFxuXG4gICAgYWRkQXN5bmNUZXN0OiBmdW5jdGlvbihmbikge1xuICAgICAgdGVzdHMucHVzaCh7bmFtZTogbnVsbCwgZm46IGZufSk7XG4gICAgfVxuICB9O1xuXG4gIG1vZHVsZS5leHBvcnRzID0gTW9kZXJuaXpyUHJvdG87XG5cbiIsInZhciBNb2Rlcm5penJQcm90byA9IHJlcXVpcmUoJy4vTW9kZXJuaXpyUHJvdG8uanMnKTtcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCcuL01vZGVybml6ci5qcycpO1xudmFyIGhhc093blByb3AgPSByZXF1aXJlKCcuL2hhc093blByb3AuanMnKTtcbnZhciBzZXRDbGFzc2VzID0gcmVxdWlyZSgnLi9zZXRDbGFzc2VzLmpzJyk7XG5cbiAgIC8vIF9sIHRyYWNrcyBsaXN0ZW5lcnMgZm9yIGFzeW5jIHRlc3RzLCBhcyB3ZWxsIGFzIHRlc3RzIHRoYXQgZXhlY3V0ZSBhZnRlciB0aGUgaW5pdGlhbCBydW5cbiAgTW9kZXJuaXpyUHJvdG8uX2wgPSB7fTtcblxuICAvKipcbiAgICogTW9kZXJuaXpyLm9uIGlzIGEgd2F5IHRvIGxpc3RlbiBmb3IgdGhlIGNvbXBsZXRpb24gb2YgYXN5bmMgdGVzdHMuIEJlaW5nXG4gICAqIGFzeW5jaHJvbm91cywgdGhleSBtYXkgbm90IGZpbmlzaCBiZWZvcmUgeW91ciBzY3JpcHRzIHJ1bi4gQXMgYSByZXN1bHQgeW91XG4gICAqIHdpbGwgZ2V0IGEgcG9zc2libHkgZmFsc2UgbmVnYXRpdmUgYHVuZGVmaW5lZGAgdmFsdWUuXG4gICAqXG4gICAqIEBtZW1iZXJvZiBNb2Rlcm5penJcbiAgICogQG5hbWUgTW9kZXJuaXpyLm9uXG4gICAqIEBhY2Nlc3MgcHVibGljXG4gICAqIEBmdW5jdGlvbiBvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZSAtIFN0cmluZyBuYW1lIG9mIHRoZSBmZWF0dXJlIGRldGVjdFxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYiAtIENhbGxiYWNrIGZ1bmN0aW9uIHJldHVybmluZyBhIEJvb2xlYW4gLSB0cnVlIGlmIGZlYXR1cmUgaXMgc3VwcG9ydGVkLCBmYWxzZSBpZiBub3RcbiAgICogQGV4YW1wbGVcbiAgICpcbiAgICogYGBganNcbiAgICogTW9kZXJuaXpyLm9uKCdmbGFzaCcsIGZ1bmN0aW9uKCByZXN1bHQgKSB7XG4gICAqICAgaWYgKHJlc3VsdCkge1xuICAgKiAgICAvLyB0aGUgYnJvd3NlciBoYXMgZmxhc2hcbiAgICogICB9IGVsc2Uge1xuICAgKiAgICAgLy8gdGhlIGJyb3dzZXIgZG9lcyBub3QgaGF2ZSBmbGFzaFxuICAgKiAgIH1cbiAgICogfSk7XG4gICAqIGBgYFxuICAgKi9cblxuICBNb2Rlcm5penJQcm90by5vbiA9IGZ1bmN0aW9uKGZlYXR1cmUsIGNiKSB7XG4gICAgLy8gQ3JlYXRlIHRoZSBsaXN0IG9mIGxpc3RlbmVycyBpZiBpdCBkb2Vzbid0IGV4aXN0XG4gICAgaWYgKCF0aGlzLl9sW2ZlYXR1cmVdKSB7XG4gICAgICB0aGlzLl9sW2ZlYXR1cmVdID0gW107XG4gICAgfVxuXG4gICAgLy8gUHVzaCB0aGlzIHRlc3Qgb24gdG8gdGhlIGxpc3RlbmVyIGxpc3RcbiAgICB0aGlzLl9sW2ZlYXR1cmVdLnB1c2goY2IpO1xuXG4gICAgLy8gSWYgaXQncyBhbHJlYWR5IGJlZW4gcmVzb2x2ZWQsIHRyaWdnZXIgaXQgb24gbmV4dCB0aWNrXG4gICAgaWYgKE1vZGVybml6ci5oYXNPd25Qcm9wZXJ0eShmZWF0dXJlKSkge1xuICAgICAgLy8gTmV4dCBUaWNrXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBNb2Rlcm5penIuX3RyaWdnZXIoZmVhdHVyZSwgTW9kZXJuaXpyW2ZlYXR1cmVdKTtcbiAgICAgIH0sIDApO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogX3RyaWdnZXIgaXMgdGhlIHByaXZhdGUgZnVuY3Rpb24gdXNlZCB0byBzaWduYWwgdGVzdCBjb21wbGV0aW9uIGFuZCBydW4gYW55XG4gICAqIGNhbGxiYWNrcyByZWdpc3RlcmVkIHRocm91Z2ggW01vZGVybml6ci5vbl0oI21vZGVybml6ci1vbilcbiAgICpcbiAgICogQG1lbWJlcm9mIE1vZGVybml6clxuICAgKiBAbmFtZSBNb2Rlcm5penIuX3RyaWdnZXJcbiAgICogQGFjY2VzcyBwcml2YXRlXG4gICAqIEBmdW5jdGlvbiBfdHJpZ2dlclxuICAgKiBAcGFyYW0ge3N0cmluZ30gZmVhdHVyZSAtIHN0cmluZyBuYW1lIG9mIHRoZSBmZWF0dXJlIGRldGVjdFxuICAgKiBAcGFyYW0ge2Z1bmN0aW9ufGJvb2xlYW59IFtyZXNdIC0gQSBmZWF0dXJlIGRldGVjdGlvbiBmdW5jdGlvbiwgb3IgdGhlIGJvb2xlYW4gPVxuICAgKiByZXN1bHQgb2YgYSBmZWF0dXJlIGRldGVjdGlvbiBmdW5jdGlvblxuICAgKi9cblxuICBNb2Rlcm5penJQcm90by5fdHJpZ2dlciA9IGZ1bmN0aW9uKGZlYXR1cmUsIHJlcykge1xuICAgIGlmICghdGhpcy5fbFtmZWF0dXJlXSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBjYnMgPSB0aGlzLl9sW2ZlYXR1cmVdO1xuXG4gICAgLy8gRm9yY2UgYXN5bmNcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGksIGNiO1xuICAgICAgZm9yIChpID0gMDsgaSA8IGNicy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjYiA9IGNic1tpXTtcbiAgICAgICAgY2IocmVzKTtcbiAgICAgIH1cbiAgICB9LCAwKTtcblxuICAgIC8vIERvbid0IHRyaWdnZXIgdGhlc2UgYWdhaW5cbiAgICBkZWxldGUgdGhpcy5fbFtmZWF0dXJlXTtcbiAgfTtcblxuICAvKipcbiAgICogYWRkVGVzdCBhbGxvd3MgeW91IHRvIGRlZmluZSB5b3VyIG93biBmZWF0dXJlIGRldGVjdHMgdGhhdCBhcmUgbm90IGN1cnJlbnRseVxuICAgKiBpbmNsdWRlZCBpbiBNb2Rlcm5penIgKHVuZGVyIHRoZSBjb3ZlcnMgaXQncyB0aGUgZXhhY3Qgc2FtZSBjb2RlIE1vZGVybml6clxuICAgKiB1c2VzIGZvciBpdHMgb3duIFtmZWF0dXJlIGRldGVjdGlvbnNdKGh0dHBzOi8vZ2l0aHViLmNvbS9Nb2Rlcm5penIvTW9kZXJuaXpyL3RyZWUvbWFzdGVyL2ZlYXR1cmUtZGV0ZWN0cykpLiBKdXN0IGxpa2UgdGhlIG9mZmljYWwgZGV0ZWN0cywgdGhlIHJlc3VsdFxuICAgKiB3aWxsIGJlIGFkZGVkIG9udG8gdGhlIE1vZGVybml6ciBvYmplY3QsIGFzIHdlbGwgYXMgYW4gYXBwcm9wcmlhdGUgY2xhc3NOYW1lIHNldCBvblxuICAgKiB0aGUgaHRtbCBlbGVtZW50IHdoZW4gY29uZmlndXJlZCB0byBkbyBzb1xuICAgKlxuICAgKiBAbWVtYmVyb2YgTW9kZXJuaXpyXG4gICAqIEBuYW1lIE1vZGVybml6ci5hZGRUZXN0XG4gICAqIEBvcHRpb25OYW1lIE1vZGVybml6ci5hZGRUZXN0KClcbiAgICogQG9wdGlvblByb3AgYWRkVGVzdFxuICAgKiBAYWNjZXNzIHB1YmxpY1xuICAgKiBAZnVuY3Rpb24gYWRkVGVzdFxuICAgKiBAcGFyYW0ge3N0cmluZ3xvYmplY3R9IGZlYXR1cmUgLSBUaGUgc3RyaW5nIG5hbWUgb2YgdGhlIGZlYXR1cmUgZGV0ZWN0LCBvciBhblxuICAgKiBvYmplY3Qgb2YgZmVhdHVyZSBkZXRlY3QgbmFtZXMgYW5kIHRlc3RcbiAgICogQHBhcmFtIHtmdW5jdGlvbnxib29sZWFufSB0ZXN0IC0gRnVuY3Rpb24gcmV0dXJuaW5nIHRydWUgaWYgZmVhdHVyZSBpcyBzdXBwb3J0ZWQsXG4gICAqIGZhbHNlIGlmIG5vdC4gT3RoZXJ3aXNlIGEgYm9vbGVhbiByZXByZXNlbnRpbmcgdGhlIHJlc3VsdHMgb2YgYSBmZWF0dXJlIGRldGVjdGlvblxuICAgKiBAZXhhbXBsZVxuICAgKlxuICAgKiBUaGUgbW9zdCBjb21tb24gd2F5IG9mIGNyZWF0aW5nIHlvdXIgb3duIGZlYXR1cmUgZGV0ZWN0cyBpcyBieSBjYWxsaW5nXG4gICAqIGBNb2Rlcm5penIuYWRkVGVzdGAgd2l0aCBhIHN0cmluZyAocHJlZmVyYWJseSBqdXN0IGxvd2VyY2FzZSwgd2l0aG91dCBhbnlcbiAgICogcHVuY3R1YXRpb24pLCBhbmQgYSBmdW5jdGlvbiB5b3Ugd2FudCBleGVjdXRlZCB0aGF0IHdpbGwgcmV0dXJuIGEgYm9vbGVhbiByZXN1bHRcbiAgICpcbiAgICogYGBganNcbiAgICogTW9kZXJuaXpyLmFkZFRlc3QoJ2l0c1R1ZXNkYXknLCBmdW5jdGlvbigpIHtcbiAgICogIHZhciBkID0gbmV3IERhdGUoKTtcbiAgICogIHJldHVybiBkLmdldERheSgpID09PSAyO1xuICAgKiB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIFdoZW4gdGhlIGFib3ZlIGlzIHJ1biwgaXQgd2lsbCBzZXQgTW9kZXJuaXpyLml0c3R1ZXNkYXkgdG8gYHRydWVgIHdoZW4gaXQgaXMgdHVlc2RheSxcbiAgICogYW5kIHRvIGBmYWxzZWAgZXZlcnkgb3RoZXIgZGF5IG9mIHRoZSB3ZWVrLiBPbmUgdGhpbmcgdG8gbm90aWNlIGlzIHRoYXQgdGhlIG5hbWVzIG9mXG4gICAqIGZlYXR1cmUgZGV0ZWN0IGZ1bmN0aW9ucyBhcmUgYWx3YXlzIGxvd2VyY2FzZWQgd2hlbiBhZGRlZCB0byB0aGUgTW9kZXJuaXpyIG9iamVjdC4gVGhhdFxuICAgKiBtZWFucyB0aGF0IGBNb2Rlcm5penIuaXRzVHVlc2RheWAgd2lsbCBub3QgZXhpc3QsIGJ1dCBgTW9kZXJuaXpyLml0c3R1ZXNkYXlgIHdpbGwuXG4gICAqXG4gICAqXG4gICAqICBTaW5jZSB3ZSBvbmx5IGxvb2sgYXQgdGhlIHJldHVybmVkIHZhbHVlIGZyb20gYW55IGZlYXR1cmUgZGV0ZWN0aW9uIGZ1bmN0aW9uLFxuICAgKiAgeW91IGRvIG5vdCBuZWVkIHRvIGFjdHVhbGx5IHVzZSBhIGZ1bmN0aW9uLiBGb3Igc2ltcGxlIGRldGVjdGlvbnMsIGp1c3QgcGFzc2luZ1xuICAgKiAgaW4gYSBzdGF0ZW1lbnQgdGhhdCB3aWxsIHJldHVybiBhIGJvb2xlYW4gdmFsdWUgd29ya3MganVzdCBmaW5lLlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiBNb2Rlcm5penIuYWRkVGVzdCgnaGFzSnF1ZXJ5JywgJ2pRdWVyeScgaW4gd2luZG93KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEp1c3QgbGlrZSBiZWZvcmUsIHdoZW4gdGhlIGFib3ZlIHJ1bnMgYE1vZGVybml6ci5oYXNqcXVlcnlgIHdpbGwgYmUgdHJ1ZSBpZlxuICAgKiBqUXVlcnkgaGFzIGJlZW4gaW5jbHVkZWQgb24gdGhlIHBhZ2UuIE5vdCB1c2luZyBhIGZ1bmN0aW9uIHNhdmVzIGEgc21hbGwgYW1vdW50XG4gICAqIG9mIG92ZXJoZWFkIGZvciB0aGUgYnJvd3NlciwgYXMgd2VsbCBhcyBtYWtpbmcgeW91ciBjb2RlIG11Y2ggbW9yZSByZWFkYWJsZS5cbiAgICpcbiAgICogRmluYWxseSwgeW91IGFsc28gaGF2ZSB0aGUgYWJpbGl0eSB0byBwYXNzIGluIGFuIG9iamVjdCBvZiBmZWF0dXJlIG5hbWVzIGFuZFxuICAgKiB0aGVpciB0ZXN0cy4gVGhpcyBpcyBoYW5keSBpZiB5b3Ugd2FudCB0byBhZGQgbXVsdGlwbGUgZGV0ZWN0aW9ucyBpbiBvbmUgZ28uXG4gICAqIFRoZSBrZXlzIHNob3VsZCBhbHdheXMgYmUgYSBzdHJpbmcsIGFuZCB0aGUgdmFsdWUgY2FuIGJlIGVpdGhlciBhIGJvb2xlYW4gb3JcbiAgICogZnVuY3Rpb24gdGhhdCByZXR1cm5zIGEgYm9vbGVhbi5cbiAgICpcbiAgICogYGBganNcbiAgICogdmFyIGRldGVjdHMgPSB7XG4gICAqICAnaGFzanF1ZXJ5JzogJ2pRdWVyeScgaW4gd2luZG93LFxuICAgKiAgJ2l0c3R1ZXNkYXknOiBmdW5jdGlvbigpIHtcbiAgICogICAgdmFyIGQgPSBuZXcgRGF0ZSgpO1xuICAgKiAgICByZXR1cm4gZC5nZXREYXkoKSA9PT0gMjtcbiAgICogIH1cbiAgICogfVxuICAgKlxuICAgKiBNb2Rlcm5penIuYWRkVGVzdChkZXRlY3RzKTtcbiAgICogYGBgXG4gICAqXG4gICAqIFRoZXJlIGlzIHJlYWxseSBubyBkaWZmZXJlbmNlIGJldHdlZW4gdGhlIGZpcnN0IG1ldGhvZHMgYW5kIHRoaXMgb25lLCBpdCBpc1xuICAgKiBqdXN0IGEgY29udmVuaWVuY2UgdG8gbGV0IHlvdSB3cml0ZSBtb3JlIHJlYWRhYmxlIGNvZGUuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIGFkZFRlc3QoZmVhdHVyZSwgdGVzdCkge1xuXG4gICAgaWYgKHR5cGVvZiBmZWF0dXJlID09ICdvYmplY3QnKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gZmVhdHVyZSkge1xuICAgICAgICBpZiAoaGFzT3duUHJvcChmZWF0dXJlLCBrZXkpKSB7XG4gICAgICAgICAgYWRkVGVzdChrZXksIGZlYXR1cmVbIGtleSBdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG5cbiAgICAgIGZlYXR1cmUgPSBmZWF0dXJlLnRvTG93ZXJDYXNlKCk7XG4gICAgICB2YXIgZmVhdHVyZU5hbWVTcGxpdCA9IGZlYXR1cmUuc3BsaXQoJy4nKTtcbiAgICAgIHZhciBsYXN0ID0gTW9kZXJuaXpyW2ZlYXR1cmVOYW1lU3BsaXRbMF1dO1xuXG4gICAgICAvLyBBZ2Fpbiwgd2UgZG9uJ3QgY2hlY2sgZm9yIHBhcmVudCB0ZXN0IGV4aXN0ZW5jZS4gR2V0IHRoYXQgcmlnaHQsIHRob3VnaC5cbiAgICAgIGlmIChmZWF0dXJlTmFtZVNwbGl0Lmxlbmd0aCA9PSAyKSB7XG4gICAgICAgIGxhc3QgPSBsYXN0W2ZlYXR1cmVOYW1lU3BsaXRbMV1dO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIGxhc3QgIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgLy8gd2UncmUgZ29pbmcgdG8gcXVpdCBpZiB5b3UncmUgdHJ5aW5nIHRvIG92ZXJ3cml0ZSBhbiBleGlzdGluZyB0ZXN0XG4gICAgICAgIC8vIGlmIHdlIHdlcmUgdG8gYWxsb3cgaXQsIHdlJ2QgZG8gdGhpczpcbiAgICAgICAgLy8gICB2YXIgcmUgPSBuZXcgUmVnRXhwKFwiXFxcXGIobm8tKT9cIiArIGZlYXR1cmUgKyBcIlxcXFxiXCIpO1xuICAgICAgICAvLyAgIGRvY0VsZW1lbnQuY2xhc3NOYW1lID0gZG9jRWxlbWVudC5jbGFzc05hbWUucmVwbGFjZSggcmUsICcnICk7XG4gICAgICAgIC8vIGJ1dCwgbm8gcmx5LCBzdHVmZiAnZW0uXG4gICAgICAgIHJldHVybiBNb2Rlcm5penI7XG4gICAgICB9XG5cbiAgICAgIHRlc3QgPSB0eXBlb2YgdGVzdCA9PSAnZnVuY3Rpb24nID8gdGVzdCgpIDogdGVzdDtcblxuICAgICAgLy8gU2V0IHRoZSB2YWx1ZSAodGhpcyBpcyB0aGUgbWFnaWMsIHJpZ2h0IGhlcmUpLlxuICAgICAgaWYgKGZlYXR1cmVOYW1lU3BsaXQubGVuZ3RoID09IDEpIHtcbiAgICAgICAgTW9kZXJuaXpyW2ZlYXR1cmVOYW1lU3BsaXRbMF1dID0gdGVzdDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGNhc3QgdG8gYSBCb29sZWFuLCBpZiBub3Qgb25lIGFscmVhZHlcbiAgICAgICAgLyoganNoaW50IC1XMDUzICovXG4gICAgICAgIGlmIChNb2Rlcm5penJbZmVhdHVyZU5hbWVTcGxpdFswXV0gJiYgIShNb2Rlcm5penJbZmVhdHVyZU5hbWVTcGxpdFswXV0gaW5zdGFuY2VvZiBCb29sZWFuKSkge1xuICAgICAgICAgIE1vZGVybml6cltmZWF0dXJlTmFtZVNwbGl0WzBdXSA9IG5ldyBCb29sZWFuKE1vZGVybml6cltmZWF0dXJlTmFtZVNwbGl0WzBdXSk7XG4gICAgICAgIH1cblxuICAgICAgICBNb2Rlcm5penJbZmVhdHVyZU5hbWVTcGxpdFswXV1bZmVhdHVyZU5hbWVTcGxpdFsxXV0gPSB0ZXN0O1xuICAgICAgfVxuXG4gICAgICAvLyBTZXQgYSBzaW5nbGUgY2xhc3MgKGVpdGhlciBgZmVhdHVyZWAgb3IgYG5vLWZlYXR1cmVgKVxuICAgICAgLyoganNoaW50IC1XMDQxICovXG4gICAgICBzZXRDbGFzc2VzKFsoISF0ZXN0ICYmIHRlc3QgIT0gZmFsc2UgPyAnJyA6ICduby0nKSArIGZlYXR1cmVOYW1lU3BsaXQuam9pbignLScpXSk7XG4gICAgICAvKiBqc2hpbnQgK1cwNDEgKi9cblxuICAgICAgLy8gVHJpZ2dlciB0aGUgZXZlbnRcbiAgICAgIE1vZGVybml6ci5fdHJpZ2dlcihmZWF0dXJlLCB0ZXN0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gTW9kZXJuaXpyOyAvLyBhbGxvdyBjaGFpbmluZy5cbiAgfVxuXG4gIC8vIEFmdGVyIGFsbCB0aGUgdGVzdHMgYXJlIHJ1biwgYWRkIHNlbGYgdG8gdGhlIE1vZGVybml6ciBwcm90b3R5cGVcbiAgTW9kZXJuaXpyLl9xLnB1c2goZnVuY3Rpb24oKSB7XG4gICAgTW9kZXJuaXpyUHJvdG8uYWRkVGVzdCA9IGFkZFRlc3Q7XG4gIH0pO1xuXG4gIG1vZHVsZS5leHBvcnRzID0gYWRkVGVzdDtcblxuIiwiXG4gIHZhciBjbGFzc2VzID0gW107XG4gIG1vZHVsZS5leHBvcnRzID0gY2xhc3NlcztcblxuIiwiXG4gIC8qKlxuICAgKiBkb2NFbGVtZW50IGlzIGEgY29udmVuaWVuY2Ugd3JhcHBlciB0byBncmFiIHRoZSByb290IGVsZW1lbnQgb2YgdGhlIGRvY3VtZW50XG4gICAqXG4gICAqIEBhY2Nlc3MgcHJpdmF0ZVxuICAgKiBAcmV0dXJucyB7SFRNTEVsZW1lbnR8U1ZHRWxlbWVudH0gVGhlIHJvb3QgZWxlbWVudCBvZiB0aGUgZG9jdW1lbnRcbiAgICovXG5cbiAgdmFyIGRvY0VsZW1lbnQgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG4gIG1vZHVsZS5leHBvcnRzID0gZG9jRWxlbWVudDtcblxuIiwidmFyIGlzID0gcmVxdWlyZSgnLi9pcy5qcycpO1xuICAvKipcbiAgICogaGFzT3duUHJvcCBpcyBhIHNoaW0gZm9yIGhhc093blByb3BlcnR5IHRoYXQgaXMgbmVlZGVkIGZvciBTYWZhcmkgMi4wIHN1cHBvcnRcbiAgICpcbiAgICogQGF1dGhvciBrYW5nYXhcbiAgICogQGFjY2VzcyBwcml2YXRlXG4gICAqIEBmdW5jdGlvbiBoYXNPd25Qcm9wXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBvYmplY3QgLSBUaGUgb2JqZWN0IHRvIGNoZWNrIGZvciBhIHByb3BlcnR5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwcm9wZXJ0eSAtIFRoZSBwcm9wZXJ0eSB0byBjaGVjayBmb3JcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuXG4gIC8vIGhhc093blByb3BlcnR5IHNoaW0gYnkga2FuZ2F4IG5lZWRlZCBmb3IgU2FmYXJpIDIuMCBzdXBwb3J0XG4gIHZhciBoYXNPd25Qcm9wO1xuXG4gIChmdW5jdGlvbigpIHtcbiAgICB2YXIgX2hhc093blByb3BlcnR5ID0gKHt9KS5oYXNPd25Qcm9wZXJ0eTtcbiAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgIC8qIHdlIGhhdmUgbm8gd2F5IG9mIHRlc3RpbmcgSUUgNS41IG9yIHNhZmFyaSAyLFxuICAgICAqIHNvIGp1c3QgYXNzdW1lIHRoZSBlbHNlIGdldHMgaGl0ICovXG4gICAgaWYgKCFpcyhfaGFzT3duUHJvcGVydHksICd1bmRlZmluZWQnKSAmJiAhaXMoX2hhc093blByb3BlcnR5LmNhbGwsICd1bmRlZmluZWQnKSkge1xuICAgICAgaGFzT3duUHJvcCA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHtcbiAgICAgICAgcmV0dXJuIF9oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpO1xuICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBoYXNPd25Qcm9wID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyAvKiB5ZXMsIHRoaXMgY2FuIGdpdmUgZmFsc2UgcG9zaXRpdmVzL25lZ2F0aXZlcywgYnV0IG1vc3Qgb2YgdGhlIHRpbWUgd2UgZG9uJ3QgY2FyZSBhYm91dCB0aG9zZSAqL1xuICAgICAgICByZXR1cm4gKChwcm9wZXJ0eSBpbiBvYmplY3QpICYmIGlzKG9iamVjdC5jb25zdHJ1Y3Rvci5wcm90b3R5cGVbcHJvcGVydHldLCAndW5kZWZpbmVkJykpO1xuICAgICAgfTtcbiAgICB9XG4gIH0pKCk7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBoYXNPd25Qcm9wO1xuXG4iLCJcbiAgLyoqXG4gICAqIGlzIHJldHVybnMgYSBib29sZWFuIGlmIHRoZSB0eXBlb2YgYW4gb2JqIGlzIGV4YWN0bHkgdHlwZS5cbiAgICpcbiAgICogQGFjY2VzcyBwcml2YXRlXG4gICAqIEBmdW5jdGlvbiBpc1xuICAgKiBAcGFyYW0geyp9IG9iaiAtIEEgdGhpbmcgd2Ugd2FudCB0byBjaGVjayB0aGUgdHlwZSBvZlxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHlwZSAtIEEgc3RyaW5nIHRvIGNvbXBhcmUgdGhlIHR5cGVvZiBhZ2FpbnN0XG4gICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgKi9cblxuICBmdW5jdGlvbiBpcyhvYmosIHR5cGUpIHtcbiAgICByZXR1cm4gdHlwZW9mIG9iaiA9PT0gdHlwZTtcbiAgfVxuICBtb2R1bGUuZXhwb3J0cyA9IGlzO1xuXG4iLCJ2YXIgZG9jRWxlbWVudCA9IHJlcXVpcmUoJy4vZG9jRWxlbWVudC5qcycpO1xuICAvKipcbiAgICogQSBjb252ZW5pZW5jZSBoZWxwZXIgdG8gY2hlY2sgaWYgdGhlIGRvY3VtZW50IHdlIGFyZSBydW5uaW5nIGluIGlzIGFuIFNWRyBkb2N1bWVudFxuICAgKlxuICAgKiBAYWNjZXNzIHByaXZhdGVcbiAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAqL1xuXG4gIHZhciBpc1NWRyA9IGRvY0VsZW1lbnQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3N2Zyc7XG4gIG1vZHVsZS5leHBvcnRzID0gaXNTVkc7XG5cbiIsInZhciBNb2Rlcm5penIgPSByZXF1aXJlKCcuL01vZGVybml6ci5qcycpO1xudmFyIGRvY0VsZW1lbnQgPSByZXF1aXJlKCcuL2RvY0VsZW1lbnQuanMnKTtcbnZhciBpc1NWRyA9IHJlcXVpcmUoJy4vaXNTVkcuanMnKTtcbiAgLyoqXG4gICAqIHNldENsYXNzZXMgdGFrZXMgYW4gYXJyYXkgb2YgY2xhc3MgbmFtZXMgYW5kIGFkZHMgdGhlbSB0byB0aGUgcm9vdCBlbGVtZW50XG4gICAqXG4gICAqIEBhY2Nlc3MgcHJpdmF0ZVxuICAgKiBAZnVuY3Rpb24gc2V0Q2xhc3Nlc1xuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBjbGFzc2VzIC0gQXJyYXkgb2YgY2xhc3MgbmFtZXNcbiAgICovXG5cbiAgLy8gUGFzcyBpbiBhbiBhbmQgYXJyYXkgb2YgY2xhc3MgbmFtZXMsIGUuZy46XG4gIC8vICBbJ25vLXdlYnAnLCAnYm9yZGVycmFkaXVzJywgLi4uXVxuICBmdW5jdGlvbiBzZXRDbGFzc2VzKGNsYXNzZXMpIHtcbiAgICB2YXIgY2xhc3NOYW1lID0gZG9jRWxlbWVudC5jbGFzc05hbWU7XG4gICAgdmFyIGNsYXNzUHJlZml4ID0gTW9kZXJuaXpyLl9jb25maWcuY2xhc3NQcmVmaXggfHwgJyc7XG5cbiAgICBpZiAoaXNTVkcpIHtcbiAgICAgIGNsYXNzTmFtZSA9IGNsYXNzTmFtZS5iYXNlVmFsO1xuICAgIH1cblxuICAgIC8vIENoYW5nZSBgbm8tanNgIHRvIGBqc2AgKGluZGVwZW5kZW50bHkgb2YgdGhlIGBlbmFibGVDbGFzc2VzYCBvcHRpb24pXG4gICAgLy8gSGFuZGxlIGNsYXNzUHJlZml4IG9uIHRoaXMgdG9vXG4gICAgaWYgKE1vZGVybml6ci5fY29uZmlnLmVuYWJsZUpTQ2xhc3MpIHtcbiAgICAgIHZhciByZUpTID0gbmV3IFJlZ0V4cCgnKF58XFxcXHMpJyArIGNsYXNzUHJlZml4ICsgJ25vLWpzKFxcXFxzfCQpJyk7XG4gICAgICBjbGFzc05hbWUgPSBjbGFzc05hbWUucmVwbGFjZShyZUpTLCAnJDEnICsgY2xhc3NQcmVmaXggKyAnanMkMicpO1xuICAgIH1cblxuICAgIGlmIChNb2Rlcm5penIuX2NvbmZpZy5lbmFibGVDbGFzc2VzKSB7XG4gICAgICAvLyBBZGQgdGhlIG5ldyBjbGFzc2VzXG4gICAgICBjbGFzc05hbWUgKz0gJyAnICsgY2xhc3NQcmVmaXggKyBjbGFzc2VzLmpvaW4oJyAnICsgY2xhc3NQcmVmaXgpO1xuICAgICAgaXNTVkcgPyBkb2NFbGVtZW50LmNsYXNzTmFtZS5iYXNlVmFsID0gY2xhc3NOYW1lIDogZG9jRWxlbWVudC5jbGFzc05hbWUgPSBjbGFzc05hbWU7XG4gICAgfVxuXG4gIH1cblxuICBtb2R1bGUuZXhwb3J0cyA9IHNldENsYXNzZXM7XG5cbiIsInZhciB0ZXN0cyA9IHJlcXVpcmUoJy4vdGVzdHMuanMnKTtcbnZhciBNb2Rlcm5penIgPSByZXF1aXJlKCcuL01vZGVybml6ci5qcycpO1xudmFyIGNsYXNzZXMgPSByZXF1aXJlKCcuL2NsYXNzZXMuanMnKTtcbnZhciBpcyA9IHJlcXVpcmUoJy4vaXMuanMnKTtcbiAgLyoqXG4gICAqIFJ1biB0aHJvdWdoIGFsbCB0ZXN0cyBhbmQgZGV0ZWN0IHRoZWlyIHN1cHBvcnQgaW4gdGhlIGN1cnJlbnQgVUEuXG4gICAqXG4gICAqIEBhY2Nlc3MgcHJpdmF0ZVxuICAgKi9cblxuICBmdW5jdGlvbiB0ZXN0UnVubmVyKCkge1xuICAgIHZhciBmZWF0dXJlTmFtZXM7XG4gICAgdmFyIGZlYXR1cmU7XG4gICAgdmFyIGFsaWFzSWR4O1xuICAgIHZhciByZXN1bHQ7XG4gICAgdmFyIG5hbWVJZHg7XG4gICAgdmFyIGZlYXR1cmVOYW1lO1xuICAgIHZhciBmZWF0dXJlTmFtZVNwbGl0O1xuXG4gICAgZm9yICh2YXIgZmVhdHVyZUlkeCBpbiB0ZXN0cykge1xuICAgICAgaWYgKHRlc3RzLmhhc093blByb3BlcnR5KGZlYXR1cmVJZHgpKSB7XG4gICAgICAgIGZlYXR1cmVOYW1lcyA9IFtdO1xuICAgICAgICBmZWF0dXJlID0gdGVzdHNbZmVhdHVyZUlkeF07XG4gICAgICAgIC8vIHJ1biB0aGUgdGVzdCwgdGhyb3cgdGhlIHJldHVybiB2YWx1ZSBpbnRvIHRoZSBNb2Rlcm5penIsXG4gICAgICAgIC8vIHRoZW4gYmFzZWQgb24gdGhhdCBib29sZWFuLCBkZWZpbmUgYW4gYXBwcm9wcmlhdGUgY2xhc3NOYW1lXG4gICAgICAgIC8vIGFuZCBwdXNoIGl0IGludG8gYW4gYXJyYXkgb2YgY2xhc3NlcyB3ZSdsbCBqb2luIGxhdGVyLlxuICAgICAgICAvL1xuICAgICAgICAvLyBJZiB0aGVyZSBpcyBubyBuYW1lLCBpdCdzIGFuICdhc3luYycgdGVzdCB0aGF0IGlzIHJ1bixcbiAgICAgICAgLy8gYnV0IG5vdCBkaXJlY3RseSBhZGRlZCB0byB0aGUgb2JqZWN0LiBUaGF0IHNob3VsZFxuICAgICAgICAvLyBiZSBkb25lIHdpdGggYSBwb3N0LXJ1biBhZGRUZXN0IGNhbGwuXG4gICAgICAgIGlmIChmZWF0dXJlLm5hbWUpIHtcbiAgICAgICAgICBmZWF0dXJlTmFtZXMucHVzaChmZWF0dXJlLm5hbWUudG9Mb3dlckNhc2UoKSk7XG5cbiAgICAgICAgICBpZiAoZmVhdHVyZS5vcHRpb25zICYmIGZlYXR1cmUub3B0aW9ucy5hbGlhc2VzICYmIGZlYXR1cmUub3B0aW9ucy5hbGlhc2VzLmxlbmd0aCkge1xuICAgICAgICAgICAgLy8gQWRkIGFsbCB0aGUgYWxpYXNlcyBpbnRvIHRoZSBuYW1lcyBsaXN0XG4gICAgICAgICAgICBmb3IgKGFsaWFzSWR4ID0gMDsgYWxpYXNJZHggPCBmZWF0dXJlLm9wdGlvbnMuYWxpYXNlcy5sZW5ndGg7IGFsaWFzSWR4KyspIHtcbiAgICAgICAgICAgICAgZmVhdHVyZU5hbWVzLnB1c2goZmVhdHVyZS5vcHRpb25zLmFsaWFzZXNbYWxpYXNJZHhdLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJ1biB0aGUgdGVzdCwgb3IgdXNlIHRoZSByYXcgdmFsdWUgaWYgaXQncyBub3QgYSBmdW5jdGlvblxuICAgICAgICByZXN1bHQgPSBpcyhmZWF0dXJlLmZuLCAnZnVuY3Rpb24nKSA/IGZlYXR1cmUuZm4oKSA6IGZlYXR1cmUuZm47XG5cblxuICAgICAgICAvLyBTZXQgZWFjaCBvZiB0aGUgbmFtZXMgb24gdGhlIE1vZGVybml6ciBvYmplY3RcbiAgICAgICAgZm9yIChuYW1lSWR4ID0gMDsgbmFtZUlkeCA8IGZlYXR1cmVOYW1lcy5sZW5ndGg7IG5hbWVJZHgrKykge1xuICAgICAgICAgIGZlYXR1cmVOYW1lID0gZmVhdHVyZU5hbWVzW25hbWVJZHhdO1xuICAgICAgICAgIC8vIFN1cHBvcnQgZG90IHByb3BlcnRpZXMgYXMgc3ViIHRlc3RzLiBXZSBkb24ndCBkbyBjaGVja2luZyB0byBtYWtlIHN1cmVcbiAgICAgICAgICAvLyB0aGF0IHRoZSBpbXBsaWVkIHBhcmVudCB0ZXN0cyBoYXZlIGJlZW4gYWRkZWQuIFlvdSBtdXN0IGNhbGwgdGhlbSBpblxuICAgICAgICAgIC8vIG9yZGVyIChlaXRoZXIgaW4gdGhlIHRlc3QsIG9yIG1ha2UgdGhlIHBhcmVudCB0ZXN0IGEgZGVwZW5kZW5jeSkuXG4gICAgICAgICAgLy9cbiAgICAgICAgICAvLyBDYXAgaXQgdG8gVFdPIHRvIG1ha2UgdGhlIGxvZ2ljIHNpbXBsZSBhbmQgYmVjYXVzZSB3aG8gbmVlZHMgdGhhdCBraW5kIG9mIHN1YnRlc3RpbmdcbiAgICAgICAgICAvLyBoYXNodGFnIGZhbW91cyBsYXN0IHdvcmRzXG4gICAgICAgICAgZmVhdHVyZU5hbWVTcGxpdCA9IGZlYXR1cmVOYW1lLnNwbGl0KCcuJyk7XG5cbiAgICAgICAgICBpZiAoZmVhdHVyZU5hbWVTcGxpdC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIE1vZGVybml6cltmZWF0dXJlTmFtZVNwbGl0WzBdXSA9IHJlc3VsdDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gY2FzdCB0byBhIEJvb2xlYW4sIGlmIG5vdCBvbmUgYWxyZWFkeVxuICAgICAgICAgICAgLyoganNoaW50IC1XMDUzICovXG4gICAgICAgICAgICBpZiAoTW9kZXJuaXpyW2ZlYXR1cmVOYW1lU3BsaXRbMF1dICYmICEoTW9kZXJuaXpyW2ZlYXR1cmVOYW1lU3BsaXRbMF1dIGluc3RhbmNlb2YgQm9vbGVhbikpIHtcbiAgICAgICAgICAgICAgTW9kZXJuaXpyW2ZlYXR1cmVOYW1lU3BsaXRbMF1dID0gbmV3IEJvb2xlYW4oTW9kZXJuaXpyW2ZlYXR1cmVOYW1lU3BsaXRbMF1dKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgTW9kZXJuaXpyW2ZlYXR1cmVOYW1lU3BsaXRbMF1dW2ZlYXR1cmVOYW1lU3BsaXRbMV1dID0gcmVzdWx0O1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNsYXNzZXMucHVzaCgocmVzdWx0ID8gJycgOiAnbm8tJykgKyBmZWF0dXJlTmFtZVNwbGl0LmpvaW4oJy0nKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgbW9kdWxlLmV4cG9ydHMgPSB0ZXN0UnVubmVyO1xuXG4iLCJcbiAgdmFyIHRlc3RzID0gW107XG4gIG1vZHVsZS5leHBvcnRzID0gdGVzdHM7XG5cbiIsIi8qIVxue1xuICBcIm5hbWVcIjogXCJXZWJwXCIsXG4gIFwiYXN5bmNcIjogdHJ1ZSxcbiAgXCJwcm9wZXJ0eVwiOiBcIndlYnBcIixcbiAgXCJ0YWdzXCI6IFtcImltYWdlXCJdLFxuICBcImJ1aWxkZXJBbGlhc2VzXCI6IFtcImltZ193ZWJwXCJdLFxuICBcImF1dGhvcnNcIjogW1wiS3Jpc3RlciBLYXJpXCIsIFwiQGFtYW5kZWVwXCIsIFwiUmljaCBCcmFkc2hhd1wiLCBcIlJ5YW4gU2VkZG9uXCIsIFwiUGF1bCBJcmlzaFwiXSxcbiAgXCJub3Rlc1wiOiBbe1xuICAgIFwibmFtZVwiOiBcIldlYnAgSW5mb1wiLFxuICAgIFwiaHJlZlwiOiBcImh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL3NwZWVkL3dlYnAvXCJcbiAgfSwge1xuICAgIFwibmFtZVwiOiBcIkNob3JtaXVtIGJsb2cgLSBDaHJvbWUgMzIgQmV0YTogQW5pbWF0ZWQgV2ViUCBpbWFnZXMgYW5kIGZhc3RlciBDaHJvbWUgZm9yIEFuZHJvaWQgdG91Y2ggaW5wdXRcIixcbiAgICBcImhyZWZcIjogXCJodHRwczovL2Jsb2cuY2hyb21pdW0ub3JnLzIwMTMvMTEvY2hyb21lLTMyLWJldGEtYW5pbWF0ZWQtd2VicC1pbWFnZXMtYW5kLmh0bWxcIlxuICB9LCB7XG4gICAgXCJuYW1lXCI6IFwiV2VicCBMb3NzbGVzcyBTcGVjXCIsXG4gICAgXCJocmVmXCI6IFwiaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vc3BlZWQvd2VicC9kb2NzL3dlYnBfbG9zc2xlc3NfYml0c3RyZWFtX3NwZWNpZmljYXRpb25cIlxuICB9LCB7XG4gICAgXCJuYW1lXCI6IFwiQXJ0aWNsZSBhYm91dCBXZWJQIHN1cHBvcnQgb24gQW5kcm9pZCBicm93c2Vyc1wiLFxuICAgIFwiaHJlZlwiOiBcImh0dHA6Ly93d3cud29wZS1mcmFtZXdvcmsuY29tL2VuLzIwMTMvMDYvMjQvd2VicC1zdXBwb3J0LW9uLWFuZHJvaWQtYnJvd3NlcnMvXCJcbiAgfSwge1xuICAgIFwibmFtZVwiOiBcIkNob3JtaXVtIFdlYlAgYW5ub3VuY2VtZW50XCIsXG4gICAgXCJocmVmXCI6IFwiaHR0cHM6Ly9ibG9nLmNocm9taXVtLm9yZy8yMDExLzExL2xvc3NsZXNzLWFuZC10cmFuc3BhcmVuY3ktZW5jb2RpbmctaW4uaHRtbD9tPTFcIlxuICB9XVxufVxuISovXG4vKiBET0NcblRlc3RzIGZvciBsb3NzeSwgbm9uLWFscGhhIHdlYnAgc3VwcG9ydC5cblxuVGVzdHMgZm9yIGFsbCBmb3JtcyBvZiB3ZWJwIHN1cHBvcnQgKGxvc3NsZXNzLCBsb3NzeSwgYWxwaGEsIGFuZCBhbmltYXRlZCkuLlxuXG4gIE1vZGVybml6ci53ZWJwICAgICAgICAgICAgICAvLyBCYXNpYyBzdXBwb3J0IChsb3NzeSlcbiAgTW9kZXJuaXpyLndlYnAubG9zc2xlc3MgICAgIC8vIExvc3NsZXNzXG4gIE1vZGVybml6ci53ZWJwLmFscGhhICAgICAgICAvLyBBbHBoYSAoYm90aCBsb3NzeSBhbmQgbG9zc2xlc3MpXG4gIE1vZGVybml6ci53ZWJwLmFuaW1hdGlvbiAgICAvLyBBbmltYXRlZCBXZWJQXG5cbiovXG52YXIgTW9kZXJuaXpyID0gcmVxdWlyZSgnLi8uLi8uLi9saWIvTW9kZXJuaXpyLmpzJyk7XG52YXIgYWRkVGVzdCA9IHJlcXVpcmUoJy4vLi4vLi4vbGliL2FkZFRlc3QuanMnKTtcblxuICBNb2Rlcm5penIuYWRkQXN5bmNUZXN0KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHdlYnBUZXN0cyA9IFt7XG4gICAgICAndXJpJzogJ2RhdGE6aW1hZ2Uvd2VicDtiYXNlNjQsVWtsR1JpUUFBQUJYUlVKUVZsQTRJQmdBQUFBd0FRQ2RBU29CQUFFQUF3QTBKYVFBQTNBQS92dVVBQUE9JyxcbiAgICAgICduYW1lJzogJ3dlYnAnXG4gICAgfSwge1xuICAgICAgJ3VyaSc6ICdkYXRhOmltYWdlL3dlYnA7YmFzZTY0LFVrbEdSa29BQUFCWFJVSlFWbEE0V0FvQUFBQVFBQUFBQUFBQUFBQUFRVXhRU0F3QUFBQUJCeEFSL1E5RVJQOERBQUJXVURnZ0dBQUFBREFCQUowQktnRUFBUUFEQURRbHBBQURjQUQrKy8xUUFBPT0nLFxuICAgICAgJ25hbWUnOiAnd2VicC5hbHBoYSdcbiAgICB9LCB7XG4gICAgICAndXJpJzogJ2RhdGE6aW1hZ2Uvd2VicDtiYXNlNjQsVWtsR1JsSUFBQUJYUlVKUVZsQTRXQW9BQUFBU0FBQUFBQUFBQUFBQVFVNUpUUVlBQUFELy8vLy9BQUJCVGsxR0pnQUFBQUFBQUFBQUFBQUFBQUFBQUdRQUFBQldVRGhNRFFBQUFDOEFBQUFRQnhBUkVZaUkvZ2NBJyxcbiAgICAgICduYW1lJzogJ3dlYnAuYW5pbWF0aW9uJ1xuICAgIH0sIHtcbiAgICAgICd1cmknOiAnZGF0YTppbWFnZS93ZWJwO2Jhc2U2NCxVa2xHUmg0QUFBQlhSVUpRVmxBNFRCRUFBQUF2QUFBQUFBZlEvLzczdi8rQmlPaC9BQUE9JyxcbiAgICAgICduYW1lJzogJ3dlYnAubG9zc2xlc3MnXG4gICAgfV07XG5cbiAgICB2YXIgd2VicCA9IHdlYnBUZXN0cy5zaGlmdCgpO1xuICAgIGZ1bmN0aW9uIHRlc3QobmFtZSwgdXJpLCBjYikge1xuXG4gICAgICB2YXIgaW1hZ2UgPSBuZXcgSW1hZ2UoKTtcblxuICAgICAgZnVuY3Rpb24gYWRkUmVzdWx0KGV2ZW50KSB7XG4gICAgICAgIC8vIGlmIHRoZSBldmVudCBpcyBmcm9tICdvbmxvYWQnLCBjaGVjayB0aGUgc2VlIGlmIHRoZSBpbWFnZSdzIHdpZHRoIGlzXG4gICAgICAgIC8vIDEgcGl4ZWwgKHdoaWNoIGluZGljaWF0ZXMgc3VwcG9ydCkuIG90aGVyd2lzZSwgaXQgZmFpbHNcblxuICAgICAgICB2YXIgcmVzdWx0ID0gZXZlbnQgJiYgZXZlbnQudHlwZSA9PT0gJ2xvYWQnID8gaW1hZ2Uud2lkdGggPT0gMSA6IGZhbHNlO1xuICAgICAgICB2YXIgYmFzZVRlc3QgPSBuYW1lID09PSAnd2VicCc7XG5cbiAgICAgICAgLyoganNoaW50IC1XMDUzICovXG4gICAgICAgIGFkZFRlc3QobmFtZSwgYmFzZVRlc3QgPyBuZXcgQm9vbGVhbihyZXN1bHQpIDogcmVzdWx0KTtcblxuICAgICAgICBpZiAoY2IpIHtcbiAgICAgICAgICBjYihldmVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaW1hZ2Uub25lcnJvciA9IGFkZFJlc3VsdDtcbiAgICAgIGltYWdlLm9ubG9hZCA9IGFkZFJlc3VsdDtcblxuICAgICAgaW1hZ2Uuc3JjID0gdXJpO1xuICAgIH1cblxuICAgIC8vIHRlc3QgZm9yIHdlYnAgc3VwcG9ydCBpbiBnZW5lcmFsXG4gICAgdGVzdCh3ZWJwLm5hbWUsIHdlYnAudXJpLCBmdW5jdGlvbihlKSB7XG4gICAgICAvLyBpZiB0aGUgd2VicCB0ZXN0IGxvYWRlZCwgdGVzdCBldmVyeXRoaW5nIGVsc2UuXG4gICAgICBpZiAoZSAmJiBlLnR5cGUgPT09ICdsb2FkJykge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdlYnBUZXN0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHRlc3Qod2VicFRlc3RzW2ldLm5hbWUsIHdlYnBUZXN0c1tpXS51cmkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cbiAgfSk7XG5cblxuIiwiLy8gbW9kZXJuaXpyICh3ZWJwIHN1cHBvcnQgY2hlY2sgb25seSlcbmltcG9ydCAnYnJvd3Nlcm5penIvdGVzdC9pbWcvd2VicCc7XG5pbXBvcnQgJ2Jyb3dzZXJuaXpyJztcblxuaW1wb3J0IG1haW5Nb2R1bGUgZnJvbSAnLi9tb2R1bGVzL21haW4nO1xuXG5tYWluTW9kdWxlLmluaXQoKTtcbiIsIiQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7XG5cdCQoJy5tYWluLWNhcm91c2VsJykuZmxpY2tpdHkoe1xuXHQgIC8vIG9wdGlvbnNcblx0ICBjZWxsQWxpZ246ICdsZWZ0Jyxcblx0ICBjb250YWluOiBmYWxzZSxcblx0ICBhdXRvUGxheTogNDAwMCxcblx0ICBpbml0aWFsSW5kZXg6IDAsXG5cdCAgYXJyb3dzOiB0cnVlXG5cdH0pO1xuXG5cdCQoJy5zbGljay1zbGlkZXInKS5zbGljayh7XG5cdCAgY2VudGVyTW9kZTogdHJ1ZSxcblx0ICBjZW50ZXJQYWRkaW5nOiAnNzBweCcsXG5cdCAgc2xpZGVzVG9TaG93OiAxLFxuXHQgIHJlc3BvbnNpdmU6IFtcblx0ICAgIHtcblx0ICAgICAgYnJlYWtwb2ludDogNzY4LFxuXHQgICAgICBzZXR0aW5nczoge1xuXHQgICAgICAgIGFycm93czogZmFsc2UsXG5cdCAgICAgICAgY2VudGVyTW9kZTogdHJ1ZSxcblx0ICAgICAgICBjZW50ZXJQYWRkaW5nOiAnNDBweCcsXG5cdCAgICAgICAgc2xpZGVzVG9TaG93OiAzXG5cdCAgICAgIH1cblx0ICAgIH0sXG5cdCAgICB7XG5cdCAgICAgIGJyZWFrcG9pbnQ6IDQ4MCxcblx0ICAgICAgc2V0dGluZ3M6IHtcblx0ICAgICAgICBhcnJvd3M6IGZhbHNlLFxuXHQgICAgICAgIGNlbnRlck1vZGU6IHRydWUsXG5cdCAgICAgICAgY2VudGVyUGFkZGluZzogJzQwcHgnLFxuXHQgICAgICAgIHNsaWRlc1RvU2hvdzogMVxuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgXVxuXHR9KTtcbn0pOyJdfQ==
