class NotificationProvider{
  constructor(name="console"){
    this.name=name;
  }

  async send(event){
    console.log(JSON.stringify({
      provider:this.name,
      type:"INCIDENT_NOTIFICATION",
      event
    }));
    return {accepted:true,provider:this.name};
  }
}

function createNotifier(){
  return new NotificationProvider(
    process.env.NOTIFICATION_PROVIDER||"console"
  );
}

module.exports={NotificationProvider,createNotifier};
