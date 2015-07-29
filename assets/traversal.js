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
    'path()'
  ];

  // Actor
  traversal.addActor = function(actor) {
    traversal.traversal[6] = "until(__.hasLabel('person').has('name','"+actor+"'))";
    return traversal;
  }

  // All Paths
  traversal.allPaths = function() {
    traversal.traversal[5] = 'repeat(__.outE().inV().simplePath())';
    return traversal;
  }

  // As a string
  traversal.toString = function() {
    return traversal.traversal.join('.');
  }

  // export the namespace object
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = traversal;
  }
})();
