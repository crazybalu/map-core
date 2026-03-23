import { create } from 'zustand';
import { POI } from '../types';

interface PoiState {
  pois: POI[];
  visiblePois: POI[];
  selectedCategory: string | null;
  activePoi: POI | null;
  searchResults: POI[] | null;
  searchQuery: string;

  setPois: (pois: POI[]) => void;
  setVisiblePois: (pois: POI[]) => void;
  setSelectedCategory: (category: string | null) => void;
  setActivePoi: (poi: POI | null) => void;
  setSearchResults: (results: POI[] | null) => void;
  setSearchQuery: (query: string) => void;
}

export const usePoiStore = create<PoiState>((set) => ({
  pois: [],
  visiblePois: [],
  selectedCategory: null,
  activePoi: null,
  searchResults: null,
  searchQuery: '',

  setPois: (pois) => set({ pois }),
  setVisiblePois: (visiblePois) => set({ visiblePois }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  setActivePoi: (poi) => set({ activePoi: poi }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
