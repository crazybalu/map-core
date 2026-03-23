import React from 'react';
import { usePoiStore } from '../stores/poiStore';
import { useMapCapabilities } from '../core/MapCore';
import { getPoiConfig } from '../config/poiConfig';
import { Search } from 'lucide-react';
import { PluginContextProps } from '../types';

export const ListPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  const { visiblePois, selectedCategory, activePoi, setActivePoi, searchQuery, setSearchQuery } = usePoiStore();
  const { flyTo } = useMapCapabilities();

  const filteredPois = selectedCategory 
    ? visiblePois.filter(p => p.category === selectedCategory)
    : visiblePois;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Search POIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>{filteredPois.length} Results</span>
          {selectedCategory && (
            <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
              {getPoiConfig(selectedCategory).label}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredPois.map(poi => {
          const config = getPoiConfig(poi.category);
          const isActive = activePoi?.id === poi.id;
          
          return (
            <div 
              key={poi.id}
              onClick={() => {
                setActivePoi(poi);
                flyTo([poi.lng, poi.lat], 16);
              }}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/20 shadow-sm border border-blue-100 dark:border-blue-800/50' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                style={{ backgroundColor: `${config.color}15`, color: config.color }}
              >
                <div className="w-5 h-5" dangerouslySetInnerHTML={{ __html: config.iconPath }} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-200'}`}>
                  {poi.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {config.label}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-mono font-medium text-slate-600 dark:text-slate-300">
                  ${poi.value}
                </div>
              </div>
            </div>
          );
        })}
        {filteredPois.length === 0 && (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
            No POIs found in this area.
          </div>
        )}
      </div>
    </div>
  );
};
