var express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const os = require("os");

// Create a new express application instance
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT || 42069;

const neighbors_identified_ids = process.env.NEIGHBORS_IDENTIFIER_IDS || "";
const neighbors_addresses = process.env.NEIGHBORS_ADDRESSES || "";
const object_map = process.env.OBJECT_MAP || "";
const node_index = process.env.INDEX || "";
const my_id = process.env.MY_ID || "";

const hostname = os.hostname();

const previous_node_id = neighbors_identified_ids.split(" ")[0];
const next_node_id = neighbors_identified_ids.split(" ")[1];

const previous_node_address = neighbors_addresses.split(" ")[0];
const next_node_address = neighbors_addresses.split(" ")[1];

const previous_node_hostname = previous_node_address.split(":")[0];
const previous_node_port = previous_node_address.split(":")[1];

const next_node_hostname = next_node_address.split(":")[0];
const next_node_port = next_node_address.split(":")[1];


function sortMapById(map) {
  let result = {};
  Object.keys(map).sort().forEach(function(key) {
    result[key] = map[key];
  });
  return result;
};

let map = object_map.split(" ").sort().reduce((acc, item) => {

  if (!item) {
    return acc;
  };

  const identifier_key = item.split(":")[0];
  const identifier_value = item.split(":")[1];
  const key = identifier_value.split(",")[0];
  const value = identifier_value.split(",")[1];

  const result = {
    [identifier_key]: value
  }
  return { ...acc, ...result };
}, {});

app.put('/storage/:key', function (req, res) {
  const value = req.body.data;
  const key = req.params.key;
  const hash_key = crypto.createHash('md5').update(key).digest('hex');
  
  console.log(`Info about ME: MY_ID: ${my_id}, node_index: ${node_index}, previous_node_address: ${previous_node_address}, next_node_address: ${next_node_address}, 
previous_node_id: ${previous_node_id}, next_node_id: ${next_node_id}`);
  console.log(`Info about MY tables: object_map: ${object_map}`);
  console.log(`Info about request: value: ${value}, key: ${key}, hash_key: ${hash_key}, req body: ${req.body}`)

  // Hit 
  if (map[hash_key]) {
    console.log("hit on host:", hostname)
    map[hash_key] = value;
    map = sortMapById(map);
    console.dir(map, { depth: null });
    res.status(200).send(`MODIFIED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
  } else {
    if (node_index == 0) {
      if (hash_key > next_node_id && hash_key < previous_node_id ) {
        console.log(`node == 0, PUT from ${hostname}:${port} to prev node: ${previous_node_address}`)
        axios.put(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`, `data=${value}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
              console.error(err);
          });
      } else if (hash_key > my_id && hash_key < next_node_id) {
        console.log(`node_index == 0, PUT from ${hostname}:${port} to next node: ${next_node_address}`)
        axios.put(`http://${next_node_hostname}:${next_node_port}/storage/${key}`, `data=${value}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
              console.error(err);
          });
      } else {
        console.log("node_index == 0, CREATED on host:", hostname)
        map[hash_key] = value;
        map = sortMapById(map);
        console.dir(map, { depth: null });
        res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
      }
    } else {
      if (hash_key < previous_node_id) {
        console.log(`node != 0, PUT from ${hostname}:${port} to prev node: ${previous_node_address}`)
        axios.put(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`, `data=${value}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
              console.error(err);
          });
      } else if (hash_key > my_id) {
        console.log(`node_index != 0, PUT from ${hostname}:${port} to next node: ${next_node_address}`)
        axios.put(`http://${next_node_hostname}:${next_node_port}/storage/${key}`, `data=${value}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
              console.error(err);
          });
      } else {
        console.log("node_index != 0, CREATED on host:", hostname)
        map[hash_key] = value;
        map = sortMapById(map);
        console.dir(map, { depth: null });
        res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
      }
    }
  }
});

app.get('/storage/:key', function (req, res) {
  const value = req.body.data;
  const key = req.params.key;
  const hash_key = crypto.createHash('md5').update(key).digest('hex');
  
  console.log(`Info about ME: MY_ID: ${my_id}, node_index: ${node_index}, previous_node_address: ${previous_node_address}, next_node_address: ${next_node_address}, 
previous_node_id: ${previous_node_id}, next_node_id: ${next_node_id}`);
  console.log(`Info about MY tables: map: ${map}`);
  console.log(`Info about request: value: ${value}, key: ${key}, hash_key: ${hash_key}, req body: ${req.body}`)

  // Hit 
  if (map[hash_key]) {
    console.log("hit on host:", hostname)
    res.json(map[hash_key])
  } else {
    if (node_index == 0) {
      if (hash_key > next_node_id && hash_key < previous_node_id ) {
        console.log(`node == 0, GET from ${hostname}:${port} to prev node: ${previous_node_address}`)
        axios.get(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
            console.error(err);
          });
      } else if (hash_key > my_id && hash_key < next_node_id) {
        console.log(`node_index == 0, GET from ${hostname}:${port} to next node: ${next_node_address}`)
        axios.get(`http://${next_node_hostname}:${next_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
            console.error(err);
          });
      } else {
        console.log("node_index == 0, NOT FOUND on host:", hostname)
        res.json("NOT FOUND");
      }
    } else {
      if (hash_key < previous_node_id) {
        console.log(`node != 0, GET from ${hostname}:${port} to prev node: ${previous_node_address}`)
        axios.get(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
            console.error(err);
          });
      } else if (hash_key > my_id) {
        console.log(`node_index != 0, GET from ${hostname}:${port} to next node: ${next_node_address}`)
        axios.get(`http://${next_node_hostname}:${next_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
            console.error(err);
          });
      } else {
        console.log("node_index != 0, NOT FOUND on host:", hostname)
        res.json("NOT FOUND");
      }
    }
  }
});

app.get('/neighbors', function (req, res) {
  const result = neighbors_addresses.split(" ");
  res.send(result);
});

app.get('/', function (req, res) {
  res.send('Hello!');
});

var server = app.listen(port, function () {
  console.log(`Node ${hostname} listening on port ${port}`);
});


// setTimeout(() => {
//   server.close(() => {
//     console.log(`Node ${hostname}:${port} Closed out remaining connections`);
//     process.exit(0);
//   });
// }, 60000);