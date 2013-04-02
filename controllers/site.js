module.exports = function(app){

    return {
        index: function(req, res){

            //render the index page
            res.render('index', {
                title: 'Sirvlog',
                page: 'index'
            });

        },

        partials: function(req, res){

            var name = req.params.name;
            res.render('partials/' + name);
        }
    }
}

