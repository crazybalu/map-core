import React, { createContext, useContext, useRef, useEffect, ReactNode, useState, useCallback } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Overlay from 'ol/Overlay';
import { Style, Fill, Stroke, Icon as IconStyle } from 'ol/style';
import Draw from 'ol/interaction/Draw';
import DragBox from 'ol/interaction/DragBox';
import { useMapStore } from '../stores/mapStore';
import { MapCapabilities, MapMarker } from '../types';
import { X, MapPin, TrendingUp } from 'lucide-react';

// Context to provide Map Capabilities to plugins
const MapContext = createContext<MapCapabilities | null>(null);
// Context to provide the raw Map instance to layers
const MapInstanceContext = createContext<Map | null>(null);

export const useMapCapabilities = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapCapabilities must be used within a MapCoreProvider');
  }
  return context;
};

export const useMapInstance = () => {
  return useContext(MapInstanceContext);
};

// --- Marker Icon Style Helper ---
const getIconStyle = (color: string = '#3b82f6', iconPath: string = '') => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="translate(4, 4)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${iconPath}
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

interface MapCoreProps {
  children: ReactNode;
}

export const MapCoreProvider: React.FC<MapCoreProps> = ({ children }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  
  const tileLayerRef = useRef<TileLayer | null>(null);
  const drawSourceRef = useRef<VectorSource | null>(null);
  const drawInteractionRef = useRef<Draw | DragBox | null>(null);

  // --- Marker Layer Refs ---
  const markerSourceRef = useRef<VectorSource | null>(null);
  const markerLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);
  
  // --- Marker State ---
  const [activeMarker, setActiveMarkerState] = useState<MapMarker | null>(null);
  const activeMarkerRef = useRef<MapMarker | null>(null);
  // Keep a ref to the current markers array for click handler lookups
  const currentMarkersRef = useRef<MapMarker[]>([]);
  
  const { 
    setMapExtent, 
    setActiveDrawingMode, 
    setDrawnExtent
  } = useMapStore();

  useEffect(() => {
    activeMarkerRef.current = activeMarker;
  }, [activeMarker]);

  // --- 1. Map Initialization (Kernel Boot) ---
  useEffect(() => {
    if (!mapRef.current) return;

    // Default to OSM
    const tileLayer = new TileLayer({ source: new OSM() });
    tileLayerRef.current = tileLayer;

    const drawSource = new VectorSource();
    drawSourceRef.current = drawSource;
    const drawLayer = new VectorLayer({
      source: drawSource,
      style: new Style({
        fill: new Fill({ color: 'rgba(59, 130, 246, 0.2)' }),
        stroke: new Stroke({ color: 'rgba(59, 130, 246, 0.8)', width: 2 }),
      }),
      zIndex: 20,
    });

    // --- Marker Layer Setup ---
    const markerSource = new VectorSource();
    markerSourceRef.current = markerSource;

    const markerLayer = new VectorLayer({
      source: markerSource,
      style: (feature) => {
        const color = feature.get('color');
        const iconPath = feature.get('iconPath');
        return getIconStyle(color, iconPath);
      },
      zIndex: 10,
    });
    markerLayerRef.current = markerLayer;

    const map = new Map({
      layers: [
        tileLayer,
        markerLayer,
        drawLayer,
      ],
      view: new View({
        center: fromLonLat([-74.0060, 40.7128]), // NYC
        zoom: 13,
      }),
      controls: [],
    });

    // --- POI Popup Overlay ---
    if (popupContainerRef.current) {
      const overlay = new Overlay({
        element: popupContainerRef.current,
        autoPan: { animation: { duration: 250 } },
        positioning: 'bottom-center',
        offset: [0, -16],
      });
      popupOverlayRef.current = overlay;
      map.addOverlay(overlay);
    }

    // Event: Map Click (Marker Feature Selection)
    const handleMapClick = (evt: any) => {
      const feature = map.forEachFeatureAtPixel(
        evt.pixel, 
        (feature) => feature,
        { layerFilter: (layer) => layer === markerLayer }
      );
      
      if (feature) {
        const id = feature.getId();
        const marker = currentMarkersRef.current.find(m => m.id === id);
        if (marker) {
          setActiveMarkerState(marker);
          if (marker.onClick) {
            marker.onClick();
          }
          return;
        }
      }
      setActiveMarkerState(null);
    };

    // Pointer cursor for Marker features
    const handlePointerMove = (e: any) => {
      const pixel = map.getEventPixel(e.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel, { layerFilter: (layer) => layer === markerLayer });
      const target = map.getTargetElement();
      if (target) {
        target.style.cursor = hit ? 'pointer' : '';
      }
    };

    map.on('click', handleMapClick);
    map.on('pointermove', handlePointerMove);

    // Event: Map Move
    map.on('moveend', () => {
      const size = map.getSize();
      if (!size || size[0] === 0 || size[1] === 0) return;

      const extent = map.getView().calculateExtent(size);
      setMapExtent(extent);
    });

    map.setTarget(mapRef.current);
    setMapInstance(map);

    // Initial Tick to trigger moveend and load initial data
    const initialFetch = () => {
      map.updateSize();
      const size = map.getSize();
      if (size && size[0] > 0 && size[1] > 0) {
        const extent = map.getView().calculateExtent(size);
        setMapExtent(extent);
      } else {
        setTimeout(initialFetch, 100);
      }
    };
    setTimeout(initialFetch, 100);

    return () => {
      map.un('click', handleMapClick);
      map.un('pointermove', handlePointerMove);
      map.setTarget(undefined);
    };
  }, []);

  // --- Popup Position Sync ---
  useEffect(() => {
    const overlay = popupOverlayRef.current;
    if (!overlay) return;

    if (activeMarker) {
      overlay.setPosition(fromLonLat([activeMarker.lng, activeMarker.lat]));
    } else {
      overlay.setPosition(undefined);
    }
  }, [activeMarker]);

  // --- Marker Layer Capability: addMarkers ---
  const addMarkers = useCallback((markers: MapMarker[]) => {
    const source = markerSourceRef.current;
    if (!source) return;

    // Store markers for click handler lookups
    currentMarkersRef.current = markers;

    source.clear();

    const features = markers.map(marker => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([marker.lng, marker.lat])),
      });
      feature.setId(marker.id);
      feature.set('color', marker.color);
      feature.set('iconPath', marker.iconPath);
      feature.set('name', marker.title);
      return feature;
    });

    source.addFeatures(features);
  }, []);

  // --- Marker Layer Capability: clearMarkers ---
  const clearMarkers = useCallback(() => {
    if (markerSourceRef.current) {
      markerSourceRef.current.clear();
    }
    currentMarkersRef.current = [];
    setActiveMarkerState(null);
  }, []);

  // --- Marker Layer Capability: setActiveMarker ---
  const handleSetActiveMarker = useCallback((marker: MapMarker | null) => {
    setActiveMarkerState(marker);
  }, []);

  // --- 2. Expose Capabilities (Kernel API) ---
  const capabilities: MapCapabilities = {
    flyTo: (center, zoom = 15) => {
      mapInstance?.getView().animate({
        center: fromLonLat(center),
        zoom: zoom,
        duration: 1000
      });
    },
    currentExtent: useMapStore.getState().mapExtent,
    zoomIn: () => {
        const view = mapInstance?.getView();
        if (view) {
            view.animate({ zoom: (view.getZoom() || 0) + 1, duration: 250 });
        }
    },
    zoomOut: () => {
        const view = mapInstance?.getView();
        if (view) {
            view.animate({ zoom: (view.getZoom() || 0) - 1, duration: 250 });
        }
    },
    startDrawing: (type: 'Circle' | 'Box') => {
      const map = mapInstance;
      const source = drawSourceRef.current;
      if (!map || !source) return;

      setActiveDrawingMode(type);

      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
      }
      source.clear();

      if (type === 'Box') {
        const dragBox = new DragBox();
        
        dragBox.on('boxstart', () => {
          source.clear();
        });

        dragBox.on('boxend', async () => {
          const geometry = dragBox.getGeometry();
          const feature = new Feature({ geometry });
          source.addFeature(feature);
          
          const extent = geometry.getExtent();
          setDrawnExtent(extent);
        });

        map.addInteraction(dragBox);
        drawInteractionRef.current = dragBox;
      } else {
        const draw = new Draw({
          source: source,
          type: 'Circle',
        });

        draw.on('drawstart', () => {
          source.clear();
        });

        draw.on('drawend', async (event) => {
          const feature = event.feature;
          const geometry = feature.getGeometry();
          if (!geometry) return;

          const extent = geometry.getExtent();
          setDrawnExtent(extent);
        });

        map.addInteraction(draw);
        drawInteractionRef.current = draw;
      }
    },
    setBaseLayer: (layerType: string) => {
        if (!tileLayerRef.current) return;

        let source;
        switch (layerType) {
            case 'satellite':
                source = new XYZ({
                    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    maxZoom: 19,
                    attributions: 'Tiles © Esri'
                });
                break;
            case 'light':
                source = new XYZ({
                    url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                    attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                });
                break;
            case 'dark':
                source = new XYZ({
                    url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                    attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                });
                break;
            case 'osm':
            default:
                source = new OSM();
                break;
        }
        tileLayerRef.current.setSource(source);
    },
    clearDrawing: () => {
      if (drawSourceRef.current) {
        drawSourceRef.current.clear();
      }
      if (drawInteractionRef.current && mapInstance) {
        mapInstance.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
      setDrawnExtent(null);
      setActiveDrawingMode(null);
    },
    // Marker Layer capabilities
    addMarkers,
    clearMarkers,
    setActiveMarker: handleSetActiveMarker,
  };

  // --- Render Popup Content ---
  const renderPopupContent = () => {
    if (!activeMarker) return null;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden animate-in zoom-in-95 duration-200 w-[240px]">
        <div className="h-2 w-full" style={{ backgroundColor: activeMarker.color || '#3b82f6' }}></div>
        <div className="p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{activeMarker.title}</h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                {activeMarker.subtitle}
              </span>
            </div>
            <button 
              onClick={() => setActiveMarkerState(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 mb-3 text-slate-600 dark:text-slate-300">
             {activeMarker.popupComponent}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 p-1">
            {activeMarker.value !== undefined && (
              <div className="flex flex-col items-center flex-1 border-r border-slate-100 dark:border-slate-700">
                  <TrendingUp className="w-3 h-3 text-green-500 mb-0.5" />
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                     {typeof activeMarker.value === 'number' && !isNaN(parseFloat(activeMarker.value.toString())) ? `$${activeMarker.value}` : activeMarker.value}
                  </span>
              </div>
            )}
            <div className="flex flex-col items-center flex-1">
                <MapPin className="w-3 h-3 text-blue-500 mb-0.5" />
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{activeMarker.lat.toFixed(3)}</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-700 rotate-45"></div>
      </div>
    );
  };

  return (
    <MapContext.Provider value={capabilities}>
      <MapInstanceContext.Provider value={mapInstance}>
        <div className="relative w-full h-full">
          {/* The Base Map View */}
          <div ref={mapRef} className="w-full h-full absolute inset-0 z-0 bg-slate-100 dark:bg-slate-900" />
          
          {/* POI Popup Overlay Container */}
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
      </MapInstanceContext.Provider>
    </MapContext.Provider>
  );
};
