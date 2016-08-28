var socket = require('socket.io-client')('http://localhost:3000');
var SmartPlugPowerMonitor = require("smart-plug-power-monitor");

//connect to smart plug
var smartPlugPowerMonitor = new SmartPlugPowerMonitor({
    smartPlugIP: "192.168.1.104",
    pollIntervalSeconds: 1,
    pollingCallback: pollingData,
});

smartPlugPowerMonitor.start();

function pollingData(powerConsumption) {
    socket.emit('smart plug data', powerConsumption);
}
