'use strict';

// Necessary Libs
var Hapi      = require('hapi');
var Path      = require('path');
var GDS       = require('gds-wrapper');
var traversal = require('./assets/traversal');

// Load env
require('dotenv').load();

// Set config
if (process.env.VCAP_SERVICES) {
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  var graphService = 'IBM Graph';
  if (vcapServices[graphService] && vcapServices[graphService].length > 0) {
    var config = vcapServices[graphService][0];
  }
}

// Set up the DB
var movies = new GDS({
  url: config.credentials.apiURL,
  username: config.credentials.username,
  password: config.credentials.password,
});

var server = new Hapi.Server({
  debug: {
    request: ['error', 'good'],
  },
  connections: {
    routes: {
      files: {
        relativeTo: Path.join(__dirname, ''),
      },
    },
  },
});

// Set Hapi Connections
server.connection({
  host: process.env.VCAP_APP_HOST || process.env.HOST || 'localhost',
  port: process.env.VCAP_APP_PORT || process.env.PORT || 3000,
});

// Hapi Log
server.log(['error', 'database', 'read']);

server.views({
  engines: { jade: require('jade') },
  path: __dirname + '/templates',
});

// Static
server.route({
  method: 'GET',
  path: '/{param*}',
  handler: {
    directory: {
      path: '.',
      redirectToSlash: true,
      index: true,
    },
  },
});

server.route({
  method: 'GET',
  path: '/',
  handler: function (request, reply) {
    reply.view('index');
  },
});

var gremlinQuery = function (request, reply) {
  console.log(request.params);
  var actor = (request.params.actor) ? request.params.actor : 'Bill Paxton';
  traversal.addActor(actor);

  // Reset All Paths
  traversal.resetAllPaths();

  // Show All Paths
  if (request.params.showall === 'showall') {
    traversal.allPaths();
  }

  console.log(traversal.traversal);
  console.log(traversal.toString());
  movies.gremlin('def g = graph.traversal();' + traversal.traversal.join('.'), function (e, b) {
    if (e) {
      console.log('--Error--');
      console.log(e);
      console.log('--Response--');
      console.log(r);
    }

    // var b = JSON.parse(b);
    var returnData = {};
    returnData.query = traversal.toString();
    returnData.data = b.result.data;

    console.log(b);
    reply(returnData);
  });
};

server.route({
  method: 'GET',
  path: '/bacon/{actor}/{showall}',
  handler: gremlinQuery,
});

server.route({
  method: 'GET',
  path: '/bacon/{actor}',
  handler: gremlinQuery,
});

server.route({
  method: 'GET',
  path: '/bacon',
  handler: gremlinQuery,
});

server.route({
  method: 'GET',
  path: '/actors',
  handler: function (request, reply) {
    movies.vertices().get({ type:'Actor' }, function (e, b) {
      if (e) {
        console.log(e);
        console.log(b);
      }

      var actorList = [];
      var b = JSON.parse(b);
      if (!e || b.status.code == 200 || b.status_code == '200') {
        for (var i = 0; i < b.result.data.length; i++) {
          var actor = b.result.data[i];
          actorList.push(actor.properties.name[0].value);
        }
      }

      reply(actorList);
    });
  },
});

// Start Hapi
server.start(function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log('Server started at: ' + server.info.uri);
  }
});
