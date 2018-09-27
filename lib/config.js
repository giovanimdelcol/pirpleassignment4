/*
 * Create and export configuration variables
 *
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'staging',
  'hashingSecret' : 'thisIsASecret',
  'maxChecks' : 5,
  'templateGlobals' : {
    'appName' : 'UptimeChecker',
    'companyName' : 'NotARealCompany, Inc.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:3000/'
  },
  'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  },
  'stripe' : {
    'hostUrl' : 'api.stripe.com',
    'chargePath':'/v1/charges',
    'token':'tok_visa',
    'publicKey':'pk_test_4xJHMKGi11FXYJf4YPODZHWw',
    'secretKey':'XXX'
  },
  'mailgun': {
    'hostUrl' : 'api.mailgun.net',
    'messagePath' : '/v3/sandbox5be9e68ac3d94aeaa90f882391f51337.mailgun.org/messages',
    'from' : 'postmaster@sandbox5be9e68ac3d94aeaa90f882391f51337.mailgun.org',
    'publicKey':'pubkey-02339ccfb8a2a47e8edcdf853d873ef8',
    'secretKey':'XXX'
  }
};

// Production environment
environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'hashingSecret' : 'thisIsAlsoASecret',
  'maxChecks' : 10,
  'templateGlobals' : {
    'appName' : 'ApiDelivery',
    'companyName' : 'NotARealCompany, Inc.',
    'yearCreated' : '2018',
    'baseUrl' : 'http://localhost:3000/'
  },
  'twilio' : {
    'accountSid' : '',
    'authToken' : '',
    'fromPhone' : ''
  }
};

// Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check that the current environment is one of the environments above, if not default to staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
