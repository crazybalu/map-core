export const MAP_CONFIG = {
    initialCenter: [-74.0060, 40.7128] as [number, number], // Initial longitude and latitude (NYC)
    initialZoom: 13,
    baseLayers: {
        satellite: {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            maxZoom: 19,
            attributions: 'Tiles © Esri'
        },
        light: {
            url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        },
        dark: {
            url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            attributions: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }
    }
};
