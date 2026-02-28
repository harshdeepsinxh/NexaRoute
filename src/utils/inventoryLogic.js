import { getDistance } from './logistics';

const CATEGORIES = ['Dairy', 'Produce', 'Meat', 'Bakery', 'Pantry'];

// Generate mock inventory for a warehouse
export const generateInventoryForWarehouse = (warehouseId) => {
    // Generate between 5 and 10 item batches per warehouse
    const numBatches = Math.floor(Math.random() * 6) + 5;
    const inventory = [];

    for (let i = 0; i < numBatches; i++) {
        const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
        const dte = Math.floor(Math.random() * 11);
        const stock = Math.floor(Math.random() * 450) + 50;

        inventory.push({
            id: `inv-${warehouseId}-${i}`,
            category,
            shelf_life_days: dte, // We'll treat this as DTE for the simulation
            stock
        });
    }
    return inventory;
};

// Calculate Discount percentage based on Days to Expiry (DTE)
export const calculateDiscount = (dte) => {
    if (dte > 5) return 0;
    if (dte >= 3 && dte <= 5) return 0.15; // 15%
    return 0.40; // < 3 days is 40% (Flash Sale)
};

// Process a warehouse's inventory to find Flash Sale status
export const processWarehouseInventory = (inventory) => {
    let totalStock = 0;
    let flashSaleStock = 0;

    const processedItems = inventory.map(item => {
        const isFlashSale = item.shelf_life_days < 3;

        totalStock += item.stock;

        if (isFlashSale) {
            flashSaleStock += item.stock;
        }

        return {
            ...item,
            isFlashSale
        };
    });

    const flashSaleRatio = totalStock > 0 ? (flashSaleStock / totalStock) : 0;
    const isUrgentFlashSale = flashSaleRatio > 0.20; // > 20% of stock

    return {
        items: processedItems,
        totalStock,
        flashSaleStock,
        isUrgentFlashSale
    };
};

// Find the X nearest red zones (> 100 orders) to a warehouse for targeted promotions
export const getPromotionTargets = (warehouseLat, warehouseLng, allData, limit = 3) => {
    const redZones = allData.filter(zone => zone.orderCount >= 100);

    // Sort red zones by distance to this warehouse
    redZones.sort((a, b) => {
        const distA = getDistance(warehouseLat, warehouseLng, a.lat, a.lng);
        const distB = getDistance(warehouseLat, warehouseLng, b.lat, b.lng);
        return distA - distB;
    });

    return redZones.slice(0, limit);
};
