//scGPIO.js

var Gpio = require('onoff').Gpio,
	MongoCycle = require("./scMongo.js"),

	speedometer = new Gpio(2, 'in', 'falling');

var coll;
var beginningMillis;
var lastTime;

var lastSpeeds;

var db;

//////////////////////////////////////////
//										//
//										//
// 			Exported Functions			//
//										//
//										//
//////////////////////////////////////////

module.exports = {
	init : function()
	{
		MongoCycle.openMongo(function(database){
			db = database;
			module.exports.endRide();
		});
	},
	startRide : function(){
		MongoCycle.createRide(db, new Date(), 1, function(collection){
			coll = collection;
			enableSensors();
		});
		beginningMillis = Date.now();
		lastTime = beginningMillis;
		lastSpeeds = [0,0,0,0,0];
	},
	endRide : function(){
		coll = null;
		beginningMillis = 0;
		lastTime = 0;
		lastSpeeds = [0,0,0,0,0];
		idleSensors();
	},
	exit : function()
	{
		speedometer.unexport();
		coll = null;
		db.close();
	}


}

//////////////////////////////////////////	
//////////////////////////////////////////

function enableSensors(){

	//Refresh whatever is currently used.
	speedometer.unwatchAll();
	// Watch speedometer pin
	speedometer.watch(function(err, value){
		if(err)
		{
			console.log("Error with speedometer, GPIO pin 2");
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
				MongoCycle.addDataPoint(coll, MongoCycle.Sensor.speedometer, time, speed);
			}
		}
	});
}

function idleSensors()
{
	speedometer.unwatchAll();
	//TO DO, keep one or two specific sensors on but repurpose them to potentially
	//start a new ride.
	speedometer.watch(function(err,value){
		//TO DO
	})
}

function updateSpeed(value){

	//Always keep the size of the array to 5.
	//pop the front off, add onto the back.
	lastSpeeds.shift();
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