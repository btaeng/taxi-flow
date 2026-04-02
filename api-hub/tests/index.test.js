import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import Redis from 'ioredis';

const redis = new Redis({ host: 'localhost', port: 6380 });

describe('Taxi Flow: Full System Scenarios', () => {

  beforeEach(async () => {
    await redis.flushall();
  });

  afterAll(async () => {
    await redis.quit();
  });

  describe('Scenario 1: City Environment Management', () => {
    it('should switch city file and clear old driver data', async () => {
      await redis.set('current_city_file', 'old_city.geojson');
      await redis.geoadd('taxis_manhattan', -73.9, 40.7, 'ghost_taxi');

      await redis.set('current_city_file', 'brooklyn.geojson');
      await redis.del('taxis_manhattan');

      expect(await redis.get('current_city_file')).toBe('brooklyn.geojson');
      expect(await redis.exists('taxis_manhattan')).toBe(0);
    });
  });

  describe('Scenario 2: Fleet Scaling', () => {
    it('should update the target fleet size correctly', async () => {
      const newSize = 75;
      await redis.set('target_fleet_size', newSize);
      
      const val = await redis.get('target_fleet_size');
      expect(parseInt(val)).toBe(75);
    });
  });

  describe('Scenario 3: Ride Dispatching Math', () => {
    it('should match a rider with the nearest driver', async () => {
      const rider = { lng: -73.9857, lat: 40.7580 };

      await redis.geoadd('taxis_manhattan', -73.9776, 40.7644, 'driver_near');
      await redis.geoadd('taxis_manhattan', -74.0091, 40.7069, 'driver_far');

      const nearby = await redis.georadius(
        'taxis_manhattan', rider.lng, rider.lat, 20, 'km', 'ASC'
      );

      expect(nearby[0]).toBe('driver_near');
      expect(nearby.length).toBe(2);
    });

    it('should not find any drivers if radius is too small', async () => {
      await redis.geoadd('taxis_manhattan', -74.0091, 40.7069, 'driver_far');
      
      const nearby = await redis.georadius('taxis_manhattan', -73.9857, 40.7580, 0.1, 'km');
      
      expect(nearby.length).toBe(0);
    });
  });
});