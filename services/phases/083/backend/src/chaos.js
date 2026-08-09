class ChaosProvider{
  async inject(_fault){
    throw new Error("inject not implemented");
  }

  async recover(_fault){
    throw new Error("recover not implemented");
  }

  async rollback(_fault){
    throw new Error("rollback not implemented");
  }
}

class MemoryChaosProvider extends ChaosProvider{
  async inject(fault){
    return {
      mode:"SIMULATION",
      fault,
      injected:true
    };
  }

  async recover(fault){
    return {
      mode:"SIMULATION",
      fault,
      recovered:true
    };
  }

  async rollback(fault){
    return {
      mode:"SIMULATION",
      fault,
      rolledBack:true
    };
  }
}

module.exports={
  ChaosProvider,
  MemoryChaosProvider
};
