class NotificationProvider{
  constructor(name="console"){
    this.name=name;
  }

  async send(event){
    console.log(JSON.stringify({
      provider:this.name,
      event
    }));

    return {
      accepted:true,
      provider:this.name,
      providerRef:`console-${Date.now()}`
    };
  }
}

function createNotifier(){
  return new NotificationProvider(
    process.env.NOTIFICATION_PROVIDER||"console"
  );
}

module.exports={NotificationProvider,createNotifier};
