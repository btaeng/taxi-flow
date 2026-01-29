import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});
const redis = new Redis({ host: process.env.REDIS_HOST || 'localhost' });

io.on('connection', (socket) => {
  console.log(" [!] New browser client connected");
});

setInterval(async () => {
  const drivers = await redis.georadius('taxis_manhattan', -73.9857, 40.7580, 100, 'km', 'WITHCOORD');
  
  const formatted = drivers.map(d => ({
    id: d[0],
    lng: parseFloat(d[1][0]),
    lat: parseFloat(d[1][1])
  }));

  io.emit('driver_updates', formatted);
}, 1000);

const PORT = 3001;
const HOST = '0.0.0.0'; 

httpServer.listen(PORT, HOST, () => {
  console.log(`API Hub running on http://${HOST}:${PORT}`);
});