//scGPIO.js

var Gpio = require('onoff').Gpio,
	MongoCycle = require("./scMongo.js"),

	speedometer = new Gpio(2, 'in', 'falling');

var db;
var beginningMillis;
var lastTime;

var lastSpeeds = [0,0,0,0,0];

MongoCycle.openMongo(function(database){
	db = database;

	MongoCycle.createRide(db, new Date(), 1, function(collection){

		beginningMillis = Date.now();
		lastTime = beginningMillis;

		speedometer.watch(function(err, value){
			if(err)
			{
				console.log("Error with the speedometer, GPIO pin 2");
			}
			else
			{
				//debouncing. If you got another tick in the last .1 seconds, disregard it.
				if(Date.now() - lastTime < 100)
				{
					return;
				}
				else
				{
					var thisTime = Date.now();
					var time = lastTime - beginningMillis;

					//We have a 26x1.75 wheel : Circumference = 2023 mm
					//speed = distance / time (mm/ms = meters / second)
					//2.23694 mi/h = 1 m/s
					var speed = (2023/(thisTime - lastTime))/2.23694;
					lastTime = thisTime;
					speed = updateSpeed(speed);

					console.log("Adding t: " + time + " v: " + speed + " to db");
					MongoCycle.addDataPoint(collection, MongoCycle.Sensor.speedometer, time, speed);
				}
			}
		})

	});
});

function updateSpeed(value){
	if(lastSpeeds.length > 5)
	{
		lastSpeeds.shift();
	}

	lastSpeeds.push(value);

	var calculate = 0;
	for(var i = lastSpeeds.length - 1; i >= 0; i--)
	{
		calculate += ((i+1)/5)*lastSpeeds[i];
	}	

	// (1/5 + 2/5 + 3/5 + 4/5 + 5/5) = 3
	calculate = calculate/3;

	return calculate;
}

process.on('SIGINT', function () {
  speedometer.unexport();
});
