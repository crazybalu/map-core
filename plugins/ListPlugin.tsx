import React, { useEffect, useRef } from 'react';
import { usePoiStore } from '../stores/poiStore';
import { useMapStore } from '../stores/mapStore';
import { useMapCapabilities } from '../core/MapCore';
import { getPoiConfig } from '../config/poiConfig';
import { fetchPOIs, queryPOIsByExtent, queryPOIsByText } from '../services/api';
import { transformExtent } from 'ol/proj';
import { Search } from 'lucide-react';
import { PluginContextProps } from '../types';

export const ListPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  const {
    pois, visiblePois, selectedCategory, activePoi, searchResults,
    setPois, setSearchResults, setActivePoi, searchQuery, setSearchQuery
  } = usePoiStore();
  const { mapExtent, drawnExtent } = useMapStore();
  const { flyTo, addMarkers, clearMarkers, setActiveMarker } = useMapCapabilities();

  const isInitialMount = useRef(true);

  // --- 1 & 2. Data Fetching: Combine mapExtent, searchQuery, and drawnExtent ---
  useEffect(() => {
    if (mapExtent) {
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
      const lonLatExtent = transformExtent(mapExtent, 'EPSG:3857', 'EPSG:4326') as [number, number, number, number];
      
      const options: { text?: string; drawnExtent?: [number, number, number, number] } = {};
      
      if (searchQuery.trim() !== '') {
        options.text = searchQuery;
      }
      if (drawnExtent) {
        options.drawnExtent = transformExtent(drawnExtent, 'EPSG:3857', 'EPSG:4326') as [number, number, number, number];
      }

      fetchPOIs(lonLatExtent, options).then(data => {
        console.log('[ListPlugin] Fetched POIs with combined conditions:', data.length);
        setPois(data);
        // Clear searchResults so we rely on pois as the single source of truth
        setSearchResults(null);
      });
    }
  }, [mapExtent, searchQuery, drawnExtent, setPois, setSearchResults]);

  // --- 3. bindPoiLayer: Sync data changes to the map layer via capabilities ---
  useEffect(() => {
    const baseData = searchResults !== null ? searchResults : pois;

    const filteredPois = selectedCategory
      ? baseData.filter(p => p.category === selectedCategory)
      : baseData;

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
  }, [pois, selectedCategory, searchResults, addMarkers]);

  // --- Cleanup: clear the POI layer when this plugin unmounts ---
  useEffect(() => {
    return () => {
      capabilities.clearMarkers();
    };
  }, [capabilities]);

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
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive
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
