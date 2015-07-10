#!/usr/bin/env node
'use strict';

var fs             = require('fs');
var gds            = require('gds-wrapper');
var ArgumentParser = require('argparse').ArgumentParser;
var csv            = require('fast-csv');
var uuid           = require('uuid');

// Read the ARGS
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'Import actors and films into GraphDB'
});
parser.addArgument(
  [ '-c', '--credentials' ],
  {
    help: 'JSON file containing access credentials'
  }
);
parser.addArgument(
  [ '-p', '--path' ],
  {
    help: 'Path to CSV'
  }
);
var args = parser.parseArgs();

// Grab the config
fs.readFile(args.credentials, 'utf8', function (err,config) {
  if (err) {
    return console.log(err);
  }

  var config = JSON.parse(config);

  var gdsConfig = {
    url: config.credentials.apiURL,
    username: config.credentials.username,
    password: config.credentials.password
  };

  var importDb = gds(gdsConfig);

  var stream = fs.createReadStream(args.path);

  var importData    = [];
  var actorList     = [];
  var actorVertices = [];
  var filmList      = [];
  var filmVertices  = [];
  var graphsonArray = [];
  var csvStream = csv()
      .on('data', function(data) {
        importData.push(data);
        if (actorList.indexOf(data[0]) < 0) {
          actorList.push(data[0]);
        }

        if (filmList.indexOf(data[2]) < 0) {
          filmList.push(data[2]);
        }
      })
      .on('end', function() {
        // Build Actor Vertices
        for (var i = 0; i < actorList.length; i++) {
          var vertex = {
            id: 'a' + (i + 1),
            label: 'vertex',
            properties: {
              name: [{
                id: uuid.v4(),
                value: actorList[i]
              }],
              type: [{
                id: uuid.v4(),
                value: 'Actor'
              }]
            },
            inE: {
              actor: []
            },
            outE: {
              actor: []
            }
          }
          actorVertices[i] = vertex;
        }

        // Build Film Vertices
        for (var i = 0; i < filmList.length; i++) {
          var vertex = {
            id: 'f' + (i + 1),
            label: 'vertex',
            properties: {
              name: [{
                id: uuid.v4(),
                value: filmList[i]
              }],
              type: [{
                id: uuid.v4(),
                value: 'Film'
              }]
            },
            inE: {
              actor: []
            },
            outE: {
              actor: []
            }
          }
          filmVertices[i] = vertex;
        }

        // Match and add Edges
        for (var i = 0; i < importData.length; i++) {
          var actorId = actorList.indexOf(importData[i][0]);
          var filmId = filmList.indexOf(importData[i][2]);
          // Actor -> Film
          var edgeId = uuid.v4();
          var outE = {
            id: edgeId,
            inV: 'f' + (filmId + 1)
          }
          actorVertices[actorId].outE.actor.push(outE);
          var inE = {
            id: edgeId,
            inV: 'a' + (actorId + 1)
          }
          filmVertices[filmId].inE.actor.push(inE);
          // Film -> Actor
          var edgeId = uuid.v4();
          var outE = {
            id: edgeId,
            inV: 'a' + (actorId + 1)
          }
          filmVertices[filmId].outE.actor.push(outE);
          var inE = {
            id: edgeId,
            inV: 'f' + (filmId + 1)
          }
          actorVertices[actorId].inE.actor.push(inE);

        }
        for (var i = 0; i < actorVertices.length; i++) {
          graphsonArray.push(JSON.stringify(actorVertices[i]));
        }
        for (var i = 0; i < filmVertices.length; i++) {
          graphsonArray.push(JSON.stringify(filmVertices[i]));
        }
        // console.log(graphsonArray);
        var graphsonString = graphsonArray.join('\n');
        console.log(graphsonString);
        importDb.io.bulkload.graphson(graphsonString, function(e, r, b){
          console.log(e);
          console.log(b);
        });
        fs.writeFile("graphson", graphsonString, function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        });
      });

  stream.pipe(csvStream);

});
