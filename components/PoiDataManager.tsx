import { useEffect } from 'react';
import { useMapStore } from '../stores/mapStore';
import { usePoiStore } from '../stores/poiStore';
import { fetchPOIs, queryPOIsByExtent, queryPOIsByText } from '../services/api';
import { transformExtent } from 'ol/proj';

export const PoiDataManager = () => {
  const { mapExtent, drawnExtent } = useMapStore();
  const { searchQuery, setPois, setSearchResults } = usePoiStore();

  // 1. Listen to mapExtent to fetch base POIs
  useEffect(() => {
    if (mapExtent) {
      const lonLatExtent = transformExtent(mapExtent, 'EPSG:3857', 'EPSG:4326');
      fetchPOIs(lonLatExtent as [number, number, number, number]).then(data => {
        console.log('[PoiDataManager] Fetched POIs for view:', data.length);
        setPois(data);
      });
    }
  }, [mapExtent, setPois]);

  // 2. Listen to drawnExtent and searchQuery to fetch search results
  useEffect(() => {
    if (searchQuery.trim() !== '') {
      queryPOIsByText(searchQuery).then(data => {
        console.log('[PoiDataManager] Fetched POIs by text:', data.length);
        setSearchResults(data);
      });
    } else if (drawnExtent) {
      const lonLatExtent = transformExtent(drawnExtent, 'EPSG:3857', 'EPSG:4326');
      queryPOIsByExtent(lonLatExtent as [number, number, number, number]).then(data => {
        console.log('[PoiDataManager] Fetched POIs by extent:', data.length);
        setSearchResults(data);
      });
    } else {
      setSearchResults(null);
    }
  }, [searchQuery, drawnExtent, setSearchResults]);

  return null; // Pure logic component, no UI
};
