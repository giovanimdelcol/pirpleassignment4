//dependencies
var http  = require('http');
var https = require('https');
var fs    = require('fs');
var url   = require('url');
var path  = require('path');
var StringDecoder = require('string_decoder').StringDecoder;
var handlers = require('./handlers');
var util  = require('util');
var config = require('./config');
var debug = util.debuglog('server');
var helpers = require('./helpers');

//instantiate the server obj
var server = {};

// Define the request router
server.router = {
    '' : handlers.index,
    'account/create' : handlers.accountCreate, //user registration
    'session/create' : handlers.sessionCreate, //user login
    'session/deleted' : handlers.sessionDeleted, //user logout
    'cart/view' : handlers.cartView, //user cart
    'cart/add' : handlers.cartAdd, //list itens so the user can add one to the cart
    'cart/ordered' : handlers.cartConfirmOrder, //confirm that the order has been made
    'api/users' : handlers.users,
    'api/tokens' : handlers.tokens,
    'api/carts' : handlers.carts,
    'api/itens' : handlers.itens,
    'api/order' : handlers.order,
    'favicon.ico' : handlers.favicon,
    'public' : handlers.public
};
 

//instantiate http and https server properties
server.httpServer = http.createServer(function(req, res) {
    server.unifiedServer(req, res);
});
server.httpsServerOptions = {
   'key': fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
   'cert': fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
 };
server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res) {
    server.unifiedServer(req, res);
});

//shared logic between http and https servers
server.unifiedServer = function (req, res) {

    //parse url into object
    var parsedUrl = url.parse(req.url, true);
    
    //obtain the required path
    var trimmedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    //get the method
    var method = req.method.toLowerCase();

    //objectify the headers
    var headers = req.headers;

    //Get the payload, if it exists
    var decoder = new StringDecoder('utf-8');
    //initialize the buffer that will receive the data
    var buffer = '';
    //bind 'data' req event to fill the buffer
    req.on('data', function (data) {
        //append the received data to the buffer
        buffer += decoder.write(data);
    });

    //bind the 'end' event to the function passing the request to the proper handler
    req.on('end', function (){
        //write any remaining bytes to our buffed
        buffer += decoder.end();

        //select the handler from the route
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // If the request is within the public directory use to the public handler instead
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

        //build data object that the handler shall receive
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };

        //send the data to the proper handler, giving it a callback that will trigger the response
        chosenHandler(data, function(statusCode, payload, contentType){

            // Determine the type of response (fallback to JSON)
            contentType = typeof(contentType) == 'string' ? contentType : 'json';
            
            //use the status returned by the handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;            

            
            // Return the response parts that are content-type specific
            var payloadString = '';
            if(contentType == 'json'){
                res.setHeader('Content-Type', 'application/json');
                payload = typeof(payload) == 'object'? payload : {};
                payloadString = JSON.stringify(payload);
            }

            if(contentType == 'html'){
                res.setHeader('Content-Type', 'text/html');
                payloadString = typeof(payload) == 'string'? payload : '';
            }

            if(contentType == 'favicon'){
                res.setHeader('Content-Type', 'image/x-icon');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }

            if(contentType == 'plain'){
                res.setHeader('Content-Type', 'text/plain');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }

            if(contentType == 'css'){
                res.setHeader('Content-Type', 'text/css');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }

            if(contentType == 'png'){
                res.setHeader('Content-Type', 'image/png');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }

            if(contentType == 'jpg'){
                res.setHeader('Content-Type', 'image/jpeg');
                payloadString = typeof(payload) !== 'undefined' ? payload : '';
            }

            //return the http response            
            res.writeHead(statusCode);
            res.end(payloadString);

            // If the response is 200, print green, otherwise print red
            if(statusCode == 200){
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            } else {
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            }

        });

    });

};

// Init script
server.init = function(){
    // Start the HTTP server
    server.httpServer.listen(config.httpPort, function(){
        console.log('\x1b[36m%s\x1b[0m','The HTTP server is running on port ' + config.httpPort);
    });

    // Start the HTTPS server
    server.httpsServer.listen(config.httpsPort, function(){
        console.log('\x1b[35m%s\x1b[0m','The HTTPS server is running on port ' + config.httpsPort);
    });
};


// Export the module
module.exports = server;
