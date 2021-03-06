$(function () {

    var dmp = new diff_match_patch(),
        editor = new orion.textview.TextView({
            parent: 'code',
            model: new orion.textview.TextModel(),
            stylesheet: ['/css/code.css'],
            readonly: true
        }),
        pos = { top: 70, left: 25 };
    editor.setText('');
//    editor.addRuler(new Livecoder.LineNumberRuler(
//        "left",
//        { styleClass: "ruler_lines" },
//        { styleClass: "ruler_lines_odd" },
//        { styleClass: "ruler_lines_even" }
//    ));

try{
    var styler = new Livecoder.TextStyler(editor);
    $('#cursor').height(editor.getLineHeight());

    socket.on('message', function (msg) {

        if (msg.patch) {
            var patches = dmp.patch_fromText(msg.patch);
            var results = dmp.patch_apply(patches, editor.getText());
            // check results
            var i, flg = true;
            for (i = results[1].length; i--;) {
                if (! results[1][i]) {
                    flg = false;
                    break;
                }
            }
            if (flg) {
                editor.setText(results[0]);
            }
            else {
                socket.json.emit('inquiry', { inquiry: 'code' });
            }
        }
        if (msg.cursor) {
            var offset = editor.getModel().getLineStart(msg.cursor.row) + msg.cursor.col;
            var location = editor.getLocationAtOffset(offset);
            pos.top = 70 + location.y;
            pos.left = 25 + location.x;
            if (pos.top < $('#code').height() + editor.getLineHeight()) {
                $('#cursor').show().offset({
                    top: pos.top,
                    left: pos.left// + editor._clientDiv.scrollWidth
                });
            }
        }
        if (msg.code !== undefined) {
            editor.setText(msg.code);
        }
        if (msg.lang !== undefined) {
            if (msg.lang !== $('#lang').val()) {
                $.ajax({
                    url: '/data/lang/' + msg.lang + '.json',
                    dataType: 'json',
                    success: function (data) {
                        styler.changeLanguage(data);
                    }
                });
                $('#lang').val(msg.lang);
            }
        }
        if (msg.name) {
            var path = window.location.pathname;
            var target = path.match(/\/view\/([\w\.\-]+)/)[1];
            socket.json.emit('view', { view: target });
        }
    });

    socket.on('connect', function () {
        socket.json.emit('auth',{ auth: { cookie: document.cookie } });
//        socket.json.send({ auth: { cookie: document.cookie } });
    });
//    socket.connect();

    $('#message_form').submit(function () {
        var val = $('#message').val();
        if (val.length > 0) {
            socket.json.emit('chat', { chat: val });
        }
        $('#message').val('');
        return false;
    });
    $('#message').focus();

    setInterval(function () {
        var cursor = $('#cursor');
        if (cursor.css('display') === 'none') {
            if (pos.top < $('#code').height() + editor.getLineHeight()) {
                cursor.show().offset({
                    top: pos.top,
                    left: pos.left// + editor._clientDiv.scrollWidth
                });
            }
        }
        else {
            cursor.hide();
        }
    }, 500);

    var LS = new Livecoder.Socket(socket);
    LS.use(['chat', 'stat']);

    var LE = new Livecoder.Editor(editor);
    LE.use(['menu']);
}catch(e){alert(e)}
});
