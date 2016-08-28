var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

io.on('connection', function(socket) {
    //recieve data from smart plug node.js script
    socket.on('smart plug data', function(msg) {
        //send data to graph
        io.emit('graph data', msg);
    });
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/graph.html');
});

http.listen(3000, function() {
    console.log('Node Express Webserver Started, open http://localhost:3000');
});
