const crypto = require('crypto');

// Get the keys
const keys = process.env.KEYS || "";

// Generate the identifiers using the "md5" hash function 
// The identifier space is 256-bit
const hashedKeys = keys.split(" ").map(key => {
  const hash = crypto.createHash('md5').update(key).digest('hex');
  return hash;
}).join(" ");

console.log(hashedKeys)
