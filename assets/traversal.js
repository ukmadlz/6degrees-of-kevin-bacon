var traversal = {};

(function() {

  // Standard traversal
  traversal.traversal = [
    'g',
    'V()',
    "hasLabel('person')",
    "has('type','Actor')",
    "has('name','Kevin Bacon')",
    'repeat(__.outE().inV().dedup().simplePath())',
    "until(__.hasLabel('person').has('name','Bill Paxton'))",
    "limit(12)",
    'path()',
  ];

  // Standard traversal
  traversal.annotation = [
    'The traversal object for the Graph.',
    'Start looking at all the Vertices.',
    'Find all Vertices that have the label \'person\'',
    'Find all Vertices with a property called type of \'Actor\'',
    'Find all Vertices with a property called name of \'Kevin Bacon\'',
    'Look at the next Edge and Vertex from the current Vertex, and repeat.',
    'Repeat until the current Vertex has a label of \'person\', and a name property of Bill Paxton',
    'Limit the repeat to 12 rotations',
    'Return the complete path',
  ];

  // Actor
  traversal.addActor = function(actor) {
    traversal.traversal[6]  = "until(__.hasLabel('person').has('name','" + actor + "'))";
    traversal.annotation[6] = 'Repeat until the current Vertex has a label of person, and a name property of ' + actor;
    return traversal;
  };

  // All Paths
  traversal.allPaths = function() {
    traversal.traversal[5] = 'repeat(__.outE().inV().simplePath())';
    return traversal;
  };

  // As a string
  traversal.toString = function() {
    return traversal.traversal.join('.');
  };

  // Annotated string
  traversal.annotated = function() {
    var annotation = [];

    for (i = 0; i < traversal.traversal.length; i++) {
      annotation.push('<a href="#" data-toggle="tooltip" data-placement="right"  title="' + traversal.annotation[i] + '">' + traversal.traversal[i] + '</a>');
    }

    return annotation.join('\n.');
  };

  // export the namespace object
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = traversal;
  }
})();
