import React, { ComponentType, ReactNode } from 'react';

// --- Domain Entities ---
export interface POI {
  id: string;
  name: string;
  category: string; // Flexible string to match configuration keys
  lat: number;
  lng: number;
  value: number;
  attributes?: Record<string, any>; // Custom attributes specific to the category
}

export interface GroundingChunk {
  web?: { uri: string; title: string };
  maps?: {
    sourceId: { id: string };
    uri: string;
    title: string;
    placeAnswerSources?: { reviewSnippets?: { uri: string; source: string; reviewText: string }[] }[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  groundingChunks?: GroundingChunk[];
}

// --- Configuration Types ---
export interface PoiConfig {
  label: string;
  color: string;
  iconPath: string; // SVG Path data (24x24 standard)
  PopupComponent: ComponentType<{ data: POI }>; // Custom component for Map Popup
}

export type PoiConfigMap = Record<string, PoiConfig>;

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