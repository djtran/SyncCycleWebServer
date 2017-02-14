//scGPIO.js

var gpio = require('onoff').Gpio,
	MongoCycle = require("./scMongo.js"),

	speedometer = new Gpio(2, 'in'),
	out = new Gpio(3, 'out');

var db;
var beginningMillis;

MongoCycle.openMongo(function(database){
	db = database;

	MongoCycle.createRide(db, new Date(), 1, function(collection){

		beginningMillis = new Date().now().getTime();

		speedometer.watch(function(err, value){
			if(err)
			{
				console.log("Error with the speedometer, GPIO pin 2");
			}
			else
			{
				var time = new Date().now().getTime() - beginningMillis;
				MongoCycle.addDataPoint(collection, MongoCycle.Sensor.speedometer, time, value);
			}
		})

	});
});


process.on('SIGINT', function () {
  speedometer.export();
});