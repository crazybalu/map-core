import React from 'react';
import { PluginType, BiPlugin } from '../types';
import { BarChart3, List, Layout, MessageSquare } from 'lucide-react';

import ChartPlugin from './ChartPlugin';
import ListPlugin from './ListPlugin';
import LayoutPlugin from './LayoutPlugin';
import ChatPlugin from './ChatPlugin';

export const registry: Record<string, BiPlugin> = {
  'poi-chart': {
    type: 'poi-chart',
    name: 'POI Statistics',
    category: PluginType.CONTENT,
    component: ChartPlugin,
    icon: BarChart3
  },
  'poi-list': {
    type: 'poi-list',
    name: 'POI List',
    category: PluginType.CONTENT,
    component: ListPlugin,
    icon: List
  },
  'layout-container': {
    type: 'layout-container',
    name: 'Layout Container',
    category: PluginType.CONTAINER,
    component: LayoutPlugin,
    icon: Layout
  },
  'ai-chat': {
    type: 'ai-chat',
    name: 'AI Assistant',
    category: PluginType.CONTENT,
    component: ChatPlugin,
    icon: MessageSquare
  }
};