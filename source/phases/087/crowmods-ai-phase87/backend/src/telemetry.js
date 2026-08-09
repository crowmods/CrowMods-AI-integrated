class TelemetryExporter{
  async health(){
    throw new Error("health not implemented");
  }

  async exportMetric(_metric){
    throw new Error("exportMetric not implemented");
  }
}

class MemoryTelemetryExporter extends TelemetryExporter{
  constructor(){
    super();
    this.metrics=[];
  }

  async health(){
    return {
      healthy:true,
      exporter:"memory-telemetry"
    };
  }

  async exportMetric(metric){
    const result={
      ...metric,
      exported:true,
      mode:"SIMULATION",
      exportedAt:new Date().toISOString()
    };

    this.metrics.push(result);
    return result;
  }
}

module.exports={
  TelemetryExporter,
  MemoryTelemetryExporter
};
