# You're going to Europe, and you have seven days to see everything
# you can. You assign a point value to each item and estimate how long it takes. How can you maximize the
# point total (seeing all the things you really want to see) during your
# stay? Come up with a greedy strategy. Will that give you the optimal
# solution?
# you start with the one closests and you can get to next one fastest.


# Destinations: name, points, visit time in hours
destinations = {
    "Paris": {"points": 100, "visit_time": 12},
    "Rome": {"points": 90, "visit_time": 10},
    "Berlin": {"points": 60, "visit_time": 8},
    "Amsterdam": {"points": 70, "visit_time": 6},
}

# Travel times in hours (simplified example)
travel_times = {
    "London": {"Paris": 3, "Rome": 6, "Berlin": 4, "Amsterdam": 2},
    "Paris": {"Rome": 5, "Berlin": 3, "Amsterdam": 3},
    "Rome": {"Paris": 5, "Berlin": 5, "Amsterdam": 6},
    "Berlin": {"Paris": 3, "Rome": 5, "Amsterdam": 4},
    "Amsterdam": {"Paris": 3, "Rome": 6, "Berlin": 4},
}


def find_best_destination(current, remaining, visited):
    best = None
    best_ratio = -1

    for name, info in destinations.items():
        if name in visited:
            continue

        travel_time = travel_times[current][name]
        time_needed = travel_time + info["visit_time"]

        if time_needed > remaining:
            continue

        ratio = info["points"] / time_needed

        if ratio > best_ratio:
            best_ratio = ratio
            best = name

    return best


# VERSION 1: LOOP
def travel_loop(current, remaining, visited=None, total_points=0):
    visited = list(visited) if visited is not None else []

    while True:
        best = find_best_destination(current, remaining, visited)

        if best is None:
            return visited, total_points, remaining

        time_needed = travel_times[current][best] + destinations[best]["visit_time"]

        remaining -= time_needed
        total_points += destinations[best]["points"]
        visited.append(best)
        current = best


# VERSION 2: RECURSION
def travel_recursive(current, remaining, visited=None, total_points=0):
    visited = list(visited) if visited is not None else []

    best = find_best_destination(current, remaining, visited)

    # Base case
    if best is None:
        return visited, total_points, remaining

    time_needed = travel_times[current][best] + destinations[best]["visit_time"]

    # Recursive case
    return travel_recursive(
        current=best,
        remaining=remaining - time_needed,
        visited=visited + [best],
        total_points=total_points + destinations[best]["points"],
    )


print("LOOP:", travel_loop("London", 168))
print("RECURSION:", travel_recursive("London", 168))
