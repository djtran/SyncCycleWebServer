//scBLE.js
/**
 * Simple bleno echo server
 * Author: Shawn Hymel
 * Date: November 22, 2015
 *
 * Creates a Bluetooth Low Energy device using bleno and offers one service
 * with one characteristic. Users can use a BLE test app to read, write, and
 * subscribe to that characteristic. Writing changes the characteristic's
 * value, reading returns that value, and subscribing results in a string
 * message every 1 second.
 *
 * This example is Beerware (https://en.wikipedia.org/wiki/Beerware).
 */
 
// Using the bleno module
var bleno = require('bleno');
var mongoCycle = require("./scMongo");

var rideManager;
var GPIOManager;

var name = "SyncCycle";

var notifyIndex = 0;
 
// Once bleno starts, begin advertising our BLE address
bleno.on('stateChange', function(state) {
    console.log('Bleno state change: ' + state);

    if (state === 'poweredOn') {
        bleno.startAdvertising(name,['12ab']);
    } else {
        bleno.stopAdvertising();
    }
});
 
// Notify the console that we've accepted a connection
bleno.on('accept', function(clientAddress) {
    console.log("Accepted connection from address: " + clientAddress);
    rideManager.changeState(rideManager.State.Connected);
});
 
// Notify the console that we have disconnected from a client
bleno.on('disconnect', function(clientAddress) {
    console.log("Disconnected from address: " + clientAddress);
    rideManager.changeState(rideManager.State.FreeRide);
});
 
// When we begin advertising, create a new service and characteristic
bleno.on('advertisingStart', function(error) {
    if (error) {
        console.log("Advertising start error:" + error);
    } else {
        console.log("Advertising start success");
        bleno.setServices([
            
            // Define a new service
            new bleno.PrimaryService({
                uuid : '12ab',
                characteristics : [
                    
                    ////////////
                    // request - Writable
                    //
                    //  Ex: StartRide, GetRide, EndRide 
                    ////////////

                    new bleno.Characteristic({
                        uuid : 'aaa0',
                        properties : ["write"],

                        onWriteRequest : function(data, offset, withoutResponse, callback){
                            
                            switch(data.toString().toUpperCase()){
                                case "STARTRIDE":

                                case "ENDRIDE":

                            }

                            console.log("request" + data.toString("utf-8"));


                            callback(this.RESULT_SUCCESS);
                        }
                    }),

                    ////////////
                    // currentRide - Readable to get current ride
                    ////////////

                    new bleno.Characteristic({
                        uuid : 'bbb0',
                        properties : ["read"],

                        onReadRequest : function(offset, callback){
                            console.log("Read currentRide request");
                            callback(this.RESULT_SUCCESS, new Buffer(rideManager.getRide())); // if empty, then the app will handle that.
                        }
                    }),

                    ////////////
                    // Location - Writable
                    //
                    // Ex: "X-Y-Z" coordinates
                    ////////////
                    new bleno.Characteristic({
                        uuid : 'aaa2',
                        properties : ["write"],

                        onWriteRequest : function(data, offset, withoutResponse, callback)
                        {
                            console.log("Location: " + data.toString("utf-8"));

                            if(GPIOManager.getCurrentRide())
                            {
                                GPIOManager.updateLocation(data.toString("utf-8"));
                            }
                        }
                    }),

                    ////////////
                    // rideDataStream- Subscribable - notify every 1 second
                    //
                    // Will be a stream of "'property':'value'" strings
                    ////////////

                    // Define a new characteristic within that service
                    new bleno.Characteristic({
                        value : null,
                        uuid : 'ccc0',
                        properties : ['notify'],
                        
                        // If the client subscribes, we send out a message every 1 second
                        onSubscribe : function(maxValueSize, updateValueCallback) {
                            console.log("Device subscribed");
                            this.intervalId = setInterval(function() {

                                if(GPIOManager.getCurrentRide())
                                {
                                    mongoCycle.getStats(GPIOManager.getCurrentRide(), function(statDoc){
                                        switch(notifyIndex)
                                        {
                                            case 0:
                                                console.log("notifying energy used");
                                                updateValueCallback(new Buffer("energyUsed:" + statDoc.energy.used.toString("utf-8")));
                                                break;

                                            case 1:
                                                console.log("notifying energy equivalent");
                                                updateValueCallback(new Buffer("energyEquiv:" + statDoc.energy.equivalent.toString("utf-8")));
                                                break;

                                            case 2:
                                                console.log("notifying energy savings");
                                                updateValueCallback(new Buffer("energySav:" + statDoc.energy.savings.toString("utf-8")));
                                                break;
                                        }
                                        notifyIndex += 1;
                                        notifyIndex = notifyIndex % 3;
                                    });
                                }
                            }, 1000);
                        },
                        
                        // If the client unsubscribes, we stop broadcasting the message
                        onUnsubscribe : function() {
                            console.log("Device unsubscribed");
                            clearInterval(this.intervalId);
                        },
 
                    })
                    
                ]
            })
        ]);
    }
});

module.exports = {
    starter : function(rideMan)
    {
        rideManager = rideMan;
        GPIOManager = rideManager.getGPIOManager();
    }
}