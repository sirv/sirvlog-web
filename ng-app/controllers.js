
app.controller('MenuCtrl', function($scope, $location, ConfigSearches, $dialog) {

    var MenuCtrl = function(){
        $scope.location = $location;

        $scope.searchLink = function(id){

            var searchFormParams = $scope.searches[id].query.match(/{{(.+?)}}/g)

            if(searchFormParams){

                searchFormParams = _.map(searchFormParams, function(match){
                    return match.match(/{{(.+?)}}/)[1];
                });

                $dialog.dialog({
                    backdrop: false,
                    keyboard: true,
                    backdropClick: true,
                    templateUrl: 'partials/searchFormDialog',
                    controller: 'SearchFormDialogCtrl',
                    resolve: {
                        params: function(){ return searchFormParams; },
                        values: function() { return $scope.searches[id].values; }
                    }
                }).open().then(function(result){
                        if(result){
                            var query = $scope.searches[id].query;

                            $scope.searches[id].values = result.values;

                            _.each(searchFormParams, function(param){
                                query = query.replace('{{' + param + '}}', result.values[param] || '')
                            })

                            $location.search({q: window.btoa(unescape(encodeURIComponent( angular.toJson({
                                searchQuery: query
                            }))))});
                        }

                    }.bind(this));
            } else {

                $location.search({q: window.btoa(unescape(encodeURIComponent( angular.toJson({
                    searchQuery: $scope.searches[id].query
                }))))});
            }

            return false;
        }

        $scope.searches = ConfigSearches.query();
    }

    return new MenuCtrl;
});

app.controller('SearchFormDialogCtrl', function($scope, $routeParams, dialog, params, values) {

    var SearchFormDialogCtrl = function(){

        // we need to play with css position a bit
        dialog.modalEl.css({
            position: 'absolute'
        }).draggable({
                handle: ".modal-header"
            }).css({
                position: 'fixed'
            });

        $scope.params = params;

        if(!values){
            $scope.values = {};

            _.each(params, function(p){
                $scope.values[p] = null;
            })
        } else {
            $scope.values = values;
        }

        $scope.close = function(result){
            if(result){
                dialog.close($scope);
            } else {
                dialog.close();
            }
        };
    }

    return new SearchFormDialogCtrl;
});

app.controller('LogsViewCtrl', function($scope, $rootScope, Logs, $dialog, $filter, $location) {

    var LogsViewCtrl = function(){

        this.searchTimeout = null;

        var query = {};
        try {
            query = angular.fromJson(decodeURIComponent(escape(window.atob( $location.search()['q'] ))));
        } catch(e){}

        $scope.searchParams = $.extend(true, {}, $scope.searchParams, {
            searchQuery: null,
            timeRange: {
                from: Math.floor((Date.now() - 1000 * 3600 * 24 * 7)/1000)*1000,
                to: Math.ceil(Date.now()/1000)*1000
            },
            pager: {
                limits: [25, 50, 100],
                pagesTotal: 0,
                limit: 25,
                curPage: 1
            },
            includeFacets: true
        }, query);

        $rootScope.subTitle = ': logs';

        $scope.processing =  false;

        // bind some methods to scope
        [
            'setScopeTimeRange',
            'validateScopeTimeRange',
            'applyScopeTimeRange',
            'applyScopeTimeRangeHistoryEntry',
            'update',
            'refresh',
            'showMessageSource',
            'getViewLink',
            'scrollToFlotPosition',
            'viewPermalink'
        ].forEach(function(f){
            $scope[f] = angular.bind(this, this[f]);
        }.bind(this))

        // watch scope updates
        $scope.$watch('searchParams.searchQuery', function(cur, old){
            clearTimeout(this.searchTimeout);
            if(cur != old){
                $scope.searchParams = $.extend(true, $scope.searchParams, {
                    //searchQuery: cur,
                    includeFacets: true,
                    pager: {
                        curPage: 1
                    }
                });
                this.searchTimeout = setTimeout(this.update.bind(this), 500);
            }
        }.bind(this));

        $scope.$watch('searchParams.pager.curPage', function(cur, old){
            if(cur != old) {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(this.update.bind(this), 100);
            }
        }.bind(this));

        $scope.$watch('searchParams.pager.limit', function(cur, old){
            if(cur != old) {
                $scope.searchParams.pager.curPage = 1; //$scope.pager.curPage / (cur/old);
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(this.update.bind(this), 100);
            }
        }.bind(this));

        this.setScopeTimeRange();

        this.setupFlot();

        this.update();
    }

    LogsViewCtrl.prototype.viewPermalink = function(){

        return '#?q=' + window.btoa(unescape(encodeURIComponent( angular.toJson($.extend($scope.searchParams, {includeFacets: true})) )));
    }

    LogsViewCtrl.prototype.scrollToFlotPosition = function(){

        if($scope.flot && $scope.flot.position && $scope.flot.position.x && this.facets && this.facets.messages && this.facets.messages.entries){
            var count = _.reduce(this.facets.messages.entries, function(memo, entry){
                if(entry.key > $scope.flot.position.x){
                    return memo + entry.count;
                }
                return memo;
            }, 0)

            //console.log(Math.ceil(count/$scope.searchParams.pager.limit));

            $scope.searchParams.pager.curPage = Math.ceil(count/$scope.searchParams.pager.limit);
        }

    }

    LogsViewCtrl.prototype.setupFlot = function(){
        $scope.flot = {
            options: {
                legend: {
                    position: 'nw'
                },
                xaxis: {
                    mode: "time",
                    timezone: "browser"
                },
                yaxis: {
                    show: true,
                    ticks: 1,
                    transform: function (v) { return Math.log(1+v); },
                    inverseTransform: function (v) { return Math.exp(v)-1; }
                },
                crosshair:{
                    mode: "x",
                    color: "black"
                },
                grid: {
                    backgroundColor: '#eee',
                    hoverable: true,
                    clickable: true
                },
                series: {
                    lines: {
                        show: true,
                        lineWidth: 1,
                        fill: false
                    }
                },
                selection: {
                    mode: "x"
                }
            },
            data: [{
                label: 'Errors',
                facetName: 'errors',
                color: "red",
                data: null,
                points: {
                    show: false,
                    radius: 3,
                    zero: false
                },
                bars: {
                    show: true
                },
                lines: {
                    show: false
                }
            },{
                label: 'Warnings',
                facetName: 'warnings',
                color: "yellow",
                data: null,
                points: {
                    show: false,
                    radius: 3,
                    zero: false
                },
                bars: {
                    show: true
                },
                lines: {
                    show: false
                }
            },{
                label: 'Messages',
                facetName: 'messages',
                color: "blue",
                data: null
            }],
            position: null, // bindings
            range: null // bindings
        }

        $scope.$watch('flot.range', function(cur, old){
            if(cur){
                this.setScopeTimeRange(Math.round(cur.xaxis.from), Math.round(cur.xaxis.to));
            } else {
                this.setScopeTimeRange();
            }
        }.bind(this))
    }

    LogsViewCtrl.prototype.validateScopeTimeRange = function(){
        var reg = /^(\d{1,2}\/[a-z]{3})\/\d{2} \d{2}:\d{2}:\d{2}/i;

        ['from', 'to'].forEach(function(f){
            $scope.timeRange[f+'Error'] = isNaN(Date.parse($scope.timeRange[f]))
                || !reg.test($scope.timeRange[f])
        })
    }

    LogsViewCtrl.prototype.setScopeTimeRange = function(from, to){
        from = from || $scope.searchParams.timeRange.from;
        to = to || $scope.searchParams.timeRange.to;

        $scope.timeRange = {
            from: $filter('date')(from, 'dd/MMM/yy HH:mm:ss'),
            to: $filter('date')(to, 'dd/MMM/yy HH:mm:ss')
        }
    }

    LogsViewCtrl.prototype.applyScopeTimeRangeHistoryEntry = function(index){
        this.setScopeTimeRange($scope.timeRangeHistory[index].from, $scope.timeRangeHistory[index].to);
        this.applyScopeTimeRange();
        $scope.timeRangeHistoryPos = index;
    }


    LogsViewCtrl.prototype.applyScopeTimeRange = function(){

        $scope.timeRangeHistory = $scope.timeRangeHistory || [];
        //$scope.timeRangeHistoryPos = $scope.timeRangeHistoryPos || -1;

        var exists = _.find($scope.timeRangeHistory, function(obj){
            if(obj.from == $scope.searchParams.timeRange.from &&
                obj.to == $scope.searchParams.timeRange.to){
                return true;
            }

            return false;
        })

        if(!exists){
            $scope.timeRangeHistory.push({
                from: $scope.searchParams.timeRange.from,
                to: $scope.searchParams.timeRange.to
            });
        }

        $scope.timeRangeHistoryPos = $scope.timeRangeHistory.length;

        $scope.searchParams = $.extend(true, $scope.searchParams, {
            timeRange: {
                from: moment($scope.timeRange.from, 'DD/MMM/YY HH:mm:ss').valueOf(),
                to: moment($scope.timeRange.to, 'DD/MMM/YY HH:mm:ss').valueOf()
            },
            pager: {
                curPage: 1
            },
            includeFacets: true
        })

        this.setScopeTimeRange();

        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(this.update.bind(this), 100);
    }


    LogsViewCtrl.prototype.updateFlotData = function(facets){

        if(!facets) return;

        $scope.flot.data.forEach(function(serie, ind){

            var data = [];

            if(!facets[serie.facetName]) return;

            facets[serie.facetName].entries.forEach(function(d){
                data.push([d.key, d.count]);
            })

            $scope.flot.data[ind].data = data;
        })

        $scope.$emit('redrawFlot');
    }


    LogsViewCtrl.prototype.refresh = function(){
        $scope.searchParams = $.extend(true, $scope.searchParams, {
            timeRange: {
                from: (Date.now() - 1000 * 3600 * 24 * 7),
                to: Date.now()
            },
            pager: {
                curPage: 1
            },
            includeFacets: true
        });

        this.setScopeTimeRange();

        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(this.update.bind(this), 100);
    }

    LogsViewCtrl.prototype.update = function(){
        $scope.processing =  true;

        Logs.load($scope.searchParams, function(data){

            $scope.processing =  false;

            if(data.error){
                $scope.searchQueryError = true;
                return;
            }

            $scope.searchParams.includeFacets = false; // don't include facets any more (unless turned on when time range changes or searchQuery)

            $scope.searchQueryError = false;

            $scope.searchParams.pager.pagesTotal = Math.ceil(data.hits.total/$scope.searchParams.pager.limit);

            $scope.data = data;

            if(data.facets){
                this.facets = data.facets; // save facets
                this.updateFlotData(data.facets);
            }

            if(data.hits.total){
                $scope.flot.crosshairPos = {
                    x: (data.hits.hits[0]._source.timestamp + data.hits.hits[data.hits.hits.length-1]._source.timestamp)/2
                }
            }

        }.bind(this), function(err){
            //console.log('err', err);
        });
    }

    LogsViewCtrl.prototype.showMessageSource = function(index){

        $dialog.dialog({
            backdrop: false,
            keyboard: true,
            backdropClick: true,
            templateUrl: 'partials/messageViewDialog',
            controller: 'MessageViewDialogCtrl',
            resolve: {
                message: function(){ return $scope.data.hits.hits[index]; }
            }
        }).open();
    };

    return new LogsViewCtrl;

});


app.controller('MessageViewDialogCtrl', function($scope, $routeParams, dialog, message, $location) {

    var MessageViewDialogCtrl = function(){

        // we need to play with css position a bit
        dialog.modalEl.css({
            position: 'absolute'
        }).draggable({
            handle: ".modal-header"
        }).css({
            position: 'fixed'
        });

        $scope.interval = 5;

        $scope.filter = function(withFacility){
            var q = {
                searchQuery: withFacility?'facility:"'+$scope.message.facility+'"':null,
                timeRange: {
                    from: Math.floor($scope.message.timestamp/1000 - $scope.interval)*1000,
                    to: Math.ceil($scope.message.timestamp/1000 + $scope.interval)*1000
                }
            }

            $location.search({q: window.btoa(unescape(encodeURIComponent( angular.toJson(q))))});
        }

        $scope.message = message._source;
        $scope.messageId = message._id;
        $scope.messageIndex = message._index;

        $scope.close = function(result){
            dialog.close(result);
        };
    }

    return new MessageViewDialogCtrl;
});

app.controller('MessageViewCtrl', function($scope, $routeParams, Message, $rootScope) {

    var MessageViewCtrl = function(){

        Message.load($routeParams, function(data){

            $scope.message = data._source;
            // set page title
            $rootScope.subTitle = (': ' + data._source.facility + '@' + data._source.hostname +': ' + data._source.message).substr(0, 255);

        });
    }

    return new MessageViewCtrl;

});

