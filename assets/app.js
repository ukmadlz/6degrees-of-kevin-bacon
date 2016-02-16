$(document).ready(function () {

  var actors = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: '/actors',
  });

  // passing in `null` for the `options` arguments will result in the default
  // options being used
  $('#actor').typeahead(null, {
    name: 'actors',
    source: actors,
  });

  // Find the Bacon number
  var ajaxRequest = [];
  $('form').on('submit', function (e) {
    e.preventDefault();

    var graphDataContainer = $('#graph-data').parent().parent().parent();
    var graphVisContainer = $('#the-graph').parent().parent();
    var queryContainer = $('#query').parent().parent().parent().parent();

    // Loading spinner
    var loadingSpinner = '<i class="fa fa-spinner fa-spin"></i>';
    $('#graph-data, #query, #the-graph, #bacon-number').html(loadingSpinner);

    var actorName = $('#actor').val();

    var url = '/bacon/' + actorName;
    traversal.addActor(actorName);

    // Reset All Paths
    traversal.resetAllPaths();

    if ($('#showall').is(':checked')) {
      url = url + '/showall';
      traversal.allPaths();
    }

    $('#query').html(traversal.annotated());
    $('[data-toggle="tooltip"]').tooltip();
    if (queryContainer.hasClass('hidden')) {
      queryContainer.removeClass('hidden');
    }

    if (ajaxRequest.length > 0) {
      ajaxRequest[0].abort();
    }

    ajaxRequest.push($.get(url, function (data) {
      console.log(data);

      // $('#query').html(data.query);

      $('#graph-data').html(JSON.stringify(data.data, null, 4));
      if (graphDataContainer.hasClass('hidden')) {
        graphDataContainer.removeClass('hidden');
        graphVisContainer.removeClass('hidden');
      }

      var rawNodes = [];
      var ignoreNodes = [];
      var rawEdges = [];
      var ignoreEdges = [];
      var baconNumber = 0;
      var tempBaconNumber = 0;

      for (i = 0; i < data.data.length; i++) {
        var path = data.data[i].objects;
        var tempBaconNumber = 0;
        for (j = 0; j < path.length; j++) {
          var obj = path[j];
          if (obj.type == 'vertex') {
            if (ignoreNodes.indexOf(obj.id) < 0) {
              var nodeObject = {
                id: obj.id,
                label: obj.properties.name[0].value,
                shape: 'circle',
              };

              if (obj.label == 'film') {
                nodeObject.color = {
                  background:'#41D6C3',
                  border:'#713E7F',
                  color: '#FFFFFF',
                  highlight:{
                    background:'red',
                    border:'black',
                  },
                };
              }

              if (obj.label == 'person' && obj.properties.name[0].value == 'Kevin Bacon') {
                nodeObject.shape = 'circularImage';
                nodeObject.image = 'http://www.nigelfarndale.com/wp-content/uploads/2013/11/kevin-bacon-0808-medium-new.jpg';
              } else if (obj.label == 'person' && obj.properties.name[0].value == actorName) {
                nodeObject.color = {
                  background:'#00B4A0',
                };
              }

              rawNodes.push(nodeObject);
              ignoreNodes.push(obj.id);
            }

            if (obj.label == 'person') {
              tempBaconNumber++;
            }
          }

          if (obj.type == 'edge') {
            if (ignoreEdges.indexOf(obj.id) < 0) {
              rawEdges.push({
                from: obj.outV,
                to: obj.inV,
              });
              ignoreEdges.push(obj.id);
            }
          }
        }

        // Check for shortest bacon!
        if (tempBaconNumber > 0) {
          if (baconNumber == 0
          && tempBaconNumber > 0) {
            baconNumber = tempBaconNumber;
          }

          if (tempBaconNumber < baconNumber) {
            baconNumber = tempBaconNumber;
          }
        }
      }

      console.log(rawNodes);

      // create an array with nodes
      var nodes = new vis.DataSet(rawNodes);

      // create an array with edges
      var edges = new vis.DataSet(rawEdges);

      // create a network
      var container = document.getElementById('the-graph');
      var data = {
        nodes: nodes,
        edges: edges,
      };
      var options = {};
      var network = new vis.Network(container, data, options);

      // Apply the Bacon Number
      $('#bacon-number').html('<strong>' + (baconNumber - 1) + '</strong>');
    }));
  });

});
