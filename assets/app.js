$(document).ready(function() {

  var actors = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.whitespace,
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: '/actors'
  });

  // passing in `null` for the `options` arguments will result in the default
  // options being used
  $('#actor').typeahead(null, {
    name: 'actors',
    source: actors
  });

  // Find the Bacon number
  var ajaxRequest = [];
  $('form').on('submit', function(e) {
    e.preventDefault();

    var graphContainer = $('#graph-data').parent().parent().parent();
    var queryContainer = $('#query').parent().parent().parent();

    // Loading spinner
    var loadingSpinner = '<i class="fa fa-spinner fa-spin"></i>';
    $('#graph-data, #query, #the-graph').html(loadingSpinner);

    var actorName = $('#actor').val();

    var url = '/bacon/' + actorName;
    traversal.addActor(actorName);

    if ($('#showall').is(':checked')) {
      url = url + '/showall';
      traversal.allPaths();
    }

    $('#query').html(traversal.toString());
    if (queryContainer.hasClass('hidden')) {
      queryContainer.removeClass('hidden');
    }

    if (ajaxRequest.length > 0) {
      ajaxRequest[0].abort();
    }
    ajaxRequest.push($.get(url, function(data) {
      console.log(data);
      $('#query').html(data.query);

      $('#graph-data').html(JSON.stringify(data.data, null, 4));
      if (graphContainer.hasClass('hidden')) {
        graphContainer.removeClass('hidden');
      }

      var rawNodes = [];
      var ignoreNodes = [];
      var rawEdges = [];
      var ignoreEdges = [];

      for (i = 0; i < data.data.length; i++) {
        var path = data.data[i].objects;
        for (j = 0; j < path.length; j++) {
          var obj = path[j];
          if (obj.type == 'vertex') {
            if (ignoreNodes.indexOf(obj.id) < 0) {
              var nodeObject = {
                id: obj.id,
                label: obj.properties.name[0].value
              }
              if (obj.label == 'film') {
                nodeObject.color = {
                  background:'#F03967',
                  border:'#713E7F',
                  highlight:{
                    background:'red',
                    border:'black'
                  }
                };
              }
              if (obj.label == 'person' && obj.properties.name[0].value == 'Kevin Bacon') {
                nodeObject.shape = 'circularImage';
                nodeObject.image = 'http://www.nigelfarndale.com/wp-content/uploads/2013/11/kevin-bacon-0808-medium-new.jpg';
              } else if (obj.label == 'person' && obj.properties.name[0].value == actorName) {
                nodeObject.color = {
                  background:'#dff0d8'
                };
              }
              rawNodes.push(nodeObject);
              ignoreNodes.push(obj.id);
            }
          }

          if (obj.type == 'edge') {
            if (ignoreEdges.indexOf(obj.id) < 0) {
              rawEdges.push({
                from: obj.outV,
                to: obj.inV
              });
              ignoreEdges.push(obj.id);
            }
          }
        }
      }

      console.log(rawNodes)

      // create an array with nodes
      var nodes = new vis.DataSet(rawNodes);

      // create an array with edges
      var edges = new vis.DataSet(rawEdges);

      // create a network
      var container = document.getElementById('the-graph');
      var data = {
        nodes: nodes,
        edges: edges
      };
      var options = {};
      var network = new vis.Network(container, data, options);
    }));
  });

});
