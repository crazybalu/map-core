import { create } from 'zustand';
import { POI, PluginInstanceConfig } from './types';

interface AppState {
  pois: POI[];
  visiblePois: POI[]; // POIs currently in map view
  mapExtent: number[] | null;
  layout: PluginInstanceConfig[]; 
  selectedCategory: string | null;
  activePoi: POI | null; // The POI currently selected for the popup
  
  // Actions
  setPois: (pois: POI[]) => void;
  setVisiblePois: (pois: POI[]) => void;
  setMapExtent: (extent: number[]) => void;
  updateLayout: (layout: PluginInstanceConfig[]) => void;
  updatePluginPosition: (id: string, x: number, y: number) => void;
  addPlugin: (plugin: PluginInstanceConfig) => void;
  removePlugin: (id: string) => void;
  bringToFront: (id: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setActivePoi: (poi: POI | null) => void;
}

// Helper for safe window usage to prevent off-screen initialization
const getSafeInitialLayout = (): PluginInstanceConfig[] => {
   const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
   const h = typeof window !== 'undefined' ? window.innerHeight : 768;
   
   return [
     {
        id: 'chart-1',
        type: 'poi-chart',
        title: 'Category Distribution',
        layout: { x: 20, y: 20, w: 300, h: 300 }
     },
     {
        id: 'list-1',
        type: 'poi-list',
        title: 'Location Details',
        layout: { x: 20, y: 340, w: 300, h: 400 }
     },
    {
      id: 'chatbot-floating',
      type: 'ai-chat',
      title: 'AI Assistant',
      // Ensure Y is at least 80px to avoid header being off-screen
      layout: { 
          x: Math.max(340, w - 380), 
          y: Math.max(80, h - 550), 
          w: 350, 
          h: 500 
      }
    }
  ];
};

export const useStore = create<AppState>((set) => ({
  pois: [], // Start empty, will be populated by backend call
  visiblePois: [],
  mapExtent: null,
  selectedCategory: null,
  activePoi: null,
  layout: getSafeInitialLayout(),

  setPois: (pois) => set({ pois }),
  setVisiblePois: (visiblePois) => set({ visiblePois }),
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
    // If not found or already at the end (top), do nothing
    if (index === -1 || index === state.layout.length - 1) return {};
    
    const newLayout = [...state.layout];
    const [item] = newLayout.splice(index, 1);
    newLayout.push(item);
    return { layout: newLayout };
  }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setActivePoi: (poi) => set({ activePoi: poi }),
}));