import requests

# Convert "city name" → "lon,lat"
def geocode_location(place):
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": place,
        "format": "json",
        "limit": 1
    }

    headers = {
        # OSM requires a specific User-Agent. 
        # Adding a fake email/repo link helps prevent being flagged as a bot.
        "User-Agent": "MeridianLogisticsPlanner/1.0 (contact: lubalecliff@gmail.com.com)"
    }

    res = requests.get(url, params=params, headers=headers)
    
    # CRITICAL: Check if the request was blocked or failed
    if res.status_code != 200:
        raise Exception(f"OSM Geocode Error: {res.status_code} - {res.text}")

    data = res.json()

    if not data:
        raise Exception(f"Location not found: {place}")

    lon = float(data[0]["lon"])
    lat = float(data[0]["lat"])

    return lon, lat


# Get route from OSRM
def get_route(start_coords, end_coords):
    lon1, lat1 = start_coords
    lon2, lat2 = end_coords

    # Note: OSRM Public API (router.project-osrm.org) is also rate-limited.
    url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}"

    params = {
        "overview": "full",
        "geometries": "geojson"
    }

    res = requests.get(url, params=params)
    
    if res.status_code != 200:
        raise Exception(f"OSRM Routing Error: {res.status_code} - {res.text}")

    data = res.json()

    # Safety check: Ensure a route was actually found
    if "routes" not in data or len(data["routes"]) == 0:
        raise Exception("No route found between these coordinates.")

    route = data["routes"][0]

    return {
        "distance_miles": route["distance"] / 1609.34, # More precise conversion
        "duration_hours": route["duration"] / 3600,
        "geometry": route["geometry"]["coordinates"]  # [lon, lat]
    }