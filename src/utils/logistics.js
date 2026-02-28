export const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
        Math.cos(p1) * Math.cos(p2) *
        Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};

export const calculateWarehouses = (data) => {
    // Sort red hotspots by density, pick top 3
    const hotspots = data.filter(p => p.orderCount >= 100)
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 3);
    return hotspots;
};

export const calculateUncoveredOrders = (data, warehouses) => {
    if (!warehouses || warehouses.length === 0) {
        return data.reduce((sum, item) => sum + item.orderCount, 0);
    }

    let uncoveredCount = 0;
    data.forEach(point => {
        let isCovered = false;
        for (const wh of warehouses) {
            if (getDistance(point.lat, point.lng, wh.lat, wh.lng) <= 2000) {
                isCovered = true;
                break;
            }
        }
        if (!isCovered) {
            uncoveredCount += point.orderCount;
        }
    });

    return uncoveredCount;
};
