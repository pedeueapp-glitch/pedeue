const { Server } = require("socket.io");
const http = require("http");
const fs = require("fs");
const path = require("path");

// Garantir que diretório de logs existe
const logsDir = path.join(__dirname, "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, "socket.log");
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Redirecionar console.log para o arquivo e console real
const originalLog = console.log;
console.log = (...args) => {
  const msg = `[${new Date().toISOString()}] ${args.join(" ")}\n`;
  logStream.write(msg);
  originalLog(...args);
};

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-store", (storeId) => {
    console.log(`Socket ${socket.id} joining store-${storeId}`);
    socket.join(`store-${storeId}`);
  });

  socket.on("new-order-trigger", (data) => {
    console.log(`Novo pedido ${data.storeId}`);
    io.to(`store-${data.storeId}`).emit("order-received", data);
  });

  socket.on("disconnect", () => {
    console.log("Nova conexão:", socket.id);
  });
});

const PORT = process.env.PORT || 3010;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sistema PedeUe PDV Operando com sucesso na porta ${PORT}`);
});
