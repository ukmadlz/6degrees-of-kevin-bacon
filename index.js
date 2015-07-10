var Hapi   = require('hapi');
var gds    = require('gds-wrapper');
var config = require('./config.json');

// Set up the DB
var movies = gds({
  url: config.credentials.apiURL,
  username: config.credentials.username,
  password: config.credentials.password
});

var server = new Hapi.Server();
server.connection({ port: 3000 });

server.start(function() {
  console.log('Server running at:', server.info.uri);
});

server.route({
  method: 'GET',
  path: '/bacon',
  handler: function(request, reply) {
    // Kev 2097192
    // Bill 1720408
    var traversal = [
      'V()',
      "has('type','Actor')",
      "has('name','Kevin Bacon')",
      "aggregate('x')",
      'repeat(__.outE().inV().simplePath())',
      "until(__.has('name','Bill Paxton'))",
      'path()'
    ]
    //g.V().has('type','Actor').has('name','Kevin Bacon').aggregate('x').repeat(__.outE().inV().simplePath()).until(__.has('name','Robin Wright Penn')).path()
    console.log('g.' + traversal.join('.'));
    movies.gremlin(traversal,function(e, r, b){
      if(e) {
        console.log(e);
        console.log(r);
      }
      reply('<code><pre>' + JSON.stringify(JSON.parse(b), null, 4) + '</pre></code>');
    });
  }
});
