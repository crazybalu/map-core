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
             className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors pointer-events-auto"
             title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
             {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>

          {/* Map Controls Toolbar */}
          <MapToolbar />

          {/* Add Widget FAB */}
          <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-auto">
            {isMenuOpen && (
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-2 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-semibold text-slate-400 dark:text-slate-500 px-2 py-1 uppercase tracking-wider">Add Widget</div>
                {availablePlugins.map((plugin) => (
                  <button
                    key={plugin.type}
                    onClick={() => handleAddPlugin(plugin.type)}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors text-left"
                  >
                    <plugin.icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    {plugin.name}
                  </button>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 ${
                isMenuOpen ? 'bg-slate-800 dark:bg-slate-700 rotate-45' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
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
