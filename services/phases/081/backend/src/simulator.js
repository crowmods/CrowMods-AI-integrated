class TrafficFailoverAdapter{
  async simulate(_sourceRegion,_targetRegion){
    throw new Error("simulate not implemented");
  }

  async validate(_targetRegion){
    throw new Error("validate not implemented");
  }
}

class MemoryTrafficFailoverAdapter extends TrafficFailoverAdapter{
  async simulate(sourceRegion,targetRegion){
    return {
      status:"SIMULATED",
      sourceRegion,
      targetRegion,
      observed:"traffic-shift-simulated"
    };
  }

  async validate(targetRegion){
    return {
      status:"VALIDATED",
      targetRegion,
      healthy:true,
      observed:"recovery-traffic-healthy"
    };
  }
}

module.exports={
  TrafficFailoverAdapter,
  MemoryTrafficFailoverAdapter
};
