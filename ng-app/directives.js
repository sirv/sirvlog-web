'use strict';

/* Directives */


angular.module('SirvLog.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }])
;