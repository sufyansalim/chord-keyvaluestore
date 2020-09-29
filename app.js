var express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const os = require("os");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Get the hostname
const hostname = os.hostname();

// Get all the Environment Variables
const port = process.env.PORT || 42069;
const neighbors_identified_ids = process.env.NEIGHBORS_IDENTIFIER_IDS || "";
const neighbors_addresses = process.env.NEIGHBORS_ADDRESSES || "";
const object_map = process.env.OBJECT_MAP || "";
const node_index = process.env.INDEX || "";
const my_id = process.env.MY_ID || "";

// Get the corresponding values from the Environment Variables,
// such as the id, address of the previous and next node 
const previous_node_id = neighbors_identified_ids.split(" ")[0];
const next_node_id = neighbors_identified_ids.split(" ")[1];

const previous_node_address = neighbors_addresses.split(" ")[0];
const next_node_address = neighbors_addresses.split(" ")[1];

const previous_node_hostname = previous_node_address.split(":")[0];
const previous_node_port = previous_node_address.split(":")[1];

const next_node_hostname = next_node_address.split(":")[0];
const next_node_port = next_node_address.split(":")[1];

// Sort the map
// Mainly used when a new key-value pair is created
function sortMap(map) {
  let result = {};
  Object.keys(map).sort().forEach(function(key) {
    result[key] = map[key];
  });
  return result;
};

// Create the object map,
// the format is in [hashed_identifier_key]: [value]
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

// Create the PUT API for '/storage/:key'
app.put('/storage/:key', function (req, res) {
  // Get the value from the request body
  const value = Object.keys(req.body)[0];
  console.log("value in PUT",value )
  // Get the key from the parameter from the url
  const key = req.params.key;
  // Use the same hash function to hash the key obtained from above
  const hash_key = crypto.createHash('md5').update(key).digest('hex');
  
  // Output some info about this server, can be removed
//   console.log(`Info about ME: MY_ID: ${my_id}, node_index: ${node_index}, previous_node_address: ${previous_node_address}, next_node_address: ${next_node_address}, 
// previous_node_id: ${previous_node_id}, next_node_id: ${next_node_id}`);
//   console.log(`Info about MY tables: object_map: ${object_map}`);
//   console.log(`Info about request: value: ${value}, key: ${key}, hash_key: ${hash_key}, req body: ${req.body}`)

  // If the key is found
  if (map[hash_key]) {
    // Overwrite the value
    map[hash_key] = value;
    // Log the new map, can be removed
    console.dir(map, { depth: null });
    // Reply with some info to indicate the value is updated successfully 
    res.status(200).send(`MODIFIED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );

  // Else if the key is not found
  } else {
    // Handle node 0 specially
    if (node_index == 0) {

      // Ask the previous node for the data
      // Because node 0 may store the data that its key is greater than the last node in the ring
      // So if the key is greater next node's key but less than the last node, then ask the last node in this case
      if (hash_key > next_node_id && hash_key < previous_node_id ) {
        // console.log(`node_index == 0, PUT from ${hostname}:${port} to prev node: ${previous_node_address}`)
        // Perform the PUT call to the previous node
        axios.put(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`, `${value}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
            console.error(err);
          });

      // Ask the next node for the data, and make sure its key is less then the one in next node
      } else if (hash_key > my_id && hash_key < next_node_id) {
        // console.log(`node_index == 0, PUT from ${hostname}:${port} to next node: ${next_node_address}`)
        // Perform the PUT call to the next node
        axios.put(`http://${next_node_hostname}:${next_node_port}/storage/${key}`, `${value}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
              console.error(err);
          });

      // Store the data if the key is less than itself or the key is greater than the last node
      } else {
        // console.log("node_index == 0, CREATED on host:", hostname)
        // Store the value
        map[hash_key] = value;
        // Sort the map after inserting the new value
        map = sortMap(map);
        // Log the new map, can be removed
        console.dir(map, { depth: null });
        // Reply with some info to indicate the value is created successfully 
        res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
      }

    // Handle node other than node 0
    } else {

      // Ask the previous node for the data if the key of the data is less than the previous node
      if (hash_key < previous_node_id) {
        // console.log(`node != 0, PUT from ${hostname}:${port} to prev node: ${previous_node_address}`)
        // Perform the PUT call to the previous node
        axios.put(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`, `${value}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
              console.error(err);
          });
          
      // Ask the next node for the data if the key of the data is greater than itself
      } else if (hash_key > my_id) {
        // console.log(`node_index != 0, PUT from ${hostname}:${port} to next node: ${next_node_address}`)
        // Perform the PUT call to the next node
        axios.put(`http://${next_node_hostname}:${next_node_port}/storage/${key}`, `${value}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
              console.error(err);
          });

      // Store the data if the key is greater than the previous node and the key is less than itself
      } else {
        // console.log("node_index != 0, CREATED on host:", hostname)
        // Store the value
        map[hash_key] = value;
         // Sort the map after inserting the new value
        map = sortMap(map);
        // Log the new map, can be removed
        console.dir(map, { depth: null });
        // Reply with some info to indicate the value is created successfully 
        res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
      }
    }
  }
});

// Create the GET API for '/storage/:key'
app.get('/storage/:key', function (req, res) {
  // Get the value from the request body
  const value = req.body;
  console.log("value in GET",value )
  // Get the key from the parameter from the url
  const key = req.params.key;
  // Use the same hash function to hash the key obtained from above
  const hash_key = crypto.createHash('md5').update(key).digest('hex');
  
  // Output some info about this server, can be removed
//   console.log(`Info about ME: MY_ID: ${my_id}, node_index: ${node_index}, previous_node_address: ${previous_node_address}, next_node_address: ${next_node_address}, 
// previous_node_id: ${previous_node_id}, next_node_id: ${next_node_id}`);
//   console.log(`Info about MY tables: object_map: ${object_map}`);
//   console.log(`Info about request: value: ${value}, key: ${key}, hash_key: ${hash_key}, req body: ${req.body}`)

  // If the key is found
  if (map[hash_key]) {
    console.log("Hit on host:", hostname)

    // Reply with the corresponding value
    res.json(map[hash_key])

  // If the key is not found
  } else {
    // Handle node 0 specially
    // Same logic as PUT, but using GET instead of PUT
    if (node_index == 0) {
      if (hash_key > next_node_id && hash_key < previous_node_id ) {
        // console.log(`node == 0, GET from ${hostname}:${port} to prev node: ${previous_node_address}`)
        axios.get(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
            console.error(err);
          });

      // Same logic as PUT, but using GET instead of PUT
      } else if (hash_key > my_id && hash_key < next_node_id) {
        // console.log(`node_index == 0, GET from ${hostname}:${port} to next node: ${next_node_address}`)
        axios.get(`http://${next_node_hostname}:${next_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
            console.error(err);
          });
      // If the key is less than itself or the key is greater the last node, meaning not found
      } else {
        // console.log("node_index == 0, NOT FOUND on host:", hostname)
        // Reply with "NOT FOUD" message
        res.json("NOT FOUND");
      }

    // Handle node other than node 0
    } else {
      // Same logic as PUT, but using GET instead of PUT
      if (hash_key < previous_node_id) {
        // console.log(`node != 0, GET from ${hostname}:${port} to prev node: ${previous_node_address}`)
        axios.get(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
            console.error(err);
          });

      // Same logic as PUT, but using GET instead of PUT
      } else if (hash_key > my_id) {
        // console.log(`node_index != 0, GET from ${hostname}:${port} to next node: ${next_node_address}`)
        axios.get(`http://${next_node_hostname}:${next_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.json(result)
          }).catch((err) => {
            console.error(err);
          });
       // If the key is greater than the previous node and less than itself, meaning not found
      } else {
        // console.log("node_index != 0, NOT FOUND on host:", hostname)
        // Reply with "NOT FOUD" message
        res.json("NOT FOUND");
      }
    }
  }
});

// Create the GET API for '/neighbors'
app.get('/neighbors', function (req, res) {

  // Split the neighbors_addresses string into array format and send back the result
  const result = neighbors_addresses.split(" ");
  res.send(result);
});

// Default route for GET
app.get('/', function (req, res) {
  res.send('Hello!');
});

// Start the server with its corresponding port given
var server = app.listen(port, function () {
  console.log(`Node ${hostname} listening on port ${port}`);
});

// Shut down the server after 5 mins, could be improved to idle time instead
setTimeout(() => {
  server.close(() => {
    console.log(`Node ${hostname}:${port} Closed out remaining connections`);
    process.exit(0);
  });
}, 3000000);