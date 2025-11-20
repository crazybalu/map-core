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
import { Style, Circle, Fill, Stroke } from 'ol/style';
import { useStore } from '../store';
import { MapCapabilities } from '../types';

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

export const MapCoreProvider: React.FC<MapCoreProps> = ({ children }) => {
  // We keep the direct map manipulation logic here (The Kernel)
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const vectorSourceRef = useRef<VectorSource | null>(null);
  
  // Connect to the "Data Bus" (Store)
  const { pois, setVisiblePois, setMapExtent, selectedCategory, setSelectedCategory } = useStore();

  // --- 1. Map Initialization (Kernel Boot) ---
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const vectorSource = new VectorSource();
    vectorSourceRef.current = vectorSource;

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({ color: '#3b82f6' }),
          stroke: new Stroke({ color: '#ffffff', width: 2 }),
        }),
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer,
      ],
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
      const [minLon, minLat, maxLon, maxLat] = lonLatExtent;

      // Filter visible data based on geometry
      // Note: This is raw data visibility, not filtered by category yet
      const currentVisiblePois = useStore.getState().pois.filter(p => 
        p.lng >= minLon && p.lng <= maxLon &&
        p.lat >= minLat && p.lat <= maxLat
      );

      setVisiblePois(currentVisiblePois);
    });

    // Initial Tick
    setTimeout(() => map.dispatchEvent('moveend'), 500);

    return () => map.setTarget(undefined);
  }, []);

  // --- 2. Data Sync (Kernel -> View) ---
  useEffect(() => {
    if (!vectorSourceRef.current) return;
    const source = vectorSourceRef.current;
    source.clear();

    // Apply Filter Logic
    const filteredPois = selectedCategory 
      ? pois.filter(p => p.category === selectedCategory)
      : pois;

    const features = filteredPois.map(poi => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([poi.lng, poi.lat])),
      });
      feature.setId(poi.id);
      return feature;
    });

    source.addFeatures(features);
  }, [pois, selectedCategory]);


  // --- 3. Expose Capabilities (Kernel API) ---
  const capabilities: MapCapabilities = {
    flyTo: (center, zoom = 15) => {
      mapInstanceRef.current?.getView().animate({
        center: fromLonLat(center),
        zoom: zoom,
        duration: 1000
      });
    },
    setFilter: (category) => {
      setSelectedCategory(category);
    },
    getVisibleData: () => {
      return useStore.getState().visiblePois;
    },
    currentExtent: useStore.getState().mapExtent
  };

  return (
    <MapContext.Provider value={capabilities}>
      <div className="relative w-full h-full">
        {/* The Base Map View */}
        <div ref={mapRef} className="w-full h-full absolute inset-0 z-0 bg-slate-100" />
        
        {/* Plugin Layer on top */}
        <div className="relative z-10 w-full h-full pointer-events-none">
           {children}
        </div>
      </div>
    </MapContext.Provider>
  );
};
