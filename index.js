//requiring the server dependency
var server = require ('./lib/server');
var cli = require('./lib/cli');

//declare the main obj of the application
var app = {};

//configure the initial behavior of our app
app.init = function(){
    server.init();

    // Start the CLI, but make sure it starts last
    setTimeout(function(){
      cli.init();
    },50);
};

//initiate the app
app.init();

// Export the app
module.exports = app;