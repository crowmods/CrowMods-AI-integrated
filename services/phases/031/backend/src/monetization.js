function minorToMajor(minor){
  return Number(minor||0)/100;
}

function summarizeRevenue(rows){
  const summary={INR:0,byProvider:{},byType:{}};

  for(const row of rows){
    const currency=row.currency||"INR";
    const amount=minorToMajor(row.amount_minor);

    summary[currency]=(summary[currency]||0)+amount;
    summary.byProvider[row.provider]=
      (summary.byProvider[row.provider]||0)+amount;
    summary.byType[row.event_type]=
      (summary.byType[row.event_type]||0)+amount;
  }

  return summary;
}

module.exports={minorToMajor,summarizeRevenue};
