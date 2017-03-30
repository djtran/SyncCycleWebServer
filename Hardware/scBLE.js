//scBLE.js

// Using the bleno module
var bleno = require('bleno');
var mongoCycle = require("./scMongo");  //only used once, but we need it to get stats. or move that function to scGPIO, but thats another time.

var rideManager;
var GPIOManager;

var name = "SyncCycle";
var serviceUUID = '12ab';

var notifyIndex = 0;
var statDoc = null;

// Once bleno starts, begin advertising our BLE address
bleno.on('stateChange', function(state) {
    console.log('Bleno state change: ' + state);

    if (state === 'poweredOn') {
        bleno.startAdvertising(name,[serviceUUID]);
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
                uuid : serviceUUID,
                characteristics : [

                    ////////////
                    // request - Writable
                    //
                    //  Ex: StartRide, GetRide, EndRide 
                    ////////////

                    new bleno.Characteristic({
                        uuid : '28545278768c471993afc5294aaaaaa0',
                        properties : ["write",  "writeWithoutResponse"],

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
                        uuid : '28545278768c471993afc5294bbbbbb0',
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
                        uuid : '28545278768c471993afc5294aaaaaa2',
                        properties : ["write", "writeWithoutResponse"],

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
                        uuid : '28545278768c471993afc5294cccccc4',
                        properties : ["read"],
                        
                        // If the client subscribes, we send out a message every n
                        onReadRequest : function(offset, callback) {
                            console.log("Device subscribe read");
                            if(notifyIndex == null)
                            {
                                notifyIndex = 0;
                            }
                            if(GPIOManager.getCurrentRide())
                            {
                                if(statDoc)
                                {
                                    switch(notifyIndex)
                                    {
                                        case 0:
                                        console.log("notifying energy used");
                                        callback(this.RESULT_SUCCESS, new Buffer("energyUsed:" + statDoc.energy.used.toString()));
                                        break;

                                        case 1:
                                        console.log("notifying energy equivalent");
                                        callback(this.RESULT_SUCCESS, new Buffer("energyEquiv:" + statDoc.energy.equivalent.toString()));
                                        break;

                                        case 2:
                                        console.log("notifying energy savings");
                                        callback(this.RESULT_SUCCESS, new Buffer("energySav:" + statDoc.energy.savings.toString()));
                                        break;

                                        case 3:
                                        console.log("notifying carbon emissions");
                                        callback(this.RESULT_SUCCESS, new Buffer("carbonEm:" + statDoc.carbon.emissionsPrevented.toString()));
                                        break;

                                        case 4:
                                        console.log("notifying avg speed");
                                        callback(this.RESULT_SUCCESS, new Buffer("speedAvg:"+statDoc.speed.average.toString()));
                                        break;

                                        case 5:
                                        console.log("notifying top speed");
                                        callback(this.RESULT_SUCCESS, new Buffer("speedTop:"+ statDoc.speed.top.toString()));
                                        break;

                                        case 6:
                                        console.log("notifying distance traveled");
                                        callback(this.RESULT_SUCCESS, new Buffer("distanceTra:" + statDoc.distance.traveled.toString()));
                                        break;

                                        case 7:
                                        console.log("notifying time elapsed");
                                        callback(this.RESULT_SUCCESS, new Buffer("timeEla:" + statDoc.time.elapsed.toString()));
                                        break;

                                        default:
                                        break;
                                    }
                                }

                                mongoCycle.getStats(GPIOManager.getCurrentRide(), function(doc){
                                    statDoc = doc;
                                });
                                notifyIndex++;
                                notifyIndex = notifyIndex % 8;
                            }
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
