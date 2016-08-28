# smart-plug-power-monitor

This node.js package monitors the power usage of a TP-Link HS110 smart plug, to determine when a 120v appliance (such as a dishwasher) starts and stops.  smart-plug-power-monitor continuously polls the smart plug for the wattage, and when the wattage exceeds a configurable threshold (default is 1), IFTTT is notified that the appliance has started.  When the wattage drops back below the threshold for a time, IFTTT is notified that the appliance has completed.

## Example
```js
var SmartPlugPowerMonitor = require("smart-plug-power-monitor");

var smartPlugPowerMonitor = new SmartPlugPowerMonitor({
  smartPlugIP: "192.168.5.55",
  iftttMakerChannelKey: "yourIftttMakerKey"
});

smartPlugPowerMonitor.start();
```

##Custom Events

If you do not want to use IFTTT, you can omit the Maker key completely.  Just use the callbacks to respond to usage data and events.

The pollingCallback is called every poll interval with the following data:

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

## Instructions for Settings up an IFTTT recipe

### Connect the Maker channel
https://ifttt.com/maker

Paste the Maker key from that page into the constructor options, along with the smart plug's IP address as shown in the JavaScript example above.

### Create an IFTTT Recipe
The "IF" part of your recipe must be the Maker Channel.
* Trigger Channel = Maker
* Trigger = Receive a web request
* Event Name = ``appliance-completed``

The "DO" part of your recipe can be anything you want.  This example sends a push notification to your mobile when your dishwasher has finished, along with the elapsed time it took to clean the dishes.

* Action Channel = IF notifications
* Action = Send a notification
* Notification = Dishwasher completed in {{Value1}}

That recipe will result in a notification like "Dishwasher completed in 1hr 32m 03s" if you have the IFTTT app on your phone;

The `appliance-completed`` event sends two ingredients that you can use in your notification text.  Value1 is the pretty time, and Value2 is the elapsed milliseconds.

You can also create an additional recipe that is triggered by the ``appliance-started`` event, which does not contain any ingredients/values for use in notification text.

## All Options
Here are all the options you can change, showing the default values.
```js
var SmartPlugPowerMonitor = require("smart-plug-power-monitor");

var smartPlugPowerMonitor = new SmartPlugPowerMonitor({
  {
          iftttMakerChannelKey: "",//REQUIRED from https://ifttt.com/maker
          smartPlugIP: "", //REQUIRED example: "192.168.1.5"
          pollIntervalSeconds: 30, //how often to check wattage
          networkRetryIntervalSeconds: 120, //how often to poll if the smart plug IP address is not reachable
          startEventName: 'appliance-started', //IFTTT maker event name
          endEventName: 'appliance-completed', //IFTTT maker event name
          wattsThreshold: 10, //wattage above this value will trigger start event after startTimeWindowSeconds
          startTimeWindowSeconds: 30, //if wattage is exceeded for this duration, appliance is considered started
          endTimeWindowSeconds: 60, //if wattage is below threshold for this entire duration, appliance is considered completed running
          cooldownPeriodSeconds: 30, //wait this long after end event before responding to subsequent start events, set to same as poll interval if no cooldown is needed
          pollingCallback: (powerConsumption)=>{}, //returns the power consumption data on every polling interval
          eventCallback: (eventName, data)=>{} //called when appliance starts and stops
        }
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

A Node process manager, such as pm2, can be used to ensure this code is always running and monitoring your appliance's power usage, even if your computer restarts.
