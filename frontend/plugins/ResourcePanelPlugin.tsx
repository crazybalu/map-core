import React, { useState, useEffect, useCallback } from 'react';
import { usePoiStore } from '../stores/poiStore';
import { useMapStore } from '../stores/mapStore';
import { useMapCapabilities } from '../core/MapCore';
import {
  RESOURCE_CATEGORIES,
  getSubCategoryById,
  isCategoryFullySelected,
  isCategoryPartiallySelected,
  getPoiConfig
} from '../config/resources';
import { fetchPOIsByResourceCategories } from '../services/api';
import { transformExtent } from 'ol/proj';
import { PluginContextProps } from '../types';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Minus,
  X,
  Search as SearchIcon,
  Loader2,
} from 'lucide-react';

// --- Custom Checkbox Component ---
const ResourceCheckbox: React.FC<{
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label: string;
  icon?: React.ComponentType<any>;
  color?: string;
}> = ({ checked, indeterminate, onChange, label, icon: Icon, color }) => {
  return (
    <label
      className="flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer select-none transition-all duration-150 hover:bg-blue-50/80 dark:hover:bg-slate-700/50 group"
      onClick={(e) => { e.preventDefault(); onChange(); }}
    >
      <div
        className={`w-4 h-4 rounded-[3px] border-2 flex items-center justify-center transition-all duration-150 shrink-0 ${
          checked || indeterminate
            ? 'bg-blue-500 border-blue-500 dark:bg-blue-600 dark:border-blue-600'
            : 'border-slate-300 dark:border-slate-600 group-hover:border-blue-400'
        }`}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        {indeterminate && !checked && <Minus className="w-3 h-3 text-white" strokeWidth={3} />}
      </div>
      {Icon && (
        <Icon
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: checked ? (color || '#3b82f6') : undefined }}
        />
      )}
      <span
        className={`text-xs leading-none transition-colors ${
          checked
            ? 'text-blue-600 dark:text-blue-400 font-medium'
            : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        {label}
      </span>
    </label>
  );
};

// --- Main Plugin Component ---
export const ResourcePanelPlugin: React.FC<PluginContextProps> = ({ config, capabilities }) => {
  const {
    pendingResourceCategories,
    selectedResourceCategories,
    togglePendingResourceCategory,
    confirmResourceSelection,
    clearPendingResourceSelection,
    setPois,
    setSearchResults,
  } = usePoiStore();

  const { addMarkers, clearMarkers } = useMapCapabilities();

  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    RESOURCE_CATEGORIES.map(c => c.id) // All expanded by default
  );
  const [isLoading, setIsLoading] = useState(false);

  // Toggle category expand/collapse
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  // Toggle all children of a category
  const toggleCategoryAll = useCallback((categoryId: string) => {
    const category = RESOURCE_CATEGORIES.find(c => c.id === categoryId);
    if (!category) return;

    const allChildIds = category.children.map(sub => sub.id);
    const allSelected = isCategoryFullySelected(categoryId, pendingResourceCategories);

    if (allSelected) {
      // Uncheck all children
      allChildIds.forEach(id => {
        if (pendingResourceCategories.includes(id)) {
          togglePendingResourceCategory(id);
        }
      });
    } else {
      // Check all children
      allChildIds.forEach(id => {
        if (!pendingResourceCategories.includes(id)) {
          togglePendingResourceCategory(id);
        }
      });
    }
  }, [pendingResourceCategories, togglePendingResourceCategory]);

  // Confirm selection and fetch data
  const handleConfirm = useCallback(async () => {
    confirmResourceSelection();

    if (pendingResourceCategories.length === 0) {
      // Clear data when nothing is selected
      setPois([]);
      setSearchResults(null);
      clearMarkers();
      return;
    }

    const mapExtent = useMapStore.getState().mapExtent;
    if (!mapExtent) return;

    setIsLoading(true);
    try {
      const lonLatExtent = transformExtent(mapExtent, 'EPSG:3857', 'EPSG:4326') as [number, number, number, number];

      // Map subcategory IDs to API category keys
      const apiCategories = pendingResourceCategories
        .map(id => getSubCategoryById(id))
        .filter(Boolean)
        .map(sub => sub!.apiCategory);

      const data = await fetchPOIsByResourceCategories(apiCategories, lonLatExtent);
      console.log('[ResourcePanel] Fetched resource POIs:', data.length);

      // Share data to poiStore for ListPlugin consumption
      setPois(data);
      setSearchResults(null);

      // Update map markers
      const markers = data.map(poi => {
        const poiCfg = getPoiConfig(poi.category);
        const CustomPopup = poiCfg.PopupComponent;
        return {
          id: poi.id,
          lat: poi.lat,
          lng: poi.lng,
          color: poiCfg.color,
          iconPath: poiCfg.iconPath,
          title: poi.name,
          subtitle: poiCfg.label,
          value: poi.value,
          popupComponent: <CustomPopup data={poi} />,
        };
      });
      addMarkers(markers);
    } finally {
      setIsLoading(false);
    }
  }, [pendingResourceCategories, confirmResourceSelection, setPois, setSearchResults, addMarkers, clearMarkers]);

  // Clear all selections and data
  const handleClear = useCallback(() => {
    clearPendingResourceSelection();
    setPois([]);
    setSearchResults(null);
    clearMarkers();
  }, [clearPendingResourceSelection, setPois, setSearchResults, clearMarkers]);

  // Count of pending selections
  const pendingCount = pendingResourceCategories.length;
  const hasChanges = JSON.stringify(pendingResourceCategories.sort()) !== JSON.stringify(selectedResourceCategories.sort());

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
      {/* Category Groups */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {RESOURCE_CATEGORIES.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          const isFullyChecked = isCategoryFullySelected(category.id, pendingResourceCategories);
          const isPartiallyChecked = isCategoryPartiallySelected(category.id, pendingResourceCategories);
          const CategoryIcon = category.icon;

          return (
            <div key={category.id} className="border-b border-slate-100 dark:border-slate-800 last:border-b-0">
              {/* Category Header */}
              <div
                className="flex items-center gap-2 px-4 py-2.5 cursor-pointer select-none hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors"
                onClick={() => toggleCategory(category.id)}
              >
                {/* Category-level checkbox */}
                <div
                  className="shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategoryAll(category.id);
                  }}
                >
                  <div
                    className={`w-4 h-4 rounded-[3px] border-2 flex items-center justify-center transition-all duration-150 cursor-pointer ${
                      isFullyChecked
                        ? 'bg-blue-500 border-blue-500'
                        : isPartiallyChecked
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                    }`}
                  >
                    {isFullyChecked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    {isPartiallyChecked && !isFullyChecked && <Minus className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </div>

                <CategoryIcon className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex-1">
                  {category.label}
                </span>

                {/* Expand/Collapse arrow */}
                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                }
              </div>

              {/* Subcategory Grid */}
              {isExpanded && (
                <div className="px-4 pb-3 pt-0.5">
                  <div className="grid grid-cols-2 gap-x-1 gap-y-0.5">
                    {category.children.map((sub) => {
                      const isChecked = pendingResourceCategories.includes(sub.id);
                      return (
                        <ResourceCheckbox
                          key={sub.id}
                          checked={isChecked}
                          onChange={() => togglePendingResourceCategory(sub.id)}
                          label={sub.label}
                          icon={sub.icon}
                          color={sub.color}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Tags */}
      {pendingCount > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-800/30">
          <div className="flex flex-wrap gap-1.5">
            {pendingResourceCategories.map(id => {
              const sub = getSubCategoryById(id);
              if (!sub) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                >
                  {sub.label}
                  <X
                    className="w-3 h-3 cursor-pointer hover:text-blue-800 dark:hover:text-blue-300"
                    onClick={() => togglePendingResourceCategory(id)}
                  />
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Action Buttons */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 flex items-center gap-3">
        <button
          onClick={handleClear}
          className="flex-1 py-2 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          清空
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading || pendingCount === 0}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded transition-all duration-200 flex items-center justify-center gap-1.5 ${
            pendingCount > 0 && !isLoading
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/20'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              查询中...
            </>
          ) : (
            <>
              确定
              {pendingCount > 0 && (
                <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
};
