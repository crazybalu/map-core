import React, { ComponentType } from 'react';
import { AlertTriangle, ShieldAlert, Cctv, MapPin, Building2, Info } from 'lucide-react';
import { POI, PoiConfig } from '../types';

// --- Custom Popup Components ---

const DefaultPopup = ({ data }: { data: POI }) => (
  <div className="p-1 text-xs text-slate-500">
    <div className="flex items-center gap-1">
      <Info className="w-3 h-3" />
      <span>No additional details available.</span>
    </div>
  </div>
);

const PoliceCasePopup = ({ data }: { data: POI }) => (
  <div className="p-1 space-y-1">
    <div className="flex justify-between text-xs text-slate-600">
      <span>级别:</span>
      <span className={`font-medium ${data.attributes?.level === '紧急' ? 'text-red-600' : data.attributes?.level === '重要' ? 'text-orange-600' : 'text-blue-600'}`}>
        {data.attributes?.level || '一般'}
      </span>
    </div>
    <div className="flex justify-between text-xs text-slate-600">
      <span>状态:</span>
      <span className="font-medium">{data.attributes?.status || '处理中'}</span>
    </div>
    <div className="text-[10px] text-slate-400 mt-1">
      报案时间: {data.attributes?.reportTime || '--'}
    </div>
  </div>
);

const SurveillancePopup = ({ data }: { data: POI }) => (
  <div className="p-1 space-y-1">
    <div className="flex justify-between text-xs text-slate-600">
      <span>状态:</span>
      <span className={`font-medium ${data.attributes?.status === '在线' ? 'text-green-600' : 'text-red-500'}`}>
        {data.attributes?.status || '在线'}
      </span>
    </div>
    <div className="flex justify-between text-xs text-slate-600">
      <span>分辨率:</span>
      <span className="font-mono text-xs">{data.attributes?.resolution || '1080P'}</span>
    </div>
    <div className="text-[10px] text-slate-400 mt-1">
      安装时间: {data.attributes?.installDate || '--'}
    </div>
  </div>
);

const BuildingPopup = ({ data }: { data: POI }) => (
  <div className="p-1 space-y-1">
    <div className="flex justify-between text-xs text-slate-600">
      <span>楼层:</span>
      <span className="font-mono">{data.attributes?.floors || '--'}F</span>
    </div>
    <div className="flex justify-between text-xs text-slate-600">
      <span>用途:</span>
      <span className="font-medium">{data.attributes?.usage || '--'}</span>
    </div>
    <div className="flex justify-between text-xs text-slate-600">
      <span>面积:</span>
      <span className="font-medium">{data.attributes?.area || '--'}</span>
    </div>
  </div>
);

// --- Resource Category Type Definitions ---

export interface ResourceSubCategory {
  id: string;            // Unique identifier, e.g. 'police_case'
  label: string;         // Display name, e.g. '警情'
  icon: ComponentType<any>; // Lucide icon component
  apiCategory: string;   // Mapped category key for API query
  color: string;         // Theme color for markers
  
  // map specific fields
  mapIconPath?: string;
  PopupComponent?: ComponentType<{ data: POI }>;
}

export interface ResourceCategory {
  id: string;
  label: string;
  icon: ComponentType<any>;
  children: ResourceSubCategory[];
}

// --- Resource Category Registry ---

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    id: 'warning',
    label: '预警',
    icon: AlertTriangle,
    children: [
      {
        id: 'police_case',
        label: '警情',
        icon: ShieldAlert,
        apiCategory: 'PoliceCase',
        color: '#ef4444',  // red-500
        mapIconPath: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
        PopupComponent: PoliceCasePopup
      },
      {
        id: 'surveillance',
        label: '监控',
        icon: Cctv,
        apiCategory: 'Surveillance',
        color: '#f59e0b',  // amber-500
        mapIconPath: '<path d="M16.75 12h3.632a1 1 0 0 1 .894 1.447l-2.034 4.069a1 1 0 0 1-.894.553H7.652a1 1 0 0 1-.894-.553l-2.034-4.069A1 1 0 0 1 5.618 12H9.25"/><circle cx="13" cy="9" r="3"/><path d="M2 17h20"/>',
        PopupComponent: SurveillancePopup
      },
    ],
  },
  {
    id: 'address',
    label: '地址',
    icon: MapPin,
    children: [
      {
        id: 'building',
        label: '建筑物',
        icon: Building2,
        apiCategory: 'Building',
        color: '#3b82f6',  // blue-500
        mapIconPath: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
        PopupComponent: BuildingPopup
      },
    ],
  },
];

// --- Helper Functions ---

/** Get map configuration for a specific POI apiCategory */
export const getPoiConfig = (category: string): PoiConfig => {
  const sub = RESOURCE_CATEGORIES.flatMap(cat => cat.children).find(s => s.apiCategory === category);
  return {
    label: sub?.label || category,
    color: sub?.color || '#64748b',
    iconPath: sub?.mapIconPath || '<circle cx="12" cy="12" r="10"/>',
    PopupComponent: sub?.PopupComponent || DefaultPopup
  };
};

/** Get a flat list of all subcategory IDs */
export const getAllSubCategoryIds = (): string[] =>
  RESOURCE_CATEGORIES.flatMap(cat => cat.children.map(sub => sub.id));

/** Find a subcategory config by ID */
export const getSubCategoryById = (id: string): ResourceSubCategory | undefined =>
  RESOURCE_CATEGORIES.flatMap(cat => cat.children).find(sub => sub.id === id);

/** Get the parent category for a given subcategory ID */
export const getParentCategory = (subId: string): ResourceCategory | undefined =>
  RESOURCE_CATEGORIES.find(cat => cat.children.some(sub => sub.id === subId));

/** Check if all children of a category are selected */
export const isCategoryFullySelected = (categoryId: string, selectedIds: string[]): boolean => {
  const category = RESOURCE_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return false;
  return category.children.every(sub => selectedIds.includes(sub.id));
};

/** Check if some (but not all) children of a category are selected */
export const isCategoryPartiallySelected = (categoryId: string, selectedIds: string[]): boolean => {
  const category = RESOURCE_CATEGORIES.find(c => c.id === categoryId);
  if (!category) return false;
  const selectedCount = category.children.filter(sub => selectedIds.includes(sub.id)).length;
  return selectedCount > 0 && selectedCount < category.children.length;
};
