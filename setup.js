'use strict';

/**
 * Copyright 2016 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
