import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { io } from 'socket.io-client';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const socket = io('http://localhost:3001');

const carIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/5900/5900437.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function App() {
  const [drivers, setDrivers] = useState([]);
  const [fleetSize, setFleetSize] = useState(10);

  useEffect(() => {
    socket.on('driver_updates', (data) => setDrivers(data));
    return () => socket.off('driver_updates');
  }, []);

  const handleFleetChange = (e) => {
    const newSize = parseInt(e.target.value);
    setFleetSize(newSize);
    socket.emit('update_fleet_size', newSize);
  };

  function MapClickHandler() {
    useMapEvents({
      click: (e) => socket.emit('request_ride', { lat: e.latlng.lat, lng: e.latlng.lng }),
    });
    return null;
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 20, left: 60, zIndex: 1000,
        backgroundColor: 'rgba(255,255,255,0.9)', padding: '15px', borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)', width: '200px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>🚕 Taxi Control</h4>
        <label>Fleet Size: <b>{fleetSize}</b></label>
        <input 
          type="range" min="1" max="100" value={fleetSize} 
          onChange={handleFleetChange} 
          style={{ width: '100%', marginTop: '10px' }}
        />
        <p style={{ fontSize: '10px', color: '#666' }}>Click map to request ride</p>
      </div>

      <MapContainer center={[40.7580, -73.9857]} zoom={13} style={{ height: "100vh" }}>
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler />
        {drivers.map(d => (
          <Marker key={d.id} position={[d.lat, d.lng]} icon={carIcon}>
            <Popup>Driver: {d.id}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
export default App;