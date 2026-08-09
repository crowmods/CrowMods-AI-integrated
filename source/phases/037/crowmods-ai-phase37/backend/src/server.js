const express=require("express");
const helmet=require("helmet");
const cors=require("cors");

const app=express();

app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

app.get("/health",(_req,res)=>res.json({
  ok:true,
  service:"crowmods-backend",
  version:"0.37.0"
}));

app.get("/ready",(_req,res)=>res.json({
  ready:true
}));

app.listen(process.env.PORT||4000,()=>console.log("Backend listening"));
