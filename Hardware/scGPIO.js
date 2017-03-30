//scGPIO.js

var Gpio = require('onoff').Gpio,
	MongoCycle = require("./scMongo.js"),

	speedometer = new Gpio(2, 'in', 'falling');

var coll;
var beginningMillis;
var lastTime;

var lastSpeeds;

var db;

var statsUpdateInterval;

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
			statsUpdateInterval = setInterval(function(){
				console.log("updating stats");
				recalculateStats(coll);
			}, 2000);
		});
		beginningMillis = Date.now();
		lastTime = beginningMillis;
		lastSpeeds = [0,0,0,0,0];
	},
	getCurrentRide : function(){
		return coll;
	},
	updateLocation : function(locationData){
		if(!coll)
		{
			module.exports.startRide();
		}
		var thisTime = Date.now();
		var time = thisTime - beginningMillis;
		time = time/1000;

		MongoCycle.addDataPoint(coll, MongoCycle.Sensor.location, time, locationData);
	},
	endRide : function(){
		coll = null;
		beginningMillis = 0;
		lastTime = 0;
		lastSpeeds = [0,0,0,0,0];
		idleSensors();

		clearInterval(statsUpdateInterval);
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

var dummyData = 5;

//USE THE DATA CALCULATION FUNCTIONS IN HERE.
function recalculateStats(coll){

	console.log(coll.collectionName);
	//Energy
	MongoCycle.updateStats(coll, "energy", "used", dummyData.toString());

	//Carbon
	MongoCycle.updateStats(coll, "carbon", "emissionsPrevented", 
		8887/21.6*lastSpeeds[lastSpeeds.length-1]*(Date.now()-beginningMillis)/1000/3600);

	//Speed
	averageSpeed(function(topSpeed,averageSpeed){
		MongoCycle.updateStats(coll, "speed", "average", averageSpeed);
		MongoCycle.updateStats(coll, "speed", "top", topSpeed);
	});

	//Distance
	MongoCycle.getStats(coll, function(doc){
		var avgSpd = parseInt(doc.speed.average, 10);
	});

	//Time
	MongoCycle.updateStats(coll, "time", "elapsed", ((Date.now() - beginningMillis)/1000/3600).toString());

	dummyData++;
}

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

				//milliseconds to seconds
				time = time/1000;

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

function averageSpeed(callback)
{
	MongoCycle.getDataPoints(coll, MongoCycle.Sensor.speedometer, 5000, function(docs){
		var totalSpeed = 0;
		var totalTime = 0;
		var topSpeed = 0;
		for(var i = 0; i < docs.length; i++)
		{
			if(docs[i].value > topSpeed)
			{
				topSpeed = docs[i].value;
			}
			totalSpeed += docs[i].value;
			totalTime += docs[i].time;
		}

		callback(topSpeed, Math.floor(totalSpeed/totalTime)); 
	});
}