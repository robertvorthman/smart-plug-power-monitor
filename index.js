'use strict';

//TODO update documentation, kwh event data, ifttt ingredient, minRuntimeForCooldownSeconds
// add money estimate

const Hs100Api = require('hs100-api'); //Smart Plug, for monitoring power usage
const IFTTTmaker = require('node-ifttt-maker'); //IFTTT, for sending notifications

class SmartPlugPowerMonitor {
    constructor(options) {

        this.config = {
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
        };

        Object.assign(this.config, options);

        this.timer;
        this.applianceRunning = false;
        this.elapsedRuntime = 0;
        this.overWattsThresholdStartTime;
        this.underWattsThresholdStartTime;
        this.startKwh;

        this.lastEndTime;


        //check for required options
        this.valid = true;
        if (!this.config.smartPlugIP || typeof this.config.smartPlugIP !== 'string') {
          this.valid = false;
          throw new Error('smartPlugIP (string) is missing from options.  Provide the IP Address of your TP-Link HS110.');
        }else{
          this.smartPlug = new Hs100Api({host: this.config.smartPlugIP});
        }

        if (this.config.iftttMakerChannelKey && typeof this.config.iftttMakerChannelKey == 'string') {
          this.iftttMakerChannel = new IFTTTmaker(this.config.iftttMakerChannelKey);
        }
    }

    start(){
      if(!this.valid){
        throw new Error('Unable to start listening due to invalid configuration options.');
      }else{
        this.poll();

      }
    }

    stop(){
    }

    poll(){
      let self = this;
      try{
        this.smartPlug.getConsumption()
          .then(function(smartPlugData){
            let consumptionData = smartPlugData.get_realtime;
            consumptionData.timestamp = new Date().getTime();
            self.config.pollingCallback(consumptionData);
            self.evaluatePowerUsage(consumptionData);
          })
          .catch(function(err){
            //smart plug unreachable
            self.config.eventCallback('Smart plug IP address unreachable', err);
            self.timer = setTimeout(()=>{self.poll()}, self.config.networkRetryIntervalSeconds*1000);
          });
      } catch(e){
        self.config.eventCallback('Error connecting to switch', e);
      }

    }

    evaluatePowerUsage(consumptionData){

      var wattage = consumptionData.power;

      var now = new Date();
      var applianceJustFinished = false;
      //if above wattage threshold
      if(wattage > this.config.wattsThreshold){
        //reset under watts time
        this.underWattsThresholdStartTime = null;
        //record start time of watts exceeded
        if(!this.overWattsThresholdStartTime){
          this.overWattsThresholdStartTime = new Date();
          this.startKwh = consumptionData.total;
        }



        this.elapsedRuntime = now - this.overWattsThresholdStartTime;

        //detect if appliance running for longer than start time window
        if(!this.applianceRunning && this.elapsedRuntime > this.config.startTimeWindowSeconds * 1000){
          //appliance started
          this.applianceRunning = true;
          this.sendNotification(this.config.startEventName);
        }

      }else if(this.applianceRunning){
        //below watts threshold and appliance running
        if(!this.underWattsThresholdStartTime){
          this.underWattsThresholdStartTime = new Date();
        }

        //elapsed time of watts not exceeded
        var elapsed = now - this.underWattsThresholdStartTime;
        if(elapsed > this.config.endTimeWindowSeconds * 1000){
          //appliance completed
          this.applianceRunning = false;
          var runtime = this.underWattsThresholdStartTime - this.overWattsThresholdStartTime;
          var kwh = consumptionData.total - this.startKwh;
          this.sendNotification(this.config.endEventName, {
            runtime: runtime,
            kwh: kwh,
            cost: kwh * this.config.kwhPrice
          });
          this.lastEndTime = now;
          //reset start time
          this.overWattsThresholdStartTime = null;
        }

      }

      if(this.lastEndTime == now && runtime > this.config.minRuntimeForCooldownSeconds){
        //if appliance running just ended, poll wattage after cooldown period
        setTimeout(()=>{this.poll()}, this.config.cooldownPeriodSeconds*1000);
      }else{
        //otherwise poll at usual polling interval
        setTimeout(()=>{this.poll()}, this.config.pollIntervalSeconds*1000);
      }

    }

    sendNotification(eventName, data){
      this.config.eventCallback(eventName, data);


      var self = this;

      if(this.iftttMakerChannel){

        var params = {};

        if(data && typeof data.runtime != 'undefined'){
          params.value1 = this.toPrettyTime(data.runtime);
          params.value2 = data.kwh;
          params.value3 = "$"+data.cost.toFixed(2);
        }

        this.iftttMakerChannel.request({
            event: eventName,
            method: 'GET',
            params: params
        }, function (err) {
            if (err) {
              self.config.eventCallback('Failed to send IFTTT notification', err);
            } else {
              //Sent IFTTT notification
            }
        });
      }



    }

    toPrettyTime(milliseconds) {
      var seconds = milliseconds/1000;
      var h = Math.floor(seconds / 3600);
      var m = Math.floor(seconds % 3600 / 60);
      var s = Math.floor(seconds % 3600 % 60);
      var prettyString = ((h > 0 ? h + "hr " + (m < 10 ? "0" : "") : "") + m + "m";
      if(h == 0) //add seconds if less than 1 hour
        prettyString += " "+ (s < 10 ? "0" : "") + s+"s");

      return prettyString;
    }

}



module.exports = SmartPlugPowerMonitor;
