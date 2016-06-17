#!/usr/bin/env node
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

var fs             = require('fs');
var GDS            = require('ibm-graph-client');
var ArgumentParser = require('argparse').ArgumentParser;
var csv            = require('fast-csv');
var uuid           = require('uuid');

// Read the ARGS
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp: true,
  description: 'Import actors and films into GraphDB',
});
parser.addArgument(
  ['-c', '--credentials'],
  {
    help: 'JSON file containing access credentials',
  }
);
parser.addArgument(
  ['-p', '--path'],
  {
    help: 'Path to CSV',
  }
);
var args = parser.parseArgs();

// Grab the config
fs.readFile(args.credentials, 'utf8', function (err, config) {
  if (err) {
    return console.log(err);
  }

  var config = JSON.parse(config);

  // Format Config
  var gdsConfig = {
    url: config.credentials.apiURL,
    username: config.credentials.username,
    password: config.credentials.password,
  };

  // Setup wrapper library
  var importDb = new GDS(gdsConfig);

  // Update the session
  importDb.session(function (e, b) {
    if (!e) {
      importDb.config.session = b;
    }

    var stream = fs.createReadStream(args.path);

    var importData    = [];
    var actorList     = [];
    var actorVertices = [];
    var filmList      = [];
    var filmVertices  = [];
    var graphsonArray = [];
    var csvStream = csv()
      .on('data', function (data) {
        importData.push(data);
        if (actorList.indexOf(data[0]) < 0) {
          actorList.push(data[0]);
        }

        if (filmList.indexOf(data[2]) < 0) {
          filmList.push(data[2]);
        }
      })
      .on('end', function () {

        // Build Actor Vertices
        for (var i = 0; i < actorList.length; i++) {
          var gremlinQuery = 'def a' + (i + 1) + ' = graph.traversal().V().hasLabel(\"person\").has(\"name\",\"' + actorList[i] + '\");';
          gremlinQuery += 'if(a' + (i + 1) + '.hasNext()){a' + (i + 1) + '.next()}\n';
          gremlinQuery += 'else{ graph.addVertex(T.label, \"person\", \"name\", \"' + actorList[i] + '\", \"type\", \"Actor\"); }\n';
          importDb.gremlin(gremlinQuery, function (e, b) {
            if (e) {
              console.log(e, b)
            } else {
              console.log('Actor ' + b.result.data[0].properties.name[0].value + ' added');
            }
          });
        }


        // Build Film Vertices
        for (var i = 0; i < filmList.length; i++) {
          var gremlinQuery = 'def f' + (i + 1) + ' = graph.traversal().V().hasLabel(\"film\").has(\"name\",\"' + filmList[i] + '\");';
          gremlinQuery += 'if(f' + (i + 1) + '.hasNext()){f' + (i + 1) + '.next()}\n';
          gremlinQuery += 'else{ graph.addVertex(T.label, \"film\", \"name\", \"' + filmList[i] + '\", \"type\", \"Film\"); }\n';
          importDb.gremlin(gremlinQuery, function (e, b) {
            if (e) {
              console.log(e, b)
            } else {
              console.log('Film ' + b.result.data[0].properties.name[0].value + ' added');
            }
          });
        }

        // Match and add Edges
        for (var i = 0; i < importData.length; i++) {
          var relationship = importData[i][1];
          var gremlinQuery = 'if(graph.traversal().V().hasLabel(\"person\").has(\"name\",\"' + importData[i][0] + '\").out().hasLabel(\"film\").has(\"name\",\"' + importData[i][2] + '\").hasNext()){';
          gremlinQuery += 'graph.traversal().V().hasLabel(\"person\").has(\"name\",\"' + importData[i][0] + '\").out().hasLabel(\"film\").has(\"name\",\"' + importData[i][2] + '\")';
          gremlinQuery += '}else{\n';
          gremlinQuery += 'def a' + (i + 1) + ' = graph.traversal().V().hasLabel(\"person\").has(\"name\",\"' + importData[i][0] + '\");\n';
          gremlinQuery += 'def f' + (i + 1) + ' = graph.traversal().V().hasLabel(\"film\").has(\"name\",\"' + importData[i][2] + '\");\n';
          gremlinQuery += 'a' + (i + 1) + '.next().addEdge(\"' + relationship + '\", f' + (i + 1) + '.next());\n';
          gremlinQuery += '}\n';
          gremlinQuery += 'if(graph.traversal().V().hasLabel(\"film\").has(\"name\",\"' + importData[i][2] + '\").out().hasLabel(\"person\").has(\"name\",\"' + importData[i][0] + '\").hasNext()){\n';
          gremlinQuery += 'graph.traversal().V().hasLabel(\"film\").has(\"name\",\"' + importData[i][2] + '\").out().hasLabel(\"person\").has(\"name\",\"' + importData[i][0] + '\")';
          gremlinQuery += '}else{\n';
          gremlinQuery += 'def a' + (i + 1) + ' = graph.traversal().V().hasLabel(\"person\").has(\"name\",\"' + importData[i][0] + '\");\n';
          gremlinQuery += 'def f' + (i + 1) + ' = graph.traversal().V().hasLabel(\"film\").has(\"name\",\"' + importData[i][2] + '\");\n';
          gremlinQuery += 'f' + (i + 1) + '.next().addEdge(\"' + relationship + '\", a' + (i + 1) + '.next());\n';
          gremlinQuery += '}\n';
          console.log(gremlinQuery);
          importDb.gremlin(gremlinQuery, function (e, b) {
            if (e) {console.log(e, b);}
          });
        };

      });

    stream.pipe(csvStream);
  });

});
