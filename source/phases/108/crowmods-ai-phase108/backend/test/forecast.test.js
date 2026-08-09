const test=require("node:test");
const assert=require("node:assert/strict");
const {
  forecastExhaustion
}=require("../src/forecast");

test("safe budget has no exhaustion forecast",()=>{
  const result=forecastExhaustion({
    remainingBudgetPercent:10,
    consumptionRatePercentPerHour:0
  });

  assert.equal(
    result.forecastStatus,
    "SAFE"
  );
  assert.equal(
    result.hoursToExhaustion,
    null
  );
});

test("rapid consumption forecasts exhaustion",()=>{
  const result=forecastExhaustion({
    remainingBudgetPercent:2,
    consumptionRatePercentPerHour:1,
    horizonHours:24
  });

  assert.equal(
    result.forecastStatus,
    "EXHAUSTION_FORECAST"
  );
  assert.equal(
    result.hoursToExhaustion,
    2
  );
});
