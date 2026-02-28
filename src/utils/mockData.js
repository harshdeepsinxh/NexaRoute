// We'll define some constant base locations so the points don't jump around, just their color changes
const NUM_ZONES = 60;
const latMin = 30.68;
const latMax = 30.78;
const lngMin = 76.70;
const lngMax = 76.85;

// Fixed hotspots to guarantee red zones pop up
const fixedLocations = [
    { name: 'Mohali Core', lat: 30.70, lng: 76.71 },
    { name: 'Panchkula Core', lat: 30.69, lng: 76.84 },
    { name: 'Sector 17', lat: 30.738, lng: 76.782 },
    { name: 'Elante Mall', lat: 30.705, lng: 76.801 },
    { name: 'Sector 35', lat: 30.725, lng: 76.760 }
];

// Generate fixed geographic zones
const baseZones = Array.from({ length: NUM_ZONES }).map((_, i) => {
    if (i < fixedLocations.length) {
        return {
            id: i,
            name: fixedLocations[i].name,
            lat: fixedLocations[i].lat,
            lng: fixedLocations[i].lng,
        };
    }
    return {
        id: i,
        name: `Sector ${Math.floor(Math.random() * 60) + 1}`,
        lat: latMin + Math.random() * (latMax - latMin),
        lng: lngMin + Math.random() * (lngMax - lngMin),
    };
});

// Helper to calculate basic Euclidean distance for boosting
const getDist = (lat1, lng1, lat2, lng2) => {
    return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
};

export const getOrdersForTime = (hour) => {
    // Morning (8-10): Mohali (~30.70, 76.71), Panchkula (~30.69, 76.84)
    // Afternoon (13-15): Sector 17 (~30.738, 76.782)
    // Evening (19-21): Elante Mall (~30.705, 76.801), Sector 35 (~30.725, 76.760)

    return baseZones.map(zone => {
        let orderCount;
        // Default low base demand for the whole city
        let baseVol = Math.floor(Math.random() * 20) + 1;
        let boost = 0;

        // Morning Profile
        if (hour >= 8 && hour <= 10) {
            if (getDist(zone.lat, zone.lng, 30.70, 76.71) < 0.02) boost += 100; // Mohali
            if (getDist(zone.lat, zone.lng, 30.69, 76.84) < 0.02) boost += 100; // Panchkula
        }
        // Afternoon Profile
        else if (hour >= 13 && hour <= 15) {
            if (getDist(zone.lat, zone.lng, 30.738, 76.782) < 0.02) boost += 150; // Sector 17
        }
        // Evening Profile
        else if (hour >= 19 && hour <= 21) {
            if (getDist(zone.lat, zone.lng, 30.705, 76.801) < 0.02) boost += 120; // Elante
            if (getDist(zone.lat, zone.lng, 30.725, 76.760) < 0.02) boost += 120; // Sector 35
        }

        // Add some random noise to those close to hotspots
        if (boost > 0) {
            boost += Math.floor(Math.random() * 50);
        } else {
            // Just normal spread for non-hotspots, maybe occasionally medium
            if (Math.random() > 0.8) boost += 40;
        }

        orderCount = baseVol + boost;

        return {
            ...zone,
            orderCount,
        };
    });
};

// Keep for initial backward compatibility if needed, using hour 14
export const generateMockOrders = () => {
    return getOrdersForTime(14);
};
