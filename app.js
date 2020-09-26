var express = require('express');

// Create a new express application instance
const app = express();
const port = process.env.PORT || 42069;

const id = process.env.ID || 0;
console.log("id: ", id)

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(port, function () {
  console.log(`Example app listening on port ${port}`);
});
