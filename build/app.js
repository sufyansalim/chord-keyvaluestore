"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
// Create a new express application instance
var app = express_1.default();
var port = process.env.PORT || 59999;
var murmurhash3_1 = __importDefault(require("murmurhash3"));
var virtual_nodes = 6;
for (var i = 0; i < virtual_nodes; i++) {
    var id = murmurhash3_1.default(uuid.v4());
}
app.get('/', function (req, res) {
    res.send('Hello World!');
});
app.listen(port, function () {
    console.log("Example app listening on port " + port);
});
