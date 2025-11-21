import { POI } from '../types';

// --- "Database" State ---
// We generate the data once and keep it here to simulate a persistent backend.
let ALL_POIS: POI[] = [];

const initDatabase = () => {
  const count = 1000; // Total number of POIs in the "world"
  const baseLat = 40.7128; // NYC Center
  const baseLon = -74.0060;
  const spread = 0.15; // Roughly +/- 15km

  const categories = ['Retail', 'Dining', 'Parks', 'Office', 'Residential'] as const;
  const data: POI[] = [];

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

    data.push({
      id: `poi-${i}`,
      name: `${category} Spot ${i + 1}`,
      category: category,
      // Generate random position within the fixed "world" bounds
      lat: baseLat + (Math.random() - 0.5) * spread,
      lng: baseLon + (Math.random() - 0.5) * spread,
      value: Math.floor(Math.random() * 10000) + 1000,
      attributes
    });
  }
  
  ALL_POIS = data;
  console.log(`[API] Mock Database Initialized with ${count} records.`);
};

export const fetchPOIs = async (extent: [number, number, number, number]): Promise<POI[]> => {
  // Initialize DB on first call
  if (ALL_POIS.length === 0) {
    initDatabase();
  }

  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const [minLon, minLat, maxLon, maxLat] = extent;
      
      // Query the "Database"
      const result = ALL_POIS.filter(p => 
        p.lat >= minLat && p.lat <= maxLat &&
        p.lng >= minLon && p.lng <= maxLon
      );

      console.log(`[API] Query returned ${result.length} POIs within current view.`);
      resolve(result);
    }, 300);
  });
};