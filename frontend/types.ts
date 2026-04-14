import React, { ComponentType } from 'react';

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

// Options for POI layer rendering
export interface PoiLayerOptions {
  selectedCategory?: string | null;
}

// Capabilities exposed by the Kernel to Plugins
export interface MapCapabilities {
  flyTo: (center: [number, number], zoom?: number) => void;
  currentExtent: number[] | null;
  zoomIn: () => void;
  zoomOut: () => void;
  setBaseLayer: (layerType: string) => void;
  startDrawing: (type: 'Circle' | 'Box') => void;
  clearDrawing: () => void;
  // Marker Layer Management
  addMarkers: (markers: MapMarker[]) => void;
  clearMarkers: () => void;
  setActiveMarker: (marker: MapMarker | null) => void;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  
  // Icon styling
  iconPath?: string;
  color?: string;

  // Popup content
  title?: string;
  subtitle?: string;
  value?: number | string;
  popupComponent?: React.ReactNode;
  
  // Interaction
  onClick?: () => void;
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