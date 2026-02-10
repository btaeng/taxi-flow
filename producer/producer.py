import redis
import time
import os
import requests
import json
import random
from shapely.geometry import shape, Point

redis_host = os.getenv('REDIS_HOST', 'localhost')
client = redis.Redis(host=redis_host, port=6379, decode_responses=True)

def update_geography(filename):
    global boundary_polygon, min_lng, min_lat, max_lng, max_lat
    path = f"cities/{filename}"
    print(f" [!] Loading new city boundary: {path}")
    with open(path) as f:
        data = json.load(f)
        boundary_polygon = shape(data['features'][0]['geometry'])
        min_lng, min_lat, max_lng, max_lat = boundary_polygon.bounds

def load_boundary(filename):
    with open(filename) as f:
        data = json.load(f)
        return shape(data['features'][0]['geometry'])

def get_random_point_in_city():
    """Rejection Sampling: Pick a point in the box, check if it's in the city"""
    while True:
        p = Point(random.uniform(min_lng, max_lng), random.uniform(min_lat, max_lat))
        if boundary_polygon.contains(p):
            return [p.x, p.y]

def get_route(start, end):
    try:
        url = f"http://router.project-osrm.org/route/v1/driving/{start[0]},{start[1]};{end[0]},{end[1]}?overview=full&geometries=geojson"
        r = requests.get(url).json()
        return r['routes'][0]['geometry']['coordinates']
    except Exception as e:
        print(f"OSRM Error: {e}")
        return []
    
print(" [!] System booting. Resetting Redis state to defaults...")

client.set('current_city_file', 'manhattan.geojson')
client.set('target_fleet_size', 10)
client.delete("taxis_manhattan")
client.delete("dispatch_queue")
current_city_file = None 
boundary_polygon = None
driver_states = {}

print(f" [x] System Initialized with {len(driver_states)} taxis.")

while True:
    new_city_file = client.get('current_city_file') or 'manhattan.geojson'

    if new_city_file != current_city_file:
        update_geography(new_city_file)
        current_city_file = new_city_file
        driver_states = {}
        client.delete("taxis_manhattan")
        client.delete("dispatch_queue")
    
    target_size = int(client.get('target_fleet_size') or 10)
    current_size = len(driver_states)
    
    if current_size < target_size:
        for i in range(current_size + 1, target_size + 1):
            d_id = f"taxi_{i}"
            driver_states[d_id] = {
                "pos": get_random_point_in_city(), 
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