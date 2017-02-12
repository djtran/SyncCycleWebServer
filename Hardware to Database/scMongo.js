//scMongo.js

var MongoClient = require('mongodb').MongoClient;

var mongoURL = 'mongodb://localhost:27017/syncCycle';

module.exports = {
	Sensor : {
		speedometer : "Sensor.speedometer",
		battery : "Sensor.battery",
	},
	openMongo : function(callback){
		MongoClient.connect(mongoURL, function(err, database) {
			if(err)
			{
				console.log(err);
				process.exit(1);
			}
			else
			{
				console.log("[info] Using database : " + database.databaseName.toString());
				callback(database);

			}
		})
	},

	//date needs to be a Date() object
	createRide : function(db, date, instance, callback){
		//create the query string in the form of MMDDYYYY
		var queryString = "";
		if((date.getMonth() + 1) < 10)
		{
			queryString += "0";
		}
		queryString += (date.getMonth()+1).toString()
		if(date.getDate() < 10)
		{
			queryString += "0";		
		}
		queryString += date.getDate().toString();
		queryString += date.getFullYear().toString() + "Ride" + instance.toString();

		db.listCollections({name : queryString}).toArray(function(err, names) {
		    if(names.length > 0)
		    {
		    	module.exports.createRide(db, date, instance + 1, callback);
		    }
		    else
		    {
		    	db.createCollection(queryString, function(err, collection){
		    		if(err)
		    		{
		    			console.log("Error creating collection " + queryString);
		    			callback(null);
		    		}
		    		else
		    		{
		    			var stats = {
		    				id : "stats",
		    				energy : {
		    					used : 0,
		    					equivalent : 0,
		    					savings : 0,
		    				},
		    				carbon : {
		    					emissionsPrevented : 0,
		    				},
		    				speed : {
		    					average : 0,
		    					top : 0,
		    				},
		    				distance : {
		    					traveled : 0,
		    				},
		    				time : {
		    					elapsed : 0,
		    				}
		    			}

		    			collection.findOne({id : "stats"}, function(err, doc){
		    				if(doc)
		    				{
		    					console.log("stats already exists, collection already exists, or you called createRide twice in a row");
		    					callback(collection);
		    				}
		    				else
		    				{
				    			collection.insertOne(stats, function(err, result){
				    				if(err)
				    				{
				    					console.log("Error inserting initialized stats document in collection " + queryString);
				    					db.dropCollection(queryString);
				    					callback(null);
				    				}
				    				else
				    				{
				    					console.log(queryString + " successfully initialized.");
				    					callback(collection);
				    				}
				    			});
		    				}
			    		});
		    		}
		    	})
		    }
		});
	},
	getRide : function(db, date, instance, callback){
		//create the query string in the form of MMDDYYYY
		var queryString = "";
		if((date.getMonth() + 1) < 10)
		{
			queryString += "0";
		}
		queryString += (date.getMonth()+1).toString()
		if(date.getDate() < 10)
		{
			queryString += "0";		
		}
		queryString += date.getDate().toString();
		queryString += date.getFullYear().toString() + "Ride" + instance.toString();

		db.collection(queryString, function(err, collection){
			if(err)
			{
				console.log("Error getting collection : " + queryString);
				callback(null)
			}
			else
			{
				callback(collection);
			}
		})
	},
	//sensorEnum should be from the enum also packaged at the top of the file
	getDataPoints : function(collection, sensorEnum, findLimit = 5000, callback){
		collection.find({"sensor": sensorEnum}, {'limit' : findLimit, 'sort' : [['time','descending']]}).toArray(function(err, docs){
			if(err)
			{
				console.log("Error getting sensor data: " + err.toString());
				callback(null);
			}
			else
			{
				callback(docs);
			}
		})
	},
	addDataPoint : function(collection, sensorEnum, ptime, pvalue)
	{
		var point = {
			sensor : sensorEnum,
			time : ptime,
			value : pvalue
		}


		collection.updateOne({time : ptime}, point,{upsert : true}, function(err, result){
			if(err){
				console.log("Error adding point to collection");
			}
		});
	},
	getStats : function(collection, callback)
	{
		collection.findOne({id:'stats'}, function(err, doc){
			if(err)
			{
				console.log("Error getting stats for collection");
			}
			else
			{
				callback(doc);
			}
		})
	},
	updateStats  : function(collection, fieldName, subFieldName, fieldValue)
	{
		var doc;

		module.exports.getStats(collection, function(resultDoc){
			//get existing document & update fields
			doc = resultDoc;
			var field = resultDoc[fieldName];
			field[subFieldName] = fieldValue;

			//create property to update
			var total = {};
			total[fieldName] = field;

			collection.updateOne({id : "stats"}, { $set: total}, function(err, result){
				if(err)
				{
					console.log("Error updating stats for collection");
				}
			});
		})
	}
}