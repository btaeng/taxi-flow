import redis
import time
import os
import requests
import json

redis_host = os.getenv('REDIS_HOST', 'localhost')
client = redis.Redis(host=redis_host, port=6379, decode_responses=True)

driver_states = {
    "taxi_1": {"pos": [-73.9857, 40.7580], "path": []},
    "taxi_2": {"pos": [-74.0060, 40.7128], "path": []},
}

def get_route(start, end):
    url = f"http://router.project-osrm.org/route/v1/driving/{start[0]},{start[1]};{end[0]},{end[1]}?overview=full&geometries=geojson"
    r = requests.get(url).json()
    return r['routes'][0]['geometry']['coordinates']

while True:
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
            client.geoadd("taxis_manhattan", [next_step[0], next_step[1], d_id])
        else:
            client.geoadd("taxis_manhattan", [state['pos'][0], state['pos'][1], d_id])

    time.sleep(1)