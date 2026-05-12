import React, { createContext, useContext, useRef, useEffect, ReactNode, useState, useCallback } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Overlay from 'ol/Overlay';
import { Style, Fill, Stroke, Icon as IconStyle } from 'ol/style';
import Draw from 'ol/interaction/Draw';
import DragBox from 'ol/interaction/DragBox';
import { useMapStore } from '../stores/mapStore';
import { MapCapabilities, MapMarker } from '../types';
import { X, MapPin, TrendingUp, Layers, Check, Bug } from 'lucide-react';
import { MAP_CONFIG } from '../config/mapConfig';
import MapToolbar from '../components/MapToolbar';

// 为插件提供地图交互能力的 Context
const MapContext = createContext<MapCapabilities | null>(null);
// 为图层提供底层 Map 实例的 Context
const MapInstanceContext = createContext<Map | null>(null);

export const useMapCapabilities = () => {
  const context = useContext(MapContext);
  if (!context) throw new Error('useMapCapabilities 必须在 MapCoreProvider 内部使用');
  return context;
};

export const useMapInstance = () => useContext(MapInstanceContext);

// --- 辅助方法：生成标记点 SVG 样式 ---
const getIconStyle = (color: string = MAP_CONFIG.styles.markerLayer.defaultColor, iconPath: string = '') => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill="${color}" stroke="white" stroke-width="2"/>
      <g transform="translate(4, 4)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${iconPath}
      </g>
    </svg>
  `.trim();

  return new Style({
    image: new IconStyle({
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      scale: 1,
      anchor: [0.5, 0.5]
    }),
  });
};

interface MapCoreProps {
  children: ReactNode;
}

export const MapCoreProvider: React.FC<MapCoreProps> = ({ children }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<Map | null>(null);

  const tileLayerRef = useRef<TileLayer | null>(null);
  const drawSourceRef = useRef<VectorSource | null>(null);
  const drawInteractionRef = useRef<Draw | DragBox | null>(null);

  // --- 标记点图层 Refs ---
  const markerSourceRef = useRef<VectorSource | null>(null);
  const markerLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const popupContainerRef = useRef<HTMLDivElement>(null);
  const popupOverlayRef = useRef<Overlay | null>(null);

  // 保存当前 markers 数组引用，供点击事件回调读取
  const currentMarkersRef = useRef<MapMarker[]>([]);

  // --- 图层状态 ---
  const [showLayerSwitcher, setShowLayerSwitcher] = useState(false);

  // 全局状态管理
  const activeMarker = useMapStore(state => state.activeMarker);
  const setActiveMarker = useMapStore(state => state.setActiveMarker);
  
  const activeLayerId = useMapStore(state => state.activeLayerId);
  const setActiveLayerId = useMapStore(state => state.setActiveLayerId);
  
  const isDevMode = useMapStore(state => state.isDevMode);
  const setIsDevMode = useMapStore(state => state.setIsDevMode);
  
  const currentZoom = useMapStore(state => state.currentZoom);
  const setCurrentZoom = useMapStore(state => state.setCurrentZoom);
  
  const currentCoords = useMapStore(state => state.currentCoords);
  const setCurrentCoords = useMapStore(state => state.setCurrentCoords);

  const setMapExtent = useMapStore(state => state.setMapExtent);
  const setActiveDrawingMode = useMapStore(state => state.setActiveDrawingMode);
  const setDrawnExtent = useMapStore(state => state.setDrawnExtent);

  // --- 1. 地图初始化 (内核启动) ---
  useEffect(() => {
    if (!mapRef.current) return;

    // 加载默认底图配置
    const defaultLayerConfig = MAP_CONFIG.baseLayers.find(l => l.id === MAP_CONFIG.defaultLayerId) || MAP_CONFIG.baseLayers[0];
    const initialSource = defaultLayerConfig.type === 'XYZ'
      ? new XYZ({
        url: defaultLayerConfig.url,
        maxZoom: defaultLayerConfig.maxZoom,
        attributions: defaultLayerConfig.attributions
      })
      : new OSM();

    const tileLayer = new TileLayer({ source: initialSource });
    tileLayerRef.current = tileLayer;

    // --- 绘制图层设置 ---
    const drawSource = new VectorSource();
    drawSourceRef.current = drawSource;
    const drawLayer = new VectorLayer({
      source: drawSource,
      style: new Style({
        fill: new Fill({ color: MAP_CONFIG.styles.drawLayer.fillColor }),
        stroke: new Stroke({ color: MAP_CONFIG.styles.drawLayer.strokeColor, width: MAP_CONFIG.styles.drawLayer.strokeWidth }),
      }),
      zIndex: MAP_CONFIG.styles.drawLayer.zIndex,
    });

    // --- 标记点图层设置 ---
    const markerSource = new VectorSource();
    markerSourceRef.current = markerSource;

    const markerLayer = new VectorLayer({
      source: markerSource,
      style: (feature) => getIconStyle(feature.get('color'), feature.get('iconPath')),
      zIndex: MAP_CONFIG.styles.markerLayer.zIndex,
    });
    markerLayerRef.current = markerLayer;

    // 创建地图实例
    const map = new Map({
      layers: [tileLayer, markerLayer, drawLayer],
      view: new View({
        center: fromLonLat(MAP_CONFIG.initialCenter),
        zoom: MAP_CONFIG.initialZoom,
      }),
      controls: [],
    });

    // --- POI 气泡弹窗遮罩层 ---
    if (popupContainerRef.current) {
      const overlay = new Overlay({
        element: popupContainerRef.current,
        autoPan: { animation: { duration: 250 } },
        positioning: 'bottom-center',
        offset: [0, -16],
      });
      popupOverlayRef.current = overlay;
      map.addOverlay(overlay);
    }

    // 事件：地图点击 (选中标记点要素)
    const handleMapClick = (evt: any) => {
      const feature = map.forEachFeatureAtPixel(
        evt.pixel,
        (feature) => feature,
        { layerFilter: (layer) => layer === markerLayer }
      );

      if (feature) {
        const id = feature.getId();
        const marker = currentMarkersRef.current.find(m => m.id === id);
        if (marker) {
          setActiveMarker(marker);
          marker.onClick?.();
          return;
        }
      }
      setActiveMarker(null);
    };

    // 事件：鼠标在地图上移动
    const handlePointerMove = (e: any) => {
      // 鼠标悬浮标记点时变成手型光标
      const pixel = map.getEventPixel(e.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel, { layerFilter: (layer) => layer === markerLayer });
      const target = map.getTargetElement();
      if (target) target.style.cursor = hit ? 'pointer' : '';

      // 更新开发模式坐标
      const coords = map.getCoordinateFromPixel(pixel);
      if (coords) {
        const lonLat = toLonLat(coords);
        setCurrentCoords([lonLat[0], lonLat[1]]);
      }
    };

    map.on('click', handleMapClick);
    map.on('pointermove', handlePointerMove);

    // 事件：地图移动结束，同步视图范围和缩放级别
    map.on('moveend', () => {
      const size = map.getSize();
      if (!size || size[0] === 0 || size[1] === 0) return;
      setMapExtent(map.getView().calculateExtent(size));
      setCurrentZoom(map.getView().getZoom() || 0);
    });

    map.setTarget(mapRef.current);
    setMapInstance(map);

    // 初始渲染触发，确保尺寸并加载初始数据
    const initialFetch = () => {
      map.updateSize();
      const size = map.getSize();
      if (size && size[0] > 0 && size[1] > 0) {
        setMapExtent(map.getView().calculateExtent(size));
      } else {
        setTimeout(initialFetch, 100);
      }
    };
    setTimeout(initialFetch, 100);

    return () => {
      map.un('click', handleMapClick);
      map.un('pointermove', handlePointerMove);
      map.setTarget(undefined);
    };
  }, []);

  // --- 气泡弹窗位置同步 ---
  useEffect(() => {
    const overlay = popupOverlayRef.current;
    if (!overlay) return;
    overlay.setPosition(activeMarker ? fromLonLat([activeMarker.lng, activeMarker.lat]) : undefined);
  }, [activeMarker]);

  // --- 能力暴露：添加标记点 ---
  const addMarkers = useCallback((markers: MapMarker[]) => {
    const source = markerSourceRef.current;
    if (!source) return;

    // 保存引用供点击事件使用
    currentMarkersRef.current = markers;
    source.clear();

    const features = markers.map(marker => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([marker.lng, marker.lat])),
      });
      feature.setId(marker.id);
      feature.setProperties({ color: marker.color || MAP_CONFIG.styles.markerLayer.defaultColor, iconPath: marker.iconPath, name: marker.title });
      return feature;
    });

    source.addFeatures(features);
  }, []);

  // --- 能力暴露：清空标记点 ---
  const clearMarkers = useCallback(() => {
    markerSourceRef.current?.clear();
    currentMarkersRef.current = [];
    setActiveMarker(null);
  }, [setActiveMarker]);

  // --- 能力暴露：设置选中标记点 ---
  const handleSetActiveMarker = useCallback((marker: MapMarker | null) => {
    setActiveMarker(marker);
  }, [setActiveMarker]);

  // --- 2. 暴露给插件的能力集合 (Kernel API) ---
  const capabilities: MapCapabilities = {
    flyTo: (center, zoom = 15) => {
      mapInstance?.getView().animate({
        center: fromLonLat(center),
        zoom: zoom,
        duration: 1000
      });
    },
    currentExtent: useMapStore.getState().mapExtent,
    zoomIn: () => {
      const view = mapInstance?.getView();
      if (view) view.animate({ zoom: (view.getZoom() || 0) + 1, duration: 250 });
    },
    zoomOut: () => {
      const view = mapInstance?.getView();
      if (view) view.animate({ zoom: (view.getZoom() || 0) - 1, duration: 250 });
    },
    startDrawing: (type: 'Circle' | 'Box') => {
      const map = mapInstance;
      const source = drawSourceRef.current;
      if (!map || !source) return;

      setActiveDrawingMode(type);

      if (drawInteractionRef.current) {
        map.removeInteraction(drawInteractionRef.current);
      }
      source.clear();

      if (type === 'Box') {
        const dragBox = new DragBox();
        dragBox.on('boxstart', () => { source.clear(); setDrawnExtent(null); });
        dragBox.on('boxend', () => {
          const geometry = dragBox.getGeometry();
          source.addFeature(new Feature({ geometry: geometry.clone() }));
          const extent = geometry.getExtent();
          setDrawnExtent(extent ? [...extent] : null);
        });
        map.addInteraction(dragBox);
        drawInteractionRef.current = dragBox;
      } else {
        const draw = new Draw({ source, type: 'Circle' });
        draw.on('drawstart', () => { source.clear(); setDrawnExtent(null); });
        draw.on('drawend', (event) => {
          const extent = event.feature.getGeometry()?.getExtent();
          setDrawnExtent(extent ? [...extent] : null);
        });
        map.addInteraction(draw);
        drawInteractionRef.current = draw;
      }
    },
    setBaseLayer: (layerId: string) => {
      if (!tileLayerRef.current) return;
      const layerConfig = MAP_CONFIG.baseLayers.find(l => l.id === layerId);
      if (!layerConfig) return;

      const source = layerConfig.type === 'XYZ'
        ? new XYZ({ url: layerConfig.url, maxZoom: layerConfig.maxZoom, attributions: layerConfig.attributions })
        : new OSM();

      tileLayerRef.current.setSource(source);
      setActiveLayerId(layerId);
    },
    clearDrawing: () => {
      drawSourceRef.current?.clear();
      if (drawInteractionRef.current && mapInstance) {
        mapInstance.removeInteraction(drawInteractionRef.current);
        drawInteractionRef.current = null;
      }
      setDrawnExtent(null);
      setActiveDrawingMode(null);
    },
    // 标记点相关能力
    addMarkers,
    clearMarkers,
    setActiveMarker: handleSetActiveMarker,
  };

  // --- 渲染气泡弹窗内容 ---
  const renderPopupContent = () => {
    if (!activeMarker) return null;

    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden animate-in zoom-in-95 duration-200 w-[240px]">
        <div className="h-2 w-full" style={{ backgroundColor: activeMarker.color || MAP_CONFIG.styles.markerLayer.defaultColor }}></div>
        <div className="p-3">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{activeMarker.title}</h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{activeMarker.subtitle}</span>
            </div>
            <button
              onClick={() => setActiveMarker(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 -mt-1 -mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700 mb-3 text-slate-600 dark:text-slate-300">
            {activeMarker.popupComponent}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 p-1">
            {activeMarker.value !== undefined && (
              <div className="flex flex-col items-center flex-1 border-r border-slate-100 dark:border-slate-700">
                <TrendingUp className="w-3 h-3 text-green-500 mb-0.5" />
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  {typeof activeMarker.value === 'number' && !isNaN(parseFloat(activeMarker.value.toString())) ? `$${activeMarker.value}` : activeMarker.value}
                </span>
              </div>
            )}
            <div className="flex flex-col items-center flex-1">
              <MapPin className="w-3 h-3 text-blue-500 mb-0.5" />
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{activeMarker.lat.toFixed(3)}</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-700 rotate-45"></div>
      </div>
    );
  };

  return (
    <MapContext.Provider value={capabilities}>
      <MapInstanceContext.Provider value={mapInstance}>
        <div className="relative w-full h-full">
          {/* 底图视图容器 */}
          <div ref={mapRef} className="w-full h-full absolute inset-0 z-0 bg-slate-100 dark:bg-slate-900" />

          {/* POI气泡弹窗容器 */}
          <div
            ref={popupContainerRef}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50"
          >
            {renderPopupContent()}
          </div>

          {/* 插件渲染层 (动态内容展示) */}
          <div className="relative z-10 w-full h-full pointer-events-none">
            {children}
          </div>

          {/* 开发模式控制与面板 (仅当 MAP_CONFIG.enableDevMode 开启时显示) */}
          {MAP_CONFIG.enableDevMode && (
            <div className="absolute bottom-6 left-6 z-40 flex flex-col items-start gap-3 pointer-events-auto">
              {isDevMode && (
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-xl p-3 shadow-lg pointer-events-none animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs mb-2">
                    <Bug className="w-4 h-4" />
                    <span className="font-bold tracking-wider">DEV MODE</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-300 font-mono text-xs">
                    <div className="text-slate-400">Zoom:</div>
                    <div className="text-right text-emerald-300 font-semibold">{currentZoom.toFixed(2)}</div>
                    <div className="text-slate-400">Lng:</div>
                    <div className="text-right text-emerald-300 font-semibold">{currentCoords[0].toFixed(5)}</div>
                    <div className="text-slate-400">Lat:</div>
                    <div className="text-right text-emerald-300 font-semibold">{currentCoords[1].toFixed(5)}</div>
                  </div>
                </div>
              )}
              {/* 开发模式切换按钮 */}
              <button
                onClick={() => setIsDevMode(!isDevMode)}
                className={`w-11 h-11 rounded-full shadow-lg border flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${isDevMode
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/25'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-emerald-500'
                  }`}
                title="切换开发模式"
              >
                <Bug className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* 右下角控制组件组 */}
          <div className="absolute bottom-6 right-[324px] z-40 flex flex-col gap-3">
            {/* 图层切换器控制组件 */}
            <div className="relative">
              {showLayerSwitcher && (
                <div className="absolute bottom-full right-0 mb-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/50 dark:border-slate-700/50 overflow-hidden w-40 animate-in slide-in-from-bottom-2 origin-bottom-right duration-200">
                  <div className="p-2 space-y-1">
                    {MAP_CONFIG.baseLayers.map((layer) => (
                      <button
                        key={layer.id}
                        onClick={() => {
                          capabilities.setBaseLayer(layer.id);
                          setShowLayerSwitcher(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all ${activeLayerId === layer.id
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                          }`}
                      >
                        <span>{layer.name}</span>
                        {activeLayerId === layer.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowLayerSwitcher(!showLayerSwitcher)}
                className={`w-11 h-11 rounded-full shadow-lg border flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${showLayerSwitcher
                  ? 'bg-blue-500 border-blue-500 text-white shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-500'
                  }`}
                title="切换地图图层"
              >
                <Layers className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 地图工具栏（缩放、定位、绘制等操作） */}
          <MapToolbar />
        </div>
      </MapInstanceContext.Provider>
    </MapContext.Provider>
  );
};
