# SyncCycleWebServer
## Requirements

MongoDB 2.4.9 (what I used) or above

###/Database to Browser

- Node.js
  - Express.js
  - MongoDB Node.js driver
  - Chart.js

###/Hardware to Database

- Python3
  - pymongo
  - enum
  - sys (should be packaged with python3)
  - datetime (should be packaged with python3)

## Instructions to create dummy data

** Make sure that MongoDB is already running on port 27017
  - On linux bash, if you have MongoDB installed, that just means doing "sudo mongod" in your terminal.
  - I ran it on my Windows 10 machine via Bash on Ubuntu on Windows

In your terminal or other CLI:

1. Go to the "../SyncCycleWebServer/Hardware to Database" folder.
2. Run "python3 syncCycleMongoTest.py".
3. You should see a verbose chain of actions that the script has taken, with specific names as to what was created. You can use those specific collection names such as "02022017Ride1" (Feb 2, 2017 Ride 1) when making AJAX calls to the web server below.

## Instructions to run web server

** Make sure that MongoDB is already running on port 27017
  - On linux bash, if you have MongoDB installed, that just means doing "sudo mongod" in your terminal.
  - I ran it on my Windows 10 machine via Bash on Ubuntu on Windows

In your terminal or other CLI:

1. Go to the "../SyncCycleWebServer/Database To Browser" folder.
2. Run 'node index.js' to start up the web app.
3. You should see the message 'Connected to [object Object] Sync Cycle Web App listening on port 8080!'.

In your browser:

4. Go to localhost:8080 to see the site.

## Requests available on web app
- localhost:8080/
  - Provides the main page for viewing

- localhost:8080/list/rides
  - Provides a list of all rides available on the database.

- localhost:8080/list/:Year-:Month-:Day             (Ex: localhost:8080/list/2005-9-20)
  - Provides a list of rides taken on a given day on the database

- localhost:8080/data/:RideCollection/:SensorEnum   (Ex: localhost:8080/data/09202005Ride1/Sensor.speedometer)
  - Returns an array of JSON objects representing (time, value) points collected by a specific sensor on a specific ride. 
  - Enums are always named in the following way: "Sensor.(specific sensor)".
    - Ex: "Sensor.speedometer" or "Sensor.sensor2"

- localhost:8080/stats/:RideCollection              (Ex: localhost:8080/stats/09202005Ride1)
  - Returns a JSON object representing our calculated data from a given ride.

## In order to use the above routes
You must make sure that the MongoDB database "syncCycle" has appropriate elements within. You can create a dummy collection by executing the python script ./Hardware to Database/syncCycleMongoTest.py using Python 3. Again, you must have MongoDB up and running before you run that script.
