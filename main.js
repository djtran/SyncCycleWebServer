//main.js

var WebManager = require("./Webserver/webServer");
	RideManager = require("./Hardware/rideManager");


WebManager.starter();
RideManager.init();



//CTRL C
process.on('SIGINT', function(){
	//Safely exit, handover all gpio back to RPi.
	closeAll();
	process.exit(0);
})

function closeAll()
{
	WebManager.teardown();
	RideManager.exit();
}