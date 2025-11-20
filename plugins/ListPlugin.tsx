import React, { useState } from 'react';
import { useStore } from '../store';
import { PluginContextProps } from '../types';
import { Search, MapPin, Filter } from 'lucide-react';

const ListPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  const { visiblePois, selectedCategory } = useStore();
  const [search, setSearch] = useState('');

  const filtered = visiblePois.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleItemClick = (poi: any) => {
    capabilities.flyTo([poi.lng, poi.lat], 16);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-white">
      <div className="p-4 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between mb-3">
           <h3 className="text-sm font-semibold text-slate-700">{config.title}</h3>
           <div className="flex items-center gap-2">
              {selectedCategory && (
                 <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                   <Filter className="w-3 h-3" />
                   {selectedCategory}
                   <button onClick={() => capabilities.setFilter(null)} className="ml-1 hover:text-blue-800">×</button>
                 </span>
              )}
              <span className="text-xs font-mono text-slate-400">{filtered.length}</span>
           </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search POIs..." 
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {filtered.length === 0 ? (
           <div className="text-center text-slate-400 py-8 text-sm">
             {selectedCategory ? `No ${selectedCategory} locations found` : 'No results found'}
           </div>
        ) : (
          filtered.map(poi => (
            <div 
              key={poi.id} 
              onClick={() => handleItemClick(poi)}
              className="p-3 bg-white border border-slate-100 rounded-md hover:border-blue-300 transition-colors group cursor-pointer"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium text-slate-800 group-hover:text-blue-600">{poi.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{poi.category}</p>
                </div>
                <MapPin className="w-3 h-3 text-slate-300 group-hover:text-blue-500" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500" style={{ width: `${Math.min(poi.value / 100, 100)}%` }}></div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">${poi.value}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ListPlugin;
