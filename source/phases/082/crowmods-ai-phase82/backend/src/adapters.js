class ReplicationProvider{
  async health(){
    throw new Error("health not implemented");
  }

  async getLag(_source,_target){
    throw new Error("getLag not implemented");
  }

  async checkpoint(_source,_target){
    throw new Error("checkpoint not implemented");
  }
}

class MemoryReplicationProvider extends ReplicationProvider{
  async health(){
    return {
      healthy:true,
      provider:"memory-replication"
    };
  }

  async getLag(source,target){
    return {
      source,
      target,
      lagSeconds:5,
      healthy:true
    };
  }

  async checkpoint(source,target){
    return {
      source,
      target,
      checkpoint:"simulated-checkpoint",
      created:true
    };
  }
}

class TrafficManagementProvider{
  async health(){
    throw new Error("health not implemented");
  }

  async dryRun(_source,_target){
    throw new Error("dryRun not implemented");
  }

  async shift(_source,_target){
    throw new Error("shift not implemented");
  }

  async rollback(_target,_source){
    throw new Error("rollback not implemented");
  }
}

class MemoryTrafficProvider extends TrafficManagementProvider{
  async health(){
    return {
      healthy:true,
      provider:"memory-traffic"
    };
  }

  async dryRun(source,target){
    return {
      mode:"DRY_RUN",
      source,
      target,
      valid:true
    };
  }

  async shift(source,target){
    return {
      mode:"SIMULATION",
      source,
      target,
      shifted:true
    };
  }

  async rollback(target,source){
    return {
      mode:"SIMULATION",
      from:target,
      to:source,
      rolledBack:true
    };
  }
}

module.exports={
  ReplicationProvider,
  MemoryReplicationProvider,
  TrafficManagementProvider,
  MemoryTrafficProvider
};
