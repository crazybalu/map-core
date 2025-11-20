import React, { ComponentType, ReactNode } from 'react';

// --- Domain Entities ---
export interface POI {
  id: string;
  name: string;
  category: 'Retail' | 'Dining' | 'Parks' | 'Office' | 'Residential';
  lat: number;
  lng: number;
  value: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

// --- Plugin System (Micro-kernel Contract) ---

export enum PluginType {
  CONTAINER = 'CONTAINER',
  CONTENT = 'CONTENT'
}

// Capabilities exposed by the Kernel to Plugins
export interface MapCapabilities {
  flyTo: (center: [number, number], zoom?: number) => void;
  setFilter: (category: string | null) => void;
  getVisibleData: () => POI[];
  currentExtent: number[] | null;
}

// Props injected into every Plugin Component
export interface PluginContextProps {
  config: PluginInstanceConfig;
  capabilities: MapCapabilities;
}

// The Static Definition of a Plugin (Manifest)
export interface BiPlugin {
  type: string;
  name: string;
  icon: ComponentType<any>;
  category: PluginType;
  component: ComponentType<PluginContextProps>;
  defaultSize?: { w: number; h: number };
}

// The Runtime Configuration of a Plugin Instance
export interface PluginInstanceConfig {
  id: string;
  type: string;
  title: string;
  props?: Record<string, any>;
  children?: PluginInstanceConfig[]; // For container plugins
  layout?: {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
  };
}
