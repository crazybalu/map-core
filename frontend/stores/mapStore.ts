import { create } from 'zustand';
import { PluginInstanceConfig, MapMarker } from '../types';
import { getSafeInitialLayout } from '../config/pluginConfig';
import { MAP_CONFIG } from '../config/mapConfig';

interface MapState {
  mapExtent: number[] | null;
  layout: PluginInstanceConfig[];
  theme: 'light' | 'dark';
  activeDrawingMode: 'Box' | 'Circle' | null;
  drawnExtent: number[] | null;
  
  // 业务及视图状态
  activeMarker: MapMarker | null;
  activeLayerId: string;
  isDevMode: boolean;
  currentZoom: number;
  currentCoords: [number, number];

  setMapExtent: (extent: number[]) => void;
  updateLayout: (layout: PluginInstanceConfig[]) => void;
  updatePluginPosition: (id: string, x: number, y: number) => void;
  addPlugin: (plugin: PluginInstanceConfig) => void;
  removePlugin: (id: string) => void;
  bringToFront: (id: string) => void;
  toggleTheme: () => void;
  setActiveDrawingMode: (mode: 'Box' | 'Circle' | null) => void;
  setDrawnExtent: (extent: number[] | null) => void;
  
  // 状态 setter
  setActiveMarker: (marker: MapMarker | null) => void;
  setActiveLayerId: (id: string) => void;
  setIsDevMode: (isDevMode: boolean) => void;
  setCurrentZoom: (zoom: number) => void;
  setCurrentCoords: (coords: [number, number]) => void;
}


export const useMapStore = create<MapState>((set) => ({
  mapExtent: null,
  layout: getSafeInitialLayout(),
  theme: 'light',
  activeDrawingMode: null,
  drawnExtent: null,
  activeMarker: null,
  activeLayerId: MAP_CONFIG.baseLayers[3]?.id || 'satellite',
  isDevMode: false,
  currentZoom: MAP_CONFIG.initialZoom,
  currentCoords: [0, 0],

  setMapExtent: (mapExtent) => set({ mapExtent }),
  updateLayout: (layout) => set({ layout }),
  updatePluginPosition: (id, x, y) => set((state) => ({
    layout: state.layout.map(p => 
      p.id === id 
        ? { ...p, layout: { ...p.layout, x, y, w: p.layout?.w, h: p.layout?.h } } 
        : p
    )
  })),
  addPlugin: (plugin) => set((state) => ({ layout: [...state.layout, plugin] })),
  removePlugin: (id) => set((state) => ({ 
    layout: state.layout.filter(p => p.id !== id) 
  })),
  bringToFront: (id) => set((state) => {
    const index = state.layout.findIndex(p => p.id === id);
    if (index === -1 || index === state.layout.length - 1) return {};
    const newLayout = [...state.layout];
    const [item] = newLayout.splice(index, 1);
    newLayout.push(item);
    return { layout: newLayout };
  }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setActiveDrawingMode: (mode) => set({ activeDrawingMode: mode }),
  setDrawnExtent: (extent) => set({ drawnExtent: extent }),
  
  setActiveMarker: (activeMarker) => set({ activeMarker }),
  setActiveLayerId: (activeLayerId) => set({ activeLayerId }),
  setIsDevMode: (isDevMode) => set({ isDevMode }),
  setCurrentZoom: (currentZoom) => set({ currentZoom }),
  setCurrentCoords: (currentCoords) => set({ currentCoords }),
}));
