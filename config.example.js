module.exports = function(app){

    return {

        port: 3000,

        requireAuth: false,

        elasticsearch: {
            hostname: '127.0.0.1',
            index: { // set the same values as in sirvlog config.js!
                prefix: 'sirvlog',
                rotate: 'weekly'
            },
            options: {
                port: 9200,
                protocol: 'http',
                timeout: 60000
            }
        },

        searches: [
            {
                name: 'All errors',
                query: 'level:[0 TO 3]'
            },
            {
                name: 'Warnings',
                query: 'level:4'
            },
            {
                name: 'Params Test',
                query: 'hostname:{{Hostname}} AND level:{{Level}}'
            }
        ]
    }

}