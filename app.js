var express = require('express');

// Create a new express application instance
const app = express();
const port = process.env.PORT || 42069;

const neighbors_identified_ids = process.env.NEIGHBORS_IDENTIFIER_IDS || "";
const neighbors_addresses = process.env.NEIGHBORS_ADDRESSES || "";
const object_map = process.env.OBJECT_MAP || "";

console.log("neighbors_identified_ids: ", neighbors_identified_ids)
console.log("neighbors_addresses: ", neighbors_addresses)
console.log("object_map: ", object_map)


app.get('/neighbors', function (req, res) {
  const result = neighbors_addresses.split(" ");
  res.send(result);
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

var server = app.listen(port, function () {
  console.log(`Example app listening on port ${port}`);
});


setTimeout(() => {
  server.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });
}, 1000);