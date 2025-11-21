import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '../store';
import { pluginRegistry } from './PluginRegistry';
import { useMapCapabilities } from './MapCore';
import { PluginInstanceConfig } from '../types';

// --- Internal Component: Floating Window Wrapper ---
const DraggableWindow = ({ config }: { config: PluginInstanceConfig }) => {
  const Definition = pluginRegistry.get(config.type);
  const { updatePluginPosition, removePlugin, bringToFront } = useStore();
  const capabilities = useMapCapabilities();
  
  // Local state for smooth dragging
  const [pos, setPos] = useState({ x: config.layout?.x || 20, y: config.layout?.y || 20 });
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    setPos({ x: config.layout?.x || 20, y: config.layout?.y || 20 });
  }, [config.layout?.x, config.layout?.y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    const newX = e.clientX - offset.current.x;
    const newY = e.clientY - offset.current.y;
    updatePluginPosition(config.id, newX, newY);
  };

  if (!Definition) return null;
  const PluginComponent = Definition.component;
  const Icon = Definition.icon;

  return (
    <div 
      className="absolute pointer-events-auto flex flex-col bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-200 transition-[height] duration-200 ease-in-out"
      style={{ 
        left: pos.x, top: pos.y, 
        width: config.layout?.w || 300, 
        height: isCollapsed ? 32 : (config.layout?.h || 400) 
      }}
      onMouseDownCapture={() => bringToFront(config.id)}
    >
      <div 
        className="h-8 bg-slate-100 border-b border-slate-200 flex items-center justify-between px-3 cursor-move select-none hover:bg-slate-200 transition-colors shrink-0"
        onMouseDown={handleMouseDown}
      >
         <div className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
           {Icon && <Icon className="w-3.5 h-3.5" />}
           {config.title}
         </div>
         <div className="flex items-center gap-1">
           <button 
              onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}
              className="text-slate-400 hover:text-blue-600 hover:bg-slate-300 rounded p-0.5 transition-colors"
              title={isCollapsed ? "Expand" : "Collapse"}
           >
             {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
           </button>
           <button 
              onClick={(e) => { e.stopPropagation(); removePlugin(config.id); }} 
              className="text-slate-400 hover:text-red-500 hover:bg-slate-300 rounded p-0.5 transition-colors"
              title="Close"
           >
             <X className="w-3.5 h-3.5" />
           </button>
         </div>
      </div>
      <div className={`flex-1 relative overflow-hidden ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
         {/* Inject Capability Context into the Plugin */}
         <PluginComponent config={config} capabilities={capabilities} />
      </div>
    </div>
  );
};

// --- Main Engine ---
export const LayoutEngine: React.FC = () => {
  const { layout } = useStore();
  const capabilities = useMapCapabilities();

  return (
    <>
      {layout.map(config => {
        // 1. Check if it is a special layout container
        const def = pluginRegistry.get(config.type);
        if (def?.category === 'CONTAINER') {
           const Component = def.component;
           return <Component key={config.id} config={config} capabilities={capabilities} />;
        }
        // 2. Otherwise, render as floating window
        return <DraggableWindow key={config.id} config={config} />;
      })}
    </>
  );
};