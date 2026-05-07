import os
import requests

def geocode_location(place):
    # Get the key from environment variables (important for security!)
    api_key = os.getenv("LOCATION_IQ_KEY")
    
    if not api_key:
        raise Exception("LOCATION_IQ_KEY is not set in environment variables.")

    url = "https://us1.locationiq.com/v1/search"
    params = {
        "key": api_key,
        "q": place,
        "format": "json",
        "limit": 1
    }

    res = requests.get(url, params=params)
    
    if res.status_code != 200:
        # LocationIQ provides helpful error messages in the response
        raise Exception(f"LocationIQ Error: {res.status_code} - {res.text}")

    data = res.json()

    if not data:
        raise Exception(f"Location not found: {place}")

    # LocationIQ returns a list of results
    lon = float(data[0]["lon"])
    lat = float(data[0]["lat"])

    return lon, lat

# Keep your get_route function exactly as it was
def get_route(start_coords, end_coords):
    lon1, lat1 = start_coords
    lon2, lat2 = end_coords

    url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}"
    params = {
        "overview": "full",
        "geometries": "geojson"
    }

    res = requests.get(url, params=params)
    
    if res.status_code != 200:
        raise Exception(f"OSRM Routing Error: {res.status_code} - {res.text}")

    data = res.json()

    if "routes" not in data or len(data["routes"]) == 0:
        raise Exception("No route found between these coordinates.")

    route = data["routes"][0]

    return {
        "distance_miles": route["distance"] / 1609.34,
        "duration_hours": route["duration"] / 3600,
        "geometry": route["geometry"]["coordinates"]
    }