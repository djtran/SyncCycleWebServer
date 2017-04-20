var express = require('express')
, path = require('path')
, MongoCycle = require("../Hardware/scMongo");

var app = express();

//////////////////////////////////////
//									//
//			Static Routing			//
//									//
//////////////////////////////////////

//For static content like images, css files, javascript files, etc.
// localhost:8080/images/dog.png
app.use(express.static(path.join(__dirname, '')));

// localhost:8080, serve up the index.html page
app.get('/', function(req, res){
	res.sendFile((path.join(__dirname + '/index.html')));
});

//////////////////////////////////////
//									//
//			 Mongo Routing			//
//									//
//////////////////////////////////////

app.get('/list/rides', function(req, res){
	getAllRides(function(items){
		if(items)
		{
			var returnPage = JSON.stringify(items);
			res.send(returnPage);
		}
		else
		{
			console.log("empty list of rides");
			res.send("");
		}
	});
});

// localhost:8080/list/1995-04-20 gets rides from April 20, 1995
app.get('/list/:Year-:Month-:Day', function(req, res){
	//months range from 0 to 11 for some reason
	var date = new Date(req.params.Year, req.params.Month - 1, req.params.Day);
	
	getRidesByDate(date,function(rides){

		if(rides)
		{
			var returnPage = JSON.stringify(rides);
			res.send(returnPage);
		}
		else
		{
			console.log("empty list of rides for date: " + req.params.Month + req.params.Day + req.params.Year);
			res.send("");
		}
	});
})

//Get specific sensor data from particular ride
// localhost:8080/data/01312017Ride1/Sensor.speedometer
app.get('/data/:RideCollection/:SensorEnum', function(req, res){
	getSensorData(req.params.RideCollection, req.params.SensorEnum, 5000, function(documents){
		if(documents)
		{
			var returnPage = JSON.stringify(documents);

			// for(var i = 0; i < documents.length; i++)
			// {
			// 	returnPage += JSON.stringify(documents[i]) + "\n";
			// }

			console.log(returnPage);
			res.send(returnPage);
		}
		else
		{
			console.log("empty sensor data for RideCollection: " + req.params.RideCollection);
			res.send("");
		}
	});
});

app.get('/stats/:RideCollection', function(req,res){

	getStats(req.params.RideCollection, function(doc)
	{
		if(doc)
		{
			var returnPage = JSON.stringify(doc);

			console.log(returnPage);
			res.send(returnPage);
		}
		else
		{
			console.log("empty stats for RideCollection: " + req.params.RideCollection);
			res.send("");
		}
	});

})

//////////////////////////////////////
//									//
//			 MongoDB Queries		//
//									//
//////////////////////////////////////

//Populated when we do MongoClient.connect in the Start section
var db;

function getAllRides(callback)
{
	db.collections(function(err,items){
		if(!err)
		{
			var returnArray = [];
			for(var i = 0; i < items.length; i++)
			{
				if(items[i].collectionName.includes("Ride"))
				{
					returnArray.push(items[i].collectionName);
				}
			}
			callback(returnArray);
		}
		else
		{
			console.log("Error getting list of all rides: " + err.toString());
			callback(null);
		}

	})
}


//using javascript date
function getRidesByDate(date, callback)
{
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

	queryString += date.getFullYear().toString();

	db.collections(function(err, items){
		if(!err)
		{
			var returnArray = [];
			for(var i = 0; i < items.length; i++)
			{
				if(items[i].collectionName.includes(queryString))
				{
					returnArray.push(items[i]);
				}
			}

			callback(returnArray);
		}
		else
		{
			console.log("Error retrieving collection names: " + err.toString())
			callback(null);
		}
	})
}

function getSensorData(rideName, sensorEnum, findLimit, callback)
{
	var collection = db.collection(rideName);

	//Filter find operation by sensor, getting the last ('findLimit') documents from newest to oldest ('descending')
	MongoCycle.getDataPoints(collection, sensorEnum, findLimit, callback);
}

function getStats(rideName, callback)
{
	var collection = db.collection(rideName);
	//Get the stats document.
	MongoCycle.getStats(collection, callback);
}


/*************************************
*									 *
*		Connectivity & Start		 *
*									 *
*************************************/

//saved for closing when CTRL - C
var server;

module.exports = {
	starter : function() {
		MongoCycle.openMongo(function(database){
			db = database;

			server = app.listen(8080, function () {
			console.log('Sync Cycle Web App listening on port 8080!');
			})
		})
	},
	teardown : function(){
		server.close();
		db.close(true);
	}
}
