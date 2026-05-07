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
        "User-Agent": "eld-trip-planner"
    }

    res = requests.get(url, params=params, headers=headers)
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

    url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}"

    params = {
        "overview": "full",
        "geometries": "geojson"
    }

    res = requests.get(url, params=params)
    data = res.json()

    route = data["routes"][0]

    return {
        "distance_miles": route["distance"] / 1609,
        "duration_hours": route["duration"] / 3600,
        "geometry": route["geometry"]["coordinates"]  # [lon, lat]
    }