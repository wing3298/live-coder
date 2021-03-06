module.exports = function (options) {
try{
    var io = require('socket.io').listen(options.http.createServer(options.server).listen(3000)),
        manager = new (require('./socket.io/manager'))(io);

    io.sockets.on('connection', function (client) {

        var user, name, viewing;

        client.on('message', function (msg) {
console.log('receive-message');
            var i, keys = Object.keys(msg);
            for (i = keys.length; i--;) {
                //all client send
//                client.json.emit(keys[i], msg[keys[i]]);
//                client.broadcast.json.emit(keys[i], msg[keys[i]]);
                io.sockets.json.emit('message', msg[keys[i]]);
//                io.sockets.json.emit(keys[i], msg[keys[i]]);
                //client.json.broadcast.emit(keys[i], msg[keys[i]]);
            }
        });

//cookie sample
//{ cookie: 
//   { originalMaxAge: null,
//     expires: null,
//     httpOnly: false,
//     path: '/' },
//  oauth: {},
//  user: { id: '50930f19d054498944000001', name: 'USERNAME' } 
//}

       client.on('auth', function (data) {
console.log('receive-auth');
            var parseCookie = require('cookie').parse(decodeURIComponent(data.auth.cookie));
                parseCookie = require("connect").utils.parseSignedCookies(parseCookie, options.server.get('secretKey'));
                sid = parseCookie[options.server.get('cookieSessionKey')];
console.log('sid- ' + sid);
            client.sessionId = sid;

            options.store.get(sid, function (err, session) {
                user = session.user;
                name = user ? user.name : 'guest#' + client.sessionId.substr(0, 5);
                if (data.edit) {
                    viewing = name;
                    manager.addToViewers(name, name, client.sessionId);
                    manager.addToEditors(user.name, client.sessionId);
                }
                client.json.emit('message', { name: name });
            });
        });

        client.on('view', function (target) {
console.log('view');
            viewing = target;
            manager.addToViewers(name, name, client.sessionId);
        });

        client.on('edit', function (edit) {
console.log('edit');
console.log(edit);
console.log('edit-user '+user);
            if (user) {
console.log('user-ok');
                manager.sendToViewers(user.name, edit);
                if (edit.save) {
console.log('save-ok');
                    delete edit.save;
                    options.model.update(
                        'users',
                        { _id: user.id },
                        { $set: edit },
                        function (err) {
                            if (err) {
                                console.err(err.message);
                            }
                        }
                    );
                }
            }
        });

        client.on('inquiry', function (kind) {
console.log('inquiry');
            if (kind.inquiry === 'code') {
                var id = editors[viewing].client;
                io.socket.sockets.socket(id).json.emit('message', { inquiry: 'code' });
                //io.clients[id].json.emit('message', { inquiry: 'code' });
            }
        });

        client.on('chat', function (message) {
            manager.sendToViewers(viewing, {
                chat: {
                    date: new Date().getTime(),
                    user: name,
                    message: message
                }
            });
        });

        client.on('disconnect', function () {
            manager.removeFromEditors(client.sessionId);
            manager.removeFromViewers(viewing, name, client.sessionId);
        });
    });
}catch(e){console.log(e)}
    return io;
};
