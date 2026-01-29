import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

const socket = io('http://localhost:3001');

function App() {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    socket.on('driver_updates', (data) => {
      setDrivers(data);
    });
    return () => socket.off('driver_updates');
  }, []);

  return (
    <MapContainer center={[40.7580, -73.9857]} zoom={13} style={{ height: "100vh" }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {drivers.map(d => (
        <Marker key={d.id} position={[d.lat, d.lng]}>
          <Popup>{d.id}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
export default App;