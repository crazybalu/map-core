import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../stores/mapStore';
import { useMapCapabilities } from './MapCore';
import { pluginRegistry } from './PluginRegistry';
import { X, GripHorizontal } from 'lucide-react';

interface DraggableWindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialLayout: { x: number; y: number; w: number; h: number };
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({ id, title, children, initialLayout }) => {
  const { updatePluginPosition, removePlugin } = useMapStore();
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ x: initialLayout.x, y: initialLayout.y });
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    const newX = Math.max(0, Math.min(window.innerWidth - initialLayout.w, dragRef.current.initialX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - initialLayout.h, dragRef.current.initialY + dy));
    
    setPos({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    dragRef.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    updatePluginPosition(id, pos.x, pos.y);
  };

  return (
    <div
      className="absolute bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/40 dark:border-slate-700/50 overflow-hidden flex flex-col pointer-events-auto transition-shadow duration-200"
      style={{
        left: pos.x,
        top: pos.y,
        width: initialLayout.w,
        height: initialLayout.h,
        zIndex: isDragging ? 50 : 10,
      }}
    >
      {/* Window Header */}
      <div 
        className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-blue-600/90 to-blue-500/90 dark:from-slate-800/90 dark:to-slate-800/90 border-b border-blue-700/50 dark:border-slate-700/50 cursor-grab active:cursor-grabbing group"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-blue-200 group-hover:text-white dark:text-slate-400 dark:group-hover:text-slate-300 transition-colors" />
          <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
        </div>
        <button 
          onClick={() => removePlugin(id)}
          className="p-1 rounded text-blue-100 hover:bg-blue-700 dark:hover:bg-slate-700 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Window Content */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};

export const LayoutEngine: React.FC = () => {
  const { layout } = useMapStore();
  const capabilities = useMapCapabilities();

  return (
    <>
      {layout.map(instance => {
        const pluginDef = pluginRegistry.get(instance.type);
        if (!pluginDef) return null;

        const PluginComponent = pluginDef.component;

        return (
          <DraggableWindow 
            key={instance.id} 
            id={instance.id} 
            title={instance.title} 
            initialLayout={instance.layout as any}
          >
            <PluginComponent 
              config={instance} 
              capabilities={capabilities} 
            />
          </DraggableWindow>
        );
      })}
    </>
  );
};
