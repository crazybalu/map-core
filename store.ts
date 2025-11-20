import { create } from 'zustand';
import { POI, PluginInstanceConfig } from './types';

interface AppState {
  pois: POI[];
  visiblePois: POI[]; // POIs currently in map view
  mapExtent: number[] | null;
  layout: PluginInstanceConfig[]; 
  selectedCategory: string | null; 
  
  // Actions
  setPois: (pois: POI[]) => void;
  setVisiblePois: (pois: POI[]) => void;
  setMapExtent: (extent: number[]) => void;
  updateLayout: (layout: PluginInstanceConfig[]) => void;
  updatePluginPosition: (id: string, x: number, y: number) => void;
  addPlugin: (plugin: PluginInstanceConfig) => void;
  removePlugin: (id: string) => void;
  setSelectedCategory: (category: string | null) => void;
}

const generateMockPOIs = (count: number): POI[] => {
  const categories = ['Retail', 'Dining', 'Parks', 'Office', 'Residential'] as const;
  const pois: POI[] = [];
  const centerLat = 40.7128;
  const centerLng = -74.0060;

  for (let i = 0; i < count; i++) {
    pois.push({
      id: `poi-${i}`,
      name: `${categories[Math.floor(Math.random() * categories.length)]} Location ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      lat: centerLat + (Math.random() - 0.5) * 0.1,
      lng: centerLng + (Math.random() - 0.5) * 0.1,
      value: Math.floor(Math.random() * 10000) + 1000,
    });
  }
  return pois;
};

export const useStore = create<AppState>((set) => ({
  pois: generateMockPOIs(200),
  visiblePois: [],
  mapExtent: null,
  selectedCategory: null,
  layout: [
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
      layout: { x: window.innerWidth - 380, y: window.innerHeight - 600, w: 350, h: 500 }
    }
  ],

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
  setSelectedCategory: (category) => set({ selectedCategory: category }),
}));
