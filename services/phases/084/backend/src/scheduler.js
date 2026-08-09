function nextRunFromCadence(cadence,from=new Date()){
  const date=new Date(from);

  if(cadence==="hourly")
    date.setUTCHours(date.getUTCHours()+1);

  else if(cadence==="daily")
    date.setUTCDate(date.getUTCDate()+1);

  else if(cadence==="weekly")
    date.setUTCDate(date.getUTCDate()+7);

  else if(cadence==="monthly")
    date.setUTCMonth(date.getUTCMonth()+1);

  else
    throw new Error("Unsupported cadence");

  return date.toISOString();
}

class SchedulerAdapter{
  async schedule(_job){
    throw new Error("schedule not implemented");
  }

  async trigger(_job){
    throw new Error("trigger not implemented");
  }
}

class MemorySchedulerAdapter extends SchedulerAdapter{
  constructor(){
    super();
    this.jobs=new Map();
  }

  async schedule(job){
    this.jobs.set(job.id,{
      ...job,
      scheduled:true
    });

    return this.jobs.get(job.id);
  }

  async trigger(job){
    return {
      triggered:true,
      jobId:job.id,
      triggeredAt:new Date().toISOString()
    };
  }
}

module.exports={
  nextRunFromCadence,
  SchedulerAdapter,
  MemorySchedulerAdapter
};
