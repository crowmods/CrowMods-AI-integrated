function forecastExhaustion({
  remainingBudgetPercent,
  consumptionRatePercentPerHour,
  horizonHours=24
}){
  if(remainingBudgetPercent<0||
     consumptionRatePercentPerHour<0)
    throw new Error(
      "invalid_forecast_inputs"
    );

  if(consumptionRatePercentPerHour===0)
    return {
      forecastStatus:"SAFE",
      hoursToExhaustion:null,
      horizonHours
    };

  const hours=
    remainingBudgetPercent/
    consumptionRatePercentPerHour;

  const status=
    hours<=horizonHours
      ?"EXHAUSTION_FORECAST"
      :hours<=horizonHours*2
        ?"AT_RISK"
        :"SAFE";

  return {
    forecastStatus:status,
    hoursToExhaustion:Number(
      hours.toFixed(3)
    ),
    horizonHours
  };
}

module.exports={
  forecastExhaustion
};
