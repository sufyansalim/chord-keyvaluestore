var express = require('express');
const axios = require('axios');
const fetch = require('node-fetch')
const bodyParser = require('body-parser');
const crypto = require('crypto');
const os = require("os");
const numCPUs = require('os').cpus().length;

const app = express();

app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({extended: false}));



// Get the hostname
const hostname = os.hostname();

process.env.UV_THREADPOOL_SIZE = numCPUs;


// Get all the Environment Variables
const port = process.env.PORT || 42069;
let neighbors_identified_ids = process.env.NEIGHBORS_IDENTIFIER_IDS || "";
let neighbors_addresses = process.env.NEIGHBORS_ADDRESSES || "";
const object_map = process.env.OBJECT_MAP || "";
const node_index = process.env.INDEX || "";
const my_id = process.env.MY_ID || "";
let st = process.env.STATE || "";
let state = JSON.parse(st)


const host = hostname;
const add = host.substring(0, host.indexOf('.'));

//Get my address
const my_address = `${add}:${port}`;

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

  console.log(JSON.stringify(req.headers));

  // Get the value from the request body
  const value = Object.keys(req.body)[0];
  console.log("value in PUT",value )
  // Get the key from the parameter from the url
  const key = req.params.key;
  console.log("params in put",req.params )
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
    res.status(200).json(`MODIFIED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );

  // Else if the key is not found
  } else {
    // Handle node 0 specially
    if (node_index == 0) {

      // Ask the previous node for the data
      // Because node 0 may store the data that its key is greater than the last node in the ring
      // So if the key is greater next node's key but less than the last node, then ask the last node in this case
      if (hash_key > next_node_id && hash_key < previous_node_id && state === false) {
        // console.log(`node_index == 0, PUT from ${hostname}:${port} to prev node: ${previous_node_address}`)
        // Perform the PUT call to the previous node
        axios.put(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`, `${value}`)
          .then((_res) => {
            const result = _res.data;
            res.status(200).json(result)
          }).catch((err) => {
            console.error(err);
          });

      // Ask the next node for the data, and make sure its key is less then the one in next node
      } else if (hash_key > my_id && hash_key < next_node_id && state === false) {
        // console.log(`node_index == 0, PUT from ${hostname}:${port} to next node: ${next_node_address}`)
        // Perform the PUT call to the next node
        axios.put(`http://${next_node_hostname}:${next_node_port}/storage/${key}`, `${value}`)
          .then((_res) => {
            const result = _res.data;
            res.status(200).json(result)
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
      if (hash_key < previous_node_id && state === false) {
        // console.log(`node != 0, PUT from ${hostname}:${port} to prev node: ${previous_node_address}`)
        // Perform the PUT call to the previous node
        axios.put(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`, `${value}`)
          .then((_res) => {
            const result = _res.data;
            res.status(200).json(result)
          }).catch((err) => {
              console.error(err);
          });
          
      // Ask the next node for the data if the key of the data is greater than itself
      } else if (hash_key > my_id && state === false) {
        // console.log(`node_index != 0, PUT from ${hostname}:${port} to next node: ${next_node_address}`)
        // Perform the PUT call to the next node
        axios.put(`http://${next_node_hostname}:${next_node_port}/storage/${key}`, `${value}`)
          .then((_res) => {
            const result = _res.data;
            res.status(200).json(result)
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

  // Get the value from the request body
  const value = req.body;
  //console.log("value in GET",value )
  // Get the key from the parameter from the url
  const key = req.params.key;
  console.log("params in get",req.params )
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
    res.status(200).json(map[hash_key])

  // If the key is not found
  } else {
    // Handle node 0 specially
    // Same logic as PUT, but using GET instead of PUT
    if (node_index == 0) {
      if (hash_key > next_node_id && hash_key < previous_node_id && state === false) {
        // console.log(`node == 0, GET from ${hostname}:${port} to prev node: ${previous_node_address}`)
        axios.get(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.status(200).json(result)
          }).catch((err) => {
            res.status(404).json("NO KEY FOUND")
          });

      // Same logic as PUT, but using GET instead of PUT
      } else if (hash_key > my_id && hash_key < next_node_id && state === false) {
        // console.log(`node_index == 0, GET from ${hostname}:${port} to next node: ${next_node_address}`)
        axios.get(`http://${next_node_hostname}:${next_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.status(200).json(result)
          }).catch((err) => {
            res.status(404).json("NO KEY FOUND")
          });
      // If the key is less than itself or the key is greater the last node, meaning not found
      } else {
        // console.log("node_index == 0, NOT FOUND on host:", hostname)
        // Reply with "NOT FOUD" message
        res.status(404).json("NO KEY FOUND");
      }

    // Handle node other than node 0
    } else {
      // Same logic as PUT, but using GET instead of PUT
      if (hash_key < previous_node_id && state === false) {
        // console.log(`node != 0, GET from ${hostname}:${port} to prev node: ${previous_node_address}`)
        axios.get(`http://${previous_node_hostname}:${previous_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.status(200).json(result)
          }).catch((err) => {
            res.status(404).json("NO KEY FOUND")
          });

      // Same logic as PUT, but using GET instead of PUT
      } else if (hash_key > my_id && state === false) {
        // console.log(`node_index != 0, GET from ${hostname}:${port} to next node: ${next_node_address}`)
        axios.get(`http://${next_node_hostname}:${next_node_port}/storage/${key}`)
          .then((_res) => {
            const result = _res.data;
            res.status(200).json(result)
          }).catch((err) => {
            res.status(404).json("NO KEY FOUND")
          });
       // If the key is greater than the previous node and less than itself, meaning not found
      } else {
        // console.log("node_index != 0, NOT FOUND on host:", hostname)
        // Reply with "NOT FOUD" message
        res.status(404).json("NO KEY FOUND");
      }
    }
  }
});

// Create the GET API for '/neighbors'
app.get('/neighbors', function (req, res) {

  // Split the neighbors_addresses string into array format and send back the result
  const result = neighbors_addresses.split(" ");
  res.status(200).json(result);
});

// Create the GET API for '/node-info'
app.get('/node-info', function (req, res) {

  // Split the neighbors_addresses string into array format and send back the result
  const previous_node_address = neighbors_addresses.split(" ")[0];
  const next_node_address = neighbors_addresses.split(" ")[1];

  
  //Info of node
  const info = {
     node_key : my_id ,
     successor : next_node_address ,
     others:[
      previous_node_address
    ],
    sim_crash : state
  }

  // res.writeHead(200, {'Content-Type': 'application/json'});
  // res.write(JSON.stringify(info));

  res.status(200).json(info);

});

// Create the POST API for '/join'
app.post(`/join`,async function (req, res) {

  const previous_node_id = neighbors_identified_ids.split(" ")[0];
  const previous_node_address = neighbors_addresses.split(" ")[0];

  //Extract nprime from url
  const nprime = req.query.nprime;

  //For edge case when it is the last node
  const ind = req.query.id;

  const address = nprime.split(":")
  
  //console.log(nprime);

  let url;
  let options;
  const prevId = previous_node_id;
  const prevAdd = previous_node_address;
  let neighbors;
  let addresses;

  options = {
    method: "POST",
    headers: {
        "Content-Type": "appliction/json",
    },
  };

  //For edge case when ind = index of the last node
  if(ind){
    url = `http://${address[0]}:${address[1]}/add-node/?nodeId=${my_id}&nodeAdd=${my_address}&ind=${ind}`;
  }else{
    url = `http://${address[0]}:${address[1]}/add-node/?nodeId=${my_id}&nodeAdd=${my_address}`;
  }
   

  try {

    //Current node is predecessor of nprime node
    const response = await fetch(url, options);

    let result = await response.json();   

    //console.log("1",result)

  //Only in edge case set last node succes to 0 node
  if(result.my_id){
    neighbors = `${prevId} ${my_id}`
    addresses = `${prevAdd} ${nprime}`
    neighbors_identified_ids = neighbors;
    neighbors_addresses = addresses;

    if(neighbors_identified_ids.split(' ')[1] === my_id && neighbors_addresses.split(' ')[1] === address){

      return res.status(200).json(" ");

    }
  }
    
    
    if(result.prevId){

    neighbors = `${result.prevId} ${result.id}`
    addresses = `${result.prevAdd} ${result.add}`
    neighbors_identified_ids = neighbors;
    neighbors_addresses = addresses;

      const previous_node_hostname = result.prevAdd.split(":")[0];
      const previous_node_port = result.prevAdd.split(":")[1];
    
      // console.log(previous_node_hostname,previous_node_port)
  
      const url1 = `http://${previous_node_hostname}:${previous_node_port}/update-info/?nextId=${my_id}&nextAdd=${my_address}`;

      const response1 = await fetch(url1, options);

      let result1 = await response1.json();   

      console.log("prev",result1)
    
      //The current node should be successor of predecessor
      if(result1 === "Predecessor Updated" && neighbors_identified_ids.split(' ')[0] === result.prevId && neighbors_identified_ids.split(' ')[1] === result.id && neighbors_addresses.split(' ')[0] === result.prevAdd && neighbors_addresses.split(' ')[1] === result.add){
        
        return res.status(200).json(" ");
      
    
      }

    }

    
  } catch(err){

    return res.status(500).json("Join Failed");
  }


});

// Create the POST API for '/leave'
app.post('/leave', async function (req, res) {


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

  let options;
  const prevId = previous_node_id;
  const prevAdd = previous_node_address;
  const nextId = next_node_id;
  const nextAdd = next_node_address;
  let neighbors;
  let addresses;


  options = {
    method: "POST",
    headers: {
        "Content-Type": "appliction/json",
    },
  };

  //Remove Node API to make node leave the network
  const url = `http://${next_node_hostname}:${next_node_port}/update-info?prevId=${prevId}&prevAdd=${prevAdd}`;
  const url1 = `http://${previous_node_hostname}:${previous_node_port}/update-info?nextId=${nextId}&nextAdd=${nextAdd}`;
 
  try {

    //Update previous/next node info in successor
    const response = await fetch(url, options);
    const response1 = await fetch(url1, options);

    let result = await response.json();   
    let result1 = await response1.json();

    console.log(result,result1)

    //The current node should be its own successor & predecessor
    if( result === "Successor Updated" && result1 === "Predecessor Updated"){

      neighbors = `${my_id} ${my_id}`
      addresses = `${my_address} ${my_address}`
      neighbors_identified_ids = neighbors;
      neighbors_addresses = addresses;
      
      if(neighbors_addresses.split(' ')[0] === `${my_address}` && neighbors_addresses.split(' ')[1] === `${my_address}`){
        return res.status(200).json(" ");
      } 

    }
    
  } catch(err){

    return res.status(500).json("Leave Failed");
  }
    
  
});

// Create the POST API for '/sim-crash'
app.post('/sim-crash', function (req, res) {

  //Crash the node
 state = true

 if(state === true){
   res.status(500).json("I have sim-crashed");
 }
 
});

// Create the POST API for '/sim-recover'
app.post('/sim-recover', function (req, res) {

  //Recover the node
 state = false

 if(state === false){
   res.status(200).json(" ");
 }

});

// POST to join node to network successor or predecessor return previous or next node info
app.post('/add-node', function (req, res) {


  // Get the corresponding values from the Environment Variables,
  // such as the id, address of the previous and next node 
  const previous_node_id = neighbors_identified_ids.split(" ")[0];
  const next_node_id = neighbors_identified_ids.split(" ")[1];
  const previous_node_address = neighbors_addresses.split(" ")[0];
  const next_node_address = neighbors_addresses.split(" ")[1];


  let neighbors;
  let addresses;

  const prevId = previous_node_id;
  const prevAdd = previous_node_address;

  //Recieve node data
  const data = req.query;

  //If node index = data.ind only in case of edge case it is the last node
  if(node_index === data.ind){
    neighbors = `${data.nodeId} ${next_node_id}`
    addresses = `${data.nodeAdd} ${next_node_address}`
    neighbors_identified_ids = neighbors;
    neighbors_addresses = addresses;
  }

  //Update prev to nodeJoin 
  if(data.nodeId){
    neighbors = `${data.nodeId} ${next_node_id}`
    addresses = `${data.nodeAdd} ${next_node_address}`
    neighbors_identified_ids = neighbors;
    neighbors_addresses = addresses;
  } 


  if(neighbors_identified_ids.split(' ')[0] === data.nodeId && neighbors_addresses.split(' ')[0] === data.nodeAdd && node_index === data.ind){

    return res.status(200).json(my_id);
  }
  else if(neighbors_identified_ids.split(' ')[0] === data.nodeId && neighbors_addresses.split(' ')[0] === data.nodeAdd){

    const previous = {
     prevId,
     prevAdd,
     id : my_id,
     add: my_address

    }

    return res.status(200).json(previous);

  }
  else {

    return res.status(500).json("Add node failed")

  }
 
});

// POST to update nodes info for leave/join api calls  in network
app.post('/update-info', function (req, res) {
  
  // Get the corresponding values from the Environment Variables,
  // such as the id, address of the previous and next node 
  const previous_node_id = neighbors_identified_ids.split(" ")[0];
  const next_node_id = neighbors_identified_ids.split(" ")[1];


  const previous_node_address = neighbors_addresses.split(" ")[0];
  const next_node_address = neighbors_addresses.split(" ")[1];

  let neighbors;
  let addresses;

  //Recieve Next|pervious node data
  const data = req.query;
  //console.log("data", hostname,data);

  //Update predecessor of successor
  if(data.prevId){
    neighbors = `${data.prevId} ${next_node_id}`
    addresses = `${data.prevAdd} ${next_node_address}`
    neighbors_identified_ids = neighbors;
    neighbors_addresses = addresses;
    
  } 

  //Update successor of predecessor
  if(data.nextId){
    neighbors = `${previous_node_id} ${data.nextId}`
    addresses = `${previous_node_address} ${data.nextAdd}`
    neighbors_identified_ids = neighbors;
    neighbors_addresses = addresses;
    
  }

  if(neighbors_identified_ids.split(' ')[0] === data.prevId && neighbors_addresses.split(' ')[0] === data.prevAdd){

    return res.status(200).json("Successor Updated");

  }else if(neighbors_identified_ids.split(' ')[1] === data.nextId && neighbors_addresses.split(' ')[1] === data.nextAdd){

   return res.status(200).json("Predecessor Updated");

  }
  else {

    return res.status(500).json("Remove node failed")

  }
 
});

// Get Stability called in chord tests to check stability of network
app.get('/stability', async function (req, res) {

  const next_node_address = neighbors_addresses.split(" ")[1];
  const next_node_hostname = next_node_address.split(":")[0];
  const next_node_port = next_node_address.split(":")[1];
  const myAdd = req.query.myaddress;
  const nAdd = req.query.nodeaddress;
  const index = req.query.id;
  const address = nAdd.split(":")
  const myaddress = myAdd.split(":")
  let url;
  let response;
  let result;

  console.log("ADD",address,"MAdd",my_address);

 

    //Info of node
    const info = {
      node_key : my_id ,
      successor : next_node_address ,
      others:[
       previous_node_address
     ],
     sim_crash : state
   }


        try {

          url = `http://${address[0]}:${address[1]}/node-info/`;
          response = await fetch(url, options);    
          result = await response.json();   

            if(result.successor === myaddress){
              
              return res.status(200).json("Success")
            }else if(result.successor !== myaddress){

              url = `http://${next_node_hostname}:${next_node_port}/stability/?myaddress=${my_address}&nodeaddress=${result.successor}&id=${index}`;
              response = await fetch(url, options);
              result = await response.json();   

              if(result.successor !== myaddress && node_index === index){
                return res.status(500).json("Successor Not Found")
              }

            }
        
            
        
          }catch(error){

            return res.status(500).json("Fail")

          }
  


  


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