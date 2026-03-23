import React, { createContext, useContext, useRef, useEffect, ReactNode, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import { Style, Fill, Stroke } from 'ol/style';
import Draw from 'ol/interaction/Draw';
import DragBox from 'ol/interaction/DragBox';
import { useMapStore } from '../stores/mapStore';
import { MapCapabilities } from '../types';

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

interface MapCoreProps {
  children: ReactNode;
}

export const MapCoreProvider: React.FC<MapCoreProps> = ({ children }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  
  const tileLayerRef = useRef<TileLayer | null>(null);
  const drawSourceRef = useRef<VectorSource | null>(null);
  const drawInteractionRef = useRef<Draw | DragBox | null>(null);
  
  const { 
    setMapExtent, 
    setActiveDrawingMode, 
    setDrawnExtent
  } = useMapStore();

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

    const map = new Map({
      layers: [
        tileLayer,
        drawLayer,
      ],
      view: new View({
        center: fromLonLat([-74.0060, 40.7128]), // NYC
        zoom: 13,
      }),
      controls: [],
    });

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
      map.setTarget(undefined);
    };
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
    }
  };

  return (
    <MapContext.Provider value={capabilities}>
      <MapInstanceContext.Provider value={mapInstance}>
        <div className="relative w-full h-full">
          {/* The Base Map View */}
          <div ref={mapRef} className="w-full h-full absolute inset-0 z-0 bg-slate-100 dark:bg-slate-900" />
          
          {/* Plugin Layer on top */}
          <div className="relative z-10 w-full h-full pointer-events-none">
             {children}
          </div>
        </div>
      </MapInstanceContext.Provider>
    </MapContext.Provider>
  );
};
