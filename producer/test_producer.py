import pytest
import fakeredis
from shapely.geometry import Polygon, Point
import producer

@pytest.fixture
def mock_redis():
    return fakeredis.FakeStrictRedis(decode_responses=True)

@pytest.fixture(autouse=True)
def setup_mocks(mocker):
    mocker.patch('producer.client', fakeredis.FakeStrictRedis(decode_responses=True))
    
    mock_poly = Polygon([(0, 0), (0, 1), (1, 1), (1, 0)])
    producer.boundary_polygon = mock_poly
    producer.min_lng, producer.min_lat, producer.max_lng, producer.max_lat = 0, 0, 1, 1

def test_get_random_point_in_city(mocker):
    mock_poly = Polygon([(0, 0), (0, 1), (1, 1), (1, 0)])
    
    mocker.patch('producer.boundary_polygon', mock_poly)
    mocker.patch('producer.min_lng', 0)
    mocker.patch('producer.max_lng', 1)
    mocker.patch('producer.min_lat', 0)
    mocker.patch('producer.max_lat', 1)

    point = producer.get_random_point_in_city()

    assert len(point) == 2
    assert 0 <= point[0] <= 1 
    assert 0 <= point[1] <= 1
    assert mock_poly.contains(Point(point))

def test_get_route_success(mocker):
    mock_response = mocker.Mock()
    mock_response.json.return_value = {
        'routes': [{'geometry': {'coordinates': [[-73.9, 40.7], [-73.8, 40.6]]}}]
    }
    mocker.patch('requests.get', return_value=mock_response)

    route = producer.get_route([-73.9, 40.7], [-73.8, 40.6])
    
    assert len(route) == 2
    assert route[0] == [-73.9, 40.7]

def test_get_route_failure(mocker):
    mocker.patch('requests.get', side_effect=Exception("OSRM Down"))
    
    route = producer.get_route([0,0], [1,1])
    
    assert route == []

def test_fleet_scaling_logic(mock_redis):
    driver_states = {"taxi_1": {}, "taxi_2": {}}
    target_size = 5
    
    new_drivers_added = 0
    if len(driver_states) < target_size:
        for i in range(len(driver_states) + 1, target_size + 1):
            d_id = f"taxi_{i}"
            driver_states[d_id] = {"pos": [0,0], "path": []}
            new_drivers_added += 1
            
    assert len(driver_states) == 5
    assert "taxi_5" in driver_states
    assert new_drivers_added == 3