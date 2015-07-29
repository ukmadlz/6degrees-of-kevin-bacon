var Hapi      = require('hapi');
var gds       = require('gds-wrapper');
var traversal = require('./assets/traversal')

// Set config
if (process.env.VCAP_SERVICES) {
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  var graphService = 'GraphDataStore'
  if (vcapServices[graphService] && vcapServices[graphService].length > 0) {
    var config = vcapServices[graphService][0];
  } else {
    var config = require('./config.json');
  }
} else {
  var config = require('./config.json');
}

// Set up the DB
var movies = gds({
  url: config.credentials.apiURL,
  username: config.credentials.username,
  password: config.credentials.password   
});

var server = new Hapi.Server({ debug: { request: ['error'] } });
process.env.VCAP_APP_HOST || 'localhost', process.env.VCAP_APP_PORT || 3000
server.connection({
  host: process.env.VCAP_APP_HOST || 'localhost',
  port: process.env.VCAP_APP_PORT || 3000
});

server.start(function() {
  console.log('Server running at:', server.info.uri);
});

server.views({
  engines: { jade: require('jade') },
  path: __dirname + '/templates'
});

server.route({
    method: 'GET',
    path: '/assets/app.js',
    handler: {
        file: function (request) {
            return 'assets/app.js';
        }
    }
});

server.route({
    method: 'GET',
    path: '/assets/traversal.js',
    handler: {
        file: function (request) {
            return 'assets/traversal.js';
        }
    }
});

server.route({
    method: 'GET',
    path: '/assets/ibm-cds.css',
    handler: {
        file: function (request) {
            return 'assets/ibm-cds.css';
        }
    }
});

server.route({
    method: 'GET',
    path: '/assets/ibm.woff',
    handler: {
        file: function (request) {
            return 'assets/ibm.woff';
        }
    }
});

server.route({
    method: 'GET',
    path: '/assets/bloodhound.min.js',
    handler: {
        file: function (request) {
            return 'assets/bloodhound.min.js';
        }
    }
});

server.route({
    method: 'GET',
    path: '/assets/typeahead.bundle.min.js',
    handler: {
        file: function (request) {
            return 'assets/typeahead.bundle.min.js';
        }
    }
});

server.route({
    method: 'GET',
    path: '/assets/typeahead.jquery.min.js',
    handler: {
        file: function (request) {
            return 'assets/typeahead.jquery.min.js';
        }
    }
});

server.route({
  method: 'GET',
  path: '/',
  handler: function(request, reply) {
    reply.view('index');
  }
});

var gremlinQuery = function(request, reply) {
  // Kev 2097192
  // Bill 1720408
  var actor = (request.params.actor)?request.params.actor:'Bill Paxton';
  traversal.addActor(actor);

  // var traversal = [
  //   'V()',
  //   "hasLabel('person')",
  //   "has('type','Actor')",
  //   "has('name','Kevin Bacon')",
  //   'repeat(__.outE().inV().dedup().simplePath())',
  //   "until(__.hasLabel('person').has('name','"+actor+"'))",
  //   "limit(12)",
  //   'path()'
  // ]

  // Show All Paths
  if (request.params.showall) {
    // traversal[4] = 'repeat(__.outE().inV().simplePath())';
    traversal.allPaths();
  }
  //g.V().has('type','Actor').has('name','Kevin Bacon').aggregate('x').repeat(__.outE().inV().simplePath()).until(__.has('name','Robin Wright Penn')).path()
  console.log(traversal.traversal);
  console.log(traversal.toString());
  movies.gremlin(traversal.traversal, function(e, r, b){
    if (e) {
      console.log('--Error--');
      console.log(e);
      console.log('--Response--');
      console.log(r);
    }
    var b = JSON.parse(b);
    returnData = {};
    returnData.query = traversal.join('.');
    returnData.data = b.result.data;
    // var returnData = JSON.stringify(returnData, null, 4);
    console.log(b);
    reply(returnData);
  });
}

server.route({
  method: 'GET',
  path: '/bacon',
  handler: gremlinQuery
});

server.route({
  method: 'GET',
  path: '/bacon/{actor}',
  handler: gremlinQuery
});

server.route({
  method: 'GET',
  path: '/bacon/{actor}/{showall}',
  handler: gremlinQuery
});

server.route({
  method: 'GET',
  path: '/actors',
  handler: function(request, reply) {
    movies.vertices.properties({'type':'Actor'}, function(e, r, b){
      if(e) {
        console.log(e);
        console.log(r);
      }
      var actorList = [];
      var b = JSON.parse(b);
      if(!e || b.status.code == 200 || b.status_code == '200') {
        for(i=0;i<b.result.data.length;i++) {
          var actor = b.result.data[i];
          actorList.push(actor.properties.name[0].value);
        }
      }
      reply(actorList);
    });
  }
});
