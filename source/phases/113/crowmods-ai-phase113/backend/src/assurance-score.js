function calculateAssurance({
  evidenceScore,
  controlScore,
  governanceScore,
  reliabilityScore,
  riskScore
}){
  const factors=[
    evidenceScore,
    controlScore,
    governanceScore,
    reliabilityScore,
    riskScore
  ].map(Number);

  if(factors.some(v=>Number.isNaN(v))||
     factors.some(v=>v<0||v>100))
    return {
      score:null,
      status:"INSUFFICIENT_DATA"
    };

  const [
    evidence,
    control,
    governance,
    reliability,
    risk
  ]=factors;

  const score=Number(
    (
      evidence*.20+
      control*.30+
      governance*.15+
      reliability*.20+
      risk*.15
    ).toFixed(3)
  );

  let status="STRONG";
  if(score<80) status="WATCH";
  if(score<60) status="WEAK";

  return {
    score,
    evidenceScore:evidence,
    controlScore:control,
    governanceScore:governance,
    reliabilityScore:reliability,
    riskScore:risk,
    status
  };
}

module.exports={
  calculateAssurance
};
