import { POI } from '../types';

const generateMockPOIs = (count: number, extent: [number, number, number, number]): POI[] => {
  const categories = ['Retail', 'Dining', 'Parks', 'Office', 'Residential'] as const;
  const pois: POI[] = [];
  
  const [minLon, minLat, maxLon, maxLat] = extent;

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    let attributes: any = {};

    // Generate attributes based on category
    switch (category) {
        case 'Retail':
            attributes = {
                rating: (3 + Math.random() * 2).toFixed(1),
                openingHours: '10:00 AM - 9:00 PM',
                tags: ['Clothing', 'Electronics', 'Gifts'].slice(0, Math.floor(Math.random() * 3) + 1)
            };
            break;
        case 'Dining':
            attributes = {
                cuisine: ['Italian', 'Mexican', 'Asian Fusion', 'Burgers', 'Cafe'][Math.floor(Math.random() * 5)],
                priceRange: ['$', '$$', '$$$', '$$$$'][Math.floor(Math.random() * 4)],
                seats: 20 + Math.floor(Math.random() * 80)
            };
            break;
        case 'Parks':
            attributes = {
                area: (1 + Math.random() * 10).toFixed(1),
                hasPlayground: Math.random() > 0.5,
                petFriendly: Math.random() > 0.3
            };
            break;
        case 'Office':
            attributes = {
                floors: 5 + Math.floor(Math.random() * 40),
                yearBuilt: 1980 + Math.floor(Math.random() * 44),
                occupancy: 1 + Math.floor(Math.random() * 10)
            };
            break;
        case 'Residential':
            attributes = {
                units: 10 + Math.floor(Math.random() * 200),
                type: Math.random() > 0.5 ? 'Apartment' : 'Condo'
            };
            break;
    }

    pois.push({
      id: `poi-${Date.now()}-${i}`,
      name: `${category} Spot ${i + 1}`,
      category: category,
      // Generate lat/lng strictly within the requested extent
      lat: minLat + Math.random() * (maxLat - minLat),
      lng: minLon + Math.random() * (maxLon - minLon),
      value: Math.floor(Math.random() * 10000) + 1000,
      attributes
    });
  }
  return pois;
};

export const fetchPOIs = async (extent: [number, number, number, number]): Promise<POI[]> => {
  console.log('[API] Fetching POIs for extent:', extent);
  // Simulate network latency (e.g., 500ms)
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate ~50 points for the current view
      const data = generateMockPOIs(50, extent);
      resolve(data);
    }, 500);
  });
};