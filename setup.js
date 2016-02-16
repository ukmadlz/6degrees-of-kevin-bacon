'use strict';

require('dotenv').load({ silent: true });
var GDS = require('gds-wrapper');

// For remote
if (process.env.VCAP_SERVICES) {
  var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
  var graphService = 'IBM Graph';
  if (vcapServices[graphService] && vcapServices[graphService].length > 0) {
    var config = vcapServices[graphService][0];
  }
}

// Add the graph
var graph = new GDS({
  url: process.env.GRAPH_URL || config.credentials.apiURL,
  username: process.env.GRAPH_USERNAME || config.credentials.username,
  password: process.env.GRAPH_PASSWORD || config.credentials.password,
});

// Set Schema
graph.session(function (token) {
  graph.config.session = token;

  graph.schema().get(function (error, body) {
    console.log(JSON.stringify(body));

    var schema = require('./schema.json');
    graph.schema().set(schema, function (error, body) {
      if (error) console.log('Error:', error);
      console.log(body.result.data);
    });

  });

});
