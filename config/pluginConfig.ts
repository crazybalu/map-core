import { PluginInstanceConfig, PluginType } from '../types';
import { BarChart3, List, Layout, Layers } from 'lucide-react';

import { ChartPlugin } from '../plugins/ChartPlugin';
import { ListPlugin } from '../plugins/ListPlugin';
import LayoutPlugin from '../plugins/LayoutPlugin';
import LayerSwitcherPlugin from '../plugins/LayerSwitcherPlugin';

export const getSafeInitialLayout = (): PluginInstanceConfig[] => {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const h = typeof window !== 'undefined' ? window.innerHeight : 768;

  return [
    {
      id: 'chart-1',
      type: 'poi-chart',
      title: 'Category Distribution',
      layout: { x: 20, y: 20, w: 300, h: 300 }
    },
    {
      id: 'list-1',
      type: 'poi-list',
      title: 'Location Details',
      layout: { x: 20, y: 340, w: 300, h: 400 }
    },
    // {
    //   id: 'chatbot-floating',
    //   type: 'ai-chat',
    //   title: 'AI Assistant',
    //   layout: { 
    //       x: Math.max(340, w - 380), 
    //       y: Math.max(80, h - 550), 
    //       w: 350, 
    //       h: 500 
    //   }
    // },
    // {
    //   id: 'layers-floating',
    //   type: 'layer-switcher',
    //   title: 'Map Layers',
    //   layout: {
    //     x: Math.max(340, w - 320),
    //     y: 20,
    //     w: 280,
    //     h: 220
    //   }
    // }
  ];
};

export const pluginDefinitions = [
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
