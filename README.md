# smart-plug-power-monitor

This node.js package monitors the power usage of a TP-Link HS110 smart plug, to determine when a 120v appliance (such as a dishwasher) starts and stops.  smart-plug-power-monitor continuously polls the smart plug for the wattage, and when the wattage exceeds a configurable threshold, IFTTT is notified that the appliance has started.  When the wattage drops back below the threshold for a time, IFTTT is notified that the appliance has completed.
![TP-Link HS110 Smart Plug](https://cloud.githubusercontent.com/assets/4665046/18059321/7974aba2-6de6-11e6-8acf-46f04b2fa43c.jpg)
![IFTTT Notification](https://cloud.githubusercontent.com/assets/4665046/18059320/7974923e-6de6-11e6-9271-22c954b55671.JPG)
## Example
```js
var SmartPlugPowerMonitor = require("smart-plug-power-monitor");

var smartPlugPowerMonitor = new SmartPlugPowerMonitor({
  smartPlugIP: "192.168.1.5",
  iftttMakerChannelKey: "yourIftttMakerKey"
});

smartPlugPowerMonitor.start();
```

##Custom Events

If you do not want to use IFTTT, you can omit the Maker key completely.  Just use the callbacks to respond to polling data and start/completed events.

The pollingCallback is called every poll interval and receives an object with the following power usage data:

```json
{
    "current": 0.128781,
    "voltage": 123.907939,
    "power": 8.986571,
    "total": 0.001,
    "err_code": 0,
    "timestamp": 1472345580826
}
```
See the example folder for an Express server which sends this data to a real-time graph using socket.io.
![Real-Time Graph](https://cloud.githubusercontent.com/assets/4665046/18059322/79785572-6de6-11e6-916a-8fb10c947526.gif)

```js
var smartPlugPowerMonitor = new SmartPlugPowerMonitor({
  smartPlugIP: "192.168.5.55",
  pollIntervalSeconds: 1,
  pollingCallback: function(powerConsumption){
    sendToRealtimeGraph(powerConsumption.power, powerConsumption.timestamp);
  }
});
smartPlugPowerMonitor.start();
```

The eventCallback is called when the appliance starts, stops or an error occurs.  Useful for logging appliance usage to a database or Google Sheets.

```js
var smartPlugPowerMonitor = new SmartPlugPowerMonitor({
  smartPlugIP: "192.168.5.55",
  eventCallback: function(eventName, data){
    logToDatabase(eventName, data);
  }
});
smartPlugPowerMonitor.start();
```
Possible values for `eventName` and `data`

 - appliance-started
	 - data = undefined
 - appliance-completed
	 - data = {runTime: milliseconds, kwh: number}
 - Failed to send IFTTT notification
	 - data = error object
 - Smart plug IP address unreachable
	 - data = error object
 - Error connecting to switch
	 - data = error object

## Instructions for Settings up an IFTTT recipe

### Connect the Maker channel
https://ifttt.com/maker

Paste the Maker key from that page into the constructor options, along with the smart plug's IP address as shown in the JavaScript example above.

### Create an IFTTT Recipe
The "IF" part of your recipe must be the Maker Channel.
* Trigger Channel = Maker
* Trigger = Receive a web request
* Event Name = ``appliance-completed``

The "DO" part of your recipe can be anything you want.  The example below sends a push notification to your mobile when your dishwasher has finished, along with the elapsed time it took to clean the dishes.

* Action Channel = IF notifications
* Action = Send a notification
* Notification = Dishwasher completed in {{Value1}}, used {{Value3}} kwh

If you have the IFTTT app on you phone, that recipe will result in a notification like "Dishwasher completed in 1hr 32m, used .858 kwh".

The `appliance-completed` event sends three ingredients that you can use in your notification text.

 - Value1 = run time pretty format, example "1hr 32m 03s"
 - Value2 = power usage in kilowatt hours
 - Value3 = estimated cost in $ based on electricity price `kwhPrice`

You can also create an additional recipe that is triggered by the ``appliance-started`` event, which does not contain any ingredients/values for use in notification text.

## All Options
Here are all the options you can change, showing the default values.
```js
var SmartPlugPowerMonitor = require("smart-plug-power-monitor");

var smartPlugPowerMonitor = new SmartPlugPowerMonitor({
          smartPlugIP: "", //REQUIRED example: "192.168.1.5"
          iftttMakerChannelKey: "", //from https://ifttt.com/maker
          pollIntervalSeconds: 30, //how often to check wattage
          networkRetryIntervalSeconds: 120, //how often to poll if the smart plug IP address is not reachable
          startEventName: 'appliance-started', //IFTTT maker event name
          endEventName: 'appliance-completed', //IFTTT maker event name
          wattsThreshold: 1, //wattage above this value will trigger start event after startTimeWindowSeconds
          startTimeWindowSeconds: 30, //if wattage is exceeded for this period, appliance is considered started
          endTimeWindowSeconds: 60, //if wattage is below threshold for this entire duration, appliance is considered completed running
          cooldownPeriodSeconds: 30, //wait this long after end event before responding to subsequent start events, set to same as poll interval if no cooldown is needed
          minRuntimeForCooldownSeconds: 10 * 60, //minimum runtime for cooldown period to engage.  If appliance ends earlier, start polling at usual interval after end instead of waiting for cooldown period
          kwhPrice: 0.12, //price of electricity, to calculate usage cost in IFTTT notification/event callback
          pollingCallback: (powerConsumption)=>{}, //returns the power consumption data on every polling interval
          eventCallback: (event, data)=>{} //called when appliance starts and stops
        });

smartPlugPowerMonitor.start();
```

## Calibrating/Logging
Use the pollingCallback and eventCallback to observe the behavior of your appliance.  The pollingCallback will fire at every pollingInterval and return the current watts to help you determine what your wattsThreshold should be.  Or you could send this information to a database or front-end visualization.  The eventCallback will fire when your appliance starts, completes or an error occurs.

### appliance-completed event fires too early
If you are getting notifications that your appliance completed before it has actually completed, increase the endTimeWindowSeconds to be longer than any period of dormancy in your appliance's power usage.

### events fire multiple times
If you are getting multiple started/completed notifications because of power usage that occurs after the endTimeWindowSeconds, increase the cooldownPeriodSeconds which will stop polling for appliance wattage for the cooldown period.

## Other Recommendations

### Static/Reserved IP Address
You should set your router to always give your smart plug the same IP address (Reserved DHCP), otherwise the script will break if the IP address of the smart plug changes.

### Running the process continuously

A Node process manager, such as [pm2](http://pm2.keymetrics.io/), can be used to ensure this code is always running and monitoring your appliance's power usage, even if your computer restarts.
