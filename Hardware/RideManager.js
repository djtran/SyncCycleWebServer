//RideManager.js

var GPIOManager = require("./scGPIO");
	// ,someBLEManager = require("./blepls");


//3 states

//idle
//freeride
//connected

var currentState = module.exports.State.Idle;

module.exports = {
	State : {
		Idle : "Idle",
		Connected : "Connected",
		FreeRide : "FreeRide"
	},
	init : function()
	{
		//setupBLE();
		GPIOManager.init();
		currentState = module.exports.State.Idle;

		//for demoing
		setTimeout(function(){
			GPIOManager.startRide();
		}, 1000);
	},
	exit : function()
	{
		GPIOManager.exit();
		//teardownBLE();
	},
	getGPIOManager : function()
	{
		return GPIOManager;
	},
	changeState : function(stateEnum)
	{
		console.log("Changing state to : " + stateEnum);
		switch(stateEnum)
		{
			case module.exports.State.Idle:
			//idle sensors
			//current ride should be null

			case module.exports.State.Connected:
			//current ride can be null, can be defined, doesn't matter.
			//sensors should be active. (if activity, we'll automatically start ride and populate current ride)

			case module.exports.State.FreeRide:
			//sensors active (we either dced or idle picked up enough activity to start)
		}

		currentState = stateEnum;

		console.log("State changed: " + currentState);
	},

}