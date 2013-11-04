'use strict';

/* Filters */

/* global angular */

angular.module('SirvLog.filters', []).
    filter('loglevelname', function() {
        return function(level) {
            if(level === undefined) {return; }
            switch(level){
                case 7:
                    return 'debug';
                case 6:
                    return 'info';
                case 5:
                    return 'notice';
                case 4:
                    return 'warning';
                case 3:
                    return 'error';
                case 2:
                    return 'critical';
                case 1:
                    return 'alert';
                case 0:
                    return 'emergency';
            }
            return level.toUpperCase();
        }
    }).
    filter('datetime', function() {
        return function(timestamp, iso) {
            if(timestamp === undefined) {return;}
            if(iso){
                return new Date(timestamp).toISOString();
            }
            return new Date(timestamp).toString();
        }
    })
    ;
