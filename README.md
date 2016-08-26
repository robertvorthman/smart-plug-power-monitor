# watts-monitor

A node module to monitor the power usage of a HS-110 smart switch, to determine when a 120v appliance (such as a dishwasher) starts and stops, by measuring if the appliance exceeds a user configurable wattage threshold.  Sends an event to the IFTTT maker channel when the appliance starts or stops, then IFTTT can take any action such as sending a notification to your phone.

Sends elapsed minutes as value1 along with the appliance-completed IFTTT Maker event.
