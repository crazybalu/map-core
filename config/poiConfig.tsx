import React from 'react';
import { PoiConfigMap, POI } from '../types';
import { ShoppingBag, Utensils, Trees, Building2, Home, Star, Clock, Info } from 'lucide-react';

// --- Custom Popup Components ---

const RetailPopup = ({ data }: { data: POI }) => (
  <div className="p-1">
    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
      <Clock className="w-3 h-3" />
      <span>{data.attributes?.openingHours || '9:00 AM - 9:00 PM'}</span>
    </div>
    <div className="flex flex-wrap gap-1">
      {(data.attributes?.tags || []).map((tag: string, i: number) => (
        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
          {tag}
        </span>
      ))}
    </div>
    <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
      <span className="text-xs text-slate-500">Rating</span>
      <div className="flex items-center gap-0.5 text-yellow-500">
        <Star className="w-3 h-3 fill-current" />
        <span className="text-xs font-bold">{data.attributes?.rating || 4.5}</span>
      </div>
    </div>
  </div>
);

const DiningPopup = ({ data }: { data: POI }) => (
  <div className="p-1">
    <div className="mb-2">
      <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
        {data.attributes?.cuisine || 'General'}
      </span>
    </div>
    <div className="flex justify-between text-xs text-slate-600 mb-1">
      <span>Price Range:</span>
      <span className="font-medium">{data.attributes?.priceRange || '$$'}</span>
    </div>
    <div className="flex justify-between text-xs text-slate-600">
      <span>Seats:</span>
      <span>{data.attributes?.seats || 40}+</span>
    </div>
  </div>
);

const ParkPopup = ({ data }: { data: POI }) => (
  <div className="p-1">
    <div className="flex gap-2 mb-2">
        {data.attributes?.hasPlayground && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">Playground</span>
        )}
        {data.attributes?.petFriendly && (
            <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200">Pets OK</span>
        )}
    </div>
    <div className="text-xs text-slate-500">
      Area: {data.attributes?.area || '2.5'} acres
    </div>
  </div>
);

const OfficePopup = ({ data }: { data: POI }) => (
  <div className="p-1 space-y-1">
    <div className="text-xs text-slate-600 flex justify-between">
       <span>Floors:</span>
       <span className="font-mono">{data.attributes?.floors || 12}</span>
    </div>
    <div className="text-xs text-slate-600 flex justify-between">
       <span>Companies:</span>
       <span className="font-mono">{data.attributes?.occupancy || 5}</span>
    </div>
    <div className="text-[10px] text-slate-400 mt-1 italic">
       Built in {data.attributes?.yearBuilt || 2010}
    </div>
  </div>
);

const DefaultPopup = ({ data }: { data: POI }) => (
  <div className="p-1 text-xs text-slate-500">
    <div className="flex items-center gap-1">
      <Info className="w-3 h-3" />
      <span>No additional details available.</span>
    </div>
  </div>
);

// --- Configuration Registry ---

export const POI_CONFIG: PoiConfigMap = {
  'Retail': {
    label: 'Retail Store',
    color: '#3b82f6', // blue-500
    // Shopping Bag Icon
    iconPath: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
    PopupComponent: RetailPopup
  },
  'Dining': {
    label: 'Restaurant',
    color: '#f97316', // orange-500
    // Utensils Icon
    iconPath: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M13 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><line x1="8" x2="8" y1="12" y2="22"/><line x1="18" x2="18" y1="12" y2="22"/>',
    PopupComponent: DiningPopup
  },
  'Parks': {
    label: 'Park & Rec',
    color: '#10b981', // green-500
    // Tree Icon
    iconPath: '<path d="M12 19v3"/><path d="M12 19c-2.8 0-5-2.2-5-5 0-4 4-8 4-8s4 4 4 8c0 2.8-2.2 5-5 5Z"/>',
    PopupComponent: ParkPopup
  },
  'Office': {
    label: 'Commercial',
    color: '#8b5cf6', // violet-500
    // Building Icon
    iconPath: '<rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/>',
    PopupComponent: OfficePopup
  },
  'Residential': {
    label: 'Housing',
    color: '#ef4444', // red-500
    // Home Icon
    iconPath: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    PopupComponent: DefaultPopup
  }
};

export const getPoiConfig = (category: string) => {
  return POI_CONFIG[category] || {
    label: category,
    color: '#64748b',
    iconPath: '<circle cx="12" cy="12" r="10"/>',
    PopupComponent: DefaultPopup
  };
};