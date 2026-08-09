function installGracefulShutdown(server, pool){
  const shutdown=async(signal)=>{
    console.log(`Received ${signal}; shutting down gracefully`);

    server.close(async()=>{
      try{
        await pool.end();
        process.exit(0);
      }catch(error){
        console.error("Shutdown error",error);
        process.exit(1);
      }
    });

    setTimeout(()=>{
      console.error("Forced shutdown after timeout");
      process.exit(1);
    },30000).unref();
  };

  process.once("SIGTERM",()=>shutdown("SIGTERM"));
  process.once("SIGINT",()=>shutdown("SIGINT"));
}

module.exports={installGracefulShutdown};
