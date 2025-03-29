const { Server } = require("socket.io");

let io;

var {
  generate1D,
  getLast5WorkingDays,
  generate1M,
  generate1Y,
} = require("../Function/Function");

const users = { "1D": {}, "5D": {}, "1M": {}, "1Y": {} };

const setupNamespace = (path, key, generateData) => {
  const namespace = io.of(path);
  namespace.on("connection", (socket) => {
    const emitData = async (_id) => {
      const data = await generateData(_id);
      socket.emit("updateChartData", data);
    };

    socket.on("sendId", ({ _id }) => {
      users[key][_id] = socket;
      emitData(_id);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected from ${path}`);
    });
  });
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

const initSocket = (server) => {
  
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  setupNamespace("/1D", "1D", generate1D);
  setupNamespace("/5D", "5D", getLast5WorkingDays);
  setupNamespace("/1M", "1M", generate1M);
  setupNamespace("/1Y", "1Y", generate1Y);

};

module.exports = { initSocket, getIO, users };
