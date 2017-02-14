//scGPIO.js

var Gpio = require('onoff').Gpio,
	MongoCycle = require("./scMongo.js"),

	speedometer = new Gpio(2, 'in', 'falling');

var db;
var beginningMillis;

MongoCycle.openMongo(function(database){
	db = database;

	MongoCycle.createRide(db, new Date(), 1, function(collection){

		beginningMillis = Date.now();

		speedometer.watch(function(err, value){
			if(err)
			{
				console.log("Error with the speedometer, GPIO pin 2");
			}
			else
			{
				var time = Date.now() - beginningMillis;
				console.log("Adding t: " + time + " v: " + value + " to db");
				MongoCycle.addDataPoint(collection, MongoCycle.Sensor.speedometer, time, value);
			}
		})

	});
});


process.on('SIGINT', function () {
  speedometer.unexport();
});
