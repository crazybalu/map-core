import React, { useEffect } from 'react';
import { usePoiStore } from '../stores/poiStore';
import { useMapStore } from '../stores/mapStore';
import { useMapCapabilities } from '../core/MapCore';
import { getPoiConfig, getSubCategoryById } from '../config/resources';
import { fetchPOIsByResourceCategories } from '../services/api';
import { transformExtent } from 'ol/proj';

import { Search } from 'lucide-react';
import { PluginContextProps } from '../types';

export const ListPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  const {
    pois, visiblePois, activePoi, searchResults,
    setPois, setSearchResults, setActivePoi, searchQuery, setSearchQuery
  } = usePoiStore();


  const { flyTo, addMarkers, clearMarkers, setActiveMarker } = useMapCapabilities();

  // --- 3. Remote search when searchQuery changes ---
  useEffect(() => {
    // If query is empty, it might be triggered when user clears text.
    // If query is not empty, we debounce the request.
    const handler = setTimeout(async () => {
      const { selectedResourceCategories, setPois } = usePoiStore.getState();
      const mapExtent = useMapStore.getState().mapExtent;
      
      if (selectedResourceCategories.length > 0 && mapExtent) {
        try {
          const lonLatExtent = transformExtent(mapExtent, 'EPSG:3857', 'EPSG:4326') as [number, number, number, number];
          const apiCategories = selectedResourceCategories
            .map(id => getSubCategoryById(id))
            .filter(Boolean)
            .map(sub => sub!.apiCategory);

          const data = await fetchPOIsByResourceCategories(apiCategories, lonLatExtent, searchQuery);
          setPois(data);
        } catch (error) {
          console.error('[ListPlugin] Search failed:', error);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // --- 4. bindPoiLayer: Sync data changes to the map layer via capabilities ---
  useEffect(() => {
    const baseData = searchResults !== null ? searchResults : pois;
    
    // Note: We still do a small local filter for visual responsiveness, 
    // but the heavy lifting is now done by the API trigger above.
    const queryMatch = searchQuery.trim().toLowerCase();
    const filteredPois = queryMatch ? baseData.filter(p => 
      p.name.toLowerCase().includes(queryMatch) || 
      (p.attributes && Object.values(p.attributes).some(v => String(v).toLowerCase().includes(queryMatch)))
    ) : baseData;

    // Update visible pois in store for other plugins to consume
    usePoiStore.getState().setVisiblePois(filteredPois);

    const markers = filteredPois.map(poi => {
      const config = getPoiConfig(poi.category);
      const CustomPopup = config.PopupComponent;
      return {
        id: poi.id,
        lat: poi.lat,
        lng: poi.lng,
        color: config.color,
        iconPath: config.iconPath,
        title: poi.name,
        subtitle: config.label,
        value: poi.value,
        popupComponent: <CustomPopup data={poi} />,
        onClick: () => setActivePoi(poi)
      };
    });

    addMarkers(markers);
  }, [pois, searchResults, searchQuery, addMarkers]);

  // --- Cleanup: clear the POI layer when this plugin unmounts ---
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  const queryMatch = searchQuery.trim().toLowerCase();
  const filteredPois = queryMatch ? visiblePois.filter(p => 
    p.name.toLowerCase().includes(queryMatch) || 
    (p.attributes && Object.values(p.attributes).some(v => String(v).toLowerCase().includes(queryMatch)))
  ) : visiblePois;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      <div className="p-4 bg-white border-b border-blue-100/80 dark:border-slate-800">
        <div className="relative">
          <input
            type="text"
            placeholder="关键字搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow placeholder:text-slate-400"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-blue-400" />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>{filteredPois.length} 项结果</span>
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
                const config = getPoiConfig(poi.category);
                const CustomPopup = config.PopupComponent;
                capabilities.setActiveMarker({
                  id: poi.id,
                  lat: poi.lat,
                  lng: poi.lng,
                  color: config.color,
                  iconPath: config.iconPath,
                  title: poi.name,
                  subtitle: config.label,
                  value: poi.value,
                  popupComponent: <CustomPopup data={poi} />
                });
                flyTo([poi.lng, poi.lat], 16);
              }}
              className={`flex flex-col gap-3 p-4 rounded bg-white cursor-pointer transition-all duration-200 shadow-sm ${isActive
                  ? 'border-2 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/10'
                  : 'border border-blue-100 hover:border-blue-300 dark:border-slate-700/50 dark:hover:border-slate-600'
                }`}
            >
              {/* Card Header */}
              <div className="flex items-start gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-sm mt-0.5 shrink-0" />
                <h4 className={`text-[15px] font-bold leading-snug flex-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {poi.name}
                </h4>
                <div 
                  className="w-6 h-6 rounded flex items-center justify-center shrink-0" 
                  style={{ backgroundColor: `${config.color}10`, color: config.color }}
                >
                  <div className="w-4 h-4" dangerouslySetInnerHTML={{ __html: config.iconPath }} />
                </div>
              </div>

              {/* Mock Details Grid to match image style */}
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                <div className="flex items-center text-slate-500">
                  <span className="w-16">属性:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{config.label}</span>
                </div>
                <div className="flex items-center text-slate-500">
                  <span className="w-16">数值:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium font-mono">${poi.value}</span>
                </div>
                <div className="flex items-center text-slate-500">
                  <span className="w-16">经度:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{poi.lng.toFixed(4)}</span>
                </div>
                <div className="flex items-center text-slate-500">
                  <span className="w-16">纬度:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{poi.lat.toFixed(4)}</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-2 mt-1">
                 {['基本信息', '空间详情', '居住人员'].map((btnText, i) => (
                    <button 
                       key={btnText}
                       className="flex-1 py-1 px-2 text-[11px] font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-slate-700 transition-colors"
                       onClick={(e) => { e.stopPropagation(); /* noop */ }}
                    >
                      {btnText}
                    </button>
                 ))}
                 <button 
                     className="flex-1 py-1 px-2 text-[11px] font-medium text-blue-600 bg-white border border-blue-200 rounded hover:bg-blue-50 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-slate-700 transition-colors truncate"
                     onClick={(e) => { e.stopPropagation(); /* noop */ }}
                  >
                    门禁轨迹
                 </button>
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
