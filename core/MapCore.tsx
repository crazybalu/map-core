import React, { createContext, useContext, useRef, useEffect, ReactNode } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat, transformExtent } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Overlay from 'ol/Overlay';
import { Style, Icon as IconStyle } from 'ol/style';
import { useStore } from '../store';
import { MapCapabilities } from '../types';
import { fetchPOIs } from '../services/api';
import { getPoiConfig } from '../config/poiConfig'; // Import Config
import { X, MapPin, TrendingUp } from 'lucide-react';

// Context to provide Map Capabilities to plugins
const MapContext = createContext<MapCapabilities | null>(null);

export const useMapCapabilities = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapCapabilities must be used within a MapCoreProvider');
  }
  return context;
};

interface MapCoreProps {
  children: ReactNode;
}

// Helper to generate SVG icons based on config
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
      src: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
      scale: 1,
      anchor: [0.5, 0.5] // Center anchor
    }),
  });
};


export const MapCoreProvider: React.FC<MapCoreProps> = ({ children }) => {
  // We keep the direct map manipulation logic here (The Kernel)
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  
  // Popup Refs
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);

  // Connect to the "Data Bus" (Store)
  const { 
    pois, setPois, setVisiblePois, setMapExtent, 
    selectedCategory, setSelectedCategory, 
    activePoi, setActivePoi,
    theme
  } = useStore();

  // --- 1. Map Initialization (Kernel Boot) ---
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const category = feature.get('category');
        return getIconStyle(category);
      },
    });

    // Always use OSM for standard visibility
    const tileLayer = new TileLayer({ source: new OSM() });
    tileLayerRef.current = tileLayer;

    // Initialize Overlay
    const overlay = new Overlay({
      element: popupContainerRef.current!,
      autoPan: {
        animation: {
          duration: 250,
        },
      },
      positioning: 'bottom-center',
      offset: [0, -16], // Increased offset slightly due to larger icons
    });
    popupOverlayRef.current = overlay;

    const map = new Map({
      target: mapRef.current,
      layers: [
        tileLayer,
        vectorLayer,
      ],
      overlays: [overlay],
      view: new View({
        center: fromLonLat([-74.0060, 40.7128]), // NYC
        zoom: 13,
      }),
      controls: [],
    });

    mapInstanceRef.current = map;

    // Event: Map Move
    map.on('moveend', () => {
      const size = map.getSize();
      if (!size) return;

      const extent = map.getView().calculateExtent(size);
      setMapExtent(extent);
      
      const lonLatExtent = transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
      // lonLatExtent is [minLon, minLat, maxLon, maxLat]
      
      // Fetch data from backend based on current view extent
      fetchPOIs(lonLatExtent as [number, number, number, number]).then(data => {
        console.log('[Kernel] Fetched POIs for view:', data.length);
        setPois(data);
        // Since backend returns data for this view, all are visible (subject to category filter)
        // Note: Logic inside "Data Sync" effect will handle visibility updates based on category
      });
    });

    // Event: Map Click (Feature Selection)
    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature);
      
      if (feature) {
        const id = feature.getId();
        const poi = useStore.getState().pois.find(p => p.id === id);
        if (poi) {
          setActivePoi(poi);
          return;
        }
      }
      
      // If no feature clicked, close popup
      setActivePoi(null);
    });

    // Pointer cursor for features
    map.on('pointermove', function (e) {
      const pixel = map.getEventPixel(e.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel);
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    // Initial Tick to trigger moveend and load initial data
    setTimeout(() => map.dispatchEvent('moveend'), 500);

    return () => map.setTarget(undefined);
  }, []);

  // --- 2. Data Sync (Kernel -> View) ---
  useEffect(() => {
    if (!vectorSourceRef.current) return;
    const source = vectorSourceRef.current;
    
    // Log for debugging
    console.log('[Kernel] Data Sync triggered. POIs:', pois.length, 'Filter:', selectedCategory);

    source.clear();

    // Apply Client-Side Category Filter Logic on top of View Data
    const filteredPois = selectedCategory 
      ? pois.filter(p => p.category === selectedCategory)
      : pois;

    console.log('[Kernel] Visible Features after filter:', filteredPois.length);

    const features = filteredPois.map(poi => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([poi.lng, poi.lat])),
      });
      feature.setId(poi.id);
      feature.set('category', poi.category); // Crucial for styling
      feature.set('name', poi.name);
      return feature;
    });

    source.addFeatures(features);
    
    // Update visible POIs for plugins whenever the category filter changes locally
    setVisiblePois(filteredPois);

  }, [pois, selectedCategory]);

  // --- 3. Popup Sync (State -> Overlay) ---
  useEffect(() => {
    const overlay = popupOverlayRef.current;
    if (!overlay) return;

    if (activePoi) {
      overlay.setPosition(fromLonLat([activePoi.lng, activePoi.lat]));
    } else {
      overlay.setPosition(undefined);
    }
  }, [activePoi]);


  // --- 4. Expose Capabilities (Kernel API) ---
  const capabilities: MapCapabilities = {
    flyTo: (center, zoom = 15) => {
      mapInstanceRef.current?.getView().animate({
        center: fromLonLat(center),
        zoom: zoom,
        duration: 1000
      });
    },
    setFilter: (category) => {
      console.log('[Kernel] Capability setFilter invoked:', category);
      setSelectedCategory(category);
    },
    getVisibleData: () => {
      return useStore.getState().visiblePois;
    },
    currentExtent: useStore.getState().mapExtent
  };

  // --- Render Helpers ---
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

          {/* Configurable Custom Content Area */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 mb-3 text-slate-600 dark:text-slate-300">
             <CustomPopup data={activePoi} />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 p-1">
            <div className="flex flex-col items-center flex-1 border-r border-slate-100 dark:border-slate-700">
                <TrendingUp className="w-3 h-3 text-green-500 mb-0.5" />
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">${activePoi.value}</span>
            </div>
            <div className="flex flex-col items-center flex-1">
                <MapPin className="w-3 h-3 text-blue-500 mb-0.5" />
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{activePoi.lat.toFixed(3)}</span>
            </div>
          </div>
        </div>
        {/* Little Triangle Pointer */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-700 rotate-45"></div>
      </div>
    );
  };

  return (
    <MapContext.Provider value={capabilities}>
      <div className="relative w-full h-full">
        {/* The Base Map View */}
        <div ref={mapRef} className="w-full h-full absolute inset-0 z-0 bg-slate-100 dark:bg-slate-900" />
        
        {/* Popup Element (Hidden by OL until positioned) */}
        <div 
          ref={popupContainerRef} 
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
        >
          {renderPopupContent()}
        </div>

        {/* Plugin Layer on top */}
        <div className="relative z-10 w-full h-full pointer-events-none">
           {children}
        </div>
      </div>
    </MapContext.Provider>
  );
};