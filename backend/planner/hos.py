def generate_trip_plan(distance_miles, cycle_used_hours):
    MAX_DRIVE_HOURS = 11
    MAX_WINDOW = 14
    BREAK_AFTER = 8
    CYCLE_LIMIT = 70

    FUEL_INTERVAL = 1000  # miles
    SPEED = 50  # mph

    logs = []
    stops = []

    remaining_miles = distance_miles
    miles_since_fuel = 0

    current_day = 1
    cycle_hours = cycle_used_hours

    while remaining_miles > 0:
        driving_hours = 0
        window_hours = 0
        day_log = []

        time = 6.0  # start 6 AM

        # PICKUP (only first day)
        if current_day == 1:
            day_log.append({"start": time, "end": time+1, "status": "ON", "label": "Pickup"})
            stops.append({"type": "PICKUP", "day": current_day, "time": time})
            time += 1
            window_hours += 1

        while driving_hours < MAX_DRIVE_HOURS and remaining_miles > 0:

            # Drive 1 hour chunk
            drive_chunk = 1
            miles = SPEED * drive_chunk

            remaining_miles -= miles
            miles_since_fuel += miles

            start_time = time
            end_time = time + drive_chunk

            day_log.append({
                "start": start_time,
                "end": end_time,
                "status": "DRIVING"
            })

            time = end_time
            driving_hours += drive_chunk
            window_hours += drive_chunk
            cycle_hours += drive_chunk

            # 🚨 BREAK (after 8 hrs driving)
            if driving_hours >= BREAK_AFTER and driving_hours - drive_chunk < BREAK_AFTER:
                day_log.append({
                    "start": time,
                    "end": time + 0.5,
                    "status": "BREAK",
                    "label": "30 min rest"
                })

                stops.append({
                    "type": "BREAK",
                    "day": current_day,
                    "time": time
                })

                time += 0.5
                window_hours += 0.5

            # ⛽ FUEL STOP
            if miles_since_fuel >= FUEL_INTERVAL:
                day_log.append({
                    "start": time,
                    "end": time + 0.3,  # ~18 min
                    "status": "ON",
                    "label": "Fuel Stop"
                })

                stops.append({
                    "type": "FUEL",
                    "day": current_day,
                    "time": time
                })

                time += 0.3
                window_hours += 0.3
                miles_since_fuel = 0

        # 🌙 END OF DAY (10h rest)
        day_log.append({
            "start": time,
            "end": time + 10,
            "status": "OFF",
            "label": "End of Day Rest"
        })

        stops.append({
            "type": "END_OF_DAY",
            "day": current_day,
            "time": time
        })

        logs.append({
            "day": current_day,
            "entries": day_log
        })

        current_day += 1

        # 🔁 Cycle reset
        if cycle_hours >= CYCLE_LIMIT:
            cycle_hours = 0

    # DROPOFF (last day)
    logs[-1]["entries"].append({
        "start": logs[-1]["entries"][-1]["end"],
        "end": logs[-1]["entries"][-1]["end"] + 1,
        "status": "ON",
        "label": "Dropoff"
    })

    stops.append({
        "type": "DROPOFF",
        "day": current_day - 1
    })

    return {
        "logs": logs,
        "stops": stops
    }