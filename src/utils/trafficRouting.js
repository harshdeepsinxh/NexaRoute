export const getTrafficColor = (congestionLevel) => {
    // Heavy Traffic: Solid Red (#FF0000)
    // Moderate Traffic: Solid Mustard (#E1AD01)
    // No Traffic (Optimized): Solid Blue (#007BFF)

    // For Mapbox annotations mapping
    if (congestionLevel === 'severe' || congestionLevel === 'heavy') return '#FF0000';
    if (congestionLevel === 'moderate') return '#E1AD01';
    if (congestionLevel === 'low' || congestionLevel === 'unknown') return '#007BFF';

    // For numerical pseudo mapping (fallback)
    const delayFactor = parseFloat(congestionLevel);
    if (!isNaN(delayFactor)) {
        if (delayFactor > 0.65) return '#FF0000';
        if (delayFactor > 0.35) return '#E1AD01';
        return '#007BFF';
    }

    return '#007BFF';
};

// Simple pseudo-random generator so the routes don't jitter on re-renders for the same hour
const pseudoRandom = (seed) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

export const generateFallbackRoute = (startLat, startLng, endLat, endLng, timeHour) => {
    const numSegments = 6;
    const segments = [];
    const waypoints = [[startLat, startLng]];

    const baseSeed = startLat + endLng + timeHour;

    for (let i = 1; i < numSegments; i++) {
        const fraction = i / numSegments;
        const jitterJ = pseudoRandom(baseSeed + i) - 0.5;
        const jitterK = pseudoRandom(baseSeed + i + 10) - 0.5;

        const lat = startLat + (endLat - startLat) * fraction + (jitterJ * 0.006);
        const lng = startLng + (endLng - startLng) * fraction + (jitterK * 0.006);
        waypoints.push([lat, lng]);
    }
    waypoints.push([endLat, endLng]);

    for (let i = 0; i < waypoints.length - 1; i++) {
        const isRushHour = (timeHour >= 8 && timeHour <= 10) || (timeHour >= 17 && timeHour <= 20);

        let delayFactor = pseudoRandom(baseSeed + i + 20); // 0.0 to 1.0

        // Push traffic heavier during rush hour
        if (isRushHour) {
            delayFactor = Math.min(1.0, delayFactor + 0.4);
        } else {
            delayFactor = Math.max(0.0, delayFactor - 0.2);
        }

        segments.push({
            positions: [waypoints[i], waypoints[i + 1]],
            color: getTrafficColor(delayFactor)
        });
    }

    return segments;
};

export const fetchLiveTrafficRoute = async (startLat, startLng, endLat, endLng, timeHour, mapboxToken) => {
    // Use fallback if we don't have a real token
    if (!mapboxToken || mapboxToken.includes('fake123')) {
        return generateFallbackRoute(startLat, startLng, endLat, endLng, timeHour);
    }

    try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${startLng},${startLat};${endLng},${endLat}?geometries=geojson&annotations=congestion&access_token=${mapboxToken}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.error('Failed to fetch Mapbox route:', response.statusText);
            return generateFallbackRoute(startLat, startLng, endLat, endLng, timeHour);
        }

        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            return generateFallbackRoute(startLat, startLng, endLat, endLng, timeHour);
        }

        const route = data.routes[0];
        const coordinates = route.geometry.coordinates; // Mapbox returns [lng, lat]
        const congestions = route.legs[0].annotation.congestion; // Array of congestion levels mapped to line segments

        const segments = [];

        for (let i = 0; i < coordinates.length - 1; i++) {
            const startNode = coordinates[i];
            const endNode = coordinates[i + 1];

            // Leaflet expects [lat, lng]
            const segmentPos = [
                [startNode[1], startNode[0]],
                [endNode[1], endNode[0]]
            ];

            // Default to 'unknown' if congestion annotation is missing for this segment
            const trafficState = congestions && congestions[i] ? congestions[i] : 'unknown';

            segments.push({
                positions: segmentPos,
                color: getTrafficColor(trafficState)
            });
        }

        return segments;

    } catch (err) {
        console.error("Error calling Mapbox API:", err);
        return generateFallbackRoute(startLat, startLng, endLat, endLng, timeHour);
    }
};
