import React from 'react';
import { useMapCapabilities } from '../core/MapCore';
import { Plus, Minus, Home, Crosshair } from 'lucide-react';

const MapToolbar: React.FC = () => {
  const { zoomIn, zoomOut, flyTo } = useMapCapabilities();

  const handleHome = () => {
    // Fly to initial NYC coordinates
    flyTo([-74.0060, 40.7128], 13);
  };

  const handleLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          flyTo([pos.coords.longitude, pos.coords.latitude], 16);
        },
        (err) => {
          console.warn('Geolocation failed', err);
          // Silently fail or use a toast notification in a real app
        }
      );
    } else {
      console.warn('Geolocation is not supported by your browser.');
    }
  };

  const btnClass = "p-2 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300";

  return (
    <div className="absolute bottom-24 right-6 z-40 flex flex-col bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden pointer-events-auto">
      <button onClick={zoomIn} className={btnClass} title="Zoom In">
        <Plus className="w-5 h-5" />
      </button>
      <div className="h-[1px] bg-slate-200 dark:bg-slate-700 w-full" />
      <button onClick={zoomOut} className={btnClass} title="Zoom Out">
        <Minus className="w-5 h-5" />
      </button>
      <div className="h-[1px] bg-slate-200 dark:bg-slate-700 w-full" />
      <button onClick={handleHome} className={btnClass} title="Reset View">
        <Home className="w-5 h-5" />
      </button>
      <div className="h-[1px] bg-slate-200 dark:bg-slate-700 w-full" />
      <button onClick={handleLocation} className={btnClass} title="My Location">
        <Crosshair className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MapToolbar;