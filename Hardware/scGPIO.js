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
		idleSensors();
	},
	startRide : function(){
		MongoCycle.createRide(db, new Date(), 1, function(collection){
			coll = collection;
			enableSensors();
			statsUpdateInterval = setInterval(function(){
				console.log("updating stats");
				recalculateStats(coll);
			}, 2000);

			beginningMillis = Date.now();
			lastTime = beginningMillis;
			lastSpeeds = [0,0,0,0,0];
			timefuck = setTimeout(module.exports.endRide, 300000); //set timeout for 5 minutes
		});
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
		time = time/3600000;

		MongoCycle.addDataPoint(coll, MongoCycle.Sensor.location, time, locationData);
	},
	endRide : function(){
		coll = null;
		beginningMillis = 0;
		lastTime = 0;
		lastSpeeds = [0,0,0,0,0];
		idleSensors();

		clearInterval(statsUpdateInterval);
		console.log("ending ride...");
		timefuck = null;
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

//USE THE DATA CALCULATION FUNCTIONS IN HERE.
function recalculateStats(coll){

	try{
		if(!coll)
		{
			return;
		}
		console.log(coll.collectionName);

		MongoCycle.getStats(coll, function(statDoc){

			var deltaT = Date.now() - lastTime;
			//get actual sensors and then make this calculation proper.
			//Energy
			var bikeE = parseFloat(statDoc.speed.average) + .5*366/2.21*lastSpeeds[lastSpeeds.length-1]*lastSpeeds[lastSpeeds.length-1]*deltaT/3600000/1000;
			var carE = parseFloat(statDoc.speed.average) + .5*1710/2.21*lastSpeeds[lastSpeeds.length-1]*lastSpeeds[lastSpeeds.length-1]*deltaT/3600000/1000;
			MongoCycle.updateStats(coll, "energy", "used", bikeE);
			MongoCycle.updateStats(coll, "energy", "equivalent", carE);
			MongoCycle.updateStats(coll, "energy", "savings", carE-bikeE);
			//Carbon
			MongoCycle.updateStats(coll, "carbon", "emissionsPrevented",parseFloat(statDoc.carbon.emissionsPrevented) + 8887/21.6*lastSpeeds[lastSpeeds.length-1]*(deltaT)/3600000);

			//Speed
			averageSpeed(function(topSpeed,averageSpeed){
				MongoCycle.updateStats(coll, "speed", "average", averageSpeed);
				MongoCycle.updateStats(coll, "speed", "top", topSpeed);
				MongoCycle.updateStats(coll, "distance", "traveled", parseFloat(statDoc.distance.traveled) + lastSpeeds[lastSpeeds.length-1]*deltaT/60000);
			});

		//Time
		MongoCycle.updateStats(coll, "time", "elapsed", parseFloat(statDoc.time.elapsed) + deltaT/60000);
		});
	}
	catch(err)
	{
		console.log("recalculateStats error caught: " + err);
	}
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
				if (timefuck != null)
				{
					clearTimeout(timefuck);

				}
				timefuck = setTimeout(module.exports.endRide, 12000)//0)
				var thisTime = Date.now();
				var time = lastTime - beginningMillis;

				//We have a 26x1.75 wheel : Circumference = 2023 mm
				//speed = distance / time (mm/ms = meters / second)
				//2.23694 mi/h = 1 m/s
				var speed = (2023/(thisTime - lastTime))/2.23694;
				lastTime = thisTime;
				speed = updateSpeed(speed);

				//milliseconds to minutes
				time = time/60000;

				console.log("Adding t: " + time + " v: " + speed + " to db");
				MongoCycle.addDataPoint(coll, MongoCycle.Sensor.speedometer, time, speed);
			}
		}
	});
}
var timefuck;
var counter = 0;
function idleSensors()
{
	speedometer.unwatchAll();
	//TO DO, keep one or two specific sensors on but repurpose them to potentially
	//start a new ride.
	speedometer.watch(function(err,value){
		if(err)
		{
			console.log("Error with speedometer, GPIO pin 2");
		}
		else 
		{
			if(timefuck != null)
			{
				counter++;
				//console.log("fuck #" + counter.toString());
			}

			else
			{
				//console.log("new fuck");
				timefuck = setTimeout(function(){
					if(counter >= 3) {
						/*console.log("> 3 fucks");*/ 
						module.exports.startRide();
					} else {
						/*console.log("not enough fucks, why?");*/ 
					} 
					counter = 0;
					timefuck = null;
				}, 2500);

			}
		}

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
		var topSpeed = 0;
		if(docs.length < 1)
		{
			callback(0,0);
		}
		else
		{

			for(var i = 0; i < docs.length; i++)
			{
				if(docs[i].value > topSpeed)
				{
					topSpeed = docs[i].value;
				}
				totalSpeed += docs[i].value;
			}
			callback(topSpeed, totalSpeed/docs.length); 
		}
	});
}
