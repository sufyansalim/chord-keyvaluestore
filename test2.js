'use strict'

const autocannon = require('autocannon')
const port = process.env.KEYS || "";

const data = ['LAKERS','NIGGETS','HEAT','CELTICS','THUNDER','WARRIOES','CLIPPERS','BUCKS']

let randIdx = Math.floor(Math.random() * data.length);
let randKey = data.splice(randIdx,1)[0];

const instance = autocannon({
  title: "GET STORAGE ITEMS",
  url: `http://localhost:${port}/storage/${randKey}`,
  connections: 10, //default
  pipelining: 1, // default
  duration: 10, // default
},console.table("GET STORAGE ITEMS"))


autocannon.track(instance,{renderProgressBar: true})

