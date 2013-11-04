'use strict';

/* Directives */

/* global angular */

angular.module('SirvLog.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm/*, attrs*/) {
      elm.text(version);
    };
  }])
;
