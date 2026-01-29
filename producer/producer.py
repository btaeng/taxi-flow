import redis
import time
import random
import os
import json

redis_host = os.getenv('REDIS_HOST', 'localhost')
client = redis.Redis(host=redis_host, port=6379, decode_responses=True)

drivers = [f"driver_{i}" for i in range(100)]

driver_coords = {
    d: [random.uniform(-74.0100, -73.9300), random.uniform(40.7000, 40.8000)]
    for d in drivers
}

print(" [x] Manhattan Simulator Started. Sending GPS updates...")

while True:
    for d_id, coords in driver_coords.items():
        coords[0] += random.uniform(-0.0005, 0.0005)
        coords[1] += random.uniform(-0.0005, 0.0005)

        client.geoadd("taxis_manhattan", [coords[0], coords[1], d_id])

    print(f" [x] Updated {len(drivers)} driver locations.")
    time.sleep(1)