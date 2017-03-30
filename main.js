//main.js

var WebManager = require("./Webserver/webServer");
	RideManager = require("./Hardware/rideManager"),
	BLEManager = require("./Hardware/scBLE");


WebManager.starter();
RideManager.init();
BLEManager.starter(RideManager);


//CTRL C;
process.on('SIGINT', function(){
	//Safely exit, handover all gpio back to RPi.
	closeAll();
	process.exit(0)
})

function closeAll()
{
	WebManager.teardown();
	RideManager.exit();
}