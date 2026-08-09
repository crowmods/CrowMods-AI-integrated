const fs=require("fs");
const path=require("path");
const crypto=require("crypto");
const {Pool}=require("pg");

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:true}:false
});

function checksum(text){
  return crypto.createHash("sha256").update(text).digest("hex");
}

async function ensureTable(client){
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations(
      version TEXT PRIMARY KEY,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function run(){
  const client=await pool.connect();

  try{
    await client.query("BEGIN");
    await ensureTable(client);

    const dir=path.join(__dirname,"../../database/migrations");

    if(!fs.existsSync(dir)){
      throw new Error(`Migration directory not found: ${dir}`);
    }

    const files=fs.readdirSync(dir)
      .filter(x=>x.endsWith(".sql"))
      .sort();

    for(const file of files){
      const version=file.replace(/\.sql$/,"");
      const sql=fs.readFileSync(path.join(dir,file),"utf8");
      const sum=checksum(sql);

      const existing=(await client.query(`
        SELECT checksum FROM schema_migrations WHERE version=$1
      `,[version])).rows[0];

      if(existing){
        if(existing.checksum!==sum){
          throw new Error(`Migration checksum changed: ${version}`);
        }
        continue;
      }

      await client.query(sql);
      await client.query(`
        INSERT INTO schema_migrations(version,checksum)
        VALUES($1,$2)
      `,[version,sum]);

      console.log(`Applied migration ${version}`);
    }

    await client.query("COMMIT");
    console.log("Migration run completed.");
  }catch(err){
    await client.query("ROLLBACK");
    console.error(err);
    process.exitCode=1;
  }finally{
    client.release();
    await pool.end();
  }
}

run();
