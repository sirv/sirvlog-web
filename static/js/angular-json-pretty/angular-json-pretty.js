// oleksiy krivoshey

angular.module('json-pretty', []).

    directive('jsonpretty', [function() {

        // taken from https://github.com/RyanAmos/Pretty-JSON/blob/master/pretty_json.js
        var pretty = {
            "parse": function (member) {
                return this[(member == undefined) ? 'null' : member.constructor.name.toLowerCase()](member);
            },

            "null": function (value) {
                return this['value']('JSONPretty-null', 'null');
            },
            "array": function (value) {
                var results = '';
                for (var x = 0; x < value.length; x++) {
                    results += '<li>' + this['parse'](value[x]) + '</li>';
                }
                return '[ ' + ((results.length > 0) ? '<ul class="JSONPretty-array">' + results + '</ul>' : '') + ' ]';
            },
            "object": function (value) {
                var results = '';
                for (var member in value) {
                    results += '<li>' + this['value']('JSONPretty-name', member) + ': ' + this['parse'](value[member]) + '</li>';
                }
                return '{ ' + ((results.length > 0) ? '<ul class="JSONPretty-object">' + results + '</ul>' : '') + ' }';
            },
            "number": function (value) {
                return this['value']('JSONPretty-number', value);
            },
            "string": function (value) {
                return this['value']('JSONPretty-string', value);
            },
            "boolean": function (value) {
                return this['value']('JSONPretty-boolean', value);
            },

            "value": function (type, value) {
                if (/^(http|https):\/\/[^\s]+$/.test(value)) {
                    return this['value'](type, '<a href="' + value + '" target="_blank">' + value + '</a>');
                }
                return '<span class="' + type + '">' + value + '</span>';
            }
        };

        var directiveDefinitionObject = {
            priority: 0,
            template: '<div class="JSONPretty"></div>',
            replace: true,
            transclude: false,
            restrict: 'EA',
            scope: {
                object: '='
            },
            link: function (scope, iElement, iAttrs) {

                scope.$watch('object', function(object) {
                    if(object){
                        iElement.html(pretty.parse(object));
                    }
                });
            }
        };
        return directiveDefinitionObject;
    }]);