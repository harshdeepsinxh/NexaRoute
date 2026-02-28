import React, { useState, useEffect } from 'react';
import MapDashboard from '../components/MapDashboard';
import SummarySidebar from '../components/SummarySidebar';
import { getOrdersForTime } from '../utils/mockData';
import { calculateWarehouses } from '../utils/logistics';
import { generateInventoryForWarehouse, processWarehouseInventory } from '../utils/inventoryLogic';
import { fetchLiveTrafficRoute } from '../utils/trafficRouting';
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox';
import './Home.css';

const formatTime = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${ampm}`;
};

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: 'white', zIndex: 9999, position: 'relative' }}>
                    <h2 style={{ color: 'red' }}>MapDashboard Crashed!</h2>
                    <pre style={{ color: 'black' }}>{this.state.error && this.state.error.toString()}</pre>
                </div>
            );
        }
        return this.props.children;
    }
}

const Home = () => {
    const [time, setTime] = useState(8); // Start at 8 AM
    const [orderData, setOrderData] = useState(() => getOrdersForTime(8));
    const [activeRiders, setActiveRiders] = useState([]);
    const [showRiderDemand, setShowRiderDemand] = useState(false);
    const [showTrafficLayer, setShowTrafficLayer] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all');

    // Generate strict mock inventory ONCE per warehouse ID so it persists across 시간 shifts
    const [inventoryRecords] = useState(() => {
        const baseWarehouses = calculateWarehouses(getOrdersForTime(8));
        const records = {};
        baseWarehouses.forEach((wh, idx) => {
            records[`wh-${idx}`] = generateInventoryForWarehouse(`wh-${idx}`);
        });
        return records;
    });

    const warehouses = calculateWarehouses(orderData).map((wh, idx) => {
        const inv = inventoryRecords[`wh-${idx}`];
        return {
            ...wh,
            id: `wh-${idx}`,
            inventoryData: processWarehouseInventory(inv)
        };
    });

    // Auto-generate active deliveries simulating current traffic
    useEffect(() => {
        const buildRiders = async () => {
            if (warehouses.length === 0) {
                setActiveRiders([]);
                return;
            }

            const topZones = [...orderData]
                .sort((a, b) => b.orderCount - a.orderCount)
                .slice(0, 15);

            const ridersPromises = topZones.map(async (zone, i) => {
                const wh = warehouses[i % warehouses.length];
                const segments = await fetchLiveTrafficRoute(wh.lat, wh.lng, zone.lat, zone.lng, time, MAPBOX_ACCESS_TOKEN);

                return {
                    id: `Rider-${i + 1}`,
                    startLat: wh.lat,
                    startLng: wh.lng,
                    stops: [{ id: `stop-${i}`, priority: 1 }],
                    routeSegments: segments
                };
            });

            const resolvedRiders = await Promise.all(ridersPromises);
            setActiveRiders(resolvedRiders);
        };

        buildRiders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderData, time]);

    // Update data whenever the time slider shifts
    useEffect(() => {
        setOrderData(getOrdersForTime(time));
    }, [time]);

    return (
        <div className="home-container">
            <div className="map-background">
                <ErrorBoundary>
                    <MapDashboard
                        data={orderData}
                        warehouses={warehouses}
                        ambientRoutes={activeRiders}
                        showRiderDemand={showRiderDemand}
                        showTrafficLayer={showTrafficLayer}
                        activeFilter={activeFilter}
                    />
                </ErrorBoundary>
            </div>
            <div className="ui-overlay">
                <header className="home-header glass-panel">
                    <div className="header-titles">
                        <h1>ORDER DELIVERY HEATMAP</h1>
                        <p>Track active deliveries and monitor fleet status.</p>
                    </div>
                    <div className="header-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/08/svg">
                            <path d="M19 8H16V5C16 4.44772 15.5523 4 15 4H5C4.44772 4 4 4.44772 4 5V18H5.5C5.5 19.3807 6.61929 20.5 8 20.5C9.38071 20.5 10.5 19.3807 10.5 18H13.5C13.5 19.3807 14.6193 20.5 16 20.5C17.3807 20.5 18.5 19.3807 18.5 18H20C20.5523 18 21 17.5523 21 17V12L19 8ZM8 19C7.44772 19 7 18.5523 7 18C7 17.4477 7.44772 17 8 17C8.55228 17 9 17.4477 9 18C9 18.5523 8.55228 19 8 19ZM16 19C15.4477 19 15 18.5523 15 18C15 17.4477 15.4477 17 16 17C16.5523 17 17 17.4477 17 18C17 18.5523 16.5523 19 16 19ZM16 13V9.5H18.5858L19.7824 11.8932C19.9272 12.1828 20 12.5024 20 12.8284V13H16Z" fill="currentColor" />
                        </svg>
                    </div>
                </header>

                <div className="sidebar-wrapper">
                    <SummarySidebar
                        data={orderData}
                        warehouses={warehouses}
                        time={time}
                        setTime={setTime}
                        formatTime={formatTime}
                        showRiderDemand={showRiderDemand}
                        setShowRiderDemand={setShowRiderDemand}
                        showTrafficLayer={showTrafficLayer}
                        setShowTrafficLayer={setShowTrafficLayer}
                        activeFilter={activeFilter}
                        setActiveFilter={setActiveFilter}
                    />
                </div>
            </div>
        </div>
    );
};

export default Home;
