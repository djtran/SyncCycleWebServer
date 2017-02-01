#Python 3.4.3
#Created by David T. on Dec 12, 2016
#scMongo
import pymongo
import datetime
from enum import Enum

#Sensor enum. Helps prevent accidental typos or misspellings, and also makes functions more readable.
class Sensor(Enum):
	speedometer = 1
	battery = 2


class MongoCycle:

	#Save the mongoclient and database objects
	def __init__(self, host, port, db):
		self.client = pymongo.MongoClient(host,port);
		self.db = self.client[db];

	#Get/Create ride by datetime.date and instance (whether it's an int or a string)
	def getRide(self, date, instance):
		#Example : Jan 1, 1995 => 01011995Ride1
		collection =  date.strftime("%m%d%Y")+"Ride"+str(instance);
		return self.db[collection];

	#Returns a cursor that can be used to iterate over all documents(data points) for any given sensor
	def getAllDataPoints(self, collection, sensorEnum):
		return collection.find({'sensor': str(sensorEnum)}).sort('time', -1);

	#Limits getAllDataPoints to some number of n documents in case pulling them all is too hefty.
	def getLastNDataPoints(self, collection, sensorEnum, n):
		return collection.find({'sensor': str(sensorEnum)}).sort('time', -1).limit(n); 


	#Insert a data point for a given sensor based on enum
	def addDataPoint(self, collection, sensorEnum, time, value):
		point = {
			'sensor' : str(sensorEnum),
			'time' : time,
			'value' : value
			}

		if(collection.find_one({'time' : time}) != None):
			print("Point at time " + str(point["time"]) + " already exists in collection " + collection.name + ". Skipping...")
			return False;
		

		result = collection.insert_one(point);
		return result; #Returns insertOneResult object, will need to handle WriteError / WriteConcernError if they ever come up.

#Instantiate a MongoCycle object and return it to the user.
def openMongo():
	return MongoCycle('localhost', 27017, 'syncCycle')
