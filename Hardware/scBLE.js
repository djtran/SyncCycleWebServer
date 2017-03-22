//scBLE.js

// Using the bleno module
var bleno = require('bleno');

var rideManager;
var GPIOManager;

var name = "SyncCycle";

var notifyIndex = 0;
var statDoc = null;

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
                                GPIOManager.startRide();
                                case "ENDRIDE":
                                GPIOManager.endRide();

                            }

                            console.log("request " + data.toString("utf-8"));

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
                            var coll = GPIOManager.getCurrentRide();

                            if(coll)
                            {
                                callback(this.RESULT_SUCCESS, new Buffer(coll.collectionName.toString()));
                            }
                            else
                            {
                                callback(this.RESULT_SUCCESS, new Buffer(""));
                            }
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
                        
                        // If the client subscribes, we send out a message every .25 seconds
                        onSubscribe : function(maxValueSize, updateValueCallback) {
                            console.log("Device subscribed");
                            this.intervalId = setInterval(function(){

                                if(GPIOManager.getCurrentRide())
                                {
                                    this.GPIOManager.getCurrentRide().getStats(GPIOManager.getCurrentRide(), function(doc){
                                        statDoc = doc;
                                    });

                                    this.subIntervalId = setInterval(function(){
                                        switch(notifyIndex)
                                        {
                                            case 0:
                                            console.log("notifying energy used");
                                            updateValueCallback(new Buffer("energyUsed:" + statDoc.energy.used.toString()));
                                            break;

                                            case 1:
                                            console.log("notifying energy equivalent");
                                            updateValueCallback(new Buffer("energyEquiv:" + statDoc.energy.equivalent.toString()));
                                            break;

                                            case 2:
                                            console.log("notifying energy savings");
                                            updateValueCallback(new Buffer("energySav:" + statDoc.energy.savings.toString()));
                                            break;

                                            case 3:
                                            console.log("notifying carbon emissions");
                                            updateValueCallback(new Buffer("carbonEm:" + statDoc.carbon.emissionsPrevented.toString()));
                                            break;

                                            case 4:
                                            console.log("notifying avg speed");
                                            updateValueCallback(new Buffer("speedAvg:"+statDoc.speed.average.toString()));
                                            break;

                                            case 5:
                                            console.log("notifying top speed");
                                            updateValueCallback(new Buffer("speedTop:"+ statDoc.speed.top.toString()));
                                            break;

                                            case 6:
                                            console.log("notifying distance traveled");
                                            updateValueCallback(new Buffer("distanceTra:" + statDoc.distance.traveled.toString()));
                                            break;

                                            case 7:
                                            console.log("notifying time elapsed");
                                            updateValueCallback(new Buffer("timeEla:" + statDoc.time.elapsed.toString()));
                                            break;

                                            default:
                                            break;
                                        }
                                        notifyIndex += 1;
                                        notifyIndex = notifyIndex % 8;
                                        if(notifyIndex == 8)
                                        {
                                            notifyIndex = 0;
                                            clearInterval(this.subIntervalId);
                                        }
                                    }, 250);
                                }
                            }, 2000);
                        },

                        // If the client unsubscribes, we stop broadcasting the message
                        onUnsubscribe : function() {
                            console.log("Device unsubscribed");
                            clearInterval(this.subIntervalId);
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
        GPIOManager = rideMan.getGPIOManager();
    }
}
