class IncidentProviderContract{
  async getIncident(_incidentId){
    throw new Error("getIncident not implemented");
  }

  async addTimelineEntry(_incidentId,_entry){
    throw new Error("addTimelineEntry not implemented");
  }

  async transitionState(_incidentId,_state,_reason){
    throw new Error("transitionState not implemented");
  }
}

class MockIncidentProvider extends IncidentProviderContract{
  constructor(){
    super();
    this.data=new Map();
  }

  async getIncident(id){
    return this.data.get(id)||{
      id,
      state:"OPEN",
      timeline:[]
    };
  }

  async addTimelineEntry(id,entry){
    const incident=await this.getIncident(id);
    incident.timeline.push(entry);
    this.data.set(id,incident);
    return entry;
  }

  async transitionState(id,state,reason){
    const incident=await this.getIncident(id);
    const previous=incident.state;
    incident.state=state;
    incident.timeline.push({
      type:"STATE_CHANGE",
      previous,
      state,
      reason
    });
    this.data.set(id,incident);
    return incident;
  }
}

class SLOProviderContract{
  async getSLO(_name){
    throw new Error("getSLO not implemented");
  }

  async evaluate(_name,_observed){
    throw new Error("evaluate not implemented");
  }
}

class MockSLOProvider extends SLOProviderContract{
  constructor(){
    super();
    this.slos=new Map();
  }

  setSLO(name,target,direction="LOWER"){
    this.slos.set(name,{name,target,direction});
  }

  async getSLO(name){
    return this.slos.get(name)||{
      name,
      target:1,
      direction:"LOWER"
    };
  }

  async evaluate(name,observed){
    const slo=await this.getSLO(name);
    const healthy=slo.direction==="HIGHER"
      ?Number(observed)>=Number(slo.target)
      :Number(observed)<=Number(slo.target);

    return {
      ...slo,
      observed:Number(observed),
      healthy
    };
  }
}

module.exports={
  IncidentProviderContract,
  MockIncidentProvider,
  SLOProviderContract,
  MockSLOProvider
};
