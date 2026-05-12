import React, { useEffect, useState, useMemo } from 'react';
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

  const [activeTab, setActiveTab] = useState<string>('');
  // 用于稳定保持 tab 显示顺序，避免因数据更新导致顺序改变
  const [tabOrder, setTabOrder] = useState<string[]>([]);
  const [tabQueries, setTabQueries] = useState<Record<string, string>>({});

  // --- 1. Group POIs (unfiltered) to determine tabs ---
  const groupedPois = useMemo(() => {
    const groups: Record<string, typeof pois> = {};
    pois.forEach(poi => {
      if (!groups[poi.category]) {
        groups[poi.category] = [];
      }
      groups[poi.category].push(poi);
    });
    return groups;
  }, [pois]);

  // 当数据到达时，初始化 activeTab 并维护稳定的 tabOrder
  useEffect(() => {
    const categories = Object.keys(groupedPois);
    if (categories.length === 0) return;

    // 将新出现的分类追加到 tabOrder 末尾（保持已有顺序不变）
    setTabOrder(prev => {
      const newCategories = categories.filter(c => !prev.includes(c));
      return newCategories.length > 0 ? [...prev, ...newCategories] : prev;
    });

    if (!activeTab) {
      setActiveTab(categories[0]);
    } else if (!categories.includes(activeTab)) {
      setActiveTab(categories[0]);
    }
  }, [groupedPois, activeTab]);

  // --- 2. Remote search for Active Tab when its query changes ---
  useEffect(() => {
    if (!activeTab) return;
    const currentQuery = tabQueries[activeTab] || '';

    const handler = setTimeout(async () => {
      const { selectedResourceCategories, pois, setPois } = usePoiStore.getState();
      const mapExtent = useMapStore.getState().mapExtent;
      
      if (selectedResourceCategories.length > 0 && mapExtent) {
        try {
          const lonLatExtent = transformExtent(mapExtent, 'EPSG:3857', 'EPSG:4326') as [number, number, number, number];
          const data = await fetchPOIsByResourceCategories([activeTab], lonLatExtent, currentQuery);
          
          // Merge data: keep POIs from OTHER categories, replace POIs for THIS category
          const otherPois = pois.filter(p => p.category !== activeTab);
          setPois([...otherPois, ...data]);
        } catch (error) {
          console.error('[ListPlugin] Search failed:', error);
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [tabQueries[activeTab], activeTab]); 

  // --- 3. Final filtered pois for map markers and display ---
  const finalFilteredPois = useMemo(() => {
    return pois.filter(p => {
      const q = (tabQueries[p.category] || '').trim().toLowerCase();
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || 
        (p.attributes && Object.values(p.attributes).some(v => String(v).toLowerCase().includes(q)));
    });
  }, [pois, tabQueries]);

  // --- 4. bindPoiLayer: Sync data changes to the map layer via capabilities ---
  useEffect(() => {
    // Update visible pois in store for other plugins to consume
    usePoiStore.getState().setVisiblePois(finalFilteredPois);

    const markers = finalFilteredPois.map(poi => {
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
  }, [finalFilteredPois, addMarkers, setActivePoi]);

  // --- Cleanup: clear the POI layer when this plugin unmounts ---
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, [clearMarkers]);

  return (
    <div className="flex flex-col h-full bg-transparent text-slate-800 dark:text-slate-100">
      
      {/* Tab Bar */}
      {tabOrder.filter(c => groupedPois[c]).length > 0 && (
        <div className="flex border-b border-white/20 dark:border-slate-700/50 overflow-x-auto custom-scrollbar shrink-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md">
          {/* 按稳定的 tabOrder 顺序渲染，避免数据更新后 tab 顺序改变 */}
          {tabOrder.filter(c => groupedPois[c]).map(category => {
            const config = getPoiConfig(category);
            const isActive = activeTab === category;
            const count = groupedPois[category].length;
            
            return (
              <div 
                key={category}
                onClick={() => setActiveTab(category)}
                className={`flex items-center gap-1.5 px-4 py-3 cursor-pointer text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive 
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white/30 dark:bg-slate-700/30' 
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/10 dark:hover:bg-slate-700/10'
                }`}
              >
                <div 
                  className="w-4 h-4 rounded flex items-center justify-center shrink-0" 
                  style={{ backgroundColor: `${config.color}20`, color: config.color }}
                >
                  <div className="w-3 h-3" dangerouslySetInnerHTML={{ __html: config.iconPath }} />
                </div>
                <span>{config.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Search Bar for Active Tab */}
      {activeTab && (
        <div className="p-3 bg-transparent border-b border-white/20 dark:border-slate-700/50 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder={`在"${getPoiConfig(activeTab).label}"中搜索...`}
              value={tabQueries[activeTab] || ''}
              onChange={(e) => setTabQueries(prev => ({ ...prev, [activeTab]: e.target.value }))}
              className="w-full pl-9 pr-4 py-1.5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-white/30 dark:border-slate-700/50 rounded text-sm focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-blue-400" />
          </div>
        </div>
      )}

      {/* Active Tab Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {activeTab && finalFilteredPois.filter(p => p.category === activeTab).map(poi => {
          const config = getPoiConfig(poi.category);
          const isActive = activePoi?.id === poi.id;

          return (
            <div
              key={poi.id}
              onClick={() => {
                setActivePoi(poi);
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
              className={`flex flex-col gap-3 p-3 rounded bg-white/60 dark:bg-slate-800/60 backdrop-blur-md cursor-pointer transition-all duration-200 shadow-sm hover:bg-white/90 dark:hover:bg-slate-800/90 hover:shadow-md ${isActive
                  ? 'border-2 border-blue-500 dark:border-blue-400 ring-2 ring-blue-500/10'
                  : 'border border-white/40 dark:border-slate-700/50'
                }`}
            >
              {/* Card Header */}
              <div className="flex items-start gap-2">
                <div className="w-1 h-4 bg-blue-500 rounded-sm mt-0.5 shrink-0" />
                <h4 className={`text-[14px] font-bold leading-snug flex-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {poi.name}
                </h4>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                <div className="flex items-center text-slate-500">
                  <span className="w-12">属性:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{config.label}</span>
                </div>
                <div className="flex items-center text-slate-500">
                  <span className="w-12">数值:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium font-mono">${poi.value}</span>
                </div>
                <div className="flex items-center text-slate-500">
                  <span className="w-12">经度:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{poi.lng.toFixed(4)}</span>
                </div>
                <div className="flex items-center text-slate-500">
                  <span className="w-12">纬度:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{poi.lat.toFixed(4)}</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center justify-between gap-1.5 mt-1">
                 {['基本信息', '空间详情', '居住人员'].map((btnText, i) => (
                    <button 
                       key={btnText}
                       className="flex-1 py-1 px-1.5 text-[10px] font-medium text-blue-600 bg-white/50 dark:bg-slate-900/50 border border-white/30 dark:border-slate-700/50 rounded hover:bg-white/80 dark:hover:bg-slate-800 transition-colors"
                       onClick={(e) => { e.stopPropagation(); /* noop */ }}
                    >
                      {btnText}
                    </button>
                 ))}
                 <button 
                     className="flex-1 py-1 px-1.5 text-[10px] font-medium text-blue-600 bg-white/50 dark:bg-slate-900/50 border border-white/30 dark:border-slate-700/50 rounded hover:bg-white/80 dark:hover:bg-slate-800 transition-colors truncate"
                     onClick={(e) => { e.stopPropagation(); /* noop */ }}
                  >
                    门禁轨迹
                 </button>
              </div>
            </div>
          );
        })}
        
        {(!activeTab || finalFilteredPois.filter(p => p.category === activeTab).length === 0) && (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm">
            暂无数据
          </div>
        )}
      </div>
    </div>
  );
};
