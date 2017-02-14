//scMongotest.js

var MongoCycle = require("./scMongo.js");

var db;

MongoCycle.openMongo(function(database){
	db = database;

	MongoCycle.createRide(db, new Date(), 1, function(collection)
	{
		console.log("Adding datapoints");
		MongoCycle.addDataPoint(collection,MongoCycle.Sensor.speedometer,0,0);
		MongoCycle.addDataPoint(collection,MongoCycle.Sensor.speedometer,0,0);
		MongoCycle.addDataPoint(collection,MongoCycle.Sensor.speedometer,1,1);
		MongoCycle.addDataPoint(collection,MongoCycle.Sensor.speedometer,2,2);
		MongoCycle.addDataPoint(collection,MongoCycle.Sensor.speedometer,3,1);
		MongoCycle.addDataPoint(collection,MongoCycle.Sensor.speedometer,4,3);
		MongoCycle.addDataPoint(collection,MongoCycle.Sensor.speedometer,0,0);


		console.log("Updating stats");
		MongoCycle.updateStats(collection, "energy", "savings", "20");


		setTimeout(function(){

			MongoCycle.getDataPoints(collection,MongoCycle.Sensor.speedometer, 5000, function(docs){
				console.log(JSON.stringify(docs, null, 2));


				MongoCycle.getStats(collection, function(doc){
					console.log(JSON.stringify(doc, null, 2));

					process.exit(0);
				})
			})
		},1000);
	});
});
