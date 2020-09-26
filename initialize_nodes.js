var uuid = require('uuid');

var crypto = require('crypto');
// const virtual_nodes = 8;

// for (let i = 0; i < virtual_nodes; i++) {
//   var id = hash(uuid.v4());
//   console.log("id: %f, virtual_nodes: %d", id, i)
// }


var id = uuid.v4();
// console.log("id:", id)
var hash = crypto.createHash('md5').update(id).digest('hex');
// console.log("hash: ", hash)
return hash
