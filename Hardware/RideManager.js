//RideManager.js

var GPIOManager = require("./scGPIO");
	// ,someBLEManager = require("./blepls");


//3 states

//idle
//freeride
//connected

var State = {
	Idle : "Idle",
	Connected : "Connected",
	FreeRide : "FreeRide"
}

var currentState;

module.exports = {
	init : function()
	{
		//setupBLE();
		GPIOManager.init();
		currentState = State.Idle;
	}
	exit : function()
	{
		GPIOManager.exit();
		//teardownBLE();
	}
}