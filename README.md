# Satellite Tracker
Built for [FullyHacks](https://fullyhacks.acmcsuf.com), a 24-hour hackathon.

A 3D visualization tool for tracking satellites, their trajectories, and overpasses over specific regions.

## Features

- **Satellite Tracking**: View the current position of satellites in Earth orbit
- **Trajectory Visualization**: See the complete path of satellites around the Earth
- **Overpass Prediction**: Identify when satellites will pass over specific locations
- **Interactive 3D Globe**: Rotate, zoom, and explore the Earth and satellite positions

## How It Works

1. **Select a Satellite**: Click on any satellite point to view its details
2. **View Trajectory**: The blue line shows the satellite's path around Earth
3. **Check Overpasses**: Cyan markers show when the satellite passes over your area
4. **Analyze Coverage**: Green and magenta outlines show visibility and sensor coverage

## Technical Details

- Built with React, Three.js, and Next.js
- Uses the [Spectator Earth API](https://api.spectator.earth/) for satellite data
- Real-time 3D rendering with WebGL
- Responsive design for desktop and mobile

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Add your API key to `.env.local`
4. Run the development server: `npm run dev`

## API Reference

The application uses the following [Spectator Earth API](https://api.spectator.earth/) endpoints:
- `/satellite/` - Satellite position data
- `/overpass/` - Satellite overpass predictions
- `/acquisition-plan/` - Planned image acquisitions
