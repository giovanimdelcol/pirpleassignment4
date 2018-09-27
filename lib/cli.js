
// Dependencies
var readline = require('readline');
var util = require('util');
var debug = util.debuglog('cli');
var events = require('events');
class _events extends events{};
var e = new _events(); 
var itens = require('./../.data/itens/itens');
var datalib = require('./data');

// Instantiate the cli object
var cli = {};

// Input handlers
e.on('man',function(str){
    cli.responders.help();
});

e.on('help',function(str){
    cli.responders.help();
});

e.on('exit',function(str){
    cli.responders.exit();
});

e.on('list menu',function(str){
    cli.responders.listMenu();
});

e.on('list recent orders',function(str){
    cli.responders.listRecentOrders();
});

e.on('more order info',function(str){
    cli.responders.orderInfo(str);
});

e.on('list recent users',function(str){
    cli.responders.listRecentUsers();
});

e.on('more user info',function(str){
    cli.responders.userInfo(str);
});
  
// Responders object
cli.responders = {};

// Help / Man
cli.responders.help = function(){

  // Codify the commands and their explanations
  var commands = {
    'exit' : 'Kill the CLI (and the rest of the application)',
    'man' : 'Show this help page',
    'help' : 'Alias of the "man" command',
    'list menu' : 'Get all the itens currently in the menu',
    'list recent orders' : 'List all orders made in the last 24h',
    'more order info --{userEmail} --{orderId}' : 'Show details about a specific order, both parameters mandatory',
    'list recent users': 'List all user registered in the last 24h',
    'more user info --{userEmail}' : 'Show details about a specific user'
  };

  // Show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered('CLI MANUAL');
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Show each command, followed by its explanation, in white and yellow respectively
  for(var key in commands){
     if(commands.hasOwnProperty(key)){
        var value = commands[key];
        var line = '      \x1b[33m '+key+'      \x1b[0m';
        var padding = 60 - line.length;
        for (i = 0; i < padding; i++) {
            line+=' ';
        }
        line+=value;
        console.log(line);
        cli.verticalSpace();
     }
  }
  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();

};

// Exit
cli.responders.exit = function(){
    process.exit(0);
};

//List Menu Itens
cli.responders.listMenu = function (){
  // Show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered('FOOD ORDERING APP   < MENU >');
  cli.horizontalLine();
  cli.verticalSpace(2); 
  
  itens.available.forEach((item) => {
    var line = '      \x1b[33m '+item.productName+'      \x1b[0m';
    var padding = 50 - line.length;
    for (i = 0; i < padding; i++) {
        line+=' ';
    }
    line += '$ ';
    line += item.Price;
    console.log(line);
    cli.verticalSpace();
  });   
}

//View Recent orders (within 24h)
cli.responders.listRecentOrders = function () {
    cli.horizontalLine();
    cli.centered('FOOD ORDERING APP   < RECENT ORDERS (LAST 24H) >');
    cli.horizontalLine();
    cli.verticalSpace(2); 

    //grab all users with orders
    datalib.list('orders', (error, listOfFiles) => {
        if(error){
            console.log('Error reading orders:', error);
            return;
        };

        if (listOfFiles.length==0) {
            console.log('No order ever registered');
            return;
        };

        showAfter = new Date().valueOf() - 1000 * 60 * 60 * 24;

        //for each user with an order, go through his list of orders and print the ones made in the last 24h
        listOfFiles.forEach((userOrderFile) => {
            datalib.read('orders', userOrderFile, function(err, ordersData){
                if (!err && ordersData) {
                    ordersData.forEach((order) => {
                        if (order.registeredAt > showAfter.valueOf()){
                            console.log('Customer: ' + userOrderFile.replace('.json','') +' | ID: ' + order.ID);
                        } ;
                    });
                } else {
                    console.log('error reading user order: ', err);
                }
            });            
        });
    });

};  

//Details about an order, providede customer email and order ID (more order info)
cli.responders.orderInfo = function (str){    
    var arr = str.split('--');
    var userMail = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    var orderID = typeof(arr[2]) == 'string' && arr[2].trim().length > 0 ? arr[2].trim() : false;
    if (!(userMail && orderID)){
        console.log('Incorrect parameters.');
        return;
    };

    cli.horizontalLine();
    cli.centered('FOOD ORDERING APP   < ORDER: '+ orderID + ' | CUSTOMER: ' + userMail.replace('.json','') + ' >');
    cli.horizontalLine();

    //lookup the user's order list
    datalib.read('orders', userMail, function(err, ordersData){
        if (!err && ordersData) {
            if (ordersData.length==0) {
                console.log('Order not found. No order at all was found for the user ', userMail);
                return;
            };
            var printed = false;
            ordersData.forEach((order) => {
                if (order.ID == orderID){
                    cli.verticalSpace();
                    console.dir(order,{'colors' : true});
                    cli.verticalSpace();
                    printed = true;
                } ;
            });

            if (!printed) {
                console.log('Order not found');
            };
        } else {
            console.log('No order found for customer '+userMail);
        }
    });    

};

//list recent users
cli.responders.listRecentUsers = function () {
    
    cli.horizontalLine();
    cli.centered('FOOD ORDERING APP   < RECENT USERS (LAST 24H) >');
    cli.horizontalLine();
    cli.verticalSpace(2); 

    //grab all users with orders
    datalib.list('users', (error, listOfUsers) => {
        if(error){
            console.log('Error reading users:', error);
            return;
        };

        if (listOfUsers.length==0) {
            console.log('No user ever registered');
            return;
        };

        showAfter = new Date().valueOf() - 1000 * 60 * 60 * 24;

        //for each user with an order, go through his list of orders and print the ones made in the last 24h
        listOfUsers.forEach((user) => {
            datalib.read('users', user, function(err, userData){
                if (!err && userData) {
                    if (userData.registeredAt > showAfter.valueOf()){
                        console.log('Customer: ' + user.replace('.json',''));
                    } ;
                } else {
                    console.log('error reading user: ', err);
                }
            });            
        });
    });


};

//more user info --{userEmail}
cli.responders.userInfo = function(str){
    var arr = str.split('--');
    var userMail = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;
    if (!userMail){
        console.log('Incorrect parameters.');
        return;
    };

    cli.horizontalLine();
    cli.centered('FOOD ORDERING APP   < CUSTOMER: ' + userMail.replace('.json','') + ' >');
    cli.horizontalLine();

    //lookup the user
    datalib.read('users', userMail, function(err, userData){
        if (!err && userData) {
                    cli.verticalSpace();
                    console.dir(userData, {'colors' : true});
                    cli.verticalSpace();
                    printed = true;
        } else {
            console.log('Customer not found: ' + userMail);
        }
    });   
};

// Create a vertical space
cli.verticalSpace = function(lines){
  lines = typeof(lines) == 'number' && lines > 0 ? lines : 1;
  for (i = 0; i < lines; i++) {
      console.log('');
  }
};

// Create a horizontal line across the screen
cli.horizontalLine = function(){

  // Get the available screen size
  var width = process.stdout.columns;

  // Put in enough dashes to go across the screen
  var line = '';
  for (i = 0; i < width; i++) {
      line+='-';
  }
  console.log(line);


};

// Create centered text on the screen
cli.centered = function(str){
  str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : '';

  // Get the available screen size
  var width = process.stdout.columns;

  // Calculate the left padding there should be
  var leftPadding = Math.floor((width - str.length) / 2);

  // Put in left padded spaces before the string itself
  var line = '';
  for (i = 0; i < leftPadding; i++) {
      line+=' ';
  }
  line+= str;
  console.log(line);
};

// Input processor that will handle user input
cli.processInput = function(str){
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false;
    // Only process the input if the user actually wrote something, otherwise ignore it
    if(str){
      // Codify the unique strings that identify the different unique questions allowed be the asked
      var uniqueInputs = [
        'man',
        'help',
        'exit',
        'list menu',
        'list recent orders',
        'more order info',
        'list recent users',
        'more user info'
      ];
  
      // Go through the possible inputs, emit event when a match is found
      var matchFound = false;
      uniqueInputs.some(function(input){
        if(str.toLowerCase().indexOf(input) > -1){
          matchFound = true;
          // Emit event matching the unique input, and include the full string given
          e.emit(input, str);
          return true;
        }
      });
  
      // If no match is found, tell the user to try again
      if(!matchFound){
        console.log('Command typed is not allowed in this application. Please, type a valid command. "Menu" to list all the valid commands.');
      }
  
    }
};

// Init script
cli.init = function(){

    // Send to console, in dark blue
    console.log('\x1b[34m%s\x1b[0m','The CLI is running');
  
    // Start the interface
    var _interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: ''
    });
  
    // Create an initial prompt
    _interface.prompt();
  
    // Handle each line of input separately
    _interface.on('line', function(str){
  
      // Send to the input processor
      cli.processInput(str);
  
      // Re-initialize the prompt afterwards
      _interface.prompt();
    });
  
    // If the user stops the CLI, kill the associated process
    _interface.on('close', function(){
      process.exit(0);
    });  
};

// Export the module
module.exports = cli;
