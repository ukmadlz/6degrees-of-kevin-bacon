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
var md5            = require('md5');
var async          = require('async');

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
    var csvStream = csv()
      .on('data', function (data) {
        importData.push(data);
      })
      .on('end', function () {

        // Add Nodes
        async.eachSeries(importData, function (data, cb) {
          const relationship = data[1];
          const actor = data[0];
          const actorMd5 = md5(data[0]);
          const film = data[2];
          const filmMd5 = md5(data[2]);

          var gremlinQuery = 'def a'+actorMd5+' = graph.traversal().V().hasLabel(\"person\").has(\"name\",\"' + actor + '\");';
          gremlinQuery += 'if(a'+actorMd5+'.hasNext()){a'+actorMd5+'.next()}\n';
          gremlinQuery += 'else{ graph.addVertex(T.label, \"person\", \"name\", \"' + actor + '\", \"type\", \"Actor\"); }\n';
          gremlinQuery += 'def f'+filmMd5+' = graph.traversal().V().hasLabel(\"film\").has(\"name\",\"' + film + '\");';
          gremlinQuery += 'if(f'+filmMd5+'.hasNext()){f'+filmMd5+'.next()}\n';
          gremlinQuery += 'else{ graph.addVertex(T.label, \"film\", \"name\", \"' + film + '\", \"type\", \"Film\"); }\n';
          gremlinQuery += 'if(graph.traversal().V().hasLabel(\"person\").has(\"name\",\"' + actor + '\").out().hasLabel(\"film\").has(\"name\",\"' + film + '\").hasNext()){';
          gremlinQuery += 'graph.traversal().V().hasLabel(\"person\").has(\"name\",\"' + actor + '\").out().hasLabel(\"film\").has(\"name\",\"' + film + '\")';
          gremlinQuery += '}else{\n';
          gremlinQuery += 'def a = graph.traversal().V().hasLabel(\"person\").has(\"name\",\"' + actor + '\");\n';
          gremlinQuery += 'def f = graph.traversal().V().hasLabel(\"film\").has(\"name\",\"' + film + '\");\n';
          gremlinQuery += 'a.next().addEdge(\"' + relationship + '\", f.next());\n';
          gremlinQuery += '}\n';
          gremlinQuery += 'if(graph.traversal().V().hasLabel(\"film\").has(\"name\",\"' + film + '\").out().hasLabel(\"person\").has(\"name\",\"' + actor + '\").hasNext()){\n';
          gremlinQuery += 'graph.traversal().V().hasLabel(\"film\").has(\"name\",\"' + film + '\").out().hasLabel(\"person\").has(\"name\",\"' + actor + '\")';
          gremlinQuery += '}else{\n';
          gremlinQuery += 'def a = graph.traversal().V().hasLabel(\"person\").has(\"name\",\"' + actor + '\");\n';
          gremlinQuery += 'def f = graph.traversal().V().hasLabel(\"film\").has(\"name\",\"' + film + '\");\n';
          gremlinQuery += 'f.next().addEdge(\"' + relationship + '\", a.next());\n';
          gremlinQuery += '}\n';
          importDb.gremlin(gremlinQuery, function (e, b) {
            if (e) {
              console.log(e, b);
            } else {
              console.log(actor, '->', film);
            }
            cb();
          });
        }, function(err) {
          if (err) console.error('ERROR:', err);
        });

      });

    stream.pipe(csvStream);
  });

});
