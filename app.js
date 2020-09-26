var express = require('express');

// Create a new express application instance
const app = express();
const port = process.env.PORT || 42069;

var uuid = require('uuid');
// var murmur = require('murmurhash3');

// var hash = murmur.murmur32Sync;

const virtual_nodes = 8;
const key = "Chris Paul";
const object_store = {
  lakers: "LBJ",
  thunder: "CP3",
  heat: "JB",
  celtics: "TATUM",
  nuggest: "JOKER"
}

// for (let i = 0; i < virtual_nodes; i++) {
//   var id = hash(uuid.v4());
//   console.log("id: %f, virtual_nodes: %d", id, i)
// }

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}`);
});
