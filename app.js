var express = require('express');

// Create a new express application instance
const app = express();
const os = require("os");
const http = require('http');

const port = process.env.PORT || 42069;

const neighbors_identified_ids = process.env.NEIGHBORS_IDENTIFIER_IDS || "";
const neighbors_addresses = process.env.NEIGHBORS_ADDRESSES || "";
const object_map = process.env.OBJECT_MAP || "";
const node_index = process.env.INDEX || "";

const hostname = os.hostname();
const previous_node_id = neighbors_identified_ids.split(" ")[0];
const next_node_id = neighbors_identified_ids.split(" ")[1];
const previous_node_address = neighbors_addresses.split(" ")[0];
const next_node_address = neighbors_addresses.split(" ")[1];

console.log("node_index: ", node_index)

// console.log(`host: ${hostname}     previous_node_address:  ${previous_node_address}`)
// console.log(`host: ${hostname}     next_node_address:  ${next_node_address}`)
// console.log("next_node_address: ", next_node_address)

// console.log("neighbors_identified_ids: ", neighbors_identified_ids)
// console.log("neighbors_addresses: ", neighbors_addresses)
// console.log("object_map: ", object_map)

// const map = object_map.split(" ").sort().map(item => {

//   if (!item) {
//     return {};
//   };

//   const key = item.split(":")[0];
//   const value = item.split(":")[1];
//   const _key = value.split(",")[0];
//   const _value = value.split(",")[1];

//   const result = {
//     [key]: {
//       [_key]: _value
//     }
//   }
//   return result;
// });

const map = object_map.split(" ").sort().reduce((acc, item) => {

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

console.log("map",map)

app.put('/storage/:key', function (req, res) {
  const key = req.params.key;
  const key_arr = Object.keys(map);
  console.log("key:", key)
  console.log(" key_arr[0]:", key_arr[0])
  console.log("key_arr[map_arr.length - 1]",key_arr[key_arr.length - 1])


  if (map[key]) {
    console.log("hit on host :", hostname)
    res.json(map[key])
  } else if (key < key_arr[0]) {
    console.log(`redirecting from ${hostname}:${port} to prev node: ${previous_node_address}`)

    http.get(`http://${previous_node_address}/storage/${key}`, resp => {
        let data = ''
        let peopleData = ''
        resp.on('data', chunk => {
            data += chunk
        })
        resp.on('end', () => {
            peopleData = JSON.parse(data)
            console.log("peopleData:", peopleData)
            res.json(peopleData)
        })
        
    })
    // res.status(404).send("NOT found")
    
  } else {
    console.log(`redirecting from ${hostname}:${port} to next node: ${next_node_address}`)

    http.get(`http://${next_node_address}/storage/${key}`, resp => {
        let data = ''
        let peopleData = ''
        resp.on('data', chunk => {
            data += chunk
        })
        resp.on('end', () => {
            peopleData = JSON.parse(data)
            console.log("peopleData:", peopleData)
            res.json(peopleData)
        })
    })
    // res.status(404).send("NOT found")
  } 
});

app.get('/storage/:key', function (req, res) {
  const key = req.params.key;
  const key_arr = Object.keys(map);
  console.log("key:", key)
  console.log(" key_arr[0]:", key_arr[0])
  console.log("key_arr[map_arr.length - 1]",key_arr[key_arr.length - 1])


  // Handle the case is map is empty
  if (map == {}) {
    if (key < previous_node_id) {
      console.log(`empty map, redirecting from ${hostname}:${port} to prev node: ${previous_node_address}`)

      http.get(`http://${previous_node_address}/storage/${key}`, resp => {
          let data = ''
          let peopleData = ''
          resp.on('data', chunk => {
              data += chunk
          })
          resp.on('end', () => {
              peopleData = JSON.parse(data)
              console.log("peopleData:", peopleData)
              res.json(peopleData)
          })
      })
    } else {
      console.log(`empty map, redirecting from ${hostname}:${port} to next node: ${next_node_address}`)

      http.get(`http://${next_node_address}/storage/${key}`, resp => {
          let data = ''
          let peopleData = ''
          resp.on('data', chunk => {
              data += chunk
          })
          resp.on('end', () => {
              peopleData = JSON.parse(data)
              console.log("peopleData:", peopleData)
              res.json(peopleData)
          })
      })
    }
  }

  if (map[key]) {
    console.log("hit on host :", hostname)
    res.json(map[key])
  } else if (key < key_arr[0]) {

    if (node_index == 0) {
      console.log(`smaller than node 0 first element, not found`);
      res.status(404).send("NOT FOUND");
    } else {
      console.log(`redirecting from ${hostname}:${port} to prev node: ${previous_node_address}`)
    
      http.get(`http://${previous_node_address}/storage/${key}`, resp => {
          let data = ''
          let peopleData = ''
          resp.on('data', chunk => {
              data += chunk
          })
          resp.on('end', () => {
            if (resp.statusCode == '404') {
              res.status(404).send("NOT FOUND");
            } else {
              peopleData = JSON.parse(data)
              console.log("peopleData:", peopleData)
              res.json(peopleData)
            }
          })
      })

    }

  } else if (key > key_arr[key_arr.length - 1]) {
    if (node_index == 0) {
      console.log(`larger than node 0 last element, not found`);
      res.status(404).send("NOT FOUND");
    } else {
      console.log(`redirecting from ${hostname}:${port} to next node: ${next_node_address}`)

      http.get(`http://${next_node_address}/storage/${key}`, resp => {
          let data = ''
          let peopleData = ''
          resp.on('data', chunk => {
              data += chunk
          })
          resp.on('end', () => {
              if (resp.statusCode == '404') {
                res.status(404).send("NOT FOUND");
              } else {
                peopleData = JSON.parse(data)
                console.log("peopleData:", peopleData)
                res.json(peopleData)
              }
          })
      })

    }
  } else {
    res.status(404).send("NOT FOUND")
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


setTimeout(() => {
  server.close(() => {
    console.log(`Node ${hostname}:${port} Closed out remaining connections`);
    process.exit(0);
  });
}, 150000);