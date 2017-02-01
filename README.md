# SyncCycleWebServer

## Instructions to run

*Make sure you have node.js and MongoDB installed.

In your terminal or other CLI:

** Make sure that MongoDB is already running on port 27017
  - On linux bash, if you have MongoDB installed, that just means doing "sudo mongod" in your terminal.
  - I ran it on my Windows 10 machine via Bash on Ubuntu on Windows

1. Go to the "../SyncCycleWebServer/DatabaseToBrowser" folder.
2. Run 'node index.js' to start up the web app.
3. You should see the message 'Connected to [object Object] Sync Cycle Web App listening on port 8080!'.

In your browser:

4. Go to localhost:8080 to see the site.

###Technology involved so far

- Node.js
  - Express.js
  - MongoDB Node.js driver
  - Chart.js


## Requests available on web app
- localhost:8080/
- localhost:8080/list/rides
- localhost:8080/list/:Year-:Month-:Day             (Ex: localhost:8080/list/2005-9-20)
- localhost:8080/data/:RideCollection/:SensorEnum   (Ex: localhost:8080/data/09202005/Sensor.speedometer)
- localhost:8080/stats/:RideCollection              (Ex: localhost:8080/stats/09202005)

## In order to use the above routes
You must make sure that the MongoDB database "syncCycle" has appropriate elements within. You can create a dummy collection by executing the python script ./Hardware to Database/syncCycleMongoTest.py using Python 3. Again, you must have MongoDB up and running before you run that script.
