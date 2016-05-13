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
var GDS            = require('gds-wrapper');
var ArgumentParser = require('argparse').ArgumentParser;
var csv            = require('fast-csv');
var uuid           = require('uuid');

// Read the ARGS
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
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
          var vertex = {
            id: 'a' + (i + 1),
            label: 'person',
            properties: {
              name: [{
                id: uuid.v4(),
                value: actorList[i],
              },
              ],
              type: [{
                id: uuid.v4(),
                value: 'Actor',
              },
            ],
            },
            inE: {},
            outE: {},
          };
          actorVertices[i] = vertex;
        }

        // Build Film Vertices
        for (var i = 0; i < filmList.length; i++) {
          var vertex = {
            id: 'f' + (i + 1),
            label: 'film',
            properties: {
              name: [{
                id: uuid.v4(),
                value: filmList[i],
              },
              ],
              type: [{
                id: uuid.v4(),
                value: 'Film',
              },
              ],
            },
            inE: {},
            outE: {},
          };
          filmVertices[i] = vertex;
        }

        // Match and add Edges
        for (var i = 0; i < importData.length; i++) {
          var actorId = actorList.indexOf(importData[i][0]);
          var filmId = filmList.indexOf(importData[i][2]);
          var relationship = importData[i][1];

          // Actor -> Film
          var edgeId = uuid.v4();
          var outE = {
            id: edgeId,
            inV: 'f' + (filmId + 1),
          };

          if (typeof actorVertices[actorId].outE[relationship] == 'undefined') {
            actorVertices[actorId].outE[relationship] = [];
          }

          actorVertices[actorId].outE[relationship].push(outE);
          var inE = {
            id: edgeId,
            inV: 'a' + (actorId + 1),
          };

          if (typeof filmVertices[filmId].inE[relationship] == 'undefined') {
            filmVertices[filmId].inE[relationship] = [];
          };

          filmVertices[filmId].inE[relationship].push(inE);

          // Film -> Actor
          var edgeId = uuid.v4();
          var outE = {
            id: edgeId,
            inV: 'a' + (actorId + 1),
          };

          if (typeof filmVertices[filmId].outE[relationship] == 'undefined') {
            filmVertices[filmId].outE[relationship] = [];
          };

          filmVertices[filmId].outE[relationship].push(outE);
          var inE = {
            id: edgeId,
            inV: 'f' + (filmId + 1),
          };

          if (typeof actorVertices[actorId].inE[relationship] == 'undefined') {
            actorVertices[actorId].inE[relationship] = [];
          };

          actorVertices[actorId].inE[relationship].push(inE);

        };

        for (var i = 0; i < actorVertices.length; i++) {
          graphsonArray.push(JSON.stringify(actorVertices[i]));
        };

        for (var i = 0; i < filmVertices.length; i++) {
          graphsonArray.push(JSON.stringify(filmVertices[i]));
        };

        // console.log(graphsonArray);
        var graphsonString = graphsonArray.join('\n');
        console.log(graphsonString);
        importDb.io().graphson(graphsonString, function (e, b) {
          console.log(e);
          console.log(b);
        });

        fs.writeFile('graphson', graphsonString, function (err) {
          if (err) {
            return console.log(err);
          }

          console.log('The file was saved!');
        });
      });

  stream.pipe(csvStream);

});
