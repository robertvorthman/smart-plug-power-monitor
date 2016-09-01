var SmartPlugPowerMonitor = require("../../index.js");

var smartPlugPowerMonitor = new SmartPlugPowerMonitor({
  smartPlugIP: "192.168.1.5",
  pollIntervalSeconds: 1,
  startTimeWindowSeconds: 2,
  endTimeWindowSeconds: 2,
  pollingCallback: pollingData,
  eventCallback: eventData
});

function pollingData(usage){
  console.log(usage.power);
}

function eventData(event, data){
  console.log(event, data);
}

smartPlugPowerMonitor.start();
