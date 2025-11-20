import { pluginRegistry } from '../core/PluginRegistry';
import { PluginType } from '../types';
import { BarChart3, List, Layout, MessageSquare } from 'lucide-react';

import ChartPlugin from './ChartPlugin';
import ListPlugin from './ListPlugin';
import LayoutPlugin from './LayoutPlugin';
import ChatPlugin from './ChatPlugin';

export const registerPlugins = () => {
  pluginRegistry.register({
    type: 'poi-chart',
    name: 'POI Statistics',
    category: PluginType.CONTENT,
    component: ChartPlugin,
    icon: BarChart3
  });

  pluginRegistry.register({
    type: 'poi-list',
    name: 'POI List',
    category: PluginType.CONTENT,
    component: ListPlugin,
    icon: List
  });

  pluginRegistry.register({
    type: 'layout-container',
    name: 'Layout Container',
    category: PluginType.CONTAINER,
    component: LayoutPlugin,
    icon: Layout
  });

  pluginRegistry.register({
    type: 'ai-chat',
    name: 'AI Assistant',
    category: PluginType.CONTENT,
    component: ChatPlugin,
    icon: MessageSquare
  });
};
