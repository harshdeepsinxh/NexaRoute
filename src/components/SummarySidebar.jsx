import React from 'react';
import './SummarySidebar.css';

const SummarySidebar = ({
    data,
    riders = [],
    time,
    setTime,
    formatTime,
    showRiderDemand,
    setShowRiderDemand,
    showTrafficLayer,
    setShowTrafficLayer,
    activeFilter,
    setActiveFilter
}) => {
    // Determine counts based on Current Circular Logic
    const totalOrders = data.reduce((sum, item) => sum + item.orderCount, 0);

    // Categorize existing data points
    const redZoneCount = data.filter(d => d.orderCount >= 100).length;
    const mustardZoneCount = data.filter(d => d.orderCount >= 30 && d.orderCount < 100).length;
    const greenZoneCount = data.filter(d => d.orderCount > 0 && d.orderCount < 30).length;

    // Pulse Animation State
    const [isPulsing, setIsPulsing] = React.useState(false);
    const prevRedCountRef = React.useRef(redZoneCount);

    React.useEffect(() => {
        const prevCount = prevRedCountRef.current;
        // Check for > 10% increase
        if (prevCount > 0 && redZoneCount > prevCount * 1.1) {
            setIsPulsing(true);
            setTimeout(() => setIsPulsing(false), 2000); // 2 second pulse
        }
        prevRedCountRef.current = redZoneCount;
    }, [redZoneCount]);

    return (
        <aside className="summary-sidebar glass-panel">
            <h2>Dashboard</h2>

            <div className="stat-box primary">
                <h4>Total Orders</h4>
                <p className="stat-value">{totalOrders}</p>
            </div>

            <div className="density-zones-grid">
                <div
                    className={`zone-card red-zone ${activeFilter === 'red' ? 'active' : ''} ${isPulsing ? 'pulse-alert' : ''}`}
                    onClick={() => setActiveFilter(activeFilter === 'red' ? 'all' : 'red')}
                >
                    <div className="zone-count">{redZoneCount}</div>
                    <div className="zone-label">URGENT</div>
                </div>
                <div
                    className={`zone-card mustard-zone ${activeFilter === 'mustard' ? 'active' : ''}`}
                    onClick={() => setActiveFilter(activeFilter === 'mustard' ? 'all' : 'mustard')}
                >
                    <div className="zone-count">{mustardZoneCount}</div>
                    <div className="zone-label">MODERATE</div>
                </div>
                <div
                    className={`zone-card green-zone ${activeFilter === 'green' ? 'active' : ''}`}
                    onClick={() => setActiveFilter(activeFilter === 'green' ? 'all' : 'green')}
                >
                    <div className="zone-count">{greenZoneCount}</div>
                    <div className="zone-label">NORMAL</div>
                </div>
            </div>

            <div className="sidebar-divider"></div>

            <h2>Map Controls</h2>

            <div className="control-group">
                <label className="rider-toggle-label" htmlFor="demand-toggle">
                    <input
                        id="demand-toggle"
                        type="checkbox"
                        checked={showRiderDemand}
                        onChange={(e) => setShowRiderDemand(e.target.checked)}
                    />
                    <span className="slider round glow-blue"></span>
                </label>
                <span className="control-text">Show Rider Demand</span>
            </div>

            <div className="control-group">
                <label className="rider-toggle-label" htmlFor="traffic-toggle">
                    <input
                        id="traffic-toggle"
                        type="checkbox"
                        checked={showTrafficLayer}
                        onChange={(e) => setShowTrafficLayer(e.target.checked)}
                    />
                    <span className="slider round glow-red"></span>
                </label>
                <span className="control-text">Live Traffic</span>
            </div>

            <div className="sidebar-divider"></div>

            {/* Time Series Slider UI */}
            <div className="sidebar-time-slider">
                <label htmlFor="timeSlider">Time of Day Simulation: <br /><strong>{formatTime(time)}</strong></label>
                <input
                    id="timeSlider"
                    type="range"
                    min="8"
                    max="23"
                    step="1"
                    value={time}
                    onChange={(e) => setTime(parseInt(e.target.value, 10))}
                    className="time-slider-input"
                />
            </div>
        </aside>
    );
};

export default SummarySidebar;
