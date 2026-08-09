const test=require("node:test");
const assert=require("node:assert/strict");
const {
  MemoryTelemetryExporter
}=require("../src/telemetry");

test("telemetry exporter records simulated metric",async()=>{
  const exporter=new MemoryTelemetryExporter();

  const result=await exporter.exportMetric({
    metricName:"alert.count",
    metricValue:3
  });

  assert.equal(result.exported,true);
  assert.equal(result.mode,"SIMULATION");
});
