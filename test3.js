'use strict'

const autocannon = require('autocannon')
const { v4: uuidv4 } = require('uuid');
const port = process.env.KEYS || "";

const instance = autocannon({
    title: "PUT STORAGE ITEM",
    url: `http://localhost:${port}/storage/${uuidv4()}`,
    connections: 10, //default
    pipelining: 1, // default
    duration: 60, // default
    method: 'PUT',
    body:JSON.stringify(uuidv4())
  },console.table("PUT STORAGE ITEM"))


autocannon.track(instance,{renderProgressBar: true})
