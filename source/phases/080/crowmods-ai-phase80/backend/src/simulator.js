class DRSimulationAdapter{
  async validateSnapshot(){
    throw new Error("validateSnapshot not implemented");
  }

  async restore(){
    throw new Error("restore not implemented");
  }

  async verifyIntegrity(){
    throw new Error("verifyIntegrity not implemented");
  }

  async reconnectProviders(){
    throw new Error("reconnectProviders not implemented");
  }
}

class MemoryDRSimulationAdapter extends DRSimulationAdapter{
  async validateSnapshot(){
    return {
      passed:true,
      observed:"valid-snapshot"
    };
  }

  async restore(){
    return {
      passed:true,
      observed:"isolated-restore-complete"
    };
  }

  async verifyIntegrity(){
    return {
      passed:true,
      observed:"integrity-match"
    };
  }

  async reconnectProviders(){
    return {
      passed:true,
      observed:"providers-reconnected"
    };
  }
}

module.exports={
  DRSimulationAdapter,
  MemoryDRSimulationAdapter
};
