
type Destination = {
  points: number;
  visitTime: number;
};

type RouteStop = {
  city: string;
  travelHours: number;
  visitHours: number;
  points: number;
};

type TravelResult = {
  route: RouteStop[];
  totalHours: number;
  usedHours: number;
  remainingHours: number;
  totalPoints: number;
};

// SHARED DATA

const destinations: Record<string, Destination> = {
  London: { points: 80, visitTime: 8 },
  Paris: { points: 100, visitTime: 12 },
  Rome: { points: 90, visitTime: 10 },
  Berlin: { points: 60, visitTime: 8 },
  Amsterdam: { points: 70, visitTime: 6 },
};

const travelTimes: Record<string, Record<string, number>> = {
  London: { Paris: 3, Rome: 6, Berlin: 4, Amsterdam: 2 },
  Paris: { London: 3, Rome: 5, Berlin: 3, Amsterdam: 3 },
  Rome: { London: 6, Paris: 5, Berlin: 5, Amsterdam: 6 },
  Berlin: { London: 4, Paris: 3, Rome: 5, Amsterdam: 4 },
  Amsterdam: { London: 2, Paris: 3, Rome: 6, Berlin: 4 },
};

// SHARED HELPERS

function validateStart(city: string, totalHours: number): Destination {
  const start = destinations[city];

  if (!start) {
    throw new Error(`Unknown starting city: ${city}`);
  }

  if (totalHours < start.visitTime) {
    throw new Error("Not enough time to visit starting city");
  }

  return start;
}

function createResult(
  route: RouteStop[],
  totalHours: number,
  remainingHours: number,
  totalPoints: number
): TravelResult {
  return {
    route,
    totalHours,
    usedHours: totalHours - remainingHours,
    remainingHours,
    totalPoints,
  };
}

function findBestDestination(
  current: string,
  remaining: number,
  visited: string[]
): string | null {
  let best: string | null = null;
  let bestRatio = -Infinity;

  for (const [name, info] of Object.entries(destinations)) {
    if (visited.includes(name)) continue;

    const travelTime = travelTimes[current]?.[name];

    if (travelTime === undefined) continue;

    const timeNeeded = travelTime + info.visitTime;

    if (timeNeeded > remaining) continue;

    const ratio = info.points / timeNeeded;

    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = name;
    }
  }

  return best;
}

// 1. RECURSIVE GREEDY ALGORITHM

function travelRecursive(
  startingCity: string,
  totalHours: number
): TravelResult {
  const start = validateStart(startingCity, totalHours);

  const initialRoute: RouteStop[] = [{
    city: startingCity,
    travelHours: 0,
    visitHours: start.visitTime,
    points: start.points,
  }];

  function recurse(
    current: string,
    remaining: number,
    visited: string[],
    route: RouteStop[],
    totalPoints: number
  ): TravelResult {
    const best = findBestDestination(current, remaining, visited);

    // Base case
    if (best === null) {
      return createResult(route, totalHours, remaining, totalPoints);
    }

    const travelHours = travelTimes[current][best];
    const destination = destinations[best];
    const timeNeeded = travelHours + destination.visitTime;

    // Recursive case
    return recurse(
      best,
      remaining - timeNeeded,
      [...visited, best],
      [...route, {
        city: best,
        travelHours,
        visitHours: destination.visitTime,
        points: destination.points,
      }],
      totalPoints + destination.points
    );
  }

  return recurse(
    startingCity,
    totalHours - start.visitTime,
    [startingCity],
    initialRoute,
    start.points
  );
}

// 2. GREEDY WITH WHILE LOOP

function travelLoop(
  startingCity: string,
  totalHours: number
): TravelResult {
  const start = validateStart(startingCity, totalHours);

  let current = startingCity;
  let remaining = totalHours - start.visitTime;
  let totalPoints = start.points;

  const visited = [startingCity];

  const route: RouteStop[] = [{
    city: startingCity,
    travelHours: 0,
    visitHours: start.visitTime,
    points: start.points,
  }];

  while (true) {
    const best = findBestDestination(current, remaining, visited);

    if (best === null) break;

    const travelHours = travelTimes[current][best];
    const destination = destinations[best];
    const timeNeeded = travelHours + destination.visitTime;

    remaining -= timeNeeded;
    totalPoints += destination.points;

    visited.push(best);
    route.push({
      city: best,
      travelHours,
      visitHours: destination.visitTime,
      points: destination.points,
    });

    current = best;
  }

  return createResult(route, totalHours, remaining, totalPoints);
}

// 3. OPTIMIZED LOOP: MAP + SET

const destinationMap = new Map<string, Destination>(
  Object.entries(destinations)
);

const travelTimeMap = new Map<string, Map<string, number>>(
  Object.entries(travelTimes).map(([city, times]) => [
    city,
    new Map(Object.entries(times)),
  ])
);

function findBestOptimized(
  current: string,
  remaining: number,
  visited: Set<string>
): string | null {
  let best: string | null = null;
  let bestRatio = -Infinity;

  for (const [name, info] of destinationMap) {
    if (visited.has(name)) continue;

    const travelTime = travelTimeMap.get(current)?.get(name);

    if (travelTime === undefined) continue;

    const timeNeeded = travelTime + info.visitTime;

    if (timeNeeded > remaining) continue;

    const ratio = info.points / timeNeeded;

    if (ratio > bestRatio) {
      bestRatio = ratio;
      best = name;
    }
  }

  return best;
}

function travelOptimized(
  startingCity: string,
  totalHours: number
): TravelResult {
  const start = destinationMap.get(startingCity);

  if (!start) {
    throw new Error(`Unknown starting city: ${startingCity}`);
  }

  if (totalHours < start.visitTime) {
    throw new Error("Not enough time to visit starting city");
  }

  let current = startingCity;
  let remaining = totalHours - start.visitTime;
  let totalPoints = start.points;

  const visited = new Set<string>([startingCity]);

  const route: RouteStop[] = [{
    city: startingCity,
    travelHours: 0,
    visitHours: start.visitTime,
    points: start.points,
  }];

  while (true) {
    const best = findBestOptimized(current, remaining, visited);

    if (best === null) break;

    const destination = destinationMap.get(best)!;
    const travelHours = travelTimeMap.get(current)!.get(best)!;
    const timeNeeded = travelHours + destination.visitTime;

    remaining -= timeNeeded;
    totalPoints += destination.points;

    visited.add(best);
    route.push({
      city: best,
      travelHours,
      visitHours: destination.visitTime,
      points: destination.points,
    });

    current = best;
  }

  return createResult(route, totalHours, remaining, totalPoints);
}

// EXECUTION AND COMPARISON

const startingCity = "Berlin"; // Change to any city
const availableHours = 4 * 12;

const recursiveResult = travelRecursive(startingCity, availableHours);
const loopResult = travelLoop(startingCity, availableHours);
const optimizedResult = travelOptimized(startingCity, availableHours);

function printResult(name: string, result: TravelResult): void {
  console.log(`\n========== ${name} ==========`);

  console.log(
    "Route:",
    result.route.map(stop => stop.city).join(" -> ")
  );

  console.table(result.route);

  console.log("Total hours:", result.totalHours);
  console.log("Used hours:", result.usedHours);
  console.log("Remaining hours:", result.remainingHours);
  console.log("Points collected:", result.totalPoints);
}

// printResult("RECURSIVE", recursiveResult);
// printResult("LOOP", loopResult);
printResult("OPTIMIZED LOOP", optimizedResult);
