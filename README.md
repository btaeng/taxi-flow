# Taxi-Flow: Distributed Geospatial Tracking System

Taxi-Flow is a real-time, microservice-based system designed to simulate and visualize high-concurrency vehicle tracking across a city. The system leverages Redis geospatial indexes for low-latency proximity queries and WebSockets for real-time state synchronization between the simulated backend and the frontend visualizer.

## System Architecture

The project is architected as a set of decoupled microservices to ensure scalability and environment parity:

- **Vehicle simulators using Python producers and workers**: Independent containers simulating taxi movements within a bounding box. Locations are updated every second using a random walk algorithm (currently transitioning to OSRM road-snapping).

- **Geospatial store (Redis)**: Acts as the system's "source of truth," utilizing Redis GEO data structures for high-performance spatial indexing.

- **WebSockets**: A lightweight bridge that queries the Redis spatial store and broadcasts real-time vehicle updates to all connected clients via Socket.io.

- **Frontend (React and Leaflet)**: A reactive dashboard that renders the distributed state onto an interactive map with low-latency marker updates.

## Tech Stack

- **Backend**: Python 3.11, Node.js
- **Real-time**: Socket.io
- **Data store**: Redis
- **Frontend**: React, Leaflet.js
- **DevOps**: Docker

## How to use

1. Clone the repo:

```bash
git clone https://github.com/btaeng/taxi-flow.git
cd taxi-flow
```

2. Build and launch the system:

```bash
docker-compose up --build
```

3. Open your browser to http://localhost:5173

## Testing

The system includes a comprehensive test suite for both the simulation logic (Python) and the API orchestration (Node.js).

### 1. Backend API (Node.js & Vitest)
The API tests use Vitest and require a temporary Redis instance to test geospatial queries.

Setup test infrastructure:
```bash
docker-compose -f docker-compose.test.yml up -d
```

Run tests:
```bash
cd api-hub
npm install
npm test
```

### 2. Simulation Logic (Python & PyTest)
The producer tests use PyTest and Mocks to validate geometry and fleet scaling logic without needing a live network or database.

Run tests (local):
```bash
cd producer
python -m venv venv
.\venv\Scripts\activate  # Windows
source venv/bin/activate # Linux/Mac

pip install -r requirements.txt
python -m pytest
```

### 3. Running via Docker (full parity)
To run all tests within the containerized environment to ensure environment parity:

```bash
docker-compose run producer python -m pytest

docker-compose run api-hub npm test
```