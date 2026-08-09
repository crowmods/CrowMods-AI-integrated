const crypto=require("crypto");
const bcrypt=require("bcryptjs");

async function hashPassword(password){
  return bcrypt.hash(password,12);
}

async function verifyPassword(password,hash){
  return bcrypt.compare(password,hash);
}

function randomToken(){
  return crypto.randomBytes(32).toString("hex");
}

function sha256(value){
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hasPremiumAccess(user){
  return Boolean(
    user &&
    user.is_active &&
    user.premium_until &&
    new Date(user.premium_until)>new Date()
  );
}

module.exports={hashPassword,verifyPassword,randomToken,sha256,hasPremiumAccess};
