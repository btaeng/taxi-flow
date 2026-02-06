import redis
import time
import os
import requests
import json
import random

redis_host = os.getenv('REDIS_HOST', 'localhost')
client = redis.Redis(host=redis_host, port=6379, decode_responses=True)

MIN_LAT, MAX_LAT = 40.7000, 40.8000
MIN_LNG, MAX_LNG = -74.0100, -73.9300

client.delete("taxis_manhattan")

driver_states = {}

def get_route(start, end):
    try:
        url = f"http://router.project-osrm.org/route/v1/driving/{start[0]},{start[1]};{end[0]},{end[1]}?overview=full&geometries=geojson"
        r = requests.get(url).json()
        return r['routes'][0]['geometry']['coordinates']
    except Exception as e:
        print(f"OSRM Error: {e}")
        return []

print(f" [x] System Initialized with {len(driver_states)} taxis.")

while True:
    target_size_raw = client.get('target_fleet_size')
    target_size = int(target_size_raw) if target_size_raw else 10

    current_size = len(driver_states)
    
    if current_size < target_size:
        for i in range(current_size + 1, target_size + 1):
            d_id = f"taxi_{i}"
            driver_states[d_id] = {
                "pos": [random.uniform(MIN_LNG, MAX_LNG), random.uniform(MIN_LAT, MAX_LAT)], 
                "path": []
            }
    elif current_size > target_size:
        for i in range(target_size + 1, current_size + 1):
            d_id = f"taxi_{i}"
            if d_id in driver_states:
                del driver_states[d_id]
                client.zrem("taxis_manhattan", d_id)
    
    job_data = client.rpop('dispatch_queue')
    if job_data:
        job = json.loads(job_data)
        d_id = job['driver_id']
        if d_id in driver_states:
            print(f" [!] Dispatching {d_id} to rider at {job['target']}")
            new_path = get_route(driver_states[d_id]['pos'], job['target'])
            driver_states[d_id]['path'] = new_path

    for d_id, state in driver_states.items():
        if state['path']:
            next_step = state['path'].pop(0)
            state['pos'] = next_step
        
        client.geoadd("taxis_manhattan", [state['pos'][0], state['pos'][1], d_id])

    time.sleep(0.1)