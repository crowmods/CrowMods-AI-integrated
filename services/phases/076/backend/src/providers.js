class IncidentProvider {
  async getIncident(_incidentId) {
    throw new Error("getIncident not implemented");
  }

  async addTimelineEntry(_incidentId,_entry) {
    throw new Error("addTimelineEntry not implemented");
  }
}

class MemoryIncidentProvider extends IncidentProvider {
  constructor() {
    super();
    this.incidents=new Map();
  }

  async getIncident(incidentId) {
    return this.incidents.get(incidentId) || {
      id:incidentId,
      state:"UNKNOWN",
      timeline:[]
    };
  }

  async addTimelineEntry(incidentId,entry) {
    const incident=await this.getIncident(incidentId);
    incident.timeline.push(entry);
    this.incidents.set(incidentId,incident);
    return entry;
  }
}

class SLOProvider {
  async getSLO(_name) {
    throw new Error("getSLO not implemented");
  }
}

class MemorySLOProvider extends SLOProvider {
  constructor() {
    super();
    this.slos=new Map();
  }

  setSLO(name,value) {
    this.slos.set(name,value);
  }

  async getSLO(name) {
    return this.slos.get(name) || {
      name,
      target:1,
      direction:"LOWER"
    };
  }
}

module.exports={
  IncidentProvider,
  MemoryIncidentProvider,
  SLOProvider,
  MemorySLOProvider
};
