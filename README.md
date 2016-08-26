# SmartPlugIftttNotifier

A node module to monitor the power usage of a TP-Link HS110 smart switch, to determine when a 120v appliance (such as a dishwasher) starts and stops, by measuring if the appliance exceeds a user configurable wattage threshold.  Sends an event to the IFTTT maker channel when the appliance starts or stops, then IFTTT can take any action such as sending a notification to your phone.

The "appliance-completed" even also sends along the elapsed minutes as "value1", so you can include the amount of time it took for the appliance to run.
