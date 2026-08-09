function buildGraph(edges=[]){
  const nodes=new Set();
  const adjacency=new Map();

  for(const edge of edges){
    nodes.add(edge.sourceService);
    nodes.add(edge.targetService);

    if(!adjacency.has(edge.sourceService))
      adjacency.set(edge.sourceService,[]);

    adjacency.get(edge.sourceService).push({
      service:edge.targetService,
      criticality:edge.criticality,
      dependencyType:edge.dependencyType
    });
  }

  return {
    nodes:[...nodes],
    edges,
    adjacency:Object.fromEntries(adjacency)
  };
}

function impactedServices(graph,failedService){
  const impacted=new Set([failedService]);
  const queue=[failedService];

  while(queue.length){
    const target=queue.shift();

    for(const edge of graph.edges){
      if(edge.targetService===target &&
         !impacted.has(edge.sourceService)){
        impacted.add(edge.sourceService);
        queue.push(edge.sourceService);
      }
    }
  }

  return [...impacted];
}

module.exports={buildGraph,impactedServices};
