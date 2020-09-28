import express from 'express';

// Create a new express application instance
const app: express.Application = express();
const port = process.env.PORT || 59999;

// import hash from 'murmurhash3';

const virtual_nodes = 6

// for (const i = 0; i < virtual_nodes; i++) {
//   var id = hash(uuid.v4());
// }

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}`);
});
