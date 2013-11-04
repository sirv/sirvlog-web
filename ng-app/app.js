"use strict";

/* global angular */

// Declare app level module which depends on filters, and services
var app = angular.module('SirvLog', ['SirvLog.filters', 'SirvLog.services', 'SirvLog.directives', 'ui.bootstrap', 'json-pretty', 'flot', 'ui']).
    config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
        $routeProvider.
            when('/', {
                templateUrl: 'partials/logIndex'
            }).
            when('/message/:index/:id', {
                templateUrl: 'partials/messageView'
            })./*
            when('/streams/:stream', {
                template: '<ng-include src="templateUrl"></ng-include>',
                controller: function($scope, $routeParams){$scope.templateUrl = 'partials/streams/' + $routeParams.stream;}
            }).*/
            otherwise({
                redirectTo: '/'
            });
    }]);

app.value('ui.config', {
    date: {
        //firstDay: 1
    }
});
