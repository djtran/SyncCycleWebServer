//webOnly.js

var WebManager = require("./Webserver/webServer");

WebManager.starter();

process.on("SIGINT", function(){
	WebManager.teardown();
	process.exit();
});