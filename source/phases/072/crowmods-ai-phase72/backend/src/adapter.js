class AutoscalingAdapter{
  async getCapacity(_consumerGroup){
    throw new Error("getCapacity not implemented");
  }

  async applyCapacity(_consumerGroup,_workers){
    throw new Error("applyCapacity not implemented");
  }

  async rollbackCapacity(_consumerGroup,_workers){
    throw new Error("rollbackCapacity not implemented");
  }
}

class MemoryAutoscalingAdapter extends AutoscalingAdapter{
  constructor(){
    super();
    this.capacity=new Map();
  }

  async getCapacity(consumerGroup){
    return this.capacity.get(consumerGroup)||1;
  }

  async applyCapacity(consumerGroup,workers){
    this.capacity.set(consumerGroup,Number(workers));
    return {
      consumerGroup,
      workers:Number(workers),
      applied:true
    };
  }

  async rollbackCapacity(consumerGroup,workers){
    this.capacity.set(consumerGroup,Number(workers));
    return {
      consumerGroup,
      workers:Number(workers),
      rolledBack:true
    };
  }
}

module.exports={
  AutoscalingAdapter,
  MemoryAutoscalingAdapter
};
