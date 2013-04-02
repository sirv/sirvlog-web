module.exports = function(app){

    app.get('/', app.controllers.site.index);

    app.get('/partials/:name', app.controllers.site.partials);

    app.post('/api/logs', app.controllers.api.logs);
    app.post('/api/message', app.controllers.api.message);
    app.get('/api/searches', app.controllers.api.searches);

}