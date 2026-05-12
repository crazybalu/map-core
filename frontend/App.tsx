import React from 'react';
import { useMapStore } from './stores/mapStore';
import { Sun, Moon } from 'lucide-react';

// Core Kernel Imports
import { MapCoreProvider } from './core/MapCore';
import { LayoutEngine } from './core/LayoutEngine';
import { registerPlugins } from './plugins';


// 1. Initialize Plugin System immediately
registerPlugins();

function App() {
  const { theme, toggleTheme } = useMapStore();

  return (
    <div className={`${theme}`}>
      <div className="relative w-screen h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-300 text-slate-800 dark:text-slate-100">
        
        {/* KERNEL: MapCoreProvider acts as the system foundation */}
        <MapCoreProvider>
          
          {/* ENGINE: Layout Engine manages the plugin windows/rendering */}
          <LayoutEngine />

          {/* GLOBAL UI: System level controls (Start Menu / Branding) */}

          {/* Theme Toggle */}
          <button
             onClick={toggleTheme}
             className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-lg shadow-black/5 border border-white/20 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-white/90 dark:hover:bg-slate-700/90 transition-all pointer-events-auto"
             title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
             {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

        </MapCoreProvider>
      </div>
    </div>
  );
}

export default App;
