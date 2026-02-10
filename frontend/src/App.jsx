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

const CITIES = {
  'Manhattan': { lat: 40.7580, lng: -73.9857, file: 'manhattan.geojson' },
  'Brooklyn': { lat: 40.6782, lng: -73.9442, file: 'brooklyn.geojson' },
  'Queens': { lat: 40.7282, lng: -73.7949, file: 'queens.geojson' },
  'The Bronx': { lat: 40.8448, lng: -73.8648, file: 'bronx.geojson' },
  'Staten Island': { lat: 40.5795, lng: -74.1502, file: 'staten_island.geojson' },
  'Los Angeles': { lat: 34.0522, lng: -118.2437, file: 'los_angeles.geojson' },
};

function ChangeView({ city, center }) {
  const map = useMapEvents({});

  useEffect(() => {
    if (city && center) {
      console.log(`Flying to ${city}...`);
      map.setView(center, 13, { animate: true });
    }
  }, [city]);

  return null;
}

function App() {
  const [currentCity, setCurrentCity] = useState('Manhattan');
  const [drivers, setDrivers] = useState([]);
  const [fleetSize, setFleetSize] = useState(10);
  const [riderPos, setRiderPos] = useState(null);

  useEffect(() => {
    socket.on('driver_updates', (data) => setDrivers(data));
    socket.on('match_confirmed', (data) => alert(`Matched with Driver ${data.driver_id}!`));
    return () => {
      socket.off('driver_updates');
      socket.off('match_confirmed');
    };
  }, []);

  function MapClickHandler() {
    useMapEvents({
      click: (e) => {
        const pos = { lat: e.latlng.lat, lng: e.latlng.lng };
        setRiderPos(pos);
        socket.emit('request_ride', pos);
      },
    });
    return null;
  }

  const handleCityChange = (e) => {
    const cityName = e.target.value;
    setCurrentCity(cityName);
    socket.emit('change_city', { name: cityName, file: CITIES[cityName].file });
  };

  const handleFleetChange = (e) => {
    const newSize = parseInt(e.target.value);
    setFleetSize(newSize);
    socket.emit('update_fleet_size', newSize);
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', top: 20, left: 60, zIndex: 1000,
        backgroundColor: 'rgba(255,255,255,0.9)', padding: '15px', borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)', width: '200px'
      }}>
        <h4>Taxi Platform</h4>
        <label>Active City:</label>
        <select value={currentCity} onChange={handleCityChange} style={{ width: '100%', marginBottom: '10px' }}>
          {Object.keys(CITIES).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <h4 style={{ margin: '0 0 10px 0' }}>Taxi Control</h4>
        <label>Fleet Size: <b>{fleetSize}</b></label>
        <input 
          type="range" min="1" max="100" value={fleetSize} 
          onChange={handleFleetChange} 
          style={{ width: '100%', marginTop: '10px' }}
        />
        <p style={{ fontSize: '10px', color: '#666' }}>Click map to request ride</p>
      </div>

      <MapContainer center={[CITIES[currentCity].lat, CITIES[currentCity].lng]} zoom={13} style={{ height: "100vh" }}>
        <ChangeView city={currentCity} center={[CITIES[currentCity].lat, CITIES[currentCity].lng]} />
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapClickHandler />
        {riderPos && (
          <Marker position={[riderPos.lat, riderPos.lng]}>
            <Popup>Rider Pickup Point</Popup>
          </Marker>
        )}
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