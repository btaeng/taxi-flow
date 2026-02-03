import redis
import time
import os
import requests

redis_host = os.getenv('REDIS_HOST', 'localhost')
client = redis.Redis(host=redis_host, port=6379, decode_responses=True)

def get_route(start, end):
    """Fetch a road-snapped route from OSRM"""
    try:
        url = f"http://router.project-osrm.org/route/v1/driving/{start[0]},{start[1]};{end[0]},{end[1]}?overview=full&geometries=geojson"
        r = requests.get(url)
        return r.json()['routes'][0]['geometry']['coordinates']
    except Exception as e:
        print(f"Error fetching route: {e}")
        return None

driver_id = "taxi_pro_1"
current_pos = [-73.9857, 40.7580] # Times Square
destination = [-74.0110, 40.7060] # Wall Street

print(f" [x] Requesting road-snapped route for {driver_id}...")
route = get_route(current_pos, destination)

if route:
    print(f" [v] Route found! {len(route)} waypoints. Starting drive...")
    for step in route:
        client.geoadd("taxis_manhattan", [step[0], step[1], driver_id])
        
        time.sleep(1)
else:
    print(" [!] Failed to get route.")