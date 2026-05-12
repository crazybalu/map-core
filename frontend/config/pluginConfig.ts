import { PluginInstanceConfig, PluginType } from '../types';
import { BarChart3, List, Layout, Layers, FolderKanban } from 'lucide-react';

import { ChartPlugin } from '../plugins/ChartPlugin';
import { ListPlugin } from '../plugins/ListPlugin';
import LayoutPlugin from '../plugins/LayoutPlugin';
import { ResourcePanelPlugin } from '../plugins/ResourcePanelPlugin';

export const getSafeInitialLayout = (): PluginInstanceConfig[] => {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const h = typeof window !== 'undefined' ? window.innerHeight : 768;

  return [
    {
      id: 'resource-panel-1',
      type: 'resource-panel',
      title: '资源面板',
      layout: { x: 0, y: 0, w: 280, h: h }
    },
    {
      id: 'list-1',
      type: 'poi-list',
      title: '资源列表',
      layout: { x: w - 300, y: 0, w: 300, h: h }
    },

  ];
};

export const pluginDefinitions = [
  {
    type: 'resource-panel',
    name: '资源面板',
    category: PluginType.CONTENT,
    component: ResourcePanelPlugin,
    icon: FolderKanban,
    defaultSize: { w: 280, h: 420 }
  },
  {
    type: 'poi-chart',
    name: 'POI Statistics',
    category: PluginType.CONTENT,
    component: ChartPlugin,
    icon: BarChart3
  },
  {
    type: 'poi-list',
    name: 'POI List',
    category: PluginType.CONTENT,
    component: ListPlugin,
    icon: List
  },
  {
    type: 'layout-container',
    name: 'Layout Container',
    category: PluginType.CONTAINER,
    component: LayoutPlugin,
    icon: Layout
  },
  // {
  //   type: 'layer-switcher',
  //   name: 'Map Layers',
  //   category: PluginType.CONTENT,
  //   component: LayerSwitcherPlugin,
  //   icon: Layers,
  //   defaultSize: { w: 280, h: 300 }
  // }
];
