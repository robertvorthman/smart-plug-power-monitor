# SmartPlugIftttNotifier

This node.js package monitors the power usage of a TP-Link HS110 smart plug, to determine when a 120v appliance (such as a dishwasher) starts and stops.  SmartPlugIftttNotifier continuously polls the smart plug for the wattage, and when the wattage exceeds a configurable threshold (default is 10), IFTTT is notified that the appliance has started.  When the wattage drops back below the threshold for a time, IFTTT is notified that the appliance has completed.

You only need the IP address of your smart plug, and an IFTTT account.

## Example
```js
var SmartPlugIftttNotifier = require("smart-plug-ifttt-notifier");

var smartPlugIftttNotifier = new SmartPlugIftttNotifier({
  smartPlugIP: "192.168.5.55",
  iftttMakerChannelKey: "yourIftttMakerKey"
});

smartPlugIftttNotifier.start();
```
## Instructions for Settings up an IFTTT recipe

### Connect the Maker channel
https://ifttt.com/maker

Paste the Maker key from that page into the constructor options, along with the smart plug's IP address as shown in the example above.

### Create an IFTTT Recipe
IFTTT recipe that sends a push notification to your mobile when your appliance starts.

Trigger Channel = Maker
Trigger = Receive a web request
Event Name = appliance-started
Action Channel = IF notifications
Action = Send a notifications
Notification = Your appliance has started

Create a second recipe for the ``appliance-completed`` event, exactly the same as the recipe describe above except for the event name.  The ``appliance-completed`` event also sends the appliance usage duration to IFTTT as "Value1", so you can display it in your IFTTT notification body.
``Dishwasher completed in {{Value1}}`` will send a notification to your mobile like this: "Dishwasher completed in 1hr 32m 03s"  The Value2 ingredient contains the duration in milliseconds.

## Other Recommendations

### Static/Reserved IP Address
You should set your router to always give your smart plug the same IP address (Reserved DHCP), otherwise the script will break if the IP address of the smart plug changes.

### Running the process continuously

A Node process manager, such as pm2, can be used to ensure this code is always running and monitoring your appliance's power usage, even if your computer restarts.
