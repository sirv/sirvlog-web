'use strict';

/* Services */


angular.module('SirvLog.services', ['ngResource']).
    factory('Logs', function ($resource) {
        return $resource('/api/logs', {}, {
            load: {
                method: 'POST',
                isArray: false
            }
        });
    }).
    factory('Message', function ($resource) {
        return $resource('/api/message', {}, {
            load: {
                method: 'POST',
                isArray: false
            }
        });
    }).
    factory('ConfigSearches', function ($resource) {
        return $resource('/api/searches', {});
    }).
    value('version', '0.1');