var express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const os = require("os");
const http = require('http');

// Create a new express application instance
const app = express();
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

// console.log("node_index: ", node_index)
// console.log("my_id: ", my_id)

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

console.log("map",map)

app.put('/storage/:key', function (req, res) {
  const value = req.body.data;
  const key = req.params.key;
  const hash_key = crypto.createHash('md5').update(key).digest('hex');
  const key_arr = Object.keys(map);
  
  console.log(`Info about ME: MY_ID: ${my_id}, node_index: ${node_index}, previous_node_address: ${previous_node_address}, next_node_address: ${next_node_address}, 
  previous_node_id: ${previous_node_id}, next_node_id: ${next_node_id}`);
  console.log(`Info about MY tables: object_map: ${object_map}`);
  console.log(`Info about request: value: ${value}, key: ${key}, hash_key: ${hash_key}`)

  // Handle the case is map is empty
  if (map == {}) {
    console.log(`PUT, map is empty`);
    if (hash_key < previous_node_id) {
      console.log(`hash_key < previous_node_id`);
      if (node_index == 0 && hash_key < my_id) {
        console.log(`node_index == 0 && hash_key < my_id`);
        console.log(`emtpy map, smaller than node 0, CREATED on node 0`);
        map[hash_key] = value;
        res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
      } else {
        console.log(`node != 0, empty map, PUT from ${hostname}:${port} to prev node: ${previous_node_address}`)

        const options = {
          host: previous_node_hostname,
          port: previous_node_port,
          path: '/storage/:key',
          method: 'PUT'
        };
        
        const _req = http.request(options, function(_res) {
          let data = ''
          let result = ''
          _res.setEncoding('utf8');
          _res.on('data', function (chunk) {
            data += chunk
          });
          _res.on('end', () => {
            // result = JSON.parse(data)
            result = data
            console.log("result:", result)
            res.json(result)
          })
        });
        
        _req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });
        
        // write data to request body
        _req.write(JSON.stringify({
          data: value,
        }));
        _req.end();

        // http.get(`http://${previous_node_address}/storage/${key}`, response => {
        //   let data = ''
        //   let result = ''
        //   response.on('data', chunk => {
        //     data += chunk
        //   })
        //   response.on('end', () => {
        //     // result = JSON.parse(data)
        //     result = data
        //     console.log("result:", result)
        //     res.json(result)
        //   })
        // })
      }
    } else if (hash_key > previous_node_id && hash_key < next_node_id) {
      console.log(`hash_key > previous_node_id && hash_key < next_node_id`);
      console.log(`emtpy map on NODE ${hostname}:${port}, CREATED on node ${hostname}:${port} and MY_ID: ${my_id}`);
      map[hash_key] = value;
      res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
    } else {
      console.log(`hash_key > next_node_id`);
      if (node_index == 0) {
        console.log(`node_index == 0, larger than last node , CREATED on node 0`);
        map[hash_key] = value;
        res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
      } else {
        console.log(`node_index != 0, PUT from ${hostname}:${port} to next node: ${next_node_address}`)

        const options = {
          host: next_node_hostname,
          port: next_node_port,
          path: '/storage/:key',
          method: 'PUT'
        };
        
        const _req = http.request(options, function(_res) {
          let data = ''
          let result = ''
          _res.setEncoding('utf8');
          _res.on('data', function (chunk) {
            data += chunk
          });
          _res.on('end', () => {
            // result = JSON.parse(data)
            result = data
            console.log("result:", result)
            res.json(result)
          })
        });
        
        _req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });
        
        // write data to request body
        _req.write(JSON.stringify({
          data: value,
        }));
        _req.end();

        // http.get(`http://${next_node_address}/storage/${key}`, response => {
        //   let data = ''
        //   let result = ''
        //   response.on('data', chunk => {
        //     data += chunk
        //   })
        //   response.on('end', () => {
        //     // result = JSON.parse(data)
        //     result = data
        //     console.log("result:", result)
        //     res.json(result)
        //   })
        // })
      }
    }
  }

  // Found and update
  else if (map[hash_key]) {
    console.log("hit on host :", hostname)
    map[hash_key] = value;
    res.status(200).send(`MODIFIED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
  } else if (hash_key < key_arr[0]) {
    console.log(`hash_key < key_arr[0]`);
    if (node_index == 0) {
      console.log(`node_index == 0 smaller than node 0 first element, CREATED on node 0`);
      map[hash_key] = value;
      res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
    } else {
      console.log(`node_index ! 0 `);
      if (hash_key > previous_node_id) {
        console.log(`hash_key > previous_node_id `);
        // console.log(`CREATED on NODE ${hostname}:${port}, CREATED on it`);
        map[hash_key] = value;
        res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
      } else {
        console.log(`hash_key < previous_node_id `);
        console.log(`PUT from ${hostname}:${port} to prev node: ${previous_node_address}`)

        const options = {
          host: previous_node_hostname,
          port: previous_node_port,
          path: '/storage/:key',
          method: 'PUT'
        };
        
        const _req = http.request(options, function(_res) {
          let data = ''
          let result = ''
          _res.setEncoding('utf8');
          _res.on('data', function (chunk) {
            data += chunk
          });
          _res.on('end', () => {
            // result = JSON.parse(data)
            result = data
            console.log("result:", result)
            res.json(result)
          })
        });
        
        _req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });
        
        // write data to request body
        _req.write(JSON.stringify({
          data: value,
        }));
        _req.end();

        // http.put(`http://${previous_node_address}/storage/${key}`, response => {
        //   let data = ''
        //   let result = ''
        //   response.on('data', chunk => {
        //     data += chunk
        //   })
        //   response.on('end', () => {
        //     // result = JSON.parse(data)
        //     result = data
        //     console.log("result:", result)
        //     res.json(result)
        //   })
        // })
      }
    }
  } else if (hash_key > key_arr[key_arr.length - 1]) {
    console.log(`hash_key > key_arr[key_arr.length - 1]`);
    if (node_index == 0) {
      console.log(`node_index == 0 larger than node 0 first element, CREATED on node 0`);
      map[hash_key] = value;
      res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
    } else {
      console.log(`node_index != 0`);
      if (hash_key < my_id) {
        // console.log(`CREATED on NODE ${hostname}:${port}, CREATED on it`);
        map[hash_key] = value;
        res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
      } else {
        console.log(`PUT from ${hostname}:${port} to next node: ${next_node_address}`)

        const options = {
          host: next_node_hostname,
          port: next_node_port,
          path: '/storage/:key',
          method: 'PUT'
        };
        
        const _req = http.request(options, function(_res) {
          let data = ''
          let result = ''
          _res.setEncoding('utf8');
          _res.on('data', function (chunk) {
            data += chunk
          });
          _res.on('end', () => {
            // result = JSON.parse(data)
            result = data
            console.log("result:", result)
            res.json(result)
          })
        });
        
        _req.on('error', function(e) {
          console.log('problem with request: ' + e.message);
        });
        
        // write data to request body
        _req.write(JSON.stringify({
          data: value,
        }));
        _req.end();

        // http.get(`http://${next_node_address}/storage/${key}`, response => {
        //   let data = ''
        //   let result = ''
        //   response.on('data', chunk => {
        //     data += chunk
        //   })
        //   response.on('end', () => {
        //     // result = JSON.parse(data)
        //     result = data
        //     console.log("result:", result)
        //     res.json(result)
        //   })
        // })
      }
    }
  } else {
    console.log(`CREATED on NODE ${hostname}:${port}, CREATED on it`);
    map[hash_key] = value;
    res.status(200).send(`CREATED value: ${value}, key: ${key}, hash_key: ${hash_key} on node ${hostname}:${port} and MY_ID: ${my_id}` );
  }
});

app.get('/storage/:key', function (req, res) {
  const key = req.params.key;
  const hash_key = crypto.createHash('md5').update(key).digest('hex');
  const key_arr = Object.keys(map);
  console.log(`Info about ME: MY_ID: ${my_id}, node_index: ${node_index}, previous_node_address: ${previous_node_address}, next_node_address: ${next_node_address}, 
  previous_node_id: ${previous_node_id}, next_node_id: ${next_node_id}`);
  console.log(`Info about MY tables: object_map: ${object_map}`);
  console.log(`Info about request: key: ${key}, hash_key: ${hash_key}`)

  // Handle the case is map is empty
  if (map == {}) {
    if (hash_key < previous_node_id) {
      if (node_index == 0 && hash_key < my_id) {
        console.log(`emtpy map, smaller than node 0, NOT FOUND`);
        res.status(404).send("NOT FOUND");
      } else {
        console.log(`empty map, redirecting from ${hostname}:${port} to prev node: ${previous_node_address}`)

        http.get(`http://${previous_node_address}/storage/${key}`, response => {
          let data = ''
          let result = ''
          response.on('data', chunk => {
            data += chunk
          })
          response.on('end', () => {
            result = JSON.parse(data)
            console.log("result:", result)
            res.json(result)
          })
        })
      }
    } else if (hash_key > previous_node_id && hash_key < next_node_id) {
      console.log(`emtpy map on NODE ${hostname}:${port}  NOT FOUND`);
      res.status(404).send("NOT FOUND");
    } else {
      if (node_index == 0) {
        console.log(`emtpy map, larger than last node , NOT FOUND`);
        res.status(404).send("NOT FOUND");
      } else {
        console.log(`empty map, redirecting from ${hostname}:${port} to next node: ${next_node_address}`)

        http.get(`http://${next_node_address}/storage/${key}`, response => {
          let data = ''
          let result = ''
          response.on('data', chunk => {
            data += chunk
          })
          response.on('end', () => {
            result = JSON.parse(data)
            console.log("result:", result)
            res.json(result)
          })
        })
      }
    }
  }

  if (map[hash_key]) {
    console.log("hit on host :", hostname)
    res.json(map[hash_key])
  } else if (hash_key < key_arr[0]) {
    if (node_index == 0) {
      console.log(`smaller than node 0 first element, not found`);
      res.status(404).send("NOT FOUND");
    } else {
      // if (hash_key > previous_node_id) {
      //   console.log(`NOT FOUND on NODE  ${hostname}:${port}`);
      //   res.status(404).send("NOT FOUND");
      // } else {
      console.log(`redirecting from ${hostname}:${port} to prev node: ${previous_node_address}`)
    
      http.get(`http://${previous_node_address}/storage/${key}`, response => {
        let data = ''
        let result = ''
        response.on('data', chunk => {
            data += chunk
        })
        response.on('end', () => {
          if (response.statusCode == '404') {
            res.status(404).send("NOT FOUND");
          } else {
            result = JSON.parse(data)
            console.log("result:", result)
            res.json(result)
          }
        })
      })
    }
  } else if (hash_key > key_arr[key_arr.length - 1]) {
    if (node_index == 0) {
      console.log(`larger than node 0 last element, not found`);
      res.status(404).send("NOT FOUND");
    } else {
      // if (hash_key < next_node_id) {
      //   console.log(`NOT FOUND on NODE  ${hostname}:${port}`);
      //   res.status(404).send("NOT FOUND");
      // } else {}
      console.log(`redirecting from ${hostname}:${port} to next node: ${next_node_address}`)

      http.get(`http://${next_node_address}/storage/${key}`, response => {
        let data = ''
        let result = ''
        response.on('data', chunk => {
            data += chunk
        })
        response.on('end', () => {
          if (response.statusCode == '404') {
            res.status(404).send("NOT FOUND");
          } else {
            result = JSON.parse(data)
            console.log("result:", result)
            res.json(result)
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


// setTimeout(() => {
//   server.close(() => {
//     console.log(`Node ${hostname}:${port} Closed out remaining connections`);
//     process.exit(0);
//   });
// }, 60000);