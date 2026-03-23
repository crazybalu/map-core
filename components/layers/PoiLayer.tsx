import React, { useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Overlay from 'ol/Overlay';
import { fromLonLat } from 'ol/proj';
import { Style, Icon as IconStyle } from 'ol/style';
import { useMapInstance } from '../../core/MapCore';
import { usePoiStore } from '../../stores/poiStore';
import { getPoiConfig } from '../../config/poiConfig';
import { X, MapPin, TrendingUp } from 'lucide-react';

const getIconStyle = (category: string) => {
  const config = getPoiConfig(category);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill="${config.color}" stroke="white" stroke-width="2"/>
      <g transform="translate(4, 4)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${config.iconPath}
      </g>
    </svg>
  `.trim();

  return new Style({
    image: new IconStyle({
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      scale: 1,
      anchor: [0.5, 0.5]
    }),
  });
};

export const PoiLayer: React.FC = () => {
  const map = useMapInstance();
  const { pois, selectedCategory, searchResults, setVisiblePois, activePoi, setActivePoi } = usePoiStore();
  
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const vectorLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);

  // 1. Initialize Layer and Overlay
  useEffect(() => {
    if (!map) return;

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const category = feature.get('category');
        return getIconStyle(category);
      },
      zIndex: 10,
    });
    vectorLayerRef.current = vectorLayer;
    map.addLayer(vectorLayer);

    const overlay = new Overlay({
      element: popupContainerRef.current!,
      autoPan: { animation: { duration: 250 } },
      positioning: 'bottom-center',
      offset: [0, -16],
    });
    popupOverlayRef.current = overlay;
    map.addOverlay(overlay);

    // Event: Map Click (Feature Selection)
    const handleMapClick = (evt: any) => {
      const feature = map.forEachFeatureAtPixel(
        evt.pixel, 
        (feature) => feature,
        { layerFilter: (layer) => layer === vectorLayer }
      );
      
      if (feature) {
        const id = feature.getId();
        const poi = usePoiStore.getState().pois.find(p => p.id === id);
        if (poi) {
          setActivePoi(poi);
          return;
        }
      }
      setActivePoi(null);
    };

    // Pointer cursor for features
    const handlePointerMove = (e: any) => {
      const pixel = map.getEventPixel(e.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel, { layerFilter: (layer) => layer === vectorLayer });
      const target = map.getTargetElement();
      if (target) {
        target.style.cursor = hit ? 'pointer' : '';
      }
    };

    map.on('click', handleMapClick);
    map.on('pointermove', handlePointerMove);

    return () => {
      map.removeLayer(vectorLayer);
      map.removeOverlay(overlay);
      map.un('click', handleMapClick);
      map.un('pointermove', handlePointerMove);
    };
  }, [map, setActivePoi]);

  // 2. Data Sync
  useEffect(() => {
    if (!vectorSourceRef.current) return;
    const source = vectorSourceRef.current;
    
    source.clear();

    const baseData = searchResults !== null ? searchResults : pois;
    const filteredPois = selectedCategory 
      ? baseData.filter(p => p.category === selectedCategory)
      : baseData;

    const features = filteredPois.map(poi => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([poi.lng, poi.lat])),
      });
      feature.setId(poi.id);
      feature.set('category', poi.category);
      feature.set('name', poi.name);
      return feature;
    });

    source.addFeatures(features);
    setVisiblePois(filteredPois);
  }, [pois, selectedCategory, searchResults, setVisiblePois]);

  // 3. Popup Sync
  useEffect(() => {
    const overlay = popupOverlayRef.current;
    if (!overlay) return;

    if (activePoi) {
      overlay.setPosition(fromLonLat([activePoi.lng, activePoi.lat]));
    } else {
      overlay.setPosition(undefined);
    }
  }, [activePoi]);

  // Render Popup Content
  const renderPopupContent = () => {
    if (!activePoi) return null;
    const config = getPoiConfig(activePoi.category);
    const CustomPopup = config.PopupComponent;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden animate-in zoom-in-95 duration-200 w-[240px]">
        <div className="h-2 w-full" style={{ backgroundColor: config.color }}></div>
        <div className="p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{activePoi.name}</h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {config.label}
              </span>
            </div>
            <button 
              onClick={() => setActivePoi(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 mb-3 text-slate-600 dark:text-slate-300">
             <CustomPopup data={activePoi} />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 p-1">
            <div className="flex flex-col items-center flex-1 border-r border-slate-100 dark:border-slate-700">
                <TrendingUp className="w-3 h-3 text-green-500 mb-0.5" />
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">\${activePoi.value}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
                <MapPin className="w-3 h-3 text-blue-500 mb-0.5" />
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{activePoi.lat.toFixed(3)}</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-700 rotate-45"></div>
      </div>
    );
  };

  return (
    <div 
      ref={popupContainerRef} 
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
    >
      {renderPopupContent()}
    </div>
  );
};
