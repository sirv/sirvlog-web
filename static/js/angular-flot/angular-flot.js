// oleksiy krivoshey

angular.module('flot', []).

    directive('flot', [function() {


        var directiveDefinitionObject = {
            priority: 0,
            template: '<div></div>',
            replace: true,
            transclude: false,
            restrict: 'EA',
            scope: {
                data: '=',
                options: '=',
                selectedRange: '=',
                lockCrosshairPos: '=',
                position: '=',
                item: '='
            },

            link: function (scope, iElement, iAttrs) {

                var plot = null;

                iElement.bind("plotclick", function (event, pos, item) {
                    scope.$apply(function(scope){
                        if(scope.position !== undefined){
                            scope.position = pos;
                        }
                        if(item && scope.item !== undefined){
                            scope.item = item;
                        }
                    })
                });

                iElement.bind("plotselected", function (event, ranges) {
                    scope.$apply(function(scope){
                        if(scope.selectedRange !== undefined){
                            scope.selectedRange = ranges;
                        }
                    });
                });

                iElement.bind("plotunselected", function (event) {
                    scope.$apply(function(scope){
                        if(scope.selectedRange !== undefined){
                            scope.selectedRange = null;
                        }
                    });
                });

                scope.$watch('lockCrosshairPos', function(cur, old){
                    if(plot && cur){
                        plot.lockCrosshair(cur);
                    }
                })

                scope.$parent.$on(iAttrs.drawEvent || 'flot.redraw', function(e){
                    plot = $.plot(iElement, scope.data, scope.options);
                })
            }
        };

        return directiveDefinitionObject;
    }]);