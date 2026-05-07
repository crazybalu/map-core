import React, { useState } from 'react';
import { useMapStore } from './stores/mapStore';
import { Plus, Sun, Moon } from 'lucide-react';
import { PluginInstanceConfig } from './types';

// Core Kernel Imports
import { MapCoreProvider } from './core/MapCore';
import { LayoutEngine } from './core/LayoutEngine';
import { registerPlugins } from './plugins';
import { pluginRegistry } from './core/PluginRegistry';
import MapToolbar from './components/MapToolbar';


// 1. Initialize Plugin System immediately
registerPlugins();

function App() {
  const { addPlugin, theme, toggleTheme } = useMapStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleAddPlugin = (type: string) => {
    const def = pluginRegistry.get(type);
    if (!def) return;

    const id = `plugin-${Date.now()}`;
    const newPlugin: PluginInstanceConfig = {
       id,
       type,
       title: def.name,
       layout: { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50, w: 350, h: 450 },
       children: []
    };
    addPlugin(newPlugin);
    setIsMenuOpen(false);
  };

  const availablePlugins = pluginRegistry.getAll().filter(p => p.type !== 'layout-container');

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

          {/* Map Controls Toolbar */}
          <MapToolbar />

          {/* Add Widget FAB */}
          <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-auto">
            {isMenuOpen && (
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-xl shadow-2xl p-2 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200 border border-white/30 dark:border-slate-700/50">
                <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 py-1 uppercase tracking-wider">Add Widget</div>
                {availablePlugins.map((plugin) => (
                  <button
                    key={plugin.type}
                    onClick={() => handleAddPlugin(plugin.type)}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50 rounded-md transition-colors text-left"
                  >
                    <plugin.icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    {plugin.name}
                  </button>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-14 h-14 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center text-white transition-all duration-300 ${
                isMenuOpen ? 'bg-slate-800/90 dark:bg-slate-700/90 backdrop-blur-md rotate-45' : 'bg-blue-600/90 hover:bg-blue-600 dark:bg-blue-500/90 dark:hover:bg-blue-500 backdrop-blur-md hover:scale-105'
              }`}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

        </MapCoreProvider>
      </div>
    </div>
  );
}

export default App;
