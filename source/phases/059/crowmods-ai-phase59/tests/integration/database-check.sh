#!/usr/bin/env sh
set -eu

: "${DATABASE_URL:?DATABASE_URL is required}"

node - <<'NODE'
const {Client}=require("pg");

(async()=>{
  const client=new Client({connectionString:process.env.DATABASE_URL});
  try{
    await client.connect();
    await client.query("SELECT 1");
    console.log("Database connectivity passed.");
  }finally{
    await client.end();
  }
})().catch(error=>{
  console.error(error.message);
  process.exit(1);
});
NODE
