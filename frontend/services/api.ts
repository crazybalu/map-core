import { POI } from '../types';



// --- Resource Category Based Query ---

const RESOURCE_CATEGORY_NAMES: Record<string, string[]> = {
  'PoliceCase': ['盗窃警情', '交通事故', '纠纷报警', '治安事件', '诈骗警情', '伤害案件', '消防警情', '求助报警'],
  'Surveillance': ['路口监控', '小区监控', '商铺监控', '学校监控', '治安监控', '交通监控', '园区监控', '银行监控'],
  'Building': ['商业大厦', '居民楼', '写字楼', '政府大楼', '学校教学楼', '医院大楼', '工厂厂房', '酒店大楼'],
};

const generateResourcePOIData = (
  categories: string[],
  minLat: number, minLon: number, maxLat: number, maxLon: number
): POI[] => {
  const countPerCategory = 50;
  const latSpread = maxLat - minLat;
  const lonSpread = maxLon - minLon;
  const data: POI[] = [];

  for (const category of categories) {
    const names = RESOURCE_CATEGORY_NAMES[category] || [`${category} 点位`];
    for (let i = 0; i < countPerCategory; i++) {
      let attributes: Record<string, any> = {};

      switch (category) {
        case 'PoliceCase':
          attributes = {
            level: ['一般', '重要', '紧急'][Math.floor(Math.random() * 3)],
            status: ['处理中', '已结案', '待派遣'][Math.floor(Math.random() * 3)],
            reportTime: `2026-04-0${Math.floor(Math.random() * 7) + 1} ${Math.floor(Math.random() * 24)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          };
          break;
        case 'Surveillance':
          attributes = {
            status: Math.random() > 0.2 ? '在线' : '离线',
            resolution: ['1080P', '4K', '720P'][Math.floor(Math.random() * 3)],
            installDate: `202${Math.floor(Math.random() * 6)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}`,
          };
          break;
        case 'Building':
          attributes = {
            floors: Math.floor(Math.random() * 30) + 1,
            usage: ['商业', '住宅', '办公', '综合'][Math.floor(Math.random() * 4)],
            area: `${(Math.random() * 5000 + 500).toFixed(0)}㎡`,
          };
          break;
      }

      data.push({
        id: `res-${category}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${i}`,
        name: `${names[Math.floor(Math.random() * names.length)]} ${i + 1}`,
        category,
        lat: minLat + Math.random() * latSpread,
        lng: minLon + Math.random() * lonSpread,
        value: Math.floor(Math.random() * 10000) + 100,
        attributes,
      });
    }
  }

  console.log(`[API] Generated ${data.length} resource POIs for categories: [${categories.join(', ')}]`);
  return data;
};

export const fetchPOIsByResourceCategories = async (
  categories: string[],
  extent: [number, number, number, number],
  keyword?: string
): Promise<POI[]> => {
  if (categories.length === 0) return [];

  const buildingRequested = categories.includes('Building');
  const otherCategories = categories.filter(c => c !== 'Building');

  let results: POI[] = [];

  // 1. Fetch from Backend for Building if requested
  if (buildingRequested) {
    try {
      console.log('[API] Fetching real building data from backend with keyword:', keyword);
      const url = keyword ? `/api/buildings?keyword=${encodeURIComponent(keyword)}` : '/api/buildings';
      const response = await fetch(url);
      const result = await response.json();
      if (result.code === 200 && Array.isArray(result.data)) {
        results = [...results, ...result.data];
      }
    } catch (error) {
      console.error('[API] Failed to fetch building data:', error);
    }
  }

  // 2. Fetch Mock Data for other categories
  if (otherCategories.length > 0) {
    const [minLon, minLat, maxLon, maxLat] = extent;
    let mockData = generateResourcePOIData(otherCategories, minLat, minLon, maxLat, maxLon);
    
    // Filter mock data locally by keyword if provided
    if (keyword) {
      const q = keyword.toLowerCase();
      mockData = mockData.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.attributes && Object.values(p.attributes).some(v => String(v).toLowerCase().includes(q)))
      );
    }
    
    results = [...results, ...mockData];
  }

  return results;
};