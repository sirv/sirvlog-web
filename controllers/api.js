//'b.c'.split('.').reduce(function(o, i){ return o[i] }, a)

var _ = require('underscore');
var async = require('async');
var util = require('util');

var app = null;

var getSearchIndexes = function (from, to) {

    var d7 = 1000*3600*24*7;
    var from = from || Date.now() - d7;
    var to = to || Date.now();

    var indexes = [];

    var indexNameForDate = function(ts){

        var d = new Date(ts);
        var m = d.getMonth() + 1;

        var indexName = app.config.elasticsearch.index.prefix + '-' + d.getFullYear() + '-' + (m < 10 ? ('0' + m) : m);

        if (/(weekly|daily)/.test(app.config.elasticsearch.index.rotate)) {
            if (app.config.elasticsearch.index.rotate == 'weekly') {
                d = new Date(d - ((d.getDay() + 6) % 7) * 24 * 60 * 60 * 1000); // get last Monday date
            }
            var day = d.getDate();
            indexName += '-' + (day < 10 ? ('0' + day) : day);
        }

        return indexName.replace(/-+/g, '-').toLowerCase();
    }

    //TODO: it will miss an index if 'from' will point at the exact hour when switching daylight saving time
    while(from < to){
        indexes.push(indexNameForDate(from))
        from += d7;
    }

    indexes.push(indexNameForDate(to))

    return _.uniq(indexes);
}

module.exports = function(_app){

    app = _app;

    return {
        logs: function(req, res){

            //console.log(req.body);

            var size = 25;
            if(req.body.pager && req.body.pager.limit){
                size = req.body.pager.limit;
            }

            var from = 0;
            if(req.body.pager && req.body.pager.curPage){
                from = size * (req.body.pager.curPage - 1)
            }

            var query = {
                "match_all": {}
            };

            var timeRange = req.body.timeRange || {
                from: Date.now() - 1000*3600*24*7
            }

            var indexes = getSearchIndexes(timeRange.from, timeRange.to)

            var histogramInterval = Math.ceil(((timeRange.to || Date.now()) - timeRange.from) / 500);

            //console.log('histogramInterval=', histogramInterval);

            var facets = {};

            if(req.body.includeFacets){
                facets = {
                    "errors": {
                        "histogram": {
                            "field": "timestamp",
                            "interval": histogramInterval
                        },
                        "facet_filter":{
                            "range":{
                                "level": { "lte": 3 }
                            }
                        }
                    },
                    "warnings": {
                        "histogram": {
                            "field": "timestamp",
                            "interval": histogramInterval
                        },
                        "facet_filter":{
                            "query":{
                                "field": {
                                    "level": 4
                                }
                            }
                        }
                    },
                    "messages": {
                        "histogram": {
                            "field": "timestamp",
                            "interval": histogramInterval
                        }
                    }
                }
            }

            if(req.body.searchQuery){
                query = {
                    "query_string": {
                        "lenient": true,
                        "query": req.body.searchQuery
                    }
                }
            }

            app.elasticClient.search({
                index: indexes,
                ignore_indices: 'missing',
                "query": {
                    "filtered":{
                        "query": query,
                        "filter" : {
                            "range" : {
                                "timestamp" : timeRange
                            }
                        }
                    }
                },
                "facets": facets,
                "sort": [
                    { "timestamp": "desc" },
                    { "order": {"order": "desc", "missing": "_first" } }
                ],
                "size": size,
                "from": from
            }, function(err, result, full){
                if(err){
                    if(err.message.indexOf('SearchPhaseExecutionException') == -1){
                        console.error(err);
                    }
                    console.error(err);
                    res.json({error: true});
                    return;
                }

                res.json(full);

            });

        },

        message: function(req, res){

            if(!req.body.id || !req.body.index){
                res.json({});
                return;
            }

            app.elasticClient.get(
                req.body.index,
                req.body.id,
                null,
                function(err, result, full){
                    if(err){
                        console.error(err);
                        res.json({});
                        return;
                    }

                    res.json(full);

                }
            );

        },

        searches: function(req, res){
            res.json(app.config.searches);
        }
    }
}

