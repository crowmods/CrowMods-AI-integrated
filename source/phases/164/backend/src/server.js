const express=require("express");
const helmet=require("helmet");
const cors=require("cors");
const {evaluate}=require("./phase-164");

const app=express();
app.use(helmet());
app.use(cors());
app.use(express.json({limit:"1mb"}));

app.get("/health",(_q,s)=>s.json({status:"healthy",phase:164}));
app.post("/api/security/crypto/phase-164/evaluate",
 (req,res)=>res.json(evaluate(req.body||{})));

app.listen(process.env.PORT||4000,()=>console.log(
 "CrowMods Phase 164 API running"));
