// http server
var express = require('express'),
    app = express(),
    sessionStore = new express.session.MemoryStore(),
    store = require('connect-mongodb'),
    http = require('http'),
    config = require('./conf/config.js'),
    partial = require('express-partials');

app.configure('development', function () {
    var development = require('./conf/development');
    Object.keys(development).forEach(function (key) {
        config[key] = development[key];
    });
});
app.configure('production', function () {
    // if NODE_ENV is production
    var production = require('./conf/production');
    Object.keys(production).forEach(function (key) {
        config[key] = production[key];
    });
});

app.configure(function () {
    app.use(express.logger());

//module.exports = require('ejs');
//exports.__express = function(filename, options, callback) {
//  callback(err, string);
//};

app.use(express.bodyParser());
app.set('secretKey', 'mySecret');
app.set('cookieSessionKey', 'sid');

    app.use(partial());
    app.use(express['static'](__dirname + '/public'));
    app.use(express.cookieParser(app.get('secretKey')));
    app.use(express.session({
        key : app.get('cookieSessionKey'),
        store: sessionStore,
//        secret: config.http.cookie_secret,
        cookie: { httpOnly: false }
    }));

    app.set('view engine', 'ejs');
    app.locals({
        port: config.http.back_port,
        jss: []
    });
    app.use(function(req, res, next){
        res.locals.session = req.session;
        res.locals.req = req;
next();
    });
//app.use(app.router);
});


// db
var model = (function () {
    var Model = require('./lib/model');
    return new Model(config.db);
}());

// routing
require('./lib/http')({
    app: app,
    model: model,
    config: config
});

model.open(function (err) {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }

//    var listen = app.listen(config.http.back_port, config.http.host);

    console.log('Server running at http://' + config.http.host + ':' + config.http.back_port + '/');

    // socket.io
    require('./lib/socket.io')({
        server: app,
        http: http,
        store: sessionStore,
        model: model
    });
});
