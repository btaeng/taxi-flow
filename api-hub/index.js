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
  socket.on('request_ride', async (riderPos) => {
    const nearby = await redis.georadius(
      'taxis_manhattan', riderPos.lng, riderPos.lat, 5, 'km', 'ASC'
    );

    if (nearby.length > 0) {
      const closestDriverId = nearby[0];
      
      const job = JSON.stringify({
        driver_id: closestDriverId,
        target: [riderPos.lng, riderPos.lat]
      });

      await redis.lpush('dispatch_queue', job);
      
      console.log(`Matched Rider at ${riderPos.lat} with ${closestDriverId}`);
      socket.emit('match_confirmed', { driver_id: closestDriverId });
    }
  });
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