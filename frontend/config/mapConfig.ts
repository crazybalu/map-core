export interface BaseLayerConfig {
    id: string;
    name: string;
    type: 'XYZ' | 'OSM';
    url?: string;
    maxZoom?: number;
    attributions?: string;
}

export const MAP_CONFIG = {
    enableDevMode: true, // 控制是否启用开发模式（左下角显示坐标和缩放级别）
    initialCenter: [113.36556, 23.124] as [number, number], // Initial longitude and latitude (NYC)
    initialZoom: 17,
    defaultLayerId: 'osm', // 默认底图

    // 图层与样式配置
    styles: {
        drawLayer: {
            fillColor: 'rgba(59, 130, 246, 0.2)',
            strokeColor: 'rgba(59, 130, 246, 0.8)',
            strokeWidth: 2,
            zIndex: 20
        },
        markerLayer: {
            defaultColor: '#3b82f6',
            zIndex: 10
        }
    },

    baseLayers: [
        {
            id: 'light',
            name: '浅色主题',
            type: 'XYZ',
            url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            attributions: '&copy; OpenStreetMap &copy; CARTO'
        },
        {
            id: 'dark',
            name: '暗黑主题',
            type: 'XYZ',
            url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            attributions: '&copy; OpenStreetMap &copy; CARTO'
        },
        {
            id: 'satellite',
            name: '卫星影像',
            type: 'XYZ',
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 19,
            attributions: 'Tiles © Esri'
        },
        {
            id: 'osm',
            name: '标准地图',
            type: 'OSM'
        }
    ] as BaseLayerConfig[]
};
