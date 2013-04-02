var path = require('path');
var express = require('express');
var elastical = require('elastical');

var configFile = path.resolve(__dirname, 'config.js');

var optimist = require('optimist')
    .usage('Usage: $0 [options]')
    .default('config', configFile);

var argv = optimist.argv;

if(argv.help || argv.h) {
    optimist.showHelp();
    return;
}

var app = module.exports = express();

app.config = require(argv.config)(app);

app.requireAuth = app.options.requireAuth;

//generic config
app.configure(function(){
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret: 'sirvlog-web-topsecret' }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/static'));
    app.use(express.static(__dirname + '/ng-app'));
});

app.configure('development', function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    app.locals.pretty = true;
});

app.configure('production', function(){
    app.use(express.logger());
});

app.controllers = require('./controllers')(app);

app.elasticClient = new elastical.Client(app.config.elasticsearch.hostname, app.config.elasticsearch.options);

// this one should be in query params
app.elasticClient._SEARCH_PARAMS.push('ignore_indices');

require('./routes')(app);

// register exit handlers so that process.on('exit') works
var exitFunc = function(){
    console.log('\nShutting down..');
    process.exit(0);
}

process.on('SIGINT', exitFunc);
process.on('SIGTERM', exitFunc);

app.config.port = app.config.port || 3000;
app.listen(app.config.port);

console.log('Sirvlog-web app started on port', app.config.port);


