var express = require('express')
, path = require('path')
, MongoClient = require('mongodb').MongoClient;

var app = express();
var mongoURL = 'mongodb://localhost:27017/syncCycle';

//variable to hold database
var db;

// TODO get database


//For static content like images, css files, javascript files, etc.
app.use(express.static(path.join(__dirname, '')));

// On any URL request to the root path directory, serve up the index.html page
app.get('/*', function(req, res){
  res.sendFile((path.join(__dirname + '/index.html')));
});

//Run our express webpage on localhost:8080
app.listen(8080, function () {
  console.log('Example app listening on port 8080!')
})

