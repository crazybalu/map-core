import { create } from 'zustand';
import { PluginInstanceConfig } from '../types';
import { getSafeInitialLayout } from '../config/pluginConfig';

interface MapState {
  mapExtent: number[] | null;
  layout: PluginInstanceConfig[];
  theme: 'light' | 'dark';
  activeDrawingMode: 'Box' | 'Circle' | null;
  drawnExtent: number[] | null;

  setMapExtent: (extent: number[]) => void;
  updateLayout: (layout: PluginInstanceConfig[]) => void;
  updatePluginPosition: (id: string, x: number, y: number) => void;
  addPlugin: (plugin: PluginInstanceConfig) => void;
  removePlugin: (id: string) => void;
  bringToFront: (id: string) => void;
  toggleTheme: () => void;
  setActiveDrawingMode: (mode: 'Box' | 'Circle' | null) => void;
  setDrawnExtent: (extent: number[] | null) => void;
}


export const useMapStore = create<MapState>((set) => ({
  mapExtent: null,
  layout: getSafeInitialLayout(),
  theme: 'light',
  activeDrawingMode: null,
  drawnExtent: null,

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
}));
