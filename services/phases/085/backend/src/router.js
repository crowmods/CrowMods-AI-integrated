class AlertRouter{
  async health(){
    throw new Error("health not implemented");
  }

  async route(_alert){
    throw new Error("route not implemented");
  }
}

class MemoryAlertRouter extends AlertRouter{
  constructor(){
    super();
    this.events=[];
  }

  async health(){
    return {
      healthy:true,
      provider:"memory-alert-router"
    };
  }

  async route(alert){
    const event={
      ...alert,
      routed:true,
      routedAt:new Date().toISOString()
    };

    this.events.push(event);

    return event;
  }
}

module.exports={
  AlertRouter,
  MemoryAlertRouter
};
