const crypto = require('crypto');

const addresses = process.env.ADDRESSES || "";

const identifierIds = addresses.split(" ").map(address => {
  const hash = crypto.createHash('md5').update(address).digest('hex');
  return hash;
}).join(" ");

console.log(identifierIds)
