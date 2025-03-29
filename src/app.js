const express = require("express");
const cors = require("cors");
const { createServer } = require("http");

const app = express();
const PORT = process.env.PORT || 3500;

app.use(cors());
// app.use(cors({ origin: "https://nxmail.in", credentials: true }));
app.use(express.json());

require("./db/Conn");
const router = require('./router/Router');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended:true }));
app.use(bodyParser.json());

var path = require("path");

app.use(express.static(path.join(__dirname, "../public"))); 

require("dotenv").config();

app.use('/', router);

const server = createServer(app);

const { initSocket } = require("./router/SocketRouter");
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
