var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SmartPlugPowerMonitor = require("smart-plug-power-monitor");

var smartPlugPowerMonitor = new SmartPlugPowerMonitor({
    smartPlugIP: "192.168.1.63",
    pollIntervalSeconds: 1,
    pollingCallback: pollingData,
});

smartPlugPowerMonitor.start();

var graphSocket;
//create socket when client connects
io.on('connection', function(socket) {
    graphSocket = socket;
    graphSocket.emit('smart plug config', smartPlugPowerMonitor.config);
});

function pollingData(powerConsumption) {
  if(graphSocket) {
    graphSocket.emit('smart plug data', powerConsumption);
  }
}

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/graph.html');
});

http.listen(3000, function() {
    console.log('Node Express Webserver Started, open http://localhost:3000');
});
