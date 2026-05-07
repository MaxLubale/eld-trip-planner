from django.shortcuts import render

# Create your views here.
from .hos import generate_trip_plan
from .osm import geocode_location, get_route
from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(['POST'])
def plan_trip(request):
    start_name = request.data.get("currentLocation")
    end_name = request.data.get("dropoffLocation")
    cycle_used = float(request.data.get("cycleUsed", 0))

    # 1. Geocode
    start_coords = geocode_location(start_name)
    end_coords = geocode_location(end_name)

    # 2. Route
    route = get_route(start_coords, end_coords)

    # 3. HOS logs
    plan = generate_trip_plan(route["distance_miles"], cycle_used)

    return Response({

    "route": route,
    "logs": plan["logs"],
    "stops": plan["stops"]
})