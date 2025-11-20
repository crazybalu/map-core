import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { Layers, Plus } from 'lucide-react';
import { PluginInstanceConfig } from './types';

// Core Kernel Imports
import { MapCoreProvider } from './core/MapCore';
import { LayoutEngine } from './core/LayoutEngine';
import { registerPlugins } from './plugins';
import { pluginRegistry } from './core/PluginRegistry';

// 1. Initialize Plugin System immediately
registerPlugins();

function App() {
  const { addPlugin } = useStore();
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
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 text-slate-800">
      
      {/* KERNEL: MapCoreProvider acts as the system foundation */}
      <MapCoreProvider>
        
        {/* ENGINE: Layout Engine manages the plugin windows/rendering */}
        <LayoutEngine />

        {/* GLOBAL UI: System level controls (Start Menu / Branding) */}
        
        {/* Header/Branding */}
        <div className="absolute top-4 left-4 z-40 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-sm border border-slate-200 flex items-center gap-2 pointer-events-none select-none">
          <Layers className="w-5 h-5 text-blue-600" />
          <h1 className="font-bold text-slate-800">GeoInsight <span className="font-light text-slate-500">Kernel</span></h1>
        </div>

        {/* Add Widget FAB */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-auto">
          {isMenuOpen && (
            <div className="bg-white rounded-lg shadow-xl p-2 mb-2 animate-in slide-in-from-bottom-4 fade-in duration-200 border border-slate-200">
              <div className="text-xs font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">Add Widget</div>
              {availablePlugins.map((plugin) => (
                <button
                  key={plugin.type}
                  onClick={() => handleAddPlugin(plugin.type)}
                  className="flex items-center w-full gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-md transition-colors text-left"
                >
                  <plugin.icon className="w-4 h-4 text-slate-500" />
                  {plugin.name}
                </button>
              ))}
            </div>
          )}
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 ${
              isMenuOpen ? 'bg-slate-800 rotate-45' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

      </MapCoreProvider>
    </div>
  );
}

export default App;