const crypto = require('crypto');

const keys = process.env.KEYS || "";

const hashedKeys = keys.split(" ").map(key => {
  const hash = crypto.createHash('md5').update(key).digest('hex');
  return hash;
}).join(" ");

console.log(hashedKeys)
