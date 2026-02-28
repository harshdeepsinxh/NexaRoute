# NexaRoute - Order Monitoring Dashboard

NexaRoute is a modern, high-performance order delivery and logistics tracking dashboard built with React and Leaflet. It visualizes city-wide order density, active fleet status, and warehouse planning metrics using a stunning Glassmorphism UI and dynamic, organic map overlays.

Features

*   **Apple Weather Liquid Cloud Effect:** Replaces standard static heatmap circles with fluid, organic, and drifting SVG filtered clouds (`mix-blend-mode: screen/overlay`) to visualize order density beautifully.
*   **Live Traffic Integration:** Overlays real-time Google Maps traffic data dynamically beneath the delivery zones for accurate logistics planning.
*   **Glassmorphism UI:** Features a premium, frosted-glass sidebar (`backdrop-filter: blur(12px)`) with clean Inter typography and subtle glowing hover states.
*   **Time of Day Simulation:** An interactive slider that seamlessly simulates order volume changes throughout the day (8:00 AM to 10:00 PM), animating the map clusters in real-time.
*   **Dynamic Warehouse Planning:** Custom isometric warehouse SVG icons that actively monitor their surrounding 2km radius. If nearby urgent orders exceed capacity, the warehouse icon dynamically pulses red.
*   **Demand Categorization:** Orders are automatically categorized into Urgent (Red), Moderate (Mustard), and Normal (Green) zones with dedicated interactive metrics.


##  Tech Stack

*   **Frontend Framework:** React 18 (using Vite)
*   **Mapping Engine:** Leaflet & React-Leaflet
*   **Map Tiles:** CARTO (Voyager basemap)
*   **Styling:** Pure CSS (Custom Glassmorphism design system)
*   **Icons:** Lucide React


##  How to Run Locally

Follow these steps to get the NexaRoute dashboard running on any local machine.

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your computer.

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/harshdeepsinxh/NexaRoute.git
cd NexaRoute
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the development server**
```bash
npm run dev
```

**4. Open in browser**
Once the server starts, it will usually be available at `http://localhost:5173` (or `http://localhost:5174`). Open that link in your web browser to view the interactive dashboard.


##  Project Structure Overview

*   `src/components/MapDashboard.jsx`: The core interactive map component containing the Leaflet logic, SVG Gooey Filters, and dynamic marker clustering.
*   `src/components/SummarySidebar.jsx`: The left-hand Glassmorphism command center containing the metrics, toggles, and time slider.
*   `src/utils/mockData.js`: Generates the realistic, simulated coordinate data for city sectors across the timeline.
*   `src/index.css`: Contains the global resets, Inter font imports, and base Glassmorphism utility classes.

---
*Created by Harshdeep Singh*
