import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, Circle, Polyline, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapDashboard.css';
import { calculateWarehouses } from '../utils/logistics';
import { getPromotionTargets } from '../utils/inventoryLogic';

// Generate a custom SVG isometric warehouse icon with dynamic glow
const createWarehouseIcon = (isOverloaded, label) => {
  const glowClass = isOverloaded ? 'overloaded-pulse' : 'steady-glow';

  const svgContent = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/08/svg" class="warehouse-custom-svg ${glowClass}">
      <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M12 22V12" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M22 7L12 12L2 7" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M12 12V16M8 9.5V13.5M16 9.5V13.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
  `;

  return new L.divIcon({
    className: 'warehouse-icon-wrapper',
    html: `
      <div class="warehouse-icon-container">
        ${svgContent}
        <div class="warehouse-glass-label">${label}</div>
      </div>
    `,
    iconSize: [60, 60],
    iconAnchor: [30, 45], // Center horizontally, anchor near bottom of SVG
    popupAnchor: [0, -45]
  });
};

// Create a custom icon for the Riders
const riderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Weather Cloud Class Logic:
 * Return specific CSS classes for the liquid SVG effect.
 */
const getZoneClassName = (orderCount) => {
  if (orderCount >= 100) return 'cloud-urgent';
  if (orderCount >= 30) return 'cloud-moderate';
  return 'cloud-normal';
};

const MapDashboard = ({
  data = [],
  warehouses = [],
  ambientRoutes = [],
  showRiderDemand,
  showTrafficLayer,
  mapboxToken,
  activeFilter = 'all'
}) => {

  const centerPosition = [30.7333, 76.7794]; // Chandigarh base center

  return (
    <div className="map-dashboard-container">

      <MapContainer center={centerPosition} zoom={13} className="leaflet-map" zoomControl={false}>
        <ZoomControl position="bottomleft" />
        {/* Base layer without labels */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
        />

        {/* Live Traffic Overlay */}
        {showTrafficLayer && (
          <TileLayer
            attribution='&copy; <a href="https://www.google.com/intl/en_US/help/terms_maps.html">Google</a>'
            url="https://mt1.google.com/vt/lyrs=m@221097413,traffic&x={x}&y={y}&z={z}"
            zIndex={10}
            opacity={0.8}
            maxZoom={18}
          />
        )}

        {data
          .filter(point => {
            if (activeFilter === 'red') return point.orderCount >= 100;
            if (activeFilter === 'mustard') return point.orderCount >= 30 && point.orderCount < 100;
            if (activeFilter === 'green') return point.orderCount > 0 && point.orderCount < 30;
            return true; // 'all'
          })
          .map((point) => {
            const zoneClass = getZoneClassName(point.orderCount);
            const ridersRequired = Math.ceil(point.orderCount / 15);

            return (
              <CircleMarker
                key={point.id}
                center={[point.lat, point.lng]}
                radius={Math.max(30, point.orderCount / 3.5)} // Slightly larger radius for cloud blobs
                className={`heat-zone-marker ${zoneClass} ${showRiderDemand ? 'visible' : 'hidden'}`}
                pathOptions={{ stroke: false }} // Defer all styling to CSS
              >
                <Tooltip direction="top" opacity={1}>
                  <strong>Location: {point.name}</strong><br />
                  {showRiderDemand
                    ? `Rider Demand: ${ridersRequired} Riders`
                    : `Volume: ${point.orderCount} Orders`
                  }
                </Tooltip>
              </CircleMarker>
            );
          })}

        {/* Label Layer sits over the markers for crisp readability */}
        <TileLayer
          className="crisp-labels-layer"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
          zIndex={1000}
        />

        {/* Warehouse Planning Layer */}
        {
          warehouses.map((wh, idx) => {
            const isFlashSale = wh.inventoryData?.isUrgentFlashSale;
            const promotionTargets = isFlashSale ? getPromotionTargets(wh.lat, wh.lng, data, 3) : [];

            // Overloaded Logic: sum of 'Red Zone' orderCount within 2km
            const whLatLng = L.latLng(wh.lat, wh.lng);
            const urgentNearbyDemand = data.reduce((sum, point) => {
              if (point.orderCount >= 100) {
                const distance = whLatLng.distanceTo(L.latLng(point.lat, point.lng));
                if (distance <= 2000) {
                  return sum + point.orderCount;
                }
              }
              return sum;
            }, 0);

            const isOverloaded = urgentNearbyDemand > 50;

            return (
              <React.Fragment key={`wh-${idx}`}>
                <Marker
                  position={[wh.lat, wh.lng]}
                  icon={createWarehouseIcon(isOverloaded, `WH-Sector ${idx + 1}`)}
                >
                  <Tooltip direction="top" opacity={1} permanent={false}>
                    <strong>Warehouse {idx + 1}</strong>
                    {isFlashSale && <><br /><span style={{ color: '#ef4444', fontWeight: 'bold' }}>URGENT FLASH SALE</span></>}
                  </Tooltip>
                </Marker>

                <Circle
                  center={[wh.lat, wh.lng]}
                  radius={2000} // 2km radius
                  pathOptions={{
                    color: isFlashSale ? '#ef4444' : 'white',
                    dashArray: '10, 10',
                    weight: 2,
                    fillColor: isFlashSale ? '#fca5a5' : '#9333ea',
                    fillOpacity: 0.1,
                  }}
                  className="warehouse-service-circle"
                />

                {/* User Promotion notification paths */}
                {isFlashSale && promotionTargets.map((target, tIdx) => (
                  <Polyline
                    key={`promo-${idx}-${tIdx}`}
                    positions={[[wh.lat, wh.lng], [target.lat, target.lng]]}
                    color="#ef4444"
                    weight={3}
                    dashArray="5, 8"
                    opacity={0.7}
                    className="promotion-polyline"
                  />
                ))}
              </React.Fragment>
            );
          })
        }

        {/* Ambient Traffic Routes for realistic active map feel */}
        {
          ambientRoutes.map((route, rIdx) => (
            <React.Fragment key={`ambient-${rIdx}`}>
              {route.routeSegments && route.routeSegments.map((segment, sIdx) => (
                <Polyline
                  key={`seg-${rIdx}-${sIdx}`}
                  positions={segment.positions}
                  color={segment.color}
                  weight={4}
                  opacity={0.5}
                  lineCap="round"
                  lineJoin="round"
                  className="traffic-route-glow"
                />
              ))}
            </React.Fragment>
          ))
        }
      </MapContainer >

      {/* Map Legend */}
      <div className="map-legend glass-panel">
        <h4>Warehouse Planning</h4>
        <div className="legend-item" style={{ marginBottom: '16px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/08/svg" className="legend-warehouse-svg" style={{ marginRight: '8px' }}>
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12 22V12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M22 7L12 12L2 7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12 12V16M8 9.5V13.5M16 9.5V13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span>Warehouse</span>
        </div>

        <h4>Order Density</h4>
        <div className="legend-item">
          <span className="legend-color legend-high"></span>
          <span>&gt; 100 orders (High)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-medium"></span>
          <span>30 - 99 orders (Mod)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-low"></span>
          <span>&lt; 30 orders (Low)</span>
        </div>
      </div >
    </div >
  );
};

export default MapDashboard;
