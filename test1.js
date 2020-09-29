'use strict'

const autocannon = require('autocannon')
const { v4: uuidv4 } = require('uuid');
const port = process.env.KEYS || "";

const instance = autocannon({
  title: 'GET Neighbors',
  url: `http://localhost:${port}/neighbors`,
  connections: 10, //default
  pipelining: 1, // default
  duration: 10, // default
  method: 'POST',
  body:JSON.stringify({id: (Math.random() * 10000) + 1, text:uuidv4() })
},console.table("GET Neighbors"))


autocannon.track(instance,{renderProgressBar: true},)
