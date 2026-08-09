class ModelProvider{
  constructor(config={}){
    this.name=config.name||"mock";
    this.model=config.model||"development";
  }

  async generate(input){
    return {
      provider:this.name,
      model:this.model,
      text:"Model-provider adapter placeholder. Supply a configured provider implementation.",
      inputSummary:{
        taskType:input.taskType||null,
        hasContext:Boolean(input.context)
      }
    };
  }
}

function createModelProvider(){
  return new ModelProvider({
    name:process.env.AI_PROVIDER||"mock",
    model:process.env.AI_MODEL||"development"
  });
}

module.exports={ModelProvider,createModelProvider};
