import { create } from 'zustand';
import { POI } from '../types';

interface PoiState {
  pois: POI[];
  visiblePois: POI[];
  activePoi: POI | null;
  searchResults: POI[] | null;
  searchQuery: string;

  // Resource Panel State
  selectedResourceCategories: string[];   // Currently checked subcategory IDs
  pendingResourceCategories: string[];    // Pending (uncommitted) subcategory IDs

  setPois: (pois: POI[]) => void;
  setVisiblePois: (pois: POI[]) => void;
  setActivePoi: (poi: POI | null) => void;
  setSearchResults: (results: POI[] | null) => void;
  setSearchQuery: (query: string) => void;

  // Resource Panel Actions
  togglePendingResourceCategory: (id: string) => void;
  confirmResourceSelection: () => void;
  clearPendingResourceSelection: () => void;
}

export const usePoiStore = create<PoiState>((set) => ({
  pois: [],
  visiblePois: [],
  activePoi: null,
  searchResults: null,
  searchQuery: '',

  // Resource Panel State
  selectedResourceCategories: [],
  pendingResourceCategories: [],

  setPois: (pois) => set({ pois }),
  setVisiblePois: (visiblePois) => set({ visiblePois }),
  setActivePoi: (poi) => set({ activePoi: poi }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Resource Panel Actions
  togglePendingResourceCategory: (id) => set((state) => {
    const isSelected = state.pendingResourceCategories.includes(id);
    return {
      pendingResourceCategories: isSelected
        ? state.pendingResourceCategories.filter(cid => cid !== id)
        : [...state.pendingResourceCategories, id]
    };
  }),
  confirmResourceSelection: () => set((state) => ({
    selectedResourceCategories: [...state.pendingResourceCategories]
  })),
  clearPendingResourceSelection: () => set({
    pendingResourceCategories: [],
    selectedResourceCategories: []
  }),
}));
