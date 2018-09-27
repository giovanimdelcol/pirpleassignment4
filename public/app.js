// Container for frontend application
var app = {};

// Config - initialize it without a token
app.config = {
  'sessionToken' : false
};

// AJAX Client (for RESTful API)
app.client = {}

// Interface for making API calls
app.client.request = function(headers, path, method, queryStringObject, payload, callback){

    // Set defaults
    headers  = typeof(headers) == 'object' && headers !== null ? headers : {};
    path     = typeof(path) == 'string' ? path : '/';
    method   = typeof(method) == 'string' && ['POST','GET','PUT','DELETE'].indexOf(method.toUpperCase()) > -1 ? method.toUpperCase() : 'GET';
    queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
    payload  = typeof(payload) == 'object' && payload !== null ? payload : {};
    callback = typeof(callback) == 'function' ? callback : false;
  
    // For each query string parameter sent, add it to the path
    var requestUrl = path+'?';
    var counter = 0;
    for(var queryKey in queryStringObject){
       if(queryStringObject.hasOwnProperty(queryKey)){
         counter++;
         // If at least one query string parameter has already been added, preprend new ones with an ampersand
         if(counter > 1){
           requestUrl+='&';
         }
         // Add the key and value
         requestUrl += queryKey + '=' + queryStringObject[queryKey];
       }
    }

    // Form the http request as a JSON type
    var xhr = new XMLHttpRequest();//AJAX
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader("Content-type", "application/json");
  
    // For each header sent, add it to the request
    for(var headerKey in headers){
       if(headers.hasOwnProperty(headerKey)){
         console.log('setting headers', 'headerkey: ', headerKey, 'headerval: ', headers[headerKey]);
         xhr.setRequestHeader(headerKey, headers[headerKey]);
       }
    }
  
    // If there is a current session token set, add that as a header
    if(app.config.sessionToken){
      xhr.setRequestHeader("token", app.config.sessionToken.id);
    }
  
    // When the request comes back, handle the response
    xhr.onreadystatechange = function() {
        if(xhr.readyState == XMLHttpRequest.DONE) {
          var statusCode = xhr.status;
          var responseReturned = xhr.responseText;
  
          // Callback if requested
          if(callback){
            try{
              var parsedResponse = JSON.parse(responseReturned);
              callback(statusCode,parsedResponse);
            } catch(e){
              callback(statusCode,false);
            }
  
          }
        }
    }
  
    // Send the payload as JSON
    var payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
  
};
  
// Bind the logout button
app.bindLogoutButton = function(){
    document.getElementById("logoutButton").addEventListener("click", function(e){
  
         // Stop it from redirecting anywhere
         e.preventDefault();
  
        // Log the user out
         app.logUserOut();
  
    });
};


// Log the user out then redirect them
app.logUserOut = function(redirectUser){
    // Set redirectUser to default to true
    redirectUser = typeof(redirectUser) == 'boolean' ? redirectUser : true;
  
    // Get the current token id
    var tokenId = typeof(app.config.sessionToken.id) == 'string' ? app.config.sessionToken.id : false;
  
    // Send the current token to the tokens endpoint to delete it
    var queryStringObject = {
      'id' : tokenId
    };
    app.client.request(undefined,'api/tokens','DELETE',queryStringObject,undefined,function(statusCode,responsePayload){
      // Set the app.config token as false
      app.setSessionToken(false);
  
      // Send the user to the logged out page
      if(redirectUser){
        window.location = '/session/deleted';
      }
  
    });
};


// Bind the forms -> turn form fields into payload for requests
app.bindForms = function(){
    if(document.querySelector("form")){
  
      var allForms = document.querySelectorAll("form");
      for(var i = 0; i < allForms.length; i++){
          allForms[i].addEventListener("submit", function(e){
  
          // Stop it from submitting
          e.preventDefault();
          var formId = this.id;
          var path = this.action;
          var method = this.method.toUpperCase();
  
          // Hide the error message (if it's currently shown due to a previous error)
          document.querySelector("#"+formId+" .formError").style.display = 'none';
  
          // Hide the success message (if it's currently shown due to a previous error)
          if(document.querySelector("#"+formId+" .formSuccess")){
            document.querySelector("#"+formId+" .formSuccess").style.display = 'none';
          }
  
  
          // Turn the inputs into a payload
          var payload = {};
          var elements = this.elements;
          for(var i = 0; i < elements.length; i++){
            if(elements[i].type !== 'submit'){
              // Determine class of element and set value accordingly
              var classOfElement = typeof(elements[i].classList.value) == 'string' && elements[i].classList.value.length > 0 ? elements[i].classList.value : '';
              var valueOfElement = elements[i].type == 'checkbox' && classOfElement.indexOf('multiselect') == -1 ? elements[i].checked : classOfElement.indexOf('intval') == -1 ? elements[i].value : parseInt(elements[i].value);
              var elementIsChecked = elements[i].checked;
              // Override the method of the form if the input's name is _method
              var nameOfElement = elements[i].name;
              if(nameOfElement == '_method'){
                method = valueOfElement;
              } else {
                // Create an payload field named "method" if the elements name is actually httpmethod
                if(nameOfElement == 'httpmethod'){
                  nameOfElement = 'method';
                }
                // Create an payload field named "id" if the elements name is actually uid
                if(nameOfElement == 'uid'){
                  nameOfElement = 'id';
                }
                // If the element has the class "multiselect" add its value(s) as array elements
                if(classOfElement.indexOf('multiselect') > -1){
                  if(elementIsChecked){
                    payload[nameOfElement] = typeof(payload[nameOfElement]) == 'object' && payload[nameOfElement] instanceof Array ? payload[nameOfElement] : [];
                    payload[nameOfElement].push(valueOfElement);
                  }
                } else {
                  payload[nameOfElement] = valueOfElement;
                }
  
              }
            }
          }
  
  
          // If the method is DELETE, the payload should be a queryStringObject instead
          var queryStringObject = method == 'DELETE' ? payload : {};
  
          // Call the API
          app.client.request(undefined,path,method,queryStringObject,payload,function(statusCode,responsePayload){
            // Display an error on the form if needed
            if(statusCode !== 200){
  
              if(statusCode == 403){
                // log the user out
                console.log('403 received')
                app.logUserOut();
  
              } else {
  
                // Try to get the error from the api, or set a default error message
                var error = typeof(responsePayload.Error) == 'string' ? responsePayload.Error : 'An error has occured, please try again';
  
                // Set the formError field with the error text
                document.querySelector("#"+formId+" .formError").innerHTML = error;
  
                // Show (unhide) the form error field on the form
                document.querySelector("#"+formId+" .formError").style.display = 'block';
              }
            } else {
              // If successful, send to form response processor
              app.formResponseProcessor(formId,payload,responsePayload);
            }
  
          });
        });
      }
    }
};


// Form response processor
app.formResponseProcessor = function(formId, requestPayload, responsePayload){
    var functionToCall = false;
    // If account creation was successful, try to immediately log the user in
    if(formId == 'accountCreate'){
      // Take the email and password, and use it to log the user in
      var newPayload = {
        'email' : requestPayload.email,
        'password' : requestPayload.password
      };
  
      app.client.request(undefined,'api/tokens','POST',undefined,newPayload,function(newStatusCode,newResponsePayload){
        // Display an error on the form if needed
        if(newStatusCode !== 200){
  
          // Set the formError field with the error text
          document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occured. Please try again.';
  
          // Show (unhide) the form error field on the form
          document.querySelector("#"+formId+" .formError").style.display = 'block';
  
        } else {
          // If successful, set the token and redirect the user
          app.setSessionToken(newResponsePayload);
          window.location = '/cart/view';
        }
      });
    }
    // If login was successful, set the token in localstorage and redirect the user
    if(formId == 'sessionCreate'){
      app.setSessionToken(responsePayload);
      window.location = '/cart/view';
    }
  
    // If forms saved successfully and they have success messages, show them
    var formsWithSuccessMessages = ['accountEdit1', 'accountEdit2','checksEdit1'];
    if(formsWithSuccessMessages.indexOf(formId) > -1){
      document.querySelector("#"+formId+" .formSuccess").style.display = 'block';
    }
  
    // If the user just deleted their account, redirect them to the account-delete page
    if(formId == 'accountEdit3'){
      app.logUserOut(false);
      window.location = '/account/deleted';
    }
  
    // If the user just created a new check successfully, redirect back to the dashboard
    if(formId == 'checksCreate'){
      window.location = '/cart/view';
    }
  
    // If the user just deleted a check, redirect them to the dashboard
    if(formId == 'checksEdit2'){
      window.location = '/cart/view';
    }
  
};
 

// Get the session token from localstorage and set it in the app.config object
app.getSessionToken = function(){
    var tokenString = localStorage.getItem('token');
    if(typeof(tokenString) == 'string'){
      try{
        var token = JSON.parse(tokenString);
        app.config.sessionToken = token;
        if(typeof(token) == 'object'){
          app.setLoggedInClass(true);
        } else {
          app.setLoggedInClass(false);
        }
      }catch(e){
        app.config.sessionToken = false;
        app.setLoggedInClass(false);
      }
    }
};

// Set (or remove) the loggedIn class from the body
app.setLoggedInClass = function(add){
  var target = document.querySelector("body");
  if(add){
    target.classList.add('loggedIn');
  } else {
    target.classList.remove('loggedIn');
  }
};

// Set the session token in the app.config object as well as localstorage
app.setSessionToken = function(token){
  app.config.sessionToken = token;
  var tokenString = JSON.stringify(token);
  localStorage.setItem('token',tokenString);
  if(typeof(token) == 'object'){
    app.setLoggedInClass(true);
    console.log('logged in token:',token);
  } else {
    app.setLoggedInClass(false);
  }
};

// Renew the token
app.renewToken = function(callback){
  var currentToken = typeof(app.config.sessionToken) == 'object' ? app.config.sessionToken : false;
  if(currentToken){
    // Update the token with a new expiration
    var payload = {
      'id' : currentToken.id,
      'extend' : true,
    };
    app.client.request(undefined,'api/tokens','PUT',undefined,payload,function(statusCode,responsePayload){
      // Display an error on the form if needed
      if(statusCode == 200){
        // Get the new token details
        var queryStringObject = {'id' : currentToken.id};
        app.client.request(undefined,'api/tokens','GET',queryStringObject,undefined,function(statusCode,responsePayload){
          // Display an error on the form if needed
          if(statusCode == 200){
            app.setSessionToken(responsePayload);
            callback(false);
          } else {
            app.setSessionToken(false);
            callback(true);
          }
        });
      } else {
        app.setSessionToken(false);
        callback(true);
      }
    });
  } else {
    app.setSessionToken(false);
    callback(true);
  }
};

// Load data on the page
app.loadDataOnPage = function(){
    // Get the current page from the body class
    var bodyClasses = document.querySelector("body").classList;
    var primaryClass = typeof(bodyClasses[0]) == 'string' ? bodyClasses[0] : false;

    //@TODO call the proper load methods for each page
  
    // // Logic for account settings page
    // if(primaryClass == 'accountEdit'){
    //   app.loadAccountEditPage();
    // }
  
    // Logic for dashboard page
    if(primaryClass == 'cartView'){
      var btnConfirmOrder = document.getElementById("confirmOrder");
      //hide the confirmOrder button until make sure there's at least 1 item.
      btnConfirmOrder.style.display = 'none';
      //using this callback like that so I can reutilize the request part in the add
      app.loadCart(function(statusCode, responsePayload){
        if(statusCode == 200 || statusCode == 404){
  
          // Determine how many itens are in the cart
          var allItens = typeof(responsePayload.itens) == 'object' && responsePayload.itens instanceof Array && responsePayload.itens.length > 0 ? responsePayload.itens : [];
          if(allItens.length > 0){
            document.getElementById("noItensMessage").style.display = 'none';
            btnConfirmOrder.style.display = 'block';
            btnConfirmOrder.onclick = function () {
              app.confirmOrder();
            }
            // Show each created item as a new row in the table
            allItens.forEach(function(item){
                // Make the item data into a table row
                var table = document.getElementById("cartViewList");
                var tr = table.insertRow(-1);
                tr.classList.add('checkRow');
                var td0 = tr.insertCell(0);
                var td1 = tr.insertCell(1);
                var td2 = tr.insertCell(2);
                td0.innerHTML = item.productName.toUpperCase();
                td1.innerHTML = item.productQt;
                td2.innerHTML = item.Price;
            });
  
          } else {
            // Show 'you have no itens' message
            document.getElementById("noItensMessage").style.display = 'table-row';
  
            // Show the see menu
            document.getElementById("seeMenu").style.display = 'block';
  
          }
        } else {
          // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
          app.logUserOut();
        }
      });
    }
    //load menu page
    if(primaryClass == 'cartAdd'){
      app.loadCartAdd();
    }
  
    // // Logic for check details page
    // if(primaryClass == 'checksEdit'){
    //   app.loadChecksEditPage();
    // }
};


// Load the dashboard page specifically
app.loadCart = function(acallback){
  // Get the email number from the current token, or log the user out if none is there
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the user data
    var queryStringObject = {
      'email' : email
    };
    app.client.request(undefined,'api/carts', 'GET', queryStringObject, undefined, acallback);
  } else {
    app.logUserOut();
  }
};

app.confirmOrder = function(){
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;

    var payload = {
      'email' : app.config.sessionToken.email
    };

    app.client.request(undefined, 'api/order', 'POST', undefined, payload, function(newStatusCode, newResponsePayload){
      // Display an error on the form if needed
      if(newStatusCode !== 200){

        // Set the formError field with the error text
        document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occured. Please try again.';

        // Show (unhide) the form error field on the form
        document.querySelector("#"+formId+" .formError").style.display = 'block';

      } else {
        // If successful redirect the user
        window.location = '/cart/ordered';
      }
    });
};

app.addItem = function (itemName){
  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  //validate itemName
  var itemName = typeof(itemName) == 'string' ? itemName : false;
  if (!email){
    app.logUserOut();
    return
  };
  if (!itemName){
    console.log('invalid itemName received: ', itemName);
    return
  };

  app.loadCart(function(statusCode, responsePayload){
    if(statusCode == 200 || statusCode == 404){

      // Determine how many itens are in the cart
      var allItens = typeof(responsePayload.itens) == 'object' && responsePayload.itens instanceof Array && responsePayload.itens.length > 0 ? responsePayload.itens : [];
      allItens.push({'productName' : itemName, "productQt" : 1});

      var payload = {
        'email' : app.config.sessionToken.email,
        'itens' : allItens
      };

      var methodToCall='';
      if (allItens.length == 1) {
        methodToCall = 'POST'
      } else {
        methodToCall = 'PUT'
      }
  
      app.client.request(undefined, 'api/carts', methodToCall, undefined, payload, function(newStatusCode, newResponsePayload){
        // Display an error on the form if needed
        if(newStatusCode !== 200){
  
          // Set the formError field with the error text
          document.querySelector("#"+formId+" .formError").innerHTML = 'Sorry, an error has occured. Please try again.';
  
          // Show (unhide) the form error field on the form
          document.querySelector("#"+formId+" .formError").style.display = 'block';
  
        } else {
          // If successful redirect the user
          window.location = '/cart/view';
        }
      });


    } else {
      // If the request comes back as something other than 200, log the user out (on the assumption that the api is temporarily down or the users token is bad)
      app.logUserOut();
    }
  });
};

// Load the dashboard page specifically
app.loadCartAdd = function(){
  // Get the email number from the current token, or log the user out if none is there
  

  var email = typeof(app.config.sessionToken.email) == 'string' ? app.config.sessionToken.email : false;
  if(email){
    // Fetch the user data
    var queryStringObject = {
      'email' : email
    };
    app.client.request(undefined,'api/itens', 'GET', queryStringObject, undefined, function(statusCode, responsePayload){
      if(statusCode == 200){

        // Determine how many itens are there
        var allItens = typeof(responsePayload) == 'object' && responsePayload instanceof Array && responsePayload.length > 0 ? responsePayload : [];
        if(allItens.length > 0){
          document.getElementById("noItensMessage").style.display = 'none';
          // Show each created item as a new row in the table
          allItens.forEach(function(item){
              // Make the item data into a table row
              var table = document.getElementById("menuList");
              var tr = table.insertRow(-1);
              tr.classList.add('checkRow');
              var td0 = tr.insertCell(0);
              var td1 = tr.insertCell(1);
              td0.innerHTML = item.productName;
              //td0.onclick = function(){console.log(td0.innerHTML)};
              td0.onclick = function(){
                app.addItem(td0.innerHTML)
              };
              td1.innerHTML = item.Price;
          });

        } else {
          // Show 'you have no itens' message
          document.getElementById("noItensMessage").style.display = 'table-row';

          // Show the see menu
          document.getElementById("seeMenu").style.display = 'block';

        }
      } else {
        // If the request comes back as something other than 200, log the user our (on the assumption that the api is temporarily down or the users token is bad)
        app.logUserOut();
      }
    });
  } else {
    app.logUserOut();
  }
};

// Loop to renew token often
app.tokenRenewalLoop = function(){
    setInterval(function(){
      app.renewToken(function(err){
        if(!err){
          console.log("Token renewed successfully @ "+Date.now());
        }
      });
    },1000 * 60);
  };
  
  // Init (bootstrapping)
  app.init = function(){
  
    // Bind all form submissions
    app.bindForms();
  
    // Bind logout logout button
    app.bindLogoutButton();
  
    // Get the token from localstorage
    app.getSessionToken();
  
    // Renew token
    app.tokenRenewalLoop();
  
    // Load data on page
    app.loadDataOnPage();
  
};
  
  // Call the init processes after the window loads
window.onload = function(){
    app.init();
};
  
    