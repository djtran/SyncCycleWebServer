#Python 3.4.3
#Created by David T. on Jan 24, 2017
#scMongoTest

import sys
import datetime
import scMongo

MongoCycle = scMongo.openMongo();

#Test making MongoCycle and db
try:
	print("Connected to database : " + MongoCycle.db.name);
except pymongo.errors.ServerSelectionTimeoutError:
	print('Connection timed out, are you sure mongod has been run prior to this program?')
	sys.exit();


#Test making collection
try:
	print("Getting/Creating ride : " + datetime.date.today().strftime("%m%d%y") + "Ride" + str(1));
	rideCollection = MongoCycle.getRide(datetime.date.today(), 1);
	print("Got ride : " + rideCollection.name);
except :
 	print("Error with ride getter");
 	sys.exit();

#Test Data Points
try:

	#Test Adding Data Points
	print("Adding 20 sample data points to the database...");
	for a in range(0,20):
		MongoCycle.addDataPoint(rideCollection, scMongo.Sensor.speedometer, a, a);

	#Test Getting ALL Data Points
	print("Getting all data points")
	for b in MongoCycle.getAllDataPoints(rideCollection, scMongo.Sensor.speedometer):
		print(str(b));

	#Test Getting Last N
	print("Getting last 5 data points");
	for c in MongoCycle.getLastNDataPoints(rideCollection, scMongo.Sensor.speedometer, 5):
		print(str(c));
except :
	print("Error with data points");
	sys.exit();


#Test exporting n data points to a json file per Gavin's needs