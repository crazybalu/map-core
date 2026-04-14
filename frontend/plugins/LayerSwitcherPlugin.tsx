import React, { useState } from 'react';
import { PluginContextProps } from '../types';
import { Map, Satellite, Moon, Sun } from 'lucide-react';

const LayerSwitcherPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  const [active, setActive] = useState('osm');

  const layers = [
    { id: 'osm', label: 'Standard', icon: Map, color: 'bg-green-500' },
    { id: 'satellite', label: 'Satellite', icon: Satellite, color: 'bg-blue-600' },
    { id: 'light', label: 'Light', icon: Sun, color: 'bg-slate-400' },
    { id: 'dark', label: 'Dark', icon: Moon, color: 'bg-slate-800' },
  ];

  const handleSelect = (id: string) => {
    setActive(id);
    capabilities.setBaseLayer(id);
  };

  return (
    <div className="w-full h-full bg-white dark:bg-transparent flex flex-col p-2 overflow-y-auto">
      <div className="grid grid-cols-2 gap-3">
        {layers.map((layer) => (
          <button
            key={layer.id}
            onClick={() => handleSelect(layer.id)}
            className={`
              relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200
              ${active === layer.id 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 shadow-sm' 
                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:bg-slate-100 dark:hover:bg-slate-700/80 hover:scale-105'
              }
            `}
          >
            <div className={`p-2 rounded-full text-white ${layer.color} shadow-sm`}>
               <layer.icon className="w-5 h-5" />
            </div>
            <span className={`text-xs font-medium ${active === layer.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>
              {layer.label}
            </span>
            {active === layer.id && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayerSwitcherPlugin;