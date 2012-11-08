// hello.js
var HTTP = require('http');
HTTP.createServer(function(req, res){
  res.writeHead(200, {'Content-Type':'text/plain; charset=utf-8'});
  res.end('Hello World ! こんにちは！');
}).listen(3000);
console.log('Server running at http://hoge/');
