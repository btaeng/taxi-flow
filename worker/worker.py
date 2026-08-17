import redis
import os
import time

redis_host = os.getenv('REDIS_HOST', 'localhost')
client = redis.Redis(host=redis_host, port=6379, decode_responses=True)

rider_lng, rider_lat = -73.9857, 40.7580

while True:
    print(f"\n [?] Rider at Times Square ({rider_lat}, {rider_lng}) requesting nearest taxis...")
    
    nearby = client.georadius(
        "taxis_manhattan", 
        rider_lng, rider_lat, 
        2, unit="km", 
        withdist=True, 
        sort="ASC"
    )

    if not nearby:
        print(" [!] No drivers found within 2km.")
    else:
        for driver in nearby[:3]: 
            print(f" [!] MATCH: {driver[0]} is {driver[1]:.2f} km away.")

    time.sleep(3)