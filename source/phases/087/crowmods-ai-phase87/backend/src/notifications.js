class NotificationProvider{
  async health(){
    throw new Error("health not implemented");
  }

  async send(_destination,_message){
    throw new Error("send not implemented");
  }
}

class MemoryNotificationProvider extends NotificationProvider{
  constructor(){
    super();
    this.messages=[];
  }

  async health(){
    return {
      healthy:true,
      provider:"memory-notification"
    };
  }

  async send(destination,message){
    const result={
      destination,
      message,
      sent:true,
      mode:"SIMULATION",
      sentAt:new Date().toISOString()
    };

    this.messages.push(result);
    return result;
  }
}

module.exports={
  NotificationProvider,
  MemoryNotificationProvider
};
